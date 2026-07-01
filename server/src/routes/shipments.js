const express = require('express');
const router = express.Router();
const db = require('../db/db');
const path = require('path');
const fs = require('fs');
const docxService = require('../services/docxService');
const { getFolderName, getCompanyName } = require('../config/transporterConfig');

// GET /api/v1/shipments/order-numbers?tip=GHU
// Visszaadja a következő szabad kamionszámot az adott típushoz (összes szezon max értéke alapján)
router.get('/order-numbers', async (req, res) => {
  try {
    const { tip } = req.query;
    if (!tip) return res.json({ nextSeq: 1, nextFormatted: '' });

    // Legfrissebb szezon lekérése (az ellenőrzéshez)
    const season = await db('seasons').orderBy('start_date', 'desc').first();

    // Az ÖSSZES szezonból lekérdezzük az adott prefix-szel kezdődő order_number-eket
    // A prefix-illesztés az order_number-ből történik regex-szel
    const rows = await db('shipments')
      .select('order_number')
      .whereNotNull('order_number')
      .whereRaw("order_number != ''");

    // Regex térkép – minden típushoz
    const regexMap = {
      'GHU': /^GHU\s+(\d+)$/i,
      'H': /^H(\d+)$/i,
      'BEL': /^BEL[-\s]*(\d+)$/i,
      'EX': /^EX[-\s]*(\d+)$/i,
      'LOG': /^LOG[-\s]*(\d+)$/i,
    };

    const re = regexMap[tip];
    if (!re) {
      return res.json({ nextSeq: 1, nextFormatted: `${tip}001`, seasonCode: season?.code });
    }

    let maxSeq = 0;
    for (const row of rows) {
      const m = (row.order_number || '').match(re);
      if (m) {
        const num = parseInt(m[1]) || 0;
        if (num > maxSeq) maxSeq = num;
      }
    }

    const nextSeq = maxSeq + 1;

    // Formázás
    let nextFormatted;
    if (tip === 'GHU') nextFormatted = `GHU ${nextSeq}`;
    else if (tip === 'H') nextFormatted = `H${String(nextSeq).padStart(3, '0')}`;
    else nextFormatted = `${tip}${String(nextSeq).padStart(3, '0')}`;

    res.json({
      nextSeq,
      nextFormatted,
      maxFound: maxSeq,
      seasonCode: season?.code
    });
  } catch (err) {
    console.error('Hiba az order-numbers lekérdezéskor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});


// GET /api/v1/shipments/by-order/:orderNumber
// Visszaadja a kamion adatait és a hozzá tartozó tételeket
// Az összes szezonban keres, nem csak a legfrissebbben
router.get('/by-order/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;

    // Normalizált order_number alapján keres az ÖSSZES szezonban
    const shipment = await db('shipments')
      .whereRaw('LOWER(REPLACE(order_number, \' \', \'\')) = ?', [
        orderNumber.toLowerCase().replace(/\s+/g, '')
      ])
      .orderBy('id', 'desc')  // Ha több szezonban is van ilyen szám, a legújabbat veszi
      .first();

    if (!shipment) return res.status(404).json({ error: 'Kamion nem található: ' + orderNumber });

    const lines = await db('shipment_lines')
      .select(
        'shipment_lines.*',
        'products.name as productName'
      )
      .leftJoin('products', 'shipment_lines.product_id', 'products.id')
      .where('shipment_id', shipment.id)
      .orderBy('shipment_lines.id', 'asc');

    res.json({ shipment, lines });
  } catch (err) {
    console.error('Hiba a by-order lekérdezéskor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

// GET /api/v1/shipments/:id
// Visszaadja a kamion adatait és a hozzá tartozó tételeket ID alapján
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!/^\d+$/.test(id)) {
      return next();
    }
    const shipment = await db('shipments')
      .where('id', id)
      .first();

    if (!shipment) return res.status(404).json({ error: 'Kamion nem található: id=' + id });

    const lines = await db('shipment_lines')
      .select(
        'shipment_lines.*',
        'products.name as productName'
      )
      .leftJoin('products', 'shipment_lines.product_id', 'products.id')
      .where('shipment_id', shipment.id)
      .orderBy('shipment_lines.id', 'asc');

    res.json({ shipment, lines });
  } catch (err) {
    console.error('Hiba a shipment lekérdezéskor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

// GET /api/v1/shipments/check-order-number/:orderNumber
// Ellenőrzi hogy az adott kamionszám foglalt-e az aktuális szezonban
router.get('/check-order-number/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const season = await db('seasons').orderBy('start_date', 'desc').first();
    if (!season) return res.json({ taken: false });

    const existing = await db('shipments')
      .where('season_id', season.id)
      .whereRaw('LOWER(REPLACE(order_number, \' \', \'\')) = ?', [
        orderNumber.toLowerCase().replace(/\s+/g, '')
      ])
      .first();

    res.json({ taken: !!existing, seasonCode: season.code });
  } catch (err) {
    console.error('Hiba a check-order-number lekérdezéskor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

// PATCH /api/v1/shipments/:id/loaded
// Frissíti a kamion rakodási státuszát (is_loaded).
// Ha is_loaded=true-ra vált, automatikusan EKAER dokumentumot generál.
router.patch('/:id/loaded', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_loaded } = req.body;
    await db('shipments')
      .where('id', id)
      .update({ is_loaded: is_loaded ? true : false });

    let ekaerResult = null;
    if (is_loaded) {
      // EKAER dokumentum automatikus generálása
      try {
        ekaerResult = await generateEkaerForShipment(id);
      } catch (ekaerErr) {
        console.error('[EKAER] Generálási hiba (a rakodva státusz sikeresen mentve):', ekaerErr.message);
        ekaerResult = { error: ekaerErr.message };
      }
    }

    res.json({ success: true, ekaer: ekaerResult });
  } catch (err) {
    console.error('Hiba a rakodási státusz frissítésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

// POST /api/v1/shipments/:id/generate-ekaer
// Manuálisan generál EKAER dokumentumot egy meglévő fuvarhoz
router.post('/:id/generate-ekaer', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await generateEkaerForShipment(id);
    res.json({ message: 'EKAER dokumentum sikeresen generálva', path: result.path });
  } catch (err) {
    console.error('Hiba az EKAER generálásakor:', err);
    res.status(500).json({ error: 'Belső szerverhiba: ' + err.message });
  }
});

// Helper: EKAER dokumentum generálása egy shipment ID-hoz
async function generateEkaerForShipment(shipmentId) {
  const shipment = await db('shipments')
    .select('shipments.*', 'transporters.name as transporter_name')
    .leftJoin('transporters', 'shipments.transporter_id', 'transporters.id')
    .where('shipments.id', shipmentId)
    .first();

  if (!shipment) throw new Error('Fuvar nem található: id=' + shipmentId);

  const lines = await db('shipment_lines')
    .select('shipment_lines.*', 'products.name as product_name', 'partners.name as partner_name')
    .leftJoin('products', 'shipment_lines.product_id', 'products.id')
    .leftJoin('partners', 'shipment_lines.partner_id', 'partners.id')
    .where('shipment_lines.shipment_id', shipmentId);

  // Referencia lista összeállítása az albaran számokból (VBA ProcessReferences logika)
  const references = lines
    .map(l => l.albaran_number || l.partner_name || '')
    .filter(r => r && r.trim() !== '')
    .join('\n');

  // Sablon és kimeneti útvonalak
  const raktarPath = process.env.RAKTAR_PATH || path.join('\\\\192.168.1.5', 'raktar');
  const templatePath = path.join(raktarPath, 'MI Teszt', 'Minta dokuk', 'EKAER minta.docx');

  if (!fs.existsSync(templatePath)) {
    throw new Error('EKAER sablon nem található: ' + templatePath);
  }

  // Kimeneti mappa az éles szerkezet szerint
  const safeOrderNum = (shipment.order_number || '').replace(/\//g, '-').replace(/[\\:*?"<>|]/g, '');
  const safePlateNum = (shipment.plate_number || '').replace(/\//g, '-').replace(/[\\:*?"<>|]/g, '');
  
  const season = await db('seasons').where('id', shipment.season_id).first();
  const seasonCode = season ? season.code : '24-25';
  
  const { generateEkaerPath } = require('../config/transporterConfig');
  const generatedPath = generateEkaerPath(seasonCode, safeOrderNum, shipment.plate_number || 'UNKNOWN', raktarPath);
  
  let outputPath;
  let targetDir;
  
  if (generatedPath) {
    outputPath = generatedPath.filePath;
    targetDir = path.dirname(outputPath);
  } else {
    // Fallback ha a rendszám nem megfelelő
    targetDir = path.join(raktarPath, 'Fuvarok', 'EKAEREK', `EKAEREK 20${seasonCode.split('-')[0]}-20${seasonCode.split('-')[1]}`, safeOrderNum);
    outputPath = path.join(targetDir, safePlateNum + '.docx');
  }

  // Duplikátum-kezelés
  let counter = 0;
  let baseOutputPath = outputPath.replace(/\.docx$/, '');
  while (fs.existsSync(outputPath)) {
    counter++;
    outputPath = `${baseOutputPath}(${counter}).docx`;
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Placeholder adatok kitöltése (VBA ReplacePlaceholders logika)
  const data = {
    'Plate number': shipment.plate_number || '',
    'Tour number': shipment.order_number || '',
    'Reference': references
  };

  // Generálás a meglévő docxService-szel (csak placeholder csere, nincs tábla)
  docxService.generateOrderDocx(templatePath, outputPath, data, []);

  // Rögzítés az ekaer_records táblában
  try {
    const season = await db('seasons').where('id', shipment.season_id).first();
    await db('ekaer_records').insert({
      shipment_id: shipmentId,
      season_id: shipment.season_id || null,
      transporter_id: shipment.transporter_id || null,
      ekaer_file_name: path.basename(outputPath),
      file_path: outputPath,
      load_date: shipment.loading_date,
      is_sent: false
    });
  } catch (dbErr) {
    console.error('[EKAER] DB mentési hiba (fájl létrejött):', dbErr.message);
  }

  return { path: outputPath, fileName: path.basename(outputPath) };
}

// GET /api/v1/shipments/unloaded
// Csak azok a kamionok, ahol is_loaded = false (ezek jelennek meg az áthelyezés/küldés felugróban)
router.get('/unloaded', async (req, res) => {
  try {
    const shipments = await db('shipments')
      .select('shipments.id', 'shipments.order_number', 'shipments.loading_date', 'transporters.name as transporter_name')
      .leftJoin('transporters', 'shipments.transporter_id', 'transporters.id')
      .where('shipments.is_loaded', false)
      .orderBy('shipments.order_number', 'asc');
    res.json(shipments);
  } catch (err) {
    console.error('Hiba az unloaded shipments lekérdezésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

// GET /api/v1/shipments[?limit=N&season_code=XX-XX&search=xxx&has_lines=true&is_loaded=true/false&exclude_aggregates=true]
router.get('/', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const seasonCode = req.query.season_code || null;
    const search = req.query.search || null;
    const hasLines = req.query.has_lines === 'true';
    const isLoadedFilter = req.query.is_loaded; // 'true', 'false', or undefined (no filter)
    const excludeAggregates = req.query.exclude_aggregates === 'true';

    let query = db('shipments')
      .select(
        'shipments.*',
        'seasons.code as season_code',
        'transporters.name as transporter_name'
      );

    if (!excludeAggregates) {
      query = query.select(
        db.raw('(SELECT string_agg(DISTINCT destination, \', \') FROM shipment_lines WHERE shipment_lines.shipment_id = shipments.id) as destinations'),
        db.raw('(SELECT string_agg(DISTINCT albaran_number, \', \') FROM shipment_lines WHERE shipment_lines.shipment_id = shipments.id) as partners'),
        db.raw('(SELECT string_agg(DISTINCT customer, \', \') FROM shipment_lines WHERE shipment_lines.shipment_id = shipments.id) as customers')
      );
    }

    query = query
      .leftJoin('seasons', 'shipments.season_id', 'seasons.id')
      .leftJoin('transporters', 'shipments.transporter_id', 'transporters.id')
      .orderByRaw('shipments.loading_date DESC NULLS LAST, shipments.id DESC');

    if (seasonCode) {
      query = query.where('seasons.code', seasonCode);
    }

    // is_loaded szűrő: ?is_loaded=true (Transportistas), ?is_loaded=false (Rakodás)
    if (isLoadedFilter === 'true') {
      query = query.where('shipments.is_loaded', true);
    } else if (isLoadedFilter === 'false') {
      query = query.where('shipments.is_loaded', false);
    }

    if (search) {
      // Kereséskor nincs limit, az összes egyező rekordot visszaadjuk
      query = query.whereRaw("LOWER(REPLACE(shipments.order_number, ' ', '')) LIKE ?", [`%${search.toLowerCase().replace(/\s+/g, '')}%`]);
      const shipments = await query;
      return res.json(shipments);
    }

    if (hasLines) {
      // Csak azok a fuvarok, amelyekhez van legalább 1 tétel
      query = query.whereExists(
        db('shipment_lines').whereRaw('shipment_lines.shipment_id = shipments.id').select(db.raw('1'))
      );
    }

    query = query.limit(limit);

    const shipments = await query;
    res.json(shipments);
  } catch (err) {
    console.error('Hiba a fuvarok lekérdezésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});


// POST /api/v1/shipments
router.post('/', async (req, res) => {
  const trx = await db.transaction();
  try {
    const {
      order_number, truck_type, truck_seq_number, transporter_id, plate_number,
      loading_place, loading_date, arrival_date, transport_price, temperature, lines
    } = req.body;

    // 1. Kikeresi a legfrissebb szezont
    const season = await trx('seasons').orderBy('start_date', 'desc').first();
    if (!season) {
      throw new Error('Nincs aktív szezon az adatbázisban.');
    }

    // 2. Létrehozza a shipments fejléc rekordot
    const [shipmentId] = await trx('shipments').insert({
      order_number,
      truck_type,
      truck_seq_number,
      season_id: season.id,
      transporter_id: transporter_id || null,
      plate_number,
      loading_place,
      loading_date: loading_date || null,
      arrival_date: arrival_date || null,
      transport_price: parseFloat(transport_price) || 0,
      transport_currency: 'EUR',
      temperature: temperature || null
    }).returning('id');

    const sId = typeof shipmentId === 'object' ? shipmentId.id : shipmentId;

    if (lines && lines.length > 0) {
      // Csak azokat a sorokat szúrjuk be, amiknek legalább az egyik raklapja nem 0
      const activeLines = lines.filter(line => (parseFloat(String(line.euro_palets).replace(',', '.')) || 0) > 0 || (parseFloat(String(line.normal_palets).replace(',', '.')) || 0) > 0);

      if (activeLines.length > 0) {
        // 3. Raklapváltó tábla betöltése
        const conversions = await trx('pallet_conversion').select('normal_count', 'euro_equivalent');
        const conversionMap = {};
        conversions.forEach(c => { conversionMap[c.normal_count] = c.euro_equivalent; });

        // 4. Kalkuláció a teljes fuvarra
        const sumNormal = activeLines.reduce((sum, l) => sum + (parseFloat(String(l.normal_palets).replace(',', '.')) || 0), 0);
        const sumEuro = activeLines.reduce((sum, l) => sum + (parseFloat(String(l.euro_palets).replace(',', '.')) || 0), 0);

        let convertedNormal = 0;
        if (sumNormal > 0) {
          const roundedNormal = Math.round(sumNormal);
          if (conversionMap[roundedNormal] !== undefined) {
            convertedNormal = conversionMap[roundedNormal];
          } else {
            convertedNormal = sumNormal * (33.0 / 26.0); // Extrapoláció 26 felett
          }
        }

        const grandTotal = sumEuro + convertedNormal;
        const tPrice = parseFloat(transport_price) || 0;

        // 5. Tételek előkészítése és mentése
        const linesToInsert = activeLines.map(line => {
          const lineEuro = parseFloat(String(line.euro_palets).replace(',', '.')) || 0;
          const lineNorm = parseFloat(String(line.normal_palets).replace(',', '.')) || 0;

          let lineTotal = lineEuro;
          if (sumNormal > 0 && lineNorm > 0) {
            lineTotal += convertedNormal * (lineNorm / sumNormal);
          }

          let calcTransportCost = 0;
          if (grandTotal > 0 && tPrice > 0) {
            calcTransportCost = tPrice * (lineTotal / grandTotal);
          }

          return {
            shipment_id: sId,
            product_id: line.product_id || null,
            partner_id: line.partner_id || null,
            customer: line.customer || '',
            destination: line.destination || '',
            euro_palets: lineEuro,
            normal_palets: lineNorm,
            total_palets: lineTotal.toFixed(2),
            gross_weight_kg: parseFloat(line.gross_weight_kg) || 0,
            price_eur: parseFloat(line.price_eur) || 0,
            price_bcn_eur: parseFloat(line.price_bcn_eur) || 0,
            unit: line.unit || '',
            reloading_per_plt: parseFloat(line.reloading_per_plt) || 0,
            transport_bcn_per_plt: parseFloat(line.transport_bcn_per_plt) || 0,
            albaran_number: line.albaran_number || '',
            customer_order_no: line.customer_order_no || '',
            comment: line.comment || '',
            truck_number_per: parseFloat(line.truck_number_per) || 0,
            transport_cost_product: calcTransportCost.toFixed(2),
            transport_cost: calcTransportCost.toFixed(2)
          };
        });

        await trx('shipment_lines').insert(linesToInsert);
      }
    }

    await trx.commit();
    res.status(201).json({ message: 'Fuvar sikeresen létrehozva', id: sId });
  } catch (err) {
    await trx.rollback();
    console.error('Hiba a fuvar létrehozásakor:', err);
    res.status(500).json({ error: 'Hiba történt a mentés során: ' + err.message });
  }
});

// PUT /api/v1/shipments/bulk-update
// Tömeges frissítés (Transportistas modulhoz)
router.put('/bulk-update', async (req, res) => {
  const trx = await db.transaction();
  try {
    const updates = req.body;
    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'A kérés törzsének egy tömbnek kell lennie.' });
    }

    for (const update of updates) {
      const { id, kb, b, t, comment, invoice_amount_huf, invoice_number, invoice_amount_eur } = update;
      
      const parseNum = (v) => (v === '' || v === null || v === undefined) ? null : (isNaN(parseFloat(v)) ? null : parseFloat(v));

      const updateData = {};
      if (kb !== undefined) updateData.kb = parseNum(kb);
      if (b !== undefined) updateData.b = parseNum(b);
      if (t !== undefined) updateData.t = parseNum(t);
      if (comment !== undefined) updateData.comment = comment;
      if (invoice_amount_huf !== undefined) updateData.invoice_amount_huf = parseNum(invoice_amount_huf);
      if (invoice_number !== undefined) updateData.invoice_number = invoice_number;
      if (invoice_amount_eur !== undefined) updateData.invoice_amount_eur = parseNum(invoice_amount_eur);

      if (Object.keys(updateData).length > 0) {
        await trx('shipments').where('id', id).update(updateData);
      }
    }

    await trx.commit();
    res.json({ message: 'Tömeges frissítés sikeres', count: updates.length });
  } catch (err) {
    await trx.rollback();
    console.error('Hiba a tömeges frissítés során:', err);
    res.status(500).json({ error: 'Hiba történt a tömeges frissítés során: ' + err.message });
  }
});

// PUT /api/v1/shipments/:id
// Teljes fuvar (fejléc + tételek) frissítése
router.put('/:id', async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id } = req.params;
    const {
      truck_type, transporter_id, plate_number,
      loading_place, loading_date, arrival_date, transport_price, temperature, lines
    } = req.body;

    // 1. Fejléc frissítése (az order_number és season_id nem változik itt)
    await trx('shipments')
      .where('id', id)
      .update({
        truck_type,
        transporter_id: transporter_id || null,
        plate_number,
        loading_place,
        loading_date: loading_date || null,
        arrival_date: arrival_date || null,
        transport_price: parseFloat(transport_price) || 0,
        temperature: temperature || null
      });

    // 2. Töröljük a régi tételeket
    await trx('shipment_lines').where('shipment_id', id).del();

    // 3. Új tételek beszúrása
    if (lines && lines.length > 0) {
      // Csak azokat a sorokat szúrjuk be, amiknek legalább az egyik raklapja nem 0
      const activeLines = lines.filter(line => (parseFloat(String(line.euro_palets).replace(',', '.')) || 0) > 0 || (parseFloat(String(line.normal_palets).replace(',', '.')) || 0) > 0);

      if (activeLines.length > 0) {
        const conversions = await trx('pallet_conversion').select('normal_count', 'euro_equivalent');
        const conversionMap = {};
        conversions.forEach(c => { conversionMap[c.normal_count] = c.euro_equivalent; });

        const sumNormal = activeLines.reduce((sum, l) => sum + (parseFloat(String(l.normal_palets).replace(',', '.')) || 0), 0);
        const sumEuro = activeLines.reduce((sum, l) => sum + (parseFloat(String(l.euro_palets).replace(',', '.')) || 0), 0);

        let convertedNormal = 0;
        if (sumNormal > 0) {
          const roundedNormal = Math.round(sumNormal);
          if (conversionMap[roundedNormal] !== undefined) {
            convertedNormal = conversionMap[roundedNormal];
          } else {
            convertedNormal = sumNormal * (33.0 / 26.0);
          }
        }

        const grandTotal = sumEuro + convertedNormal;
        const tPrice = parseFloat(transport_price) || 0;

        const linesToInsert = activeLines.map(line => {
          const lineEuro = parseFloat(String(line.euro_palets).replace(',', '.')) || 0;
          const lineNorm = parseFloat(String(line.normal_palets).replace(',', '.')) || 0;

          let lineTotal = lineEuro;
          if (sumNormal > 0 && lineNorm > 0) {
            lineTotal += convertedNormal * (lineNorm / sumNormal);
          }

          let calcTransportCost = 0;
          if (grandTotal > 0 && tPrice > 0) {
            calcTransportCost = tPrice * (lineTotal / grandTotal);
          }

          return {
            shipment_id: id,
            product_id: line.product_id || null,
            partner_id: line.partner_id || null,
            customer: line.customer || '',
            destination: line.destination || '',
            euro_palets: lineEuro,
            normal_palets: lineNorm,
            total_palets: lineTotal.toFixed(2),
            gross_weight_kg: parseFloat(line.gross_weight_kg) || 0,
            price_eur: parseFloat(line.price_eur) || 0,
            price_bcn_eur: parseFloat(line.price_bcn_eur) || 0,
            unit: line.unit || '',
            reloading_per_plt: parseFloat(line.reloading_per_plt) || 0,
            transport_bcn_per_plt: parseFloat(line.transport_bcn_per_plt) || 0,
            albaran_number: line.albaran_number || '',
            customer_order_no: line.customer_order_no || '',
            comment: line.comment || '',
            truck_number_per: parseFloat(line.truck_number_per) || 0,
            transport_cost_product: calcTransportCost.toFixed(2),
            transport_cost: calcTransportCost.toFixed(2)
          };
        });

        await trx('shipment_lines').insert(linesToInsert);
      }
    }

    await trx.commit();
    res.json({ message: 'Fuvar sikeresen frissítve' });
  } catch (err) {
    await trx.rollback();
    console.error('Hiba a fuvar frissítésekor:', err);
    res.status(500).json({ error: 'Hiba történt a mentés során: ' + err.message });
  }
});


// PATCH /api/v1/shipments/rename
router.patch('/rename', async (req, res) => {
  try {
    const { oldOrderNumber, newOrderNumber } = req.body;
    if (!oldOrderNumber || !newOrderNumber) {
      return res.status(400).json({ error: 'oldOrderNumber és newOrderNumber megadása kötelező' });
    }

    // 1. Kikeresi a jelenlegi kamiont a szezonja miatt
    const shipmentToRename = await db('shipments')
      .where('order_number', oldOrderNumber)
      .first();

    if (!shipmentToRename) {
      return res.status(404).json({ error: 'Nem található kamion ezzel a számmal: ' + oldOrderNumber });
    }

    const seasonId = shipmentToRename.season_id;

    // 2. Ellenőrizzük, hogy a megadott új kamionszám foglalt-e már ebben a szezonban
    const existingShipment = await db('shipments')
      .where('season_id', seasonId)
      .where('order_number', newOrderNumber)
      .whereNot('id', shipmentToRename.id)
      .first();

    if (existingShipment) {
      return res.status(400).json({ error: `A(z) ${newOrderNumber} kamionszám már foglalt ebben a szezonban!` });
    }

    // 3. Frissítjük a shipments táblában az order_number-t
    await db('shipments')
      .where('id', shipmentToRename.id)
      .update({ order_number: newOrderNumber });

    res.json({ message: 'Kamionszám sikeresen frissítve', oldOrderNumber, newOrderNumber });
  } catch (err) {
    console.error('Hiba a kamionszám módosításakor:', err);
    res.status(500).json({ error: 'Belső szerverhiba: ' + err.message });
  }
});
// POST /api/v1/shipments/:id/generate-order
router.post('/:id/generate-order', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Fetch shipment
    const shipment = await db('shipments')
      .select('shipments.*', 'transporters.name as transporter_name')
      .leftJoin('transporters', 'shipments.transporter_id', 'transporters.id')
      .where('shipments.id', id)
      .first();
      
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
    
    // 2. Fetch lines
    const lines = await db('shipment_lines')
      .select('shipment_lines.*', 'products.name as product_name')
      .leftJoin('products', 'shipment_lines.product_id', 'products.id')
      .where('shipment_lines.shipment_id', id);
      
    // 3. Folder Map and Company Map logic (centralized config)
    const shortTransporter = shipment.transporter_name || '';
    const fullTransporter = getCompanyName(shortTransporter);
    const folderTransporter = getFolderName(shortTransporter);

    // 4. Calculate destinations
    const destDict = {};
    for (const line of lines) {
      let valB = Number(line.euro_palets) || 0;
      let valC = Number(line.normal_palets) || 0;
      let totalVal = valB + valC;
      let raklapSzam = totalVal === 0 ? 1 : Math.ceil(totalVal);
      
      let products = (line.product_name || '').toUpperCase();
      let customerOrder = (line.customer_order_no || '').toUpperCase();
      
      let destination = "GAVA HUNGRIA KFT, FELSOPAKONY";
      if ((products.includes("SPAR SLO") || products.includes("SPAR CRO")) && customerOrder.includes("DG69")) {
        destination = "LOGATEC";
      } else if (products.includes("SPAR SLO") && customerOrder.includes("SPAR")) {
        destination = "SPAR SLO";
      } else if (products.includes("SPAR CRO") && customerOrder.includes("SPAR")) {
        destination = "SPAR CRO";
      }
      
      if (destination !== "GAVA HUNGRIA KFT, FELSOPAKONY") {
        destDict[destination] = (destDict[destination] || 0) + raklapSzam;
      } else {
        destDict[destination] = 0; // Just to ensure it exists
      }
    }
    
    const priorityOrder = ["LOGATEC", "SPAR CRO", "SPAR SLO", "GAVA HUNGRIA KFT, FELSOPAKONY"];
    let destListStr = '';
    let cnt = 0;
    for (const key of priorityOrder) {
      if (destDict[key] !== undefined) {
        cnt++;
        destListStr += cnt + "., " + key;
        if (destDict[key] > 0 && key !== "GAVA HUNGRIA KFT, FELSOPAKONY") {
          destListStr += ", " + destDict[key] + " RAKLAP";
        }
        destListStr += "\n";
      }
    }
    destListStr = destListStr.trim();
    
    // 5. Build template placeholders data
    const formatDate = (d) => {
      if (!d) return '';
      const date = new Date(d);
      return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}.`;
    };
    
    let destinationText = shipment.loading_place || '';
    let isSpecialKermor = false;
    let loadingPlace = destinationText;
    let loadingPlace1 = "";
    let destination1 = "";
    
    if (shortTransporter.toUpperCase() === "KERMOR" && destinationText.toUpperCase() === "DUNAHARASZTI") {
       const destText = lines.length > 0 ? (lines[0].destination || '').toUpperCase() : '';
       if (destText.includes("ÁPORKA") || destText.includes("KECSKEMÉT")) {
         isSpecialKermor = true;
         if (destText.includes("ÁPORKA")) {
           loadingPlace = "Sylvan Hungária Zrt., HU-2330 Dunaharaszti, Irinyi János u. 1";
           destinationText = "Bio Fungi Kft., HU-2338 Áporka, Szabadság telep 30";
         } else if (destText.includes("KECSKEMÉT")) {
           loadingPlace = "Sylvan Hungária Zrt., HU-2330 Dunaharaszti, Irinyi János u. 1";
           destinationText = "Pilze-Nagy Kft., HU-6000 Kecskemét, Talfája tanya 47/B";
         }
         loadingPlace1 = destinationText;
         destination1 = loadingPlace;
       }
    }

    const formattedPrice = shipment.transport_price ? Number(shipment.transport_price).toLocaleString('hu-HU') : '0';
    
    const data = {
      // English keys (Old template)
      "Transport company": fullTransporter,
      "Arrival date": formatDate(shipment.arrival_date),
      "Transport price": formattedPrice + " €",
      "Plate number": shipment.plate_number || '',
      "Order number": shipment.order_number || '',
      "Loading date": formatDate(shipment.loading_date),
      "createDate": formatDate(new Date()),
      "Temp": shipment.temperature || '',
      "Loading Place": loadingPlace,
      "Destination": destListStr,
      "Loading Place1": loadingPlace1,
      "Destination1": destination1,
      
      // Hungarian keys (New template V2.0)
      "Rendszám": shipment.plate_number || '',
      "Rakodási hely": loadingPlace,
      "Lerakóhely": destListStr,
      "Rakodás dátuma": formatDate(shipment.loading_date),
      "Lerakodás dátuma": formatDate(shipment.arrival_date),
      "Szállítási hőmérséklet": shipment.temperature || '',
      "Fuvardíj": formattedPrice + " €",
      "Dátum": formatDate(new Date())
    };
    
    // 6. Build lines data for table
    const tableLines = lines.map(l => ({
      euroPallets: l.euro_palets || '',
      normalPallets: l.normal_palets || '',
      products: l.product_name || '',
      reference: l.albaran_number || l.comment || '', 
      customerOrder: l.customer_order_no || ''
    }));
    
    // 7. Render Document
    let templateName = isSpecialKermor ? 'Fuvarmegbízás Kermor.docx' : 'Fuvarmegbízás minta.docx';
    
    // Resolve base path for raktar: defaults to \\192.168.1.5\raktar on Windows development,
    // or can be overridden via RAKTAR_PATH env variable (e.g. /mnt/raktar) in Docker/production.
    const raktarPath = process.env.RAKTAR_PATH || path.join('\\\\192.168.1.5', 'raktar');
    
    let templatePath = path.join(raktarPath, 'MI Teszt', 'Minta dokuk', templateName);
    
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(raktarPath, 'MI Teszt', 'Minta dokuk', 'Fuvarmegbízás minta.docx');
    }

    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({ error: `Sablon nem található: ${templatePath}` });
    }

    const season = await db('seasons').where('id', shipment.season_id).first();
    const seasonCode = season ? season.code : '24-25';
    const safeOrderNum = (shipment.order_number || '').replace(/\//g, '-').replace(/[\\:*?"<>|]/g, '');
    const { generateTransportOrderPath } = require('../config/transporterConfig');
    
    const generatedTransPath = generateTransportOrderPath(seasonCode, shortTransporter, safeOrderNum, raktarPath);
    let outputPath = generatedTransPath.filePath;
    const targetDir = path.dirname(outputPath);
    
    // Duplikátum kezelés ha már létezik ugyanazzal a névvel
    let counter = 0;
    let baseOutputPath = outputPath.replace(/\.docx$/, '');
    while (fs.existsSync(outputPath)) {
      counter++;
      outputPath = `${baseOutputPath}(${counter}).docx`;
    }
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    docxService.generateOrderDocx(templatePath, outputPath, data, tableLines);

    // Rögzítés a transport_orders táblában (is_sent=false – még nem lett kiküldve)
    try {
      const existingOrder = await db('transport_orders')
        .where('shipment_id', id)
        .where('file_path', outputPath)
        .first();

      if (!existingOrder) {
        await db('transport_orders').insert({
          shipment_id: id,
          season_id: shipment.season_id || null,
          transporter_id: shipment.transporter_id || null,
          document_name: path.basename(outputPath),
          file_path: outputPath,
          file_date: new Date(),
          loading_date: shipment.loading_date || null,
          is_sent: false
        });
      }
    } catch (dbErr) {
      console.error('[generate-order] DB mentési hiba (fájl létrejött):', dbErr.message);
    }

    res.json({ message: 'Dokumentum sikeresen legenerálva', path: outputPath });
  } catch (err) {
    console.error('Hiba a dokumentum generálásakor:', err);
    res.status(500).json({ error: 'Belső szerverhiba: ' + err.message });
  }
});


// DELETE /api/v1/shipments/:id
// Teljes fuvar (fejléc + tételek) törlése
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const trx = await db.transaction();
  try {
    // 1. Töröljük a fuvarhoz tartozó tételeket
    await trx('shipment_lines').where('shipment_id', id).del();

    // 2. Töröljük magát a fuvart
    const deletedCount = await trx('shipments').where('id', id).del();

    if (deletedCount === 0) {
      await trx.rollback();
      return res.status(404).json({ error: 'A fuvar nem található.' });
    }

    await trx.commit();
    res.json({ message: 'Fuvar és a hozzá tartozó tételek sikeresen törölve.' });
  } catch (err) {
    await trx.rollback();
    console.error('Hiba a fuvar törlésekor:', err);
    res.status(500).json({ error: 'Hiba történt a törlés során: ' + err.message });
  }
});

module.exports = router;

