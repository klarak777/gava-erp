const express = require('express');
const router = express.Router();
const db = require('../db/db');

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
// Frissíti a kamion rakodási státuszát (is_loaded)
router.patch('/:id/loaded', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_loaded } = req.body;
    await db('shipments')
      .where('id', id)
      .update({ is_loaded: is_loaded ? true : false });

    res.json({ success: true });
  } catch (err) {
    console.error('Hiba a rakodási státusz frissítésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

// GET /api/v1/shipments[?limit=N&season_code=XX-XX&search=xxx&has_lines=true]
router.get('/', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const seasonCode = req.query.season_code || null;
    const search = req.query.search || null;
    const hasLines = req.query.has_lines === 'true';

    let query = db('shipments')
      .select('shipments.*', 'seasons.code as season_code', 'transporters.name as transporter_name')
      .leftJoin('seasons', 'shipments.season_id', 'seasons.id')
      .leftJoin('transporters', 'shipments.transporter_id', 'transporters.id')
      .orderBy('shipments.id', 'desc');

    if (seasonCode) {
      query = query.where('seasons.code', seasonCode);
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
      // 3. Raklapváltó tábla betöltése
      const conversions = await trx('pallet_conversion').select('normal_count', 'euro_equivalent');
      const conversionMap = {};
      conversions.forEach(c => { conversionMap[c.normal_count] = c.euro_equivalent; });

      // 4. Kalkuláció a teljes fuvarra
      const sumNormal = lines.reduce((sum, l) => sum + (parseFloat(l.normal_palets) || 0), 0);
      const sumEuro = lines.reduce((sum, l) => sum + (parseFloat(l.euro_palets) || 0), 0);

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
      const linesToInsert = lines.map(line => {
        const lineEuro = parseFloat(line.euro_palets) || 0;
        const lineNorm = parseFloat(line.normal_palets) || 0;

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

    await trx.commit();
    res.status(201).json({ message: 'Fuvar sikeresen létrehozva', id: sId });
  } catch (err) {
    await trx.rollback();
    console.error('Hiba a fuvar létrehozásakor:', err);
    res.status(500).json({ error: 'Hiba történt a mentés során: ' + err.message });
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
      const conversions = await trx('pallet_conversion').select('normal_count', 'euro_equivalent');
      const conversionMap = {};
      conversions.forEach(c => { conversionMap[c.normal_count] = c.euro_equivalent; });

      const sumNormal = lines.reduce((sum, l) => sum + (parseFloat(l.normal_palets) || 0), 0);
      const sumEuro = lines.reduce((sum, l) => sum + (parseFloat(l.euro_palets) || 0), 0);

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

      const linesToInsert = lines.map(line => {
        const lineEuro = parseFloat(line.euro_palets) || 0;
        const lineNorm = parseFloat(line.normal_palets) || 0;

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

module.exports = router;
