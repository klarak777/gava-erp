const fs = require('fs');
const { parse } = require('csv-parse/sync');
const path = require('path');
const db = require('./src/db/db');

// Dátum tisztítása
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
  fixed = fixed.replace(/FELS\?PAKONY/gi, 'FELSŐPAKONY');
  fixed = fixed.replace(/HÓDMEZ\?VÁSÁRHELY/gi, 'HÓDMEZŐVÁSÁRHELY');
  fixed = fixed.replace(/ÜLL\?/g, 'ÜLLŐ');
  fixed = fixed.replace(/Üll\?/g, 'Üllő');
  fixed = fixed.replace(/ÜLL\?T/g, 'ÜLLŐT');
  fixed = fixed.replace(/üll\?t/g, 'üllőt');
  fixed = fixed.replace(/HEJ\?KÜRT/g, 'HEJŐKÜRT');
  fixed = fixed.replace(/Hej\?kürt/g, 'Hejőkürt');
  fixed = fixed.replace(/Keresked\?ház/g, 'Kereskedőház');
  fixed = fixed.replace(/KERESKED\?HÁZ/g, 'KERESKEDŐHÁZ');
  fixed = fixed.replace(/M\?hely/g, 'Műhely');
  fixed = fixed.replace(/M\?HELY/g, 'MŰHELY');
  fixed = fixed.replace(/KÖVETKEZ\?RE/g, 'KÖVETKEZŐRE');
  fixed = fixed.replace(/következ\?re/g, 'következőre');
  fixed = fixed.replace(/lév\?/g, 'lévő');
  fixed = fixed.replace(/LÉV\?/g, 'LÉVŐ');
  fixed = fixed.replace(/EBB\?L/g, 'EBBŐL');
  fixed = fixed.replace(/ebb\?l/g, 'ebből');
  fixed = fixed.replace(/F\?SZEREK/g, 'FŰSZEREK');
  fixed = fixed.replace(/f\?szerek/g, 'fűszerek');
  fixed = fixed.replace(/err\?l/g, 'erről');
  fixed = fixed.replace(/ERR\?L/g, 'ERRŐL');
  fixed = fixed.replace(/3000b\?l/g, '3000ből');
  fixed = fixed.replace(/3000B\?L/g, '3000BŐL');
  fixed = fixed.replace(/délel\?tt/g, 'délelőtt');
  fixed = fixed.replace(/DÉLEL\?TT/g, 'DÉLELŐTT');
  fixed = fixed.replace(/el\?z\?/g, 'előző');
  fixed = fixed.replace(/EL\?Z\?/g, 'ELŐZŐ');
  fixed = fixed.replace(/\?k\b/g, 'ők');
  fixed = fixed.replace(/\?K\b/g, 'ŐK');
  fixed = fixed.replace(/\b\?k\b/gi, 'ők');
  fixed = fixed.replace(/ALDI\?/g, 'ALDI');
  fixed = fixed.replace(/ÉRTEND\?/g, 'ÉRTENDŐ');
  fixed = fixed.replace(/értend\?/g, 'értendő');
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

async function verify() {
  console.log('🧐 Adatbázis ellenőrzése...');
  
  try {
    const csvPath = path.join(__dirname, '../25-26 Fuvarok összesítö V2 260617.csv');
    if (!fs.existsSync(csvPath)) {
      console.error('❌ A megadott CSV fájl nem található:', csvPath);
      process.exit(1);
    }
    
    // 1. Dinamikus szezon lekérés a kód alapján
    const season = await db('seasons').where('code', '25-26').first();
    if (!season) {
      console.error('❌ Nem található "25-26" szezon az adatbázisban!');
      process.exit(1);
    }
    const seasonId = season.id;
    
    // 2. CSV adatok elemzése (május 1. utániak)
    let content = fs.readFileSync(csvPath, 'utf8');
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }
    const records = parse(content, { delimiter: ';', columns: true, skip_empty_lines: true, relax_quotes: true, relax_column_count: true });
    
    const csvOrders = new Set();
    let csvLinesCount = 0;
    for (const row of records) {
      const orderNumber = findCol(row, 'Order number');
      const loadingDate = findCol(row, 'Loading date');
      if (!orderNumber || !loadingDate) continue;
      const parsedD = parseDate(loadingDate);
      if (parsedD && parsedD >= '2026-05-01') {
        csvOrders.add(orderNumber.trim().toUpperCase());
        csvLinesCount++;
      }
    }
    
    // 3. DB adatok lekérése (május 1. utániak a 25-26 szezonban)
    const dbShipments = await db('shipments')
      .where('season_id', seasonId)
      .where('loading_date', '>=', '2026-05-01')
      .select('id', 'order_number');
    
    const dbShipmentIds = dbShipments.map(s => s.id);
    let dbLinesCount = 0;
    if (dbShipmentIds.length > 0) {
      const dbLinesResult = await db('shipment_lines')
        .whereIn('shipment_id', dbShipmentIds)
        .count('id as cnt')
        .first();
      dbLinesCount = parseInt(dbLinesResult.cnt, 10);
    }
    
    // Check if any shipments in that range have 0 lines
    let emptyShipmentsCount = 0;
    for (const s of dbShipments) {
      const lc = await db('shipment_lines').where('shipment_id', s.id).count('id as cnt').first();
      if (parseInt(lc.cnt, 10) === 0) {
        emptyShipmentsCount++;
      }
    }

    console.log('\n--- ELLENŐRZÉSI RIPORT (2026. május 1. utáni adatok) ---');
    console.log(`CSV-ben talált egyedi fuvarok (Order number): ${csvOrders.size}`);
    console.log(`DB-ben talált fuvarok (Shipments):          ${dbShipments.length}`);
    console.log(`CSV-ben talált tételek (Lines):              ${csvLinesCount}`);
    console.log(`DB-ben talált tételek (Shipment lines):      ${dbLinesCount}`);
    console.log(`DB-ben lévő üres (0 tételes) fuvarok száma:   ${emptyShipmentsCount}`);
    console.log('------------------------------------------------------');
    
    let success = true;
    if (csvOrders.size !== dbShipments.length) {
      console.error('❌ ELTÉRÉS: A fuvarok (shipments) száma nem egyezik!');
      success = false;
    }
    if (csvLinesCount !== dbLinesCount) {
      console.error('❌ ELTÉRÉS: A tételek (shipment_lines) száma nem egyezik!');
      success = false;
    }
    if (emptyShipmentsCount > 0) {
      console.error('❌ HIBA: Van olyan fuvar a DB-ben a megadott időszakban, aminek nincs tétele!');
      success = false;
    }
    
    if (success) {
      console.log('✅ SIKER: Az adatbázis adatai tökéletesen megegyeznek a CSV-vel!');
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Hiba történt az ellenőrzés során:', err);
    process.exit(1);
  }
}

verify();
