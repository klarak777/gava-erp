/**
 * restore_ai_vectors_remote.js
 * 
 * Az ai_vectors es ai_documents tablakat tolti vissza a .gz backupbol.
 * Futtatás:
 *   node restore_ai_vectors_remote.js          <- DO szerver
 *   node restore_ai_vectors_remote.js --local  <- Lokalis DB
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { Client } = require('./node_modules/pg');
const copyFrom = require('./node_modules/pg-copy-streams').from;
const { Readable } = require('stream');

const isLocal = process.argv.includes('--local');
const host = isLocal ? '127.0.0.1' : '138.68.143.223';

console.log('=== AI VECTORS VISSZAALLITAS (' + (isLocal ? 'LOKALIS' : 'DO SZERVER: ' + host) + ') ===');

async function main() {
  const client = new Client({
    host, port: 5432,
    user: 'gava_admin', password: 'adminpassword123', database: 'gava_erp',
    connectionTimeoutMillis: 15000,
  });

  await client.connect();
  console.log('Csatlakozva: ' + host + ':5432/gava_erp');

  const beforeVectors = await client.query('SELECT COUNT(*) as c FROM ai_vectors');
  console.log('Jelenlegi ai_vectors: ' + beforeVectors.rows[0].c + ' sor');

  if (parseInt(beforeVectors.rows[0].c) > 100) {
    console.log('Mar van adat. Kihagyas.');
    await client.end(); return;
  }

  const gzFile = path.join(__dirname, 'src/db/ai_vectors_data.sql.gz');
  console.log('Backup fajl: ' + gzFile + ' (' + (fs.statSync(gzFile).size / 1024 / 1024).toFixed(1) + ' MB)');

  const sql = zlib.gunzipSync(fs.readFileSync(gzFile)).toString('utf8');
  const lines = sql.split('\n');

  let regularSQLLines = [];
  let copyBlocks = [];
  let inCopy = false, currentCopyHeader = '', currentCopyData = [];

  for (const line of lines) {
    if (inCopy) {
      if (line === '\\.') {
        inCopy = false;
        copyBlocks.push({ header: currentCopyHeader, data: currentCopyData.join('\n') });
        currentCopyData = []; currentCopyHeader = '';
      } else { currentCopyData.push(line); }
    } else if (line.match(/^COPY\s+/i)) {
      inCopy = true; currentCopyHeader = line;
    } else { regularSQLLines.push(line); }
  }

  console.log('SQL utasitasok futtatasa...');
  const stmts = regularSQLLines.join('\n').split(/;\s*\n/).filter(s => s.trim().length > 0);
  for (const stmt of stmts) {
    const t = stmt.trim();
    if (!t || t.startsWith('--')) continue;
    try { await client.query(t + ';'); } catch (e) { /* ignore already exists */ }
  }

  console.log('COPY adatok betoltese...');
  for (const block of copyBlocks) {
    const match = block.header.match(/COPY\s+(?:public\.)?(\w+)\s+\(([^)]+)\)\s+FROM\s+stdin/i);
    if (!match) { console.warn('Ismeretlen COPY: ' + block.header); continue; }
    const tableName = match[1];
    const columns = match[2];
    const rowCount = block.data.split('\n').filter(l => l.length > 0).length;
    console.log('  ' + tableName + ': ' + rowCount + ' sor...');
    try {
      await new Promise((resolve, reject) => {
        const stream = client.query(copyFrom('COPY ' + tableName + ' (' + columns + ') FROM STDIN'));
        const readable = Readable.from([block.data + '\n']);
        readable.pipe(stream);
        stream.on('finish', resolve);
        stream.on('error', reject);
        readable.on('error', reject);
      });
      console.log('  OK: ' + tableName);
    } catch (err) { console.error('  HIBA ' + tableName + ': ' + err.message); }
  }

  const afterVectors = await client.query('SELECT COUNT(*) as c FROM ai_vectors');
  const afterDocs = await client.query('SELECT COUNT(*) as c FROM ai_documents WHERE is_permanent = true');
  console.log('\n=== EREDMENY ===');
  console.log('  ai_vectors: ' + afterVectors.rows[0].c + ' sor');
  console.log('  ai_documents: ' + afterDocs.rows[0].c + ' sor');

  try {
    await client.query("SELECT setval('ai_documents_id_seq', COALESCE((SELECT MAX(id) FROM ai_documents), 1));");
    await client.query("SELECT setval('ai_vectors_id_seq', COALESCE((SELECT MAX(id) FROM ai_vectors), 1));");
    console.log('  Szekvenciak frissitve');
  } catch (e) { console.warn('Szekvencia hiba: ' + e.message); }

  await client.end();
  console.log('Kesz!');
}

main().catch(err => { console.error('Hiba:', err.message); process.exit(1); });
