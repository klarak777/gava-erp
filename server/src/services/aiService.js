const { OpenAI } = require('openai');
const db = require('../db/db');
const pdfParse = require('pdf-parse');
const xlsx = require('xlsx');
const mammoth = require('mammoth');
const AgentManager = require('./agents/AgentManager');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Split text into roughly max length chunks.
 * A maxLength-nél hosszabb bekezdéseket (pl. sortörés nélküli PDF) is
 * feldarabolja, hogy ne lépjük túl az embedding tokenlimitet.
 */
function chunkText(text, maxLength = 2000) {
  const chunks = [];
  let currentChunk = '';
  const paragraphs = text.split('\n');

  for (const p of paragraphs) {
    // Túl hosszú bekezdés: előbb a felgyülemlett chunkot elmentjük,
    // majd a bekezdést fix hosszakra vágjuk
    if (p.length > maxLength) {
      if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      for (let i = 0; i < p.length; i += maxLength) {
        chunks.push(p.slice(i, i + maxLength) + '\n');
      }
      continue;
    }
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

/**
 * Process a document, vectorize it, and store in the DB
 */
async function processDocument(filename, buffer, mimetype) {
  let text = '';
  let category = 'general';

  if (mimetype === 'application/pdf' || filename.endsWith('.pdf')) {
    category = 'legal';
    text = await parsePdfText(buffer);
  } else if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    filename.endsWith('.docx')
  ) {
    category = 'legal';
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else if (
    mimetype === 'text/csv' ||
    mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    filename.endsWith('.csv') ||
    filename.endsWith('.xlsx')
  ) {
    category = 'finance';
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    // Convert to CSV string for easy chunking
    text = xlsx.utils.sheet_to_csv(worksheet);
  } else {
    // Treat as raw text
    text = buffer.toString('utf-8');
  }

  // Remove null bytes (\u0000) for PostgreSQL UTF-8 compatibility
  text = text.replace(/\0/g, '').replace(/\u0000/g, '');

  // 1. Create document record
  const [doc] = await db('ai_documents').insert({
    filename: filename,
    original_name: filename,
    mimetype: mimetype || 'unknown',
    category: category
  }).returning('id');

  const documentId = doc.id;

  // 2. Chunk text
  const chunks = chunkText(text, 2500);

  // 3. Generate embeddings and store – kisebb kötegekben (BATCH_SIZE = 20),
  // hogy a szigorúbb OpenAI fiók-limiteket se lépjük túl (pl. max 300k token/kérés)
  const BATCH_SIZE = 20;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batchChunks = chunks.slice(i, i + BATCH_SIZE);

    const embeddingsResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batchChunks
    });

    const vectorRecords = batchChunks.map((chunk, index) => {
      // Create a pgvector string representation: '[0.1, 0.2, ...]'
      const embeddingArray = embeddingsResponse.data[index].embedding;
      const embeddingString = `[${embeddingArray.join(',')}]`;

      return {
        document_id: documentId,
        content: chunk,
        embedding: embeddingString
      };
    });

    await db('ai_vectors').insert(vectorRecords);
  }

  return { documentId, category };
}

/**
 * Get context menu options
 */
async function getOptionsForDocument(documentId) {
  const doc = await db('ai_documents').where({ id: documentId }).first();
  if (!doc) throw new Error('Dokumentum nem található.');

  if (doc.category === 'legal') {
    return [
      { id: 'legal_summary', label: '⚖️ Jogszabályi összefoglaló' },
      { id: 'legal_compliance', label: '✅ Megfelelőség ellenőrzése' },
      { id: 'legal_risks', label: '⚠️ Jogi kockázatok keresése' },
      { id: 'other', label: '💬 Más (kérdés feltevése)' }
    ];
  } else if (doc.category === 'finance') {
    return [
      { id: 'fin_summary', label: '📊 Pénzügyi kimutatás elemzése' },
      { id: 'fin_anomalies', label: '⚠️ Kiugró értékek, anomáliák keresése' },
      { id: 'fin_breakdown', label: '🔍 Részletes lebontás (sorok elemzése)' },
      { id: 'other', label: '💬 Más (kérdés feltevése)' }
    ];
  }

  return [
    { id: 'summary', label: 'Összefoglaló' },
    { id: 'other', label: 'Kérdés' }
  ];
}

/**
 * Generate chat response using AgentManager
 */
async function generateChatResponse(documentId, message, optionId, history = [], uiContext = null, onEvent = null) {
  let userQuery = message || '';

  if (optionId && optionId !== 'other') {
    const promptMap = {
      'legal_summary': 'Foglald össze röviden a dokumentum jogi tartalmát, különös tekintettel a főbb kötelezettségekre.',
      'legal_compliance': 'Ellenőrizd a jogszabályi megfelelőséget a dokumentumban foglaltak alapján.',
      'legal_risks': 'Keresd meg és listázd ki a dokumentumban rejlő esetleges jogi kockázatokat.',
      'fin_summary': 'Készíts egy összesített pénzügyi kimutatást az adatok alapján.',
      'fin_anomalies': 'Keress kiugró értékeket és anomáliákat az adatokban, és listázd őket.',
      'fin_breakdown': 'Készíts részletes elemzést és lebontást a pénzügyi adatokról.',
      'summary': 'Készíts egy rövid összefoglalót a dokumentumról.'
    };
    // Ismeretlen opció esetén maradjon az eredeti üzenet – soha ne küldjünk üres kérdést
    userQuery = promptMap[optionId] || userQuery;
  }

  if (!userQuery.trim()) {
    throw new Error('Hiányzó üzenet vagy érvénytelen opció azonosító.');
  }

  // Get document category if available
  let documentCategory = null;
  if (documentId) {
    const doc = await db('ai_documents').where({ id: documentId }).first();
    if (doc) documentCategory = doc.category;
  }

  const manager = new AgentManager(openai);
  return await manager.handleChat(documentId, userQuery, documentCategory, history, uiContext, onEvent);
}

/**
 * Delete a temporary document and its vectors from the DB
 */
async function deleteDocument(documentId) {
  if (!documentId) return;
  const doc = await db('ai_documents').where({ id: documentId }).first();
  if (!doc) return;

  // SOHA ne töröljünk állandó jogszabálytár dokumentumot user session leválasztáskor
  if (doc.is_permanent) return;

  await db('ai_vectors').where({ document_id: documentId }).del();
  await db('ai_documents').where({ id: documentId }).del();
}

/**
 * Execute or log an AI proposed action
 */
async function executeAiAction(actionName, payload, decision, userId) {
  return await db.transaction(async (trx) => {
    let executionResult = null;
    let status = decision === 'approve' ? 'approved' : 'rejected';

    if (decision === 'approve') {
      try {
        // Implement specific actions here
        if (actionName === 'update_partner') {
          if (!payload.id) throw new Error('Hiányzó partner ID');
          
          const updateData = { ...payload };
          delete updateData.id;
          
          await trx('partners').where('id', payload.id).update(updateData);
          executionResult = { message: 'Partner sikeresen frissítve.' };
        } else {
          throw new Error('Ismeretlen művelet: ' + actionName);
        }
      } catch (error) {
        status = 'failed';
        executionResult = { error: error.message };
        throw error; // Rollback
      }
    }

    // Naplózás az ai_actions_audit táblába
    await trx('ai_actions_audit').insert({
      action_name: actionName,
      payload: JSON.stringify(payload),
      status: status,
      user_id: userId,
      execution_result: JSON.stringify(executionResult)
    });

    return { status, executionResult };
  });
}

module.exports = {
  processDocument,
  getOptionsForDocument,
  generateChatResponse,
  deleteDocument,
  executeAiAction
};
