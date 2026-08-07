/**
 * SEED SCRIPT: Jogszabálytár bevektorizálása az adatbázisba
 * 
 * Futtatás: node src/scripts/seed_legal_vectors.js
 * 
 * Ez a script:
 * - Végigmegy a server/jogszabalyok/ mappán
 * - Minden PDF-et beolvas és vektorizál
 * - is_permanent = true flaggel menti az adatbázisba (nem törli az auto-cleanup)
 * - Ha a dokumentum már be van töltve (ugyanolyan filename), kihagyja
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const db = require('../db/db');

// pdf-parse több féleképpen exportálhatja magát – kezeljük mindkét formát
const _pdfParseModule = require('pdf-parse');

async function parsePdfText(buffer) {
    if (typeof _pdfParseModule === 'function') {
        const data = await _pdfParseModule(buffer);
        return data.text;
    } else if (_pdfParseModule && _pdfParseModule.PDFParse) {
        const parser = new _pdfParseModule.PDFParse({ data: buffer });
        const res = await parser.getText();
        return typeof res === 'string' ? res : (res.text || '');
    } else if (_pdfParseModule && _pdfParseModule.default && typeof _pdfParseModule.default === 'function') {
        const data = await _pdfParseModule.default(buffer);
        return data.text;
    }
    throw new Error('Nem sikerült beolvasni a PDF fájlt.');
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const JOGSZABALYOK_DIR = path.join(__dirname, '../../jogszabalyok');
const BATCH_SIZE = 10;
const CHUNK_SIZE = 2500;

function chunkText(text, maxLength = CHUNK_SIZE) {
    const chunks = [];
    let currentChunk = '';
    const paragraphs = text.split('\n');
    for (const p of paragraphs) {
        if (p.length > maxLength) {
            if (currentChunk.trim().length > 0) { chunks.push(currentChunk); currentChunk = ''; }
            for (let i = 0; i < p.length; i += maxLength) { chunks.push(p.slice(i, i + maxLength)); }
        } else if (currentChunk.length + p.length + 1 > maxLength) {
            if (currentChunk.trim().length > 0) { chunks.push(currentChunk); }
            currentChunk = p;
        } else {
            currentChunk += (currentChunk ? '\n' : '') + p;
        }
    }
    if (currentChunk.trim().length > 0) chunks.push(currentChunk);
    return chunks.filter(c => c.trim().length > 20);
}

function getCategoryFromPath(filePath) {
    const rel = filePath.replace(JOGSZABALYOK_DIR, '').toLowerCase();
    if (rel.includes('fuvarozás') || rel.includes('logisztika') || rel.includes('fuvarozas')) return 'legal';
    if (rel.includes('élelmíszer') || rel.includes('elelmiszer')) return 'legal';
    if (rel.includes('zöldség') || rel.includes('zoldseg')) return 'legal';
    if (rel.includes('vám') || rel.includes('vam')) return 'legal';
    return 'legal';
}

function getAllPdfs(dir, results = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            getAllPdfs(fullPath, results);
        } else if (entry.name.toLowerCase().endsWith('.pdf') || entry.name.toLowerCase().endsWith('.docx')) {
            results.push(fullPath);
        }
    }
    return results;
}

async function processFile(filePath) {
    const filename = path.basename(filePath);
    const ext = path.extname(filename).toLowerCase();

    // Ellenőrizzük, hogy már be van-e töltve
    const existing = await db('ai_documents').where({ filename, is_permanent: true }).first();
    if (existing) {
        console.log(`⏭  Már létezik, kihagyva: ${filename}`);
        return;
    }

    console.log(`📄 Feldolgozás: ${filename}`);

    let text = '';
    try {
        const buffer = fs.readFileSync(filePath);
        if (ext === '.pdf') {
            text = await parsePdfText(buffer);
        } else if (ext === '.docx') {
            const mammoth = require('mammoth');
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;
        }
    } catch (err) {
        console.warn(`  ⚠️  Nem sikerült beolvasni: ${filename} - ${err.message}`);
        return;
    }

    text = text.replace(/\0/g, '').replace(/\u0000/g, '').trim();
    if (text.length < 50) {
        console.warn(`  ⚠️  Túl rövid szöveg, kihagyva: ${filename}`);
        return;
    }

    const chunks = chunkText(text);
    console.log(`  📦 ${chunks.length} chunk, vektorizálás...`);

    const category = getCategoryFromPath(filePath);
    const [doc] = await db('ai_documents').insert({
        filename,
        original_name: filename,
        mimetype: ext === '.pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        category,
        is_permanent: true   // ← FONTOS: nem törli az auto-cleanup!
    }).returning('id');

    const documentId = doc.id;

    // Kötegelt vektorizálás
    let totalChunks = 0;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batchChunks = chunks.slice(i, i + BATCH_SIZE);
        try {
            const embeddingsResponse = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: batchChunks
            });

            const vectorRecords = batchChunks.map((chunk, index) => {
                const embeddingArray = embeddingsResponse.data[index].embedding;
                const embeddingString = `[${embeddingArray.join(',')}]`;
                return { document_id: documentId, content: chunk, embedding: embeddingString };
            });

            await db('ai_vectors').insert(vectorRecords);
            totalChunks += batchChunks.length;
            process.stdout.write(`\r  ✅ ${totalChunks}/${chunks.length} chunk betöltve`);
        } catch (err) {
            console.error(`\n  ❌ Vektorizálási hiba (batch ${i}): ${err.message}`);
        }
    }
    console.log(`\n  ✅ Kész: ${filename} (${totalChunks} vektor)`);
}

async function main() {
    if (!process.env.OPENAI_API_KEY) {
        console.error('❌ OPENAI_API_KEY nincs beállítva!');
        process.exit(1);
    }

    if (!fs.existsSync(JOGSZABALYOK_DIR)) {
        console.error(`❌ A jogszabályok mappa nem található: ${JOGSZABALYOK_DIR}`);
        process.exit(1);
    }

    const files = getAllPdfs(JOGSZABALYOK_DIR);
    console.log(`\n🔍 Talált fájlok: ${files.length} db\n`);

    let processed = 0;
    for (const filePath of files) {
        try {
            await processFile(filePath);
            processed++;
        } catch (err) {
            console.error(`❌ Hiba: ${path.basename(filePath)}: ${err.message}`);
        }
    }

    const total = await db('ai_vectors').count('id as c').first();
    console.log(`\n🎉 Kész! ${processed}/${files.length} fájl feldolgozva.`);
    console.log(`📊 Összesen vektor az adatbázisban: ${total.c}`);
    await db.destroy();
}

main().catch(console.error);
