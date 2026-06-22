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
    
    console.log('Adatbázis referenciák beolvasása (Shipments, Seasons, Transporters)...');
    
    // Előkészítjük a térképeket a gyors kereséshez
    const seasons = await db('seasons').select('id', 'code');
    const seasonMap = {};
    for (const s of seasons) seasonMap[s.code] = s.id;

    const transporters = await db('transporters').select('id', 'name');
    const transpMap = {};
    for (const t of transporters) transpMap[t.name] = t.id;

    const shipments = await db('shipments').select('id', 'order_number', 'season_id');
    const shipmentMap = {};
    for (const sh of shipments) {
        // Kulcs: "LOG149|2" (order_number|season_id)
        shipmentMap[`${sh.order_number}|${sh.season_id}`] = sh.id;
    }
    
    // Törlés (ha esetleg lenne benne szemét)
    console.log('Meglévő adatok törlése...');
    await db('transport_orders').del();
    await db('ekaer_records').del();
    
    // Beszúrás 500-as csomagokban
    const BATCH_SIZE = 500;
    
    console.log('Fuvarmegbízások importálása...');
    const toInsert = [];
    for (const to of transport_orders) {
        const sId = seasonMap[to.season_code];
        const tId = to.transporter_name ? transpMap[to.transporter_name] : null;
        const shId = sId ? shipmentMap[`${to.order_number}|${sId}`] : null;
        
        if (shId && sId) {
            toInsert.push({
                shipment_id: shId,
                season_id: sId,
                transporter_id: tId,
                document_name: to.document_name,
                file_path: to.file_path,
                file_date: to.file_date,
                loading_date: to.loading_date,
                is_sent: to.is_sent
            });
        }
    }
    
    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const batch = toInsert.slice(i, i + BATCH_SIZE);
      await db('transport_orders').insert(batch);
      process.stdout.write(`\r  ${Math.min(i + BATCH_SIZE, toInsert.length)}/${toInsert.length}`);
    }
    console.log(`\nFuvarmegbízások importálva: ${toInsert.length} / ${transport_orders.length}`);
    
    console.log('EKAER rekordok importálása...');
    const erInsert = [];
    for (const er of ekaer_records) {
        const sId = seasonMap[er.season_code];
        const tId = er.transporter_name ? transpMap[er.transporter_name] : null;
        const shId = sId ? shipmentMap[`${er.order_number}|${sId}`] : null;
        
        if (shId && sId) {
            erInsert.push({
                shipment_id: shId,
                season_id: sId,
                transporter_id: tId,
                ekaer_file_name: er.ekaer_file_name,
                file_path: er.file_path,
                file_date: er.file_date,
                load_date: er.load_date,
                is_sent: er.is_sent
            });
        }
    }

    for (let i = 0; i < erInsert.length; i += BATCH_SIZE) {
      const batch = erInsert.slice(i, i + BATCH_SIZE);
      await db('ekaer_records').insert(batch);
      process.stdout.write(`\r  ${Math.min(i + BATCH_SIZE, erInsert.length)}/${erInsert.length}`);
    }
    console.log(`\nEKAER rekordok importálva: ${erInsert.length} / ${ekaer_records.length}`);
    
    console.log('✅ Importálás sikeresen befejeződött!');
    process.exit(0);
  } catch (err) {
    console.error('Hiba:', err);
    process.exit(1);
  }
}

run();
