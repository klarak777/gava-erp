/**
 * FileMapDatabase CSV → transport_orders + ekaer_records import szkript.
 * 
 * A FileMapDatabase.csv tartalmazza az összes fuvar Fuvarmegbízás és EKAER
 * dokumentum metaadatait (fájlnév, útvonal, dátum, kiküldve státusz) 
 * 7 szezonra visszamenőleg (Season 18-19 → Season 24-25).
 * 
 * Ez a szkript importálja ezeket az adatokat a PostgreSQL adatbázisba.
 * 
 * Futtatás: node server/import_file_map_database.js
 */
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const path = require('path');
const db = require('./src/db/db');

// Magyar hónap rövidítések → szám
const HUNGARIAN_MONTHS = {
  'jan': '01', 'feb': '02', 'már': '03', 'mar': '03', 'ápr': '04', 'apr': '04',
  'máj': '05', 'maj': '05', 'jún': '06', 'jun': '06', 'júl': '07', 'jul': '07',
  'aug': '08', 'sze': '09', 'okt': '10', 'nov': '11', 'dec': '12'
};

/**
 * Magyar formátumú dátumot parse-ol.
 * Támogatott formátumok:
 *   - "03-máj-25" → "2025-05-03"
 *   - "2025.05.03" → "2025-05-03"
 *   - "02-máj-25" → "2025-05-02"
 * @param {string} str
 * @returns {string|null} YYYY-MM-DD formátum, vagy null
 */
function parseHungarianDate(str) {
  if (!str || str.trim() === '') return null;
  const s = str.trim();

  // Formátum: "2025.05.03" vagy "2025-05-03"
  const isoMatch = s.match(/^(\d{4})[.\-](\d{2})[.\-](\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  // Formátum: "03-máj-25" (nap-hónap_rövidítés-év_rövidítés)
  const hunMatch = s.match(/^(\d{1,2})[.\-]([a-záéíóöőúüű]+)[.\-](\d{2,4})/i);
  if (hunMatch) {
    const day = hunMatch[1].padStart(2, '0');
    const monthStr = hunMatch[2].toLowerCase().substring(0, 3);
    const month = HUNGARIAN_MONTHS[monthStr];
    if (!month) return null;

    let year = hunMatch[3];
    if (year.length === 2) {
      year = parseInt(year, 10) >= 50 ? `19${year}` : `20${year}`;
    }
    return `${year}-${month}-${day}`;
  }

  return null;
}

/**
 * Dátum parser a Load_Date formátumhoz (2025.05.03 stílusú).
 * @param {string} str
 * @returns {string|null}
 */
function parseDate(str) {
  if (!str) return null;
  const cleaned = str.trim().replace(/\./g, '-');
  if (/^\d{4}-\d{2}-\d{2}/.test(cleaned)) {
    return cleaned.substring(0, 10);
  }
  return null;
}

/**
 * "Season 24-25" → "24-25"
 * @param {string} seasonPeriod
 * @returns {string|null}
 */
function extractSeasonCode(seasonPeriod) {
  if (!seasonPeriod) return null;
  const match = seasonPeriod.match(/(\d{2}-\d{2})/);
  return match ? match[1] : null;
}

async function runImport() {
  console.log('📦 FileMapDatabase import indítása...');
  console.log('═══════════════════════════════════════');

  try {
    // CSV beolvasás
    const csvPath = path.join(__dirname, '../FileMapDatabase.csv');
    if (!fs.existsSync(csvPath)) {
      console.error('❌ A FileMapDatabase.csv nem található:', csvPath);
      process.exit(1);
    }

    let content = fs.readFileSync(csvPath, 'utf8');
    // BOM eltávolítás
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }

    const records = parse(content, {
      delimiter: ';',
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true
    });

    console.log(`📊 Beolvasott sorok száma: ${records.length}`);

    // === Cache-ek betöltése ===

    // Szezonok
    const seasonsMap = {};
    const seasonsDb = await db('seasons').select('*');
    for (const s of seasonsDb) { seasonsMap[s.code] = s.id; }
    console.log(`📅 Betöltött szezonok: ${Object.keys(seasonsMap).join(', ')}`);

    // Fuvarozók
    const transMap = {};
    const transDb = await db('transporters').select('*');
    for (const t of transDb) { transMap[t.name.toUpperCase()] = t.id; }

    // Szállító ID keresés / létrehozás
    async function getTransporterId(name) {
      if (!name || name.trim() === '') return null;
      const key = name.trim().toUpperCase();
      if (transMap[key]) return transMap[key];
      // Próbáljuk létrehozni
      const [newId] = await db('transporters')
        .insert({ name: name.trim(), code: key.substring(0, 3) })
        .returning('id');
      transMap[key] = newId.id;
      return newId.id;
    }

    // === Shipment keresés cache ===
    // order_number + season_id → shipment_id
    const shipmentCache = {};
    const allShipments = await db('shipments').select('id', 'order_number', 'season_id');
    for (const s of allShipments) {
      const key = `${s.order_number.trim().toUpperCase()}|${s.season_id}`;
      shipmentCache[key] = s.id;
    }
    console.log(`🚚 Betöltött fuvarok száma: ${allShipments.length}`);

    // === Meglévő transport_orders és ekaer_records törlése (tiszta import) ===
    const existingTO = await db('transport_orders').count('id as cnt').first();
    const existingER = await db('ekaer_records').count('id as cnt').first();
    console.log(`📋 Meglévő transport_orders: ${existingTO.cnt}, ekaer_records: ${existingER.cnt}`);

    if (parseInt(existingTO.cnt, 10) > 0 || parseInt(existingER.cnt, 10) > 0) {
      console.log('🗑️ Meglévő transport_orders és ekaer_records törlése (tiszta import)...');
      await db('transport_orders').del();
      await db('ekaer_records').del();
    }

    // === Import ===
    let toInserted = 0;
    let toSkipped = 0;
    let ekaerInserted = 0;
    let ekaerSkipped = 0;
    let shipmentNotFound = 0;

    // Batch insert adatok
    const transportOrdersBatch = [];
    const ekaerRecordsBatch = [];

    for (const row of records) {
      const tourNumber = (row.Tour_number || '').trim();
      const seasonPeriod = (row.Season_Period || '').trim();
      const loadDate = (row.Load_Date || '').trim();
      const transporter = (row.Transporter || '').trim();

      if (!tourNumber || !seasonPeriod) continue;

      const seasonCode = extractSeasonCode(seasonPeriod);
      if (!seasonCode || !seasonsMap[seasonCode]) {
        continue;
      }

      const seasonId = seasonsMap[seasonCode];
      const shipmentKey = `${tourNumber.toUpperCase()}|${seasonId}`;
      const shipmentId = shipmentCache[shipmentKey];

      if (!shipmentId) {
        shipmentNotFound++;
        continue;
      }

      const transporterId = await getTransporterId(transporter);
      const loadingDate = parseDate(loadDate);

      // --- Fuvarmegbízás (transport_orders) ---
      const fuvarmFileName = (row.Fuvarm_FileName || '').trim();
      if (fuvarmFileName) {
        const fuvarmFilePath = (row.Fuvarm_FilePath || '').trim();
        const fuvarmFileDate = parseHungarianDate((row.Fuvarm_FileDate || '').trim()) || loadingDate;
        const fuvarmSent = (row.Fuvarm_kiküldve || row['Fuvarm_kik\u00FCldve'] || '').trim().toUpperCase() === 'IGAZ';

        // Keresés a kiküldve mező UTF-8 encoding problémák miatt
        let sentValue = false;
        for (const k of Object.keys(row)) {
          if (k.includes('Fuvarm_kik') || k.includes('Fuvarm_kük')) {
            sentValue = (row[k] || '').trim().toUpperCase() === 'IGAZ';
            break;
          }
        }

        transportOrdersBatch.push({
          shipment_id: shipmentId,
          season_id: seasonId,
          transporter_id: transporterId,
          document_name: fuvarmFileName,
          file_path: fuvarmFilePath,
          file_date: fuvarmFileDate,
          loading_date: loadingDate,
          is_sent: sentValue || fuvarmSent,
        });
        toInserted++;
      } else {
        toSkipped++;
      }

      // --- EKAER (ekaer_records) ---
      const ekaerFileName = (row.EKAER_FileName || '').trim();
      if (ekaerFileName) {
        const ekaerFilePath = (row.EKAER_FilePath || '').trim();
        const ekaerFileDate = parseHungarianDate((row.EKAER_FileDate || '').trim()) || loadingDate;

        // Keresés a kiküldve mező UTF-8 encoding problémák miatt
        let ekaerSent = false;
        for (const k of Object.keys(row)) {
          if (k.includes('EKAER_kik') || k.includes('EKAER_kük')) {
            ekaerSent = (row[k] || '').trim().toUpperCase() === 'IGAZ';
            break;
          }
        }

        ekaerRecordsBatch.push({
          shipment_id: shipmentId,
          season_id: seasonId,
          transporter_id: transporterId,
          ekaer_file_name: ekaerFileName,
          file_path: ekaerFilePath,
          file_date: ekaerFileDate,
          load_date: loadingDate,
          is_sent: ekaerSent,
        });
        ekaerInserted++;
      } else {
        ekaerSkipped++;
      }
    }

    // === Batch beszúrás (1000-es batch méretben) ===
    console.log('\n📝 Batch beszúrás indítása...');

    const BATCH_SIZE = 500;

    // Transport Orders
    for (let i = 0; i < transportOrdersBatch.length; i += BATCH_SIZE) {
      const batch = transportOrdersBatch.slice(i, i + BATCH_SIZE);
      await db('transport_orders').insert(batch);
      process.stdout.write(`\r  transport_orders: ${Math.min(i + BATCH_SIZE, transportOrdersBatch.length)}/${transportOrdersBatch.length}`);
    }
    console.log('');

    // EKAER Records
    for (let i = 0; i < ekaerRecordsBatch.length; i += BATCH_SIZE) {
      const batch = ekaerRecordsBatch.slice(i, i + BATCH_SIZE);
      await db('ekaer_records').insert(batch);
      process.stdout.write(`\r  ekaer_records: ${Math.min(i + BATCH_SIZE, ekaerRecordsBatch.length)}/${ekaerRecordsBatch.length}`);
    }
    console.log('');

    // === Eredmény összesítés ===
    console.log('\n═══════════════════════════════════════');
    console.log('📊 IMPORT ÖSSZESÍTÉS:');
    console.log(`  ✅ Transport Orders beszúrva: ${toInserted}`);
    console.log(`  ⏭️ Transport Orders átugorva (üres fájlnév): ${toSkipped}`);
    console.log(`  ✅ EKAER Records beszúrva: ${ekaerInserted}`);
    console.log(`  ⏭️ EKAER Records átugorva (üres fájlnév): ${ekaerSkipped}`);
    console.log(`  ⚠️ Shipment nem található az adatbázisban: ${shipmentNotFound}`);

    // Szezonszintű statisztika
    console.log('\n📅 SZEZON STATISZTIKA:');
    const toStats = await db('transport_orders')
      .select('seasons.code')
      .count('transport_orders.id as cnt')
      .join('seasons', 'transport_orders.season_id', 'seasons.id')
      .groupBy('seasons.code')
      .orderBy('seasons.code');
    for (const s of toStats) {
      console.log(`  ${s.code}: ${s.cnt} fuvarmegbízás`);
    }

    const erStats = await db('ekaer_records')
      .select('seasons.code')
      .count('ekaer_records.id as cnt')
      .join('seasons', 'ekaer_records.season_id', 'seasons.id')
      .groupBy('seasons.code')
      .orderBy('seasons.code');
    for (const s of erStats) {
      console.log(`  ${s.code}: ${s.cnt} EKAER`);
    }

    console.log('\n🎉 SIKERES IMPORT!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Hiba történt az import során:', err);
    process.exit(1);
  }
}

runImport();
