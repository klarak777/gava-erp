const fs = require('fs');
const { parse } = require('csv-parse/sync');
const path = require('path');
const db = require('./src/db/db');

// Dátumból szezon számítása
function getSeasonCode(dateStr, defaultSeason) {
  if (!dateStr || dateStr.trim() === '') return defaultSeason;
  
  // Megpróbáljuk standardizálni a dátum formátumot (pl. 2019.08.31 vagy 2019-08-31)
  const cleaned = dateStr.replace(/[-\s/]/g, '.');
  const parts = cleaned.split('.');
  
  let year = null;
  let month = null;
  
  if (parts.length >= 3) {
    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
    } else if (parts[2].length === 4) {
      year = parseInt(parts[2], 10);
      month = parseInt(parts[1], 10);
    }
  }
  
  if (year && month) {
    if (month >= 9) {
      return `${year.toString().slice(-2)}-${(year + 1).toString().slice(-2)}`;
    } else {
      return `${(year - 1).toString().slice(-2)}-${year.toString().slice(-2)}`;
    }
  }
  
  return defaultSeason;
}

// Számok konvertálása
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

// Egész számok konvertálása
function parseIntVal(str) {
  if (!str || str.trim() === '') return 0;
  let cleanStr = str.replace(/[^\d-]/g, '');
  let val = parseInt(cleanStr, 10);
  return isNaN(val) ? 0 : val;
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

// Ékezetes betűk helyreállítása
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
    
    // 1. Teljes pontos egyezés
    let key = Object.keys(row).find(k => k.trim() === pTrim);
    if (key !== undefined) return fixHungarianAccents((row[key] || '').trim());
    
    // 2. Kisbetűs pontos egyezés
    key = Object.keys(row).find(k => k.toLowerCase().trim() === pTrim.toLowerCase());
    if (key !== undefined) return fixHungarianAccents((row[key] || '').trim());
    
    // 3. Részleges egyezés (ha elég hosszú)
    if (pTrim.length > 2) {
      key = Object.keys(row).find(k => k.toLowerCase().includes(pTrim.toLowerCase()));
      if (key !== undefined) return fixHungarianAccents((row[key] || '').trim());
    }
  }
  return '';
}

async function runImport() {
  console.log('🚀 Történeti adatok importálása indult...');
  
  const files = [
    { name: '18-19_Fuvarok összesítő.csv', defaultSeason: '18-19' },
    { name: '19-20_Fuvarok összesítő.csv', defaultSeason: '19-20' },
    { name: '20-21_Fuvarok összesítő.csv', defaultSeason: '20-21' },
    { name: '21-22_Fuvarok összesítő.csv', defaultSeason: '21-22' },
    { name: '22-23_Fuvarok összesítő.csv', defaultSeason: '22-23' },
    { name: '23-24_Fuvarok összesítő.csv', defaultSeason: '23-24' },
    { name: '24-25 Fuvarok összesítő.csv', defaultSeason: '24-25' }
  ];

  const baseDir = path.join(__dirname, '..');

  try {
    // Sorszámozók (sequences) helyreállítása a biztonság kedvéért
    await db.raw(`SELECT setval('seasons_id_seq', COALESCE((SELECT MAX(id)+1 FROM seasons), 1), false)`);
    await db.raw(`SELECT setval('transporters_id_seq', COALESCE((SELECT MAX(id)+1 FROM transporters), 1), false)`);
    await db.raw(`SELECT setval('products_id_seq', COALESCE((SELECT MAX(id)+1 FROM products), 1), false)`);
    await db.raw(`SELECT setval('partners_id_seq', COALESCE((SELECT MAX(id)+1 FROM partners), 1), false)`);

    // Gyorstárak (cache maps) betöltése
    const seasonsMap = {};
    const seasonsDb = await db('seasons').select('*');
    for (const s of seasonsDb) seasonsMap[s.code] = s.id;
    
    async function getSeasonId(code) {
      if (!code) return null;
      if (seasonsMap[code]) return seasonsMap[code];
      const [newId] = await db('seasons').insert({
        code: code,
        start_date: `20${code.split('-')[0]}-09-01`,
        end_date: `20${code.split('-')[1]}-08-31`
      }).returning('id');
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

    const clearedShipments = new Set();
    let totalFilesCount = 0;
    let totalLinesCount = 0;
    let totalShipmentsCount = 0;

    for (const fileObj of files) {
      const filePath = path.join(baseDir, fileObj.name);
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️ Fájl nem található, kihagyás: ${fileObj.name}`);
        continue;
      }
      
      console.log(`📖 Fájl feldolgozása: ${fileObj.name}...`);
      let content = fs.readFileSync(filePath, 'utf8');
      content = content.replace(/^\ufeff/, ''); // Strip BOM
      
      const records = parse(content, { 
        delimiter: ';', 
        columns: true, 
        skip_empty_lines: true, 
        relax_quotes: true, 
        relax_column_count: true 
      });
      
      console.log(`  - Beolvasott nyers sorok száma: ${records.length}`);
      
      let fileLinesCount = 0;
      let fileShipmentsCount = 0;

      for (const row of records) {
        const orderNumber = findCol(row, 'Order number', 'Order N°');
        if (!orderNumber || orderNumber.trim() === '') continue; // Skip empty rows (Excel sheet padding)
        
        const loadingDate = findCol(row, 'Loading date');
        const seasonCode = getSeasonCode(loadingDate, fileObj.defaultSeason);
        const seasonId = await getSeasonId(seasonCode);
        
        // Meglévő shipment keresése vagy új létrehozása
        let shipment = await db('shipments').where({ order_number: orderNumber.trim(), season_id: seasonId }).first();
        const transporterId = await getTransporterId(findCol(row, 'Transport company', 'Transporter'));
        
        const shipmentData = {
          order_number: orderNumber.trim(),
          season_id: seasonId,
          transporter_id: transporterId,
          plate_number: findCol(row, 'Plate number'),
          loading_place: findCol(row, 'Loading place'),
          loading_date: parseDate(loadingDate),
          arrival_date: parseDate(findCol(row, 'Arrival date')),
          transport_price: parseDecimal(findCol(row, 'Transport price')),
          invoice_number: findCol(row, 'Invoice N°', 'Invoice number'),
          invoice_amount_eur: parseDecimal(findCol(row, 'Invoice amount', 'Amount EUR')),
          invoice_amount_huf: parseDecimal(findCol(row, 'Amount HUF')),
          payment_date: parseDate(findCol(row, 'Payment date')),
          kb: parseDecimal(findCol(row, 'K-B')),
          b: parseDecimal(findCol(row, 'B') || ''),
          t: parseDecimal(findCol(row, ';T;') || findCol(row, 'T') || ''),
          comment: findCol(row, 'Comment'),
          is_loaded: true // történeti adatok, mind befejezett/rakodott
        };

        if (shipment) {
          await db('shipments').where('id', shipment.id).update(shipmentData);
        } else {
          const [newShip] = await db('shipments').insert(shipmentData).returning('*');
          shipment = newShip;
          fileShipmentsCount++;
          totalShipmentsCount++;
        }

        // Töröljük a régi tételeket a fuvarnál az első találkozáskor ebben a futásban
        if (!clearedShipments.has(shipment.id)) {
          await db('shipment_lines').where('shipment_id', shipment.id).del();
          clearedShipments.add(shipment.id);
        }

        // Tétel adatainak kinyerése
        const productId = await getProductId(findCol(row, 'Products'));
        const partnerId = await getPartnerId(findCol(row, 'Reference'));
        
        let euro = 0;
        let normal = 0;
        for (const key of Object.keys(row)) {
          if (key.includes('Euro Palets') || key === 'Euro') euro = parseIntVal(row[key]);
          if (key.includes('Normal Palets') || key === 'Normal') normal = parseIntVal(row[key]);
        }

        await db('shipment_lines').insert({
          shipment_id: shipment.id,
          product_id: productId,
          partner_id: partnerId,
          customer: findCol(row, 'Customer'),
          destination: findCol(row, 'Destination', 'Unloading place', 'Unloading'),
          euro_palets: euro,
          normal_palets: normal,
          total_palets: euro + normal,
          gross_weight_kg: parseDecimal(findCol(row, 'Gross weight')),
          price_eur: parseDecimal(findCol(row, 'Price (EUR)', 'Price')),
          price_bcn_eur: parseDecimal(findCol(row, 'Price BCN')),
          unit: findCol(row, 'Unit'),
          reloading_per_plt: parseDecimal(findCol(row, 'Reloading/plt')),
          transport_bcn_per_plt: parseDecimal(findCol(row, 'Transport BCN/plt')),
          albaran_number: findCol(row, 'Albarán', 'Albar'),
          transport_cost: parseDecimal(findCol(row, 'Transport cost', 'Total Transport cost')),
          transport_cost_product: parseDecimal(findCol(row, 'Transport Cost / product')),
          comment: findCol(row, 'Comment'),
        });

        fileLinesCount++;
        totalLinesCount++;
      }
      
      console.log(`  ✅ Feldolgozva: ${fileShipmentsCount} új fuvar létrehozva, ${fileLinesCount} tétel sikeresen importálva.`);
      totalFilesCount++;
    }

    console.log(`\n🎉 MINDEN FÁJL KÉSZ!`);
    console.log(`Összesen ${totalFilesCount} fájl lett feldolgozva.`);
    console.log(`Létrehozott új fuvarok száma: ${totalShipmentsCount}`);
    console.log(`Beszúrt tételek száma: ${totalLinesCount}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Végzetes hiba történt az importálás során:', err);
    process.exit(1);
  }
}

runImport();
