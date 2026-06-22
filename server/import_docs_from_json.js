const fs = require('fs');
const path = require('path');
const db = require('./src/db/db');

async function run() {
  try {
    const dataPath = path.join(__dirname, 'data', 'docs_dump.json');
    if (!fs.existsSync(dataPath)) {
      console.error('File not found:', dataPath);
      process.exit(1);
    }
    
    console.log('Olvasás: docs_dump.json...');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const { transport_orders, ekaer_records } = data;
    
    console.log(`Fuvarmegbízások száma: ${transport_orders.length}`);
    console.log(`EKAER rekordok száma: ${ekaer_records.length}`);
    
    // Törlés (ha esetleg lenne benne szemét)
    console.log('Meglévő adatok törlése...');
    await db('transport_orders').del();
    await db('ekaer_records').del();
    
    // Beszúrás 500-as csomagokban
    const BATCH_SIZE = 500;
    
    console.log('Fuvarmegbízások importálása...');
    for (let i = 0; i < transport_orders.length; i += BATCH_SIZE) {
      const batch = transport_orders.slice(i, i + BATCH_SIZE);
      await db('transport_orders').insert(batch);
      process.stdout.write(`\r  ${Math.min(i + BATCH_SIZE, transport_orders.length)}/${transport_orders.length}`);
    }
    console.log('\nFuvarmegbízások importálva.');
    
    console.log('EKAER rekordok importálása...');
    for (let i = 0; i < ekaer_records.length; i += BATCH_SIZE) {
      const batch = ekaer_records.slice(i, i + BATCH_SIZE);
      await db('ekaer_records').insert(batch);
      process.stdout.write(`\r  ${Math.min(i + BATCH_SIZE, ekaer_records.length)}/${ekaer_records.length}`);
    }
    console.log('\nEKAER rekordok importálva.');
    
    console.log('✅ Importálás sikeresen befejeződött!');
    process.exit(0);
  } catch (err) {
    console.error('Hiba:', err);
    process.exit(1);
  }
}

run();
