const fs = require('fs');
const { parse } = require('csv-parse/sync');
const path = require('path');
const db = require('./src/db/db');

// Pénznem tisztítása és számok konvertálása
function parseDecimal(str) {
  if (!str || str.trim() === '') return null;
  let cleanStr = str.replace(',', '.');
  cleanStr = cleanStr.replace(/[^\d\.-]/g, '');
  
  const parts = cleanStr.split('.');
  if (parts.length > 2) {
    cleanStr = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
  }

  let val = parseFloat(cleanStr);
  if (isNaN(val)) return null;
  if (val > 99999999 || val < -99999999) return 0;
  return val;
}

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

function parseOrderNumber(orderNum) {
  if (!orderNum) return { type: null, seq: null };
  const clean = orderNum.trim();
  const match = clean.match(/^([A-Za-z]+)\s*(\d+)/);
  if (match) {
    return {
      type: match[1].toUpperCase(),
      seq: parseInt(match[2], 10)
    };
  }
  return { type: null, seq: null };
}

async function runImport() {
  console.log('🚀 25-26 Szezon adatbázis frissítés indítása (csak 2026. május 1. utáni adatok)...');
  
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
    console.log(`✅ Megtalált Szezon: ${season.code} (id: ${seasonId})`);
    
    // Sequences helyreállítása biztonság kedvéért
    await db.raw(`SELECT setval('seasons_id_seq', COALESCE((SELECT MAX(id)+1 FROM seasons), 1), false)`);
    await db.raw(`SELECT setval('transporters_id_seq', COALESCE((SELECT MAX(id)+1 FROM transporters), 1), false)`);
    await db.raw(`SELECT setval('products_id_seq', COALESCE((SELECT MAX(id)+1 FROM products), 1), false)`);
    await db.raw(`SELECT setval('partners_id_seq', COALESCE((SELECT MAX(id)+1 FROM partners), 1), false)`);
    
    // Caches maps
    const transMap = {};
    const transDb = await db('transporters').select('*');
    for (const t of transDb) { transMap[t.name.toUpperCase()] = t.id; }
    
    async function getTransporterId(name) {
      if (!name || name.trim() === '') return null;
      let cleanName = name.trim();
      if (cleanName === '2') return null;
      if (/^2\s+/i.test(cleanName)) {
        cleanName = cleanName.replace(/^2\s+/i, '');
      }
      const key = cleanName.toUpperCase();
      if (transMap[key]) return transMap[key];
      const [newId] = await db('transporters').insert({ name: cleanName, code: key.substring(0,3) }).returning('id');
      transMap[key] = newId.id;
      return newId.id;
    }
    
    const prodMap = {};
    const prodDb = await db('products').select('*');
    for (const p of prodDb) { prodMap[p.name.toUpperCase()] = p.id; }
    
    async function getProductId(name) {
      if (!name || name.trim() === '') return null;
      const key = name.trim().toUpperCase();
      if (prodMap[key]) return prodMap[key];
      const [newId] = await db('products').insert({ name: name.trim() }).returning('id');
      prodMap[key] = newId.id;
      return newId.id;
    }
    
    const partnerMap = {};
    const partnerDb = await db('partners').select('*');
    for (const p of partnerDb) { partnerMap[p.name.toUpperCase()] = p.id; }
    
    async function getPartnerId(name) {
      if (!name || name.trim() === '') return null;
      const key = name.trim().toUpperCase();
      if (partnerMap[key]) return partnerMap[key];
      const [newId] = await db('partners').insert({ name: name.trim() }).returning('id');
      partnerMap[key] = newId.id;
      return newId.id;
    }
    
    // 2. CSV beolvasása (UTF-8 encoding, BOM eltávolítás)
    let content = fs.readFileSync(csvPath, 'utf8');
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }
    
    const records = parse(content, { delimiter: ';', columns: true, skip_empty_lines: true, relax_quotes: true, relax_column_count: true });
    console.log(`📊 Beolvasott összes sor: ${records.length}`);
    
    // Filter out rows without order number or loading date, or before 2026-05-01
    const validRecords = records.filter(row => {
      const orderNumber = findCol(row, 'Order number');
      const loadingDate = findCol(row, 'Loading date');
      if (!orderNumber || !loadingDate) return false;
      const parsedD = parseDate(loadingDate);
      return parsedD && parsedD >= '2026-05-01';
    });
    console.log(`✅ Érvényes fuvar sorok száma (2026. május 1. utáni): ${validRecords.length}`);
    
    // 3. Régi shipment_lines törlése a 25-26 szezonban azon fuvarokhoz, amik frissülni fognak
    const csvOrderNumbers = [];
    for (const row of validRecords) {
      const orderNumber = findCol(row, 'Order number').trim();
      if (orderNumber && !csvOrderNumbers.includes(orderNumber)) {
        csvOrderNumbers.push(orderNumber);
      }
    }
    
    const shipIdsToClear = await db('shipments')
      .where('season_id', seasonId)
      .whereIn('order_number', csvOrderNumbers)
      .pluck('id');
      
    if (shipIdsToClear.length > 0) {
      const deletedLines = await db('shipment_lines').whereIn('shipment_id', shipIdsToClear).del();
      console.log(`🗑️ Régi shipment_lines törölve a frissítendő fuvarokhoz: ${deletedLines} db tétel.`);
    }
    
    // 4. Shipments UPSERT és Lines beszúrás
    const upsertedShipments = new Map(); // orderNumber.trim().toUpperCase() -> shipment ID
    let insertedLinesCount = 0;
    
    // Először gyűjtsük össze az egyedi fuvarokat az upserthez
    const uniqueOrderRecords = {};
    for (const row of validRecords) {
      const orderNumber = findCol(row, 'Order number').trim();
      const key = orderNumber.toUpperCase();
      if (!uniqueOrderRecords[key]) {
        uniqueOrderRecords[key] = [];
      }
      uniqueOrderRecords[key].push(row);
    }
    
    console.log(`🚚 Egyedi fuvarok (rendszámok) száma a CSV-ben: ${Object.keys(uniqueOrderRecords).length}`);
    
    // Végezzük el az upsert-et a fuvarokhoz
    for (const [key, rows] of Object.entries(uniqueOrderRecords)) {
      const firstRow = rows[0];
      const orderNumber = findCol(firstRow, 'Order number').trim();
      const loadingDate = parseDate(findCol(firstRow, 'Loading date'));
      const transporterId = await getTransporterId(findCol(firstRow, 'Transport company'));
      const parsedOrder = parseOrderNumber(orderNumber);
      
      const shipmentData = {
        order_number: orderNumber,
        season_id: seasonId,
        loading_date: loadingDate,
        loading_place: findCol(firstRow, 'Loading place'),
        plate_number: findCol(firstRow, 'Plate number'),
        transport_price: parseDecimal(findCol(firstRow, 'Transport price')),
        arrival_date: parseDate(findCol(firstRow, 'Arrival date')),
        transporter_id: transporterId,
        truck_type: parsedOrder.type,
        truck_seq_number: parsedOrder.seq,
        is_loaded: true
      };
      
      let shipment = await db('shipments').where({ order_number: orderNumber, season_id: seasonId }).first();
      let shipmentId;
      if (shipment) {
        await db('shipments').where('id', shipment.id).update(shipmentData);
        shipmentId = shipment.id;
      } else {
        const [newShip] = await db('shipments').insert(shipmentData).returning('id');
        shipmentId = newShip.id;
      }
      upsertedShipments.set(key, shipmentId);
    }
    
    console.log('✅ Fuvarok (shipments) sikeresen upsertelve.');
    
    // Beszúrjuk a tételsorokat (shipment_lines)
    for (const row of validRecords) {
      const orderNumber = findCol(row, 'Order number').trim();
      const key = orderNumber.toUpperCase();
      const shipmentId = upsertedShipments.get(key);
      
      const productId = await getProductId(findCol(row, 'Products'));
      const partnerId = await getPartnerId(findCol(row, 'Reference'));
      
      let euro = 0;
      let normal = 0;
      for (const k of Object.keys(row)) {
        if (k.includes('Euro Palets')) euro = parseInt(row[k], 10) || 0;
        if (k.includes('Normal Palets')) normal = parseInt(row[k], 10) || 0;
      }
      
      await db('shipment_lines').insert({
        shipment_id: shipmentId,
        product_id: productId,
        partner_id: partnerId,
        customer: findCol(row, 'Customer'),
        destination: findCol(row, 'Destination'),
        euro_palets: euro,
        normal_palets: normal,
        total_palets: parseDecimal(findCol(row, 'Total Palets')),
        gross_weight_kg: parseDecimal(findCol(row, 'Gross weight')),
        price_eur: parseDecimal(findCol(row, 'Price (EUR)')),
        price_bcn_eur: parseDecimal(findCol(row, 'Price BCN')),
        unit: findCol(row, 'Unit'),
        reloading_per_plt: parseDecimal(findCol(row, 'Reloading/plt')),
        transport_bcn_per_plt: parseDecimal(findCol(row, 'Transport BCN/plt')),
        albaran_number: findCol(row, 'Albar'),
        transport_cost: parseDecimal(findCol(row, 'Total Transport cost')),
        transport_cost_product: parseDecimal(findCol(row, 'Transport Cost / product')),
        comment: findCol(row, 'Comment'),
      });
      insertedLinesCount++;
    }
    
    console.log(`✅ Beszúrt új shipment_lines száma: ${insertedLinesCount}`);
    
    // 5. Árva (üres) fuvarok takarítása a 25-26 szezonban (május 1. utániak)
    const currentShipments = await db('shipments')
      .where('season_id', seasonId)
      .where('loading_date', '>=', '2026-05-01')
      .select('id', 'order_number');
    let cleanedCount = 0;
    
    for (const s of currentShipments) {
      const lineCount = await db('shipment_lines').where('shipment_id', s.id).count('id as cnt').first();
      if (parseInt(lineCount.cnt, 10) === 0) {
        const ekaerCount = await db('ekaer_records').where('shipment_id', s.id).count('id as cnt').first();
        const toCount = await db('transport_orders').where('shipment_id', s.id).count('id as cnt').first();
        const leCount = await db('loading_events').where('shipment_id', s.id).count('id as cnt').first();
        
        if (parseInt(ekaerCount.cnt, 10) === 0 && parseInt(toCount.cnt, 10) === 0 && parseInt(leCount.cnt, 10) === 0) {
          await db('shipments').where('id', s.id).del();
          cleanedCount++;
        }
      }
    }
    
    console.log(`🧹 Sikeresen törölve ${cleanedCount} db üres (árva) fuvar a 25-26 szezonban (május 1. utáni).`);
    console.log('🎉 SIKERES IMPORT!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Hiba történt az import során:', err);
    process.exit(1);
  }
}

runImport();
