const fs = require('fs');
const { parse } = require('csv-parse/sync');
const path = require('path');
const db = require('./src/db/db');

// Dátumból szezon számítása
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

// Pénznem tisztítása
function parseDecimal(str) {
  if (!str || str.trim() === '') return null;
  let cleanStr = str.replace(',', '.');
  cleanStr = cleanStr.replace(/[^\d\.-]/g, '');
  const parts = cleanStr.split('.');
  if (parts.length > 2) cleanStr = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
  let val = parseFloat(cleanStr);
  if (isNaN(val)) return null;
  if (val > 99999999 || val < -99999999) return 0;
  return val;
}

// Dátum tisztítása
function parseDate(str) {
  if (!str) return null;
  const cleaned = str.trim().replace(/\./g, '-');
  if (/^\d{4}-\d{2}-\d{2}/.test(cleaned)) return cleaned.substring(0, 10);
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

// CSV fejléc keresés
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
  console.log('📦 Új tételek importálása (május 6. utániak)...');
  try {
    const seasonsMap = {};
    const seasonsDb = await db('seasons').select('*');
    for (const s of seasonsDb) seasonsMap[s.code] = s.id;
    
    async function getSeasonId(code) {
      if (!code) return null;
      if (seasonsMap[code]) return seasonsMap[code];
      const [newId] = await db('seasons').insert({ code, start_date: `20${code.split('-')[0]}-09-01`, end_date: `20${code.split('-')[1]}-08-31` }).returning('id');
      seasonsMap[code] = newId.id;
      return newId.id;
    }

    const transMap = {};
    const transDb = await db('transporters').select('*');
    for (const t of transDb) transMap[t.name.toUpperCase()] = t.id;
    
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
    for (const p of prodDb) prodMap[p.name.toUpperCase()] = p.id;
    
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
    for (const p of partnerDb) partnerMap[p.name.toUpperCase()] = p.id;
    
    async function getPartnerId(name) {
      if (!name || name.trim() === '') return null;
      const key = name.trim().toUpperCase();
      if (partnerMap[key]) return partnerMap[key];
      const [newId] = await db('partners').insert({ name: name.trim() }).returning('id');
      partnerMap[key] = newId.id;
      return newId.id;
    }

    const linesCsvPath = path.join(__dirname, '../25-26 Fuvarok összesítö 260621.csv');
    if (!fs.existsSync(linesCsvPath)) {
      console.log('⚠️ A fájl nem található:', linesCsvPath);
      process.exit(1);
    }

    const content = fs.readFileSync(linesCsvPath, 'latin1');
    const records = parse(content, { delimiter: ';', columns: true, skip_empty_lines: true, relax_quotes: true, relax_column_count: true });
    
    const newRecords = records.filter(row => {
      const d = parseDate(findCol(row, 'Loading date'));
      return d && d > '2026-05-06';
    });

    console.log(`Találtunk ${newRecords.length} db május 6. utáni tételt.`);

    const clearedShipments = new Set();
    let insertedLinesCount = 0;

    for (const row of newRecords) {
      const orderNumber = findCol(row, 'Order number');
      const loadingDate = findCol(row, 'Loading date');
      if (!orderNumber || !loadingDate) continue;
      
      const seasonCode = getSeasonCode(loadingDate);
      if (!seasonCode) continue;
      
      const seasonId = await getSeasonId(seasonCode);
      
      let shipment = await db('shipments').where({ order_number: orderNumber.trim(), season_id: seasonId }).first();
      if (!shipment) {
        const tId = await getTransporterId(findCol(row, 'Transport company'));
        const [newShip] = await db('shipments').insert({
          order_number: orderNumber.trim(),
          season_id: seasonId,
          loading_date: parseDate(loadingDate),
          loading_place: findCol(row, 'Loading place'),
          plate_number: findCol(row, 'Plate number'),
          transport_price: parseDecimal(findCol(row, 'Transport price')),
          arrival_date: parseDate(findCol(row, 'Arrival date')),
          transporter_id: tId
        }).returning('*');
        shipment = newShip;
      }

      if (!clearedShipments.has(shipment.id)) {
        await db('shipment_lines').where('shipment_id', shipment.id).del();
        clearedShipments.add(shipment.id);
      }

      const productId = await getProductId(findCol(row, 'Products'));
      const partnerId = await getPartnerId(findCol(row, 'Reference'));
      
      let euro = 0;
      let normal = 0;
      for (const key of Object.keys(row)) {
        if (key.includes('Euro Palets')) euro = parseInt(row[key], 10) || 0;
        if (key.includes('Normal Palets')) normal = parseInt(row[key], 10) || 0;
      }

      await db('shipment_lines').insert({
        shipment_id: shipment.id,
        product_id: productId,
        partner_id: partnerId,
        customer: findCol(row, 'Customer'),
        destination: findCol(row, 'Destination'),
        euro_palets: euro,
        normal_palets: normal,
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
    
    console.log(`✅ KÉSZ! ${clearedShipments.size} fuvar érintve. Sikeresen bekerült ${insertedLinesCount} tétel az adatbázisba!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Hiba történt:', err);
    process.exit(1);
  }
}

runImport();
