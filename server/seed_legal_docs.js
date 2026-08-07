require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const pdfParse = require('pdf-parse');
const db = require('./src/db/db');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function chunkText(text, maxLength = 2000) {
  const chunks = [];
  let currentChunk = '';
  const paragraphs = text.split('\n');

  for (const p of paragraphs) {
    if ((currentChunk.length + p.length) > maxLength && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
    currentChunk += p + '\n';
  }
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk);
  }
  return chunks;
}

async function parsePdfText(buffer) {
  if (typeof pdfParse === 'function') {
    const data = await pdfParse(buffer);
    return data.text;
  } else if (pdfParse && pdfParse.PDFParse) {
    const parser = new pdfParse.PDFParse({ data: buffer });
    const res = await parser.getText();
    return typeof res === 'string' ? res : (res.text || '');
  } else if (pdfParse && pdfParse.default && typeof pdfParse.default === 'function') {
    const data = await pdfParse.default(buffer);
    return data.text;
  }
  throw new Error('Nem sikerült beolvasni a PDF fájlt.');
}

function getAllFiles(dirPath, baseDir = dirPath, fileList = []) {
  const items = fs.readdirSync(dirPath);
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getAllFiles(fullPath, baseDir, fileList);
    } else if (item.toLowerCase().endsWith('.pdf') || item.toLowerCase().endsWith('.txt')) {
      const relFolder = path.relative(baseDir, path.dirname(fullPath));
      fileList.push({
        fullPath,
        filename: item,
        folder: relFolder
      });
    }
  }
  return fileList;
}

async function getEmbeddingsWithRetry(chunkBatch, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: chunkBatch
      });
    } catch (err) {
      if (attempt === retries) throw err;
      console.log(` ⚠️ Rate limit/Hiba: ${err.message}. Újrapróbálkozás 3 másodperc múlva (${attempt}/${retries})...`);
      await new Promise(res => setTimeout(res, 3000));
    }
  }
}

async function processFile(item) {
  const { fullPath, filename, folder } = item;
  const displayName = folder ? `[${folder}] ${filename}` : filename;
  console.log(`Feldolgozás alatt: ${displayName}...`);
  try {
    const dataBuffer = fs.readFileSync(fullPath);
    let text = '';
    
    if (filename.toLowerCase().endsWith('.pdf')) {
      text = await parsePdfText(dataBuffer);
    } else {
      text = dataBuffer.toString('utf-8');
    }

    text = text.replace(/\0/g, '').replace(/\u0000/g, '');

    if (!text.trim()) {
      console.log(`Üres fájl vagy nem felismerhető formátum: ${displayName}`);
      return;
    }

    // Ellenőrizzük, hogy létezik-e már ez a dokumentum az adatbázisban és vannak-e vektoraik
    const existing = await db('ai_documents').where({ original_name: displayName, is_permanent: true }).first();
    if (existing) {
      const vecCount = await db('ai_vectors').where({ document_id: existing.id }).count('id as cnt').first();
      if (Number(vecCount.cnt) > 0) {
        console.log(`⏩ Már létezik az adatbázisban (${vecCount.cnt} vektor), kihagyva: ${displayName}`);
        return;
      } else {
        console.log(`🧹 Újrapróbálkozás: Töröljük a korábban meghiúsult üres rekordot: ${displayName}`);
        await db('ai_documents').where({ id: existing.id }).del();
      }
    }

    // Insert document record
    const [doc] = await db('ai_documents').insert({
      filename: displayName,
      original_name: displayName,
      mimetype: filename.endsWith('.pdf') ? 'application/pdf' : 'text/plain',
      category: 'legal',
      is_permanent: true
    }).returning('id');
    
    const documentId = doc.id;
    const chunks = chunkText(text, 2500);

    if (chunks.length > 0) {
      const vectorRecords = [];
      const batchSize = 30; // Csökkentett kötegméret a stabilabb token-limit tartáshoz

      for (let i = 0; i < chunks.length; i += batchSize) {
        const chunkBatch = chunks.slice(i, i + batchSize);
        const embeddingsResponse = await getEmbeddingsWithRetry(chunkBatch);

        chunkBatch.forEach((chunk, index) => {
          const embeddingArray = embeddingsResponse.data[index].embedding;
          const embeddingString = `[${embeddingArray.join(',')}]`;
          vectorRecords.push({
            document_id: documentId,
            content: chunk,
            embedding: embeddingString
          });
        });
        // Kis szünet a kötegek között
        await new Promise(res => setTimeout(res, 500));
      }

      // Insert vectors in batches of 50 to prevent huge query strings
      for (let i = 0; i < vectorRecords.length; i += 50) {
          const batch = vectorRecords.slice(i, i + 50);
          await db('ai_vectors').insert(batch);
      }
    }
    console.log(`✔ Kész: ${displayName} (${chunks.length} blokk feltöltve)`);
  } catch (err) {
    console.error(`❌ Hiba a(z) ${displayName} feldolgozása közben:`, err.message);
  }
}

async function main() {
  const dirPath = path.join(__dirname, 'jogszabalyok');
  
  if (!fs.existsSync(dirPath)) {
    console.log(`A mappa nem létezik: ${dirPath}`);
    console.log(`Létrehozom a mappát. Kérlek, helyezd ide a PDF jogszabályokat, majd futtasd újra a scriptet!`);
    fs.mkdirSync(dirPath);
    process.exit(0);
  }

  const allItems = getAllFiles(dirPath);
  let processedCount = 0;

  console.log(`Összesen ${allItems.length} jogszabály dokumentumot találtam a mappákban.\n`);

  for (const item of allItems) {
    await processFile(item);
    processedCount++;
  }

  if (processedCount === 0) {
    console.log('Nem találtam PDF vagy TXT kiterjesztésű fájlt a mappákban.');
  } else {
    console.log(`\nSikeresen befejeződött ${processedCount} dokumentum feldolgozása az állandó jogszabálytárba.`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Fatális hiba:', err);
  process.exit(1);
});
