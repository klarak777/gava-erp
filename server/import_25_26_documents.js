/**
 * 25-26 szezon Fuvarmegbízás + EKAER dokumentum adatok generálása.
 * 
 * A FileMapDatabase CSV utolsó bejegyzése: BEL016 Season 24-25, 2025.05.05.
 * Ez a szkript a Transportistas CSV-ből kiegészíti a hiányzó dokumentum adatokat
 * a 25-26 szezon fuvarjaihoz (2025.05.05 utáni fuvarok, BEL016 utániak).
 * 
 * Generálja a fájlneveket és elérési utakat a meglévő minták alapján:
 * - Fuvarmegbízás: \\...\Fuvarmegbízás\25-26\{fuvarozó_mappa}\{fuvarozó_név} {kamionszám}.docx
 * - EKAER: \\...\EKAEREK\EKAEREK 2025-2026\{kamionszám}\{rendszám1}-{rendszám2}.docx
 * 
 * Futtatás: node server/import_25_26_documents.js
 */
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const path = require('path');
const db = require('./src/db/db');
const {
  generateTransportOrderPath,
  generateEkaerPath,
  getDocNamePrefix,
} = require('./src/config/transporterConfig');

// Dátumból szezon számítása (Szeptember 1. - Augusztus 31.)
function getSeasonCode(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  const parts = dateStr.replace(/-/g, '.').split('.');
  if (parts.length < 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  
  if (month >= 9) {
    return `${year.toString().slice(-2)}-${(year + 1).toString().slice(-2)}`;
  } else {
    return `${(year - 1).toString().slice(-2)}-${year.toString().slice(-2)}`;
  }
}

function parseDate(str) {
  if (!str) return null;
  const cleaned = str.trim().replace(/\./g, '-');
  if (/^\d{4}-\d{2}-\d{2}/.test(cleaned)) {
    return cleaned.substring(0, 10);
  }
  return null;
}

function fixHungarianAccents(text) {
  if (!text || typeof text !== 'string') return text;
  let fixed = text;
  fixed = fixed.replace(/K\?NYA/gi, 'KÓNYA');
  fixed = fixed.replace(/BOGN\?R/gi, 'BOGNÁR');
  fixed = fixed.replace(/K\?D\?R/gi, 'KÁDÁR');
  fixed = fixed.replace(/G\?R\?GORSZ\?G/gi, 'GÖRÖGORSZÁG');
  fixed = fixed.replace(/FELS\?PAKONY/gi, 'FELSŐPAKONY');
  fixed = fixed.replace(/MAROKK\?/gi, 'MAROKKÓ');
  fixed = fixed.replace(/ÜLL\?/g, 'ÜLLŐ');
  return fixed;
}

// CSV fejléc keresés részleges egyezéssel
function findCol(row, ...partialNames) {
  for (const partial of partialNames) {
    const pTrim = partial.trim();
    let key = Object.keys(row).find(k => k.trim() === pTrim);
    if (key !== undefined) return fixHungarianAccents((row[key] || '').trim());
    
    key = Object.keys(row).find(k => k.toLowerCase().trim() === pTrim.toLowerCase());
    if (key !== undefined) return fixHungarianAccents((row[key] || '').trim());
    
    if (pTrim.length > 2) {
      key = Object.keys(row).find(k => k.toLowerCase().includes(pTrim.toLowerCase()));
      if (key !== undefined) return fixHungarianAccents((row[key] || '').trim());
    }
  }
  return '';
}

async function runImport() {
  console.log('📦 25-26 szezon dokumentum adatok generálása...');
  console.log('═══════════════════════════════════════');

  try {
    // 1. Transportistas CSV beolvasás
    const csvPath = path.join(__dirname, '../Transportistas 260605.csv');
    if (!fs.existsSync(csvPath)) {
      console.error('❌ A Transportistas CSV nem található:', csvPath);
      process.exit(1);
    }

    const content = fs.readFileSync(csvPath, 'latin1');
    const records = parse(content, {
      delimiter: ';',
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true
    });

    console.log(`📊 Transportistas összes sor: ${records.length}`);

    // 2. Csak a BEL016 utáni fuvarokat szűrjük (2025.05.05 utáni, 24-25 és 25-26 szezon)
    // A FileMapDatabase utolsó bejegyzése: BEL016, Season 24-25, 2025.05.05
    // Tehát az összes fuvarhoz generálunk, amihez még nincs dokumentum adat
    const season2526 = await db('seasons').where('code', '25-26').first();
    const season2425 = await db('seasons').where('code', '24-25').first();

    if (!season2526) {
      console.error('❌ Nem található "25-26" szezon az adatbázisban!');
      process.exit(1);
    }

    console.log(`📅 25-26 szezon id: ${season2526.id}`);

    // 3. Cache: meglévő shipment-ek
    const allShipments = await db('shipments')
      .select('shipments.*', 'transporters.name as transporter_name')
      .leftJoin('transporters', 'shipments.transporter_id', 'transporters.id');
    
    const shipmentMap = {};
    for (const s of allShipments) {
      const key = `${s.order_number.trim().toUpperCase()}|${s.season_id}`;
      shipmentMap[key] = s;
    }

    // 4. Cache: meglévő transport_orders és ekaer_records (duplikátum ellenőrzéshez)
    const existingTO = await db('transport_orders').select('shipment_id');
    const existingTOSet = new Set(existingTO.map(r => r.shipment_id));

    const existingER = await db('ekaer_records').select('shipment_id');
    const existingERSet = new Set(existingER.map(r => r.shipment_id));

    // 5. Transportistas CSV feldolgozás
    let toInserted = 0;
    let ekaerInserted = 0;
    let skippedExisting = 0;
    let skippedNoShipment = 0;
    let skippedNoPlate = 0;

    const transportOrdersBatch = [];
    const ekaerRecordsBatch = [];

    for (const row of records) {
      const loadingDate = findCol(row, 'Loading date');
      const orderNumber = findCol(row, 'Order number');
      const transporter = findCol(row, 'Transporter');
      const plateNumber = findCol(row, 'Plate number');

      if (!orderNumber || !loadingDate) continue;

      const parsedDate = parseDate(loadingDate);
      if (!parsedDate) continue;

      // Szezon számítás
      const seasonCode = getSeasonCode(loadingDate);
      if (!seasonCode) continue;

      // Melyik szezon ID?
      let seasonId = null;
      if (seasonCode === '25-26') seasonId = season2526.id;
      else if (seasonCode === '24-25' && season2425) seasonId = season2425.id;
      else continue; // Régebbi szezonokat nem kezeljük, azok a FileMapDatabase importból jönnek

      // Shipment keresés
      const shipmentKey = `${orderNumber.trim().toUpperCase()}|${seasonId}`;
      const shipment = shipmentMap[shipmentKey];
      if (!shipment) {
        skippedNoShipment++;
        continue;
      }

      // --- Fuvarmegbízás ---
      if (!existingTOSet.has(shipment.id)) {
        const transporterName = transporter || shipment.transporter_name || '';
        const { fileName, filePath } = generateTransportOrderPath(
          seasonCode,
          transporterName,
          orderNumber.trim()
        );

        transportOrdersBatch.push({
          shipment_id: shipment.id,
          season_id: seasonId,
          transporter_id: shipment.transporter_id,
          document_name: fileName,
          file_path: filePath,
          file_date: parsedDate, // loading_date-ot használjuk ha nincs file_date
          loading_date: parsedDate,
          is_sent: false, // Új dokumentum, alapértelmezetten nem kiküldött
        });
        existingTOSet.add(shipment.id);
        toInserted++;
      } else {
        skippedExisting++;
      }

      // --- EKAER ---
      if (!existingERSet.has(shipment.id) && plateNumber) {
        const ekaerResult = generateEkaerPath(
          seasonCode,
          orderNumber.trim(),
          plateNumber
        );

        if (ekaerResult) {
          ekaerRecordsBatch.push({
            shipment_id: shipment.id,
            season_id: seasonId,
            transporter_id: shipment.transporter_id,
            ekaer_file_name: ekaerResult.fileName,
            file_path: ekaerResult.filePath,
            file_date: parsedDate,
            load_date: parsedDate,
            is_sent: false,
          });
          existingERSet.add(shipment.id);
          ekaerInserted++;
        } else {
          skippedNoPlate++;
        }
      } else if (!plateNumber) {
        skippedNoPlate++;
      }
    }

    // 6. Batch beszúrás
    console.log('\n📝 Batch beszúrás indítása...');

    const BATCH_SIZE = 500;

    for (let i = 0; i < transportOrdersBatch.length; i += BATCH_SIZE) {
      const batch = transportOrdersBatch.slice(i, i + BATCH_SIZE);
      await db('transport_orders').insert(batch);
      process.stdout.write(`\r  transport_orders: ${Math.min(i + BATCH_SIZE, transportOrdersBatch.length)}/${transportOrdersBatch.length}`);
    }
    console.log('');

    for (let i = 0; i < ekaerRecordsBatch.length; i += BATCH_SIZE) {
      const batch = ekaerRecordsBatch.slice(i, i + BATCH_SIZE);
      await db('ekaer_records').insert(batch);
      process.stdout.write(`\r  ekaer_records: ${Math.min(i + BATCH_SIZE, ekaerRecordsBatch.length)}/${ekaerRecordsBatch.length}`);
    }
    console.log('');

    // 7. Eredmény összesítés
    console.log('\n═══════════════════════════════════════');
    console.log('📊 25-26 SZEZON DOKUMENTUM IMPORT ÖSSZESÍTÉS:');
    console.log(`  ✅ Új Transport Orders: ${toInserted}`);
    console.log(`  ✅ Új EKAER Records: ${ekaerInserted}`);
    console.log(`  ⏭️ Már létezik (átugorva): ${skippedExisting}`);
    console.log(`  ⚠️ Shipment nem található: ${skippedNoShipment}`);
    console.log(`  ⚠️ Nincs rendszám (EKAER): ${skippedNoPlate}`);

    // Mintaellenőrzés: véletlenszerű rekordok
    console.log('\n📋 MINTA ELLENŐRZÉS (utolsó 5 transport_orders):');
    const sampleTO = await db('transport_orders')
      .select('transport_orders.*', 'shipments.order_number')
      .join('shipments', 'transport_orders.shipment_id', 'shipments.id')
      .orderBy('transport_orders.id', 'desc')
      .limit(5);
    for (const r of sampleTO) {
      console.log(`  ${r.order_number}: ${r.document_name} → ${r.file_path}`);
    }

    console.log('\n📋 MINTA ELLENŐRZÉS (utolsó 5 ekaer_records):');
    const sampleER = await db('ekaer_records')
      .select('ekaer_records.*', 'shipments.order_number')
      .join('shipments', 'ekaer_records.shipment_id', 'shipments.id')
      .orderBy('ekaer_records.id', 'desc')
      .limit(5);
    for (const r of sampleER) {
      console.log(`  ${r.order_number}: ${r.ekaer_file_name} → ${r.file_path}`);
    }

    // Teljes statisztika
    console.log('\n📅 TELJES STATISZTIKA (szezonszintű):');
    const totalTO = await db('transport_orders')
      .select('seasons.code')
      .count('transport_orders.id as cnt')
      .join('seasons', 'transport_orders.season_id', 'seasons.id')
      .groupBy('seasons.code')
      .orderBy('seasons.code');
    for (const s of totalTO) {
      console.log(`  ${s.code}: ${s.cnt} fuvarmegbízás`);
    }

    const totalER = await db('ekaer_records')
      .select('seasons.code')
      .count('ekaer_records.id as cnt')
      .join('seasons', 'ekaer_records.season_id', 'seasons.id')
      .groupBy('seasons.code')
      .orderBy('seasons.code');
    for (const s of totalER) {
      console.log(`  ${s.code}: ${s.cnt} EKAER`);
    }

    console.log('\n🎉 SIKERES IMPORT!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Hiba történt:', err);
    process.exit(1);
  }
}

runImport();
