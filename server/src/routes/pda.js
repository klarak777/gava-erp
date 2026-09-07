/**
 * pda.js – PDA specifikus API végpontok
 * 
 * POST /api/v1/pda/login       → Egyszerű bejelentkezés (egyelőre bármilyen névvel)
 * GET  /api/v1/pda/commission-tasks → PDA-ra jelölt ALDI kamionok listája
 */

const express = require('express');
const router = express.Router();
const knex = require('../db/db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_gava';

// ── POST /login ────────────────────────────────
// Egyelőre bármilyen azonosítóval be lehet lépni (fejlesztési fázis).
// Visszaad egy JWT tokent és a felhasználó nevét.
router.post('/login', (req, res) => {
  const { username } = req.body;
  if (!username || !String(username).trim()) {
    return res.status(400).json({ error: 'Az azonosító megadása kötelező.' });
  }

  const name = String(username).trim();
  const payload = { name, role: 'pda_user', sub: name };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });

  res.json({
    token,
    user: { name, role: 'pda_user' },
  });
});

// ── Middleware: JWT ellenőrzés ────────────────
function verifyToken(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  
  // Teszt mód / emulátor / hiányzó vagy mock token esetén automatikus engedélyezés
  if (!token || token.startsWith('pda-mock-token') || token === 'null' || token === 'undefined') {
    req.user = { name: 'Teszt Felhasználó', role: 'pda_user' };
    return next();
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (e) {
    // Lejárt vagy eltérő secret esetén sem blokkoljuk az emulátort / tesztet
    req.user = { name: 'Teszt Felhasználó', role: 'pda_user' };
    return next();
  }
}

// ── GET /commission-tasks ─────────────────────
// Visszaadja az ALDI kamionokat, amelyeket PDA-ra jelöltek (sent_to_pda = true)
router.get('/commission-tasks', verifyToken, async (req, res) => {
  try {
    const trucks = await knex('aldi_trucks')
      .select(
        'id',
        'truck_number',
        'delivery_date',
        'transporter',
        'license_plate_1',
        'preparation_status',
        'is_loaded',
        'sent_to_pda',
      )
      .where('sent_to_pda', true)
      .orderBy('delivery_date', 'asc')
      .orderBy('id', 'asc');

    res.json(trucks);
  } catch (err) {
    console.error('[PDA] /commission-tasks hiba:', err);
    res.status(500).json({ error: 'Szerverhiba a feladatok betöltésekor.' });
  }
});

// ── GET /commission-lines ──────────────────────
// Visszaadja a PDA-ra küldött kamionok tételeit (Termék, Kamionszám, Kartonszám, Típus, Partner, Cél raktár)
router.get('/commission-lines', verifyToken, async (req, res) => {
  try {
    const { truck_id } = req.query;

    let query = knex('aldi_truck_lines')
      .join('aldi_trucks', 'aldi_truck_lines.aldi_truck_id', 'aldi_trucks.id')
      .select(
        'aldi_truck_lines.id',
        'aldi_truck_lines.aldi_truck_id',
        'aldi_trucks.truck_number as kamionszam',
        'aldi_truck_lines.product_name as termek',
        'aldi_truck_lines.ordered_cartons as kartonszam',
        knex.raw('COALESCE(aldi_truck_lines.picked_cartons, 0) as komissziozott_kartonszam'),
        'aldi_truck_lines.pallet_type as tipus',
        'aldi_truck_lines.cartons_per_pallet as plt',
        'aldi_truck_lines.partner',
        'aldi_truck_lines.destination as celraktar',
        'aldi_truck_lines.is_picked'
      )
      .where('aldi_trucks.sent_to_pda', true)
      .orderBy('aldi_trucks.delivery_date', 'asc')
      .orderBy('aldi_trucks.id', 'asc')
      .orderBy('aldi_truck_lines.row_order', 'asc')
      .orderBy('aldi_truck_lines.id', 'asc');

    if (truck_id) {
      query = query.where('aldi_trucks.id', truck_id);
    }

    const lines = await query;
    res.json(lines);
  } catch (err) {
    console.error('[PDA] /commission-lines hiba:', err);
    res.status(500).json({ error: 'Hiba a komissió tételek betöltésekor.' });
  }
});

// ── GET /packaging-types ───────────────────────
router.get('/packaging-types', verifyToken, async (req, res) => {
  try {
    const data = await knex('ref_packaging_types').select('id', 'name', 'category', 'tare_weight_kg').where('is_active', true).orderBy('name');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Hiba a göngyöleg típusok betöltésekor.' });
  }
});

// ── GET /origin-countries ──────────────────────
router.get('/origin-countries', verifyToken, async (req, res) => {
  try {
    const data = await knex('ref_origin_countries').select('id', 'name').where('is_active', true).orderBy('name');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Hiba a származási országok betöltésekor.' });
  }
});

// ── GET /pallet-types ──────────────────────────
router.get('/pallet-types', verifyToken, async (req, res) => {
  try {
    const data = await knex('ref_pallet_types').select('id', 'name').where('is_active', true).orderBy('name');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Hiba a raklap típusok betöltésekor.' });
  }
});

// ── PUT /commission-lines/:id/pick ─────────────
// Komissió rögzítése (kumulatív):
//   - picked_cartons nő a megadott mennyiséggel
//   - ordered_cartons NINCS módosítva (az eredeti rendeltet tükrözi)
//   - is_picked = true ha picked_cartons >= ordered_cartons
//   - Ha qty > remaining: 409 hiba
// Közös segédfüggvény a komissiózás feldolgozásához
async function processPick(trx, id, reqData, locationId = null) {
  const { picked_cartons, gross_weight, packaging_type, tare_weight, origin_country, lot_number, pallet_type } = reqData;
  const qty = parseInt(picked_cartons);
  if (!Number.isInteger(qty) || qty <= 0) {
    const err = new Error('A komissiózott kartonszám megadása kötelező (pozitív egész szám).'); err.code = 'BAD_REQUEST'; throw err;
  }

  // 1. Tétel lekérése zárolással
  const line = await trx('aldi_truck_lines').where('id', id).forUpdate().first();
  if (!line) {
    const err = new Error('not_found'); err.code = 'NOT_FOUND'; throw err;
  }

  const orderedCartons = parseInt(line.ordered_cartons) || 0;
  const alreadyPicked = parseInt(line.picked_cartons) || 0;
  const remaining = Math.max(0, orderedCartons - alreadyPicked);

  if (qty > remaining) {
    const err = new Error(`A megadott kartonszám (${qty} db) több mint a hátralévő rendelt mennyiség (${remaining} db).`); err.code = 'OVER_QTY'; throw err;
  }

  // 2. Kapacitás ellenőrzése (ha van lokáció)
  if (locationId && qty > 0) {
    const loc = await trx('aldi_locations').where('id', locationId).first();
    
    const currentLocStock = await trx('aldi_stock_locations as s')
      .leftJoin('aldi_daily_order_lines as ol', 'ol.id', 's.order_line_id')
      .leftJoin('aldi_truck_lines as tl', 'tl.id', 's.truck_line_id')
      .where('s.location_id', locationId)
      .select(trx.raw('SUM(s.quantity_cartons::decimal / COALESCE(NULLIF(ol.cartons_per_pallet, 0), NULLIF(tl.cartons_per_pallet, 0), 1)) as occupied_pallets'))
      .first();

    const existingPallets = parseFloat(currentLocStock?.occupied_pallets) || 0;
    const incomingPallets = 1; // Minden PDA megadás 1 raklap
    const capacity = parseFloat(loc.capacity) || 1;

    if (existingPallets + incomingPallets > capacity + 0.05) {
      const err = new Error(`A lokáció megtelt! Kapacitás: ${capacity} raklap.\nFoglalt: ${existingPallets.toFixed(2)} raklap\nÚj tétel: ${incomingPallets.toFixed(2)} raklap.\n\nA tétel NEM lett levonva – próbálj másik lokációt!`);
      err.code = 'CAPACITY_EXCEEDED';
      throw err;
    }

    // Lokáció mentése
    await trx('aldi_stock_locations').insert({
      location_id: locationId,
      order_line_id: line.aldi_daily_order_line_id || null,
      truck_line_id: line.aldi_daily_order_line_id ? null : line.id,
      quantity_cartons: qty
    });
  }

  // 3. Súly és raklap kalkuláció
  const cartonsPerPallet = parseInt(line.cartons_per_pallet) || 0;
  let newPallets = 1; // Minden PDA megadás pontosan 1 raklapot jelent
  let palletTareKg = 0;
  let palletTypeName = null;

  if (pallet_type) {
    // pallet_type a ref_packaging_types ID-ja a frontend módosítás óta
    const palInfo = await trx('ref_packaging_types').where('id', pallet_type).first();
    if (!palInfo || !palInfo.is_active || ![palInfo.name, palInfo.category].some(value => String(value || '').toLowerCase().includes('raklap'))) {
      const err = new Error('Válassz érvényes, aktív raklaptípust.'); err.code = 'BAD_REQUEST'; throw err;
    }
    if (palInfo.tare_weight_kg == null || !Number.isFinite(Number(palInfo.tare_weight_kg)) || Number(palInfo.tare_weight_kg) <= 0) {
      const err = new Error('A nettó számításához érvényes raklaptára szükséges.'); err.code = 'INVALID_WEIGHT'; throw err;
    }
    if (alreadyPicked > 0 && line.pallet_type && line.pallet_type !== palInfo.name) {
      const err = new Error('A megkezdett tételt ugyanazzal a raklaptípussal folytasd.'); err.code = 'BAD_REQUEST'; throw err;
    }
    if (palInfo) {
      palletTypeName = palInfo.name;
      if (newPallets > 0) {
        palletTareKg = parseFloat(palInfo.tare_weight_kg) || 0;
      }
    }
  }

  if (!pallet_type) {
    const err = new Error('Válassz raklaptípust a nettó súly számításához.'); err.code = 'BAD_REQUEST'; throw err;
  }
  const reqGross = Number(gross_weight);
  const reqTare = Number(tare_weight);
  if (!Number.isFinite(reqGross) || reqGross <= 0 || tare_weight == null || tare_weight === '' || !Number.isFinite(reqTare) || reqTare < 0) {
    const err = new Error('Adj meg pozitív bruttó súlyt és nem negatív göngyölegtárát.'); err.code = 'INVALID_WEIGHT'; throw err;
  }
  if (alreadyPicked > 0 && (line.gross_weight == null || line.net_weight == null)) {
    const err = new Error('A korábbi komissió súlyadatai hiányosak. Folytatás előtt rendezni kell a korábbi bruttó és nettó súlyt.'); err.code = 'INVALID_WEIGHT'; throw err;
  }
  
  if (!isNaN(reqGross) && reqGross > 0) {
    const totalTare = (reqTare * qty) + (newPallets * palletTareKg);
    if (reqGross < totalTare) {
      const err = new Error(`A bruttó súly (${reqGross} kg) kisebb, mint a göngyöleg (${reqTare} kg x ${qty} db) és az új raklapok (${newPallets} db x ${palletTareKg} kg) tára összege!`);
      err.code = 'INVALID_WEIGHT'; throw err;
    }
  } else if (gross_weight !== undefined && gross_weight !== null && gross_weight !== '') {
    const err = new Error('A bruttó súlynak pozitívnak kell lennie!');
    err.code = 'INVALID_WEIGHT'; throw err;
  }

  let currentPickNet = null;
  if (!isNaN(reqGross) && reqGross > 0) {
    currentPickNet = reqGross - (reqTare * qty) - (newPallets * palletTareKg);
    if (currentPickNet < 0) {
      const err = new Error('Számítási hiba: a nettó súly negatív!'); err.code = 'INVALID_WEIGHT'; throw err;
    }
  }

  // 4. Részlet naplózása (Auditálhatóság)
  await trx('aldi_commission_lines').insert({
    aldi_truck_id: line.aldi_truck_id,
    aldi_truck_line_id: id,
    product_name: line.product_name,
    cartons: qty,
    pallets: newPallets,
    gross_weight: !isNaN(reqGross) ? reqGross : null,
    net_weight: currentPickNet,
    pallet_type: palletTypeName,
    tare_weight: reqTare || null,
    carton_type: packaging_type || null,
    lot_number: lot_number || null,
    origin_country: origin_country || null
  });

  // 5. Kumulatív frissítés
  const newPicked = alreadyPicked + qty;
  const newRemaining = Math.max(0, orderedCartons - newPicked);
  const isFullyPicked = newRemaining <= 0;

  const oldGross = parseFloat(line.gross_weight) || 0;
  const oldNet = parseFloat(line.net_weight) || 0;

  const newGross = !isNaN(reqGross) && reqGross > 0 ? oldGross + reqGross : line.gross_weight;
  const newNet = currentPickNet !== null ? oldNet + currentPickNet : line.net_weight;

  await trx('aldi_truck_lines')
    .where('id', id)
    .update({
      is_picked: isFullyPicked,
      picked_cartons: newPicked,
      gross_weight: newGross,
      net_weight: newNet,
      packaging_type: packaging_type || null,
      pallet_type: palletTypeName || null,
      tare_weight: reqTare || null,
      origin_country: origin_country || null,
      lot_number: lot_number || null
    });

  return { orderedCartons, newPicked, newRemaining, isFullyPicked };
}

// ── PUT /commission-lines/:id/pick ─────────────
router.put('/commission-lines/:id/pick', verifyToken, async (req, res) => {
  try {
    let result = {};
    await knex.transaction(async (trx) => {
      result = await processPick(trx, req.params.id, req.body, null);
    });
    res.json({
      success: true,
      message: result.isFullyPicked ? 'Tétel teljesen komissiózva, eltűnik a listából.' : `Részleges komissió rögzítve. Maradék: ${result.newRemaining} karton.`,
      ordered_cartons: result.orderedCartons,
      picked_cartons: result.newPicked,
      remaining: result.newRemaining,
      is_picked: result.isFullyPicked
    });
  } catch (err) {
    if (err.code === 'BAD_REQUEST') return res.status(400).json({ error: err.message });
    if (err.code === 'NOT_FOUND') return res.status(404).json({ error: 'A tétel nem található.' });
    if (err.code === 'OVER_QTY') return res.status(409).json({ error: err.message });
    if (err.code === 'INVALID_WEIGHT') return res.status(400).json({ error: err.message });
    console.error('[PDA] /commission-lines/:id/pick hiba:', err);
    res.status(500).json({ error: 'Hiba a tétel mentésekor.' });
  }
});

// ── PUT /commission-lines/:id/pick-and-assign ──────────────────────────────
router.put('/commission-lines/:id/pick-and-assign', verifyToken, async (req, res) => {
  try {
    if (!req.body.barcode) {
      return res.status(400).json({ error: 'Vonalkód megadása kötelező.' });
    }

    const location = await knex('aldi_locations').where('barcode', req.body.barcode).first();
    if (!location) {
      return res.status(404).json({ error: 'Érvénytelen vonalkód: a lokáció nem található.' });
    }

    let result = {};
    await knex.transaction(async (trx) => {
      result = await processPick(trx, req.params.id, req.body, location.id);
    });

    res.json({
      success: true,
      location_name: location.name,
      ordered_cartons: result.orderedCartons,
      picked_cartons: result.newPicked,
      remaining: result.newRemaining,
      is_picked: result.isFullyPicked,
      message: result.isFullyPicked
        ? 'Tétel teljesen komissiózva.'
        : `Részleges komissió rögzítve. Maradék: ${result.newRemaining} karton.`
    });
  } catch (err) {
    if (err.code === 'BAD_REQUEST') return res.status(400).json({ error: err.message });
    if (err.code === 'NOT_FOUND') return res.status(404).json({ error: 'A tétel nem található.' });
    if (err.code === 'OVER_QTY') return res.status(409).json({ error: err.message });
    if (err.code === 'CAPACITY_EXCEEDED') return res.status(400).json({ error: err.message });
    if (err.code === 'INVALID_WEIGHT') return res.status(400).json({ error: err.message });
    console.error('[PDA] /commission-lines/:id/pick-and-assign hiba:', err);
    res.status(500).json({ error: 'Hiba a mentéskor.' });
  }
});

module.exports = router;
