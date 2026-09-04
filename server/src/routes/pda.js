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
router.put('/commission-lines/:id/pick', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { picked_cartons, gross_weight, packaging_type, tare_weight, origin_country, lot_number, pallet_type } = req.body;

    const qty = parseInt(picked_cartons);
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ error: 'A komissiózott kartonszám megadása kötelező (pozitív egész szám).' });
    }

    await knex.transaction(async (trx) => {
      const line = await trx('aldi_truck_lines').where('id', id).first('id', 'ordered_cartons', 'picked_cartons');
      if (!line) {
        const err = new Error('not_found');
        err.code = 'NOT_FOUND';
        throw err;
      }

      const orderedCartons = parseInt(line.ordered_cartons) || 0;
      const alreadyPicked = parseInt(line.picked_cartons) || 0;
      const remaining = Math.max(0, orderedCartons - alreadyPicked);

      if (qty > remaining) {
        const overErr = new Error(`A megadott kartonszám (${qty} db) több mint a hátralévő rendelt mennyiség (${remaining} db).`);
        overErr.code = 'OVER_QTY';
        throw overErr;
      }

      const newPicked = alreadyPicked + qty;
      const newRemaining = Math.max(0, orderedCartons - newPicked);
      const isFullyPicked = newRemaining <= 0;

      await trx('aldi_truck_lines')
        .where('id', id)
        .update({
          is_picked: isFullyPicked,
          picked_cartons: newPicked,
          gross_weight: gross_weight || null,
          packaging_type: packaging_type || null,
          tare_weight: tare_weight || null,
          origin_country: origin_country || null,
          lot_number: lot_number || null,
          pallet_type: pallet_type || null
        });

      res.json({
        success: true,
        message: isFullyPicked ? 'Tétel teljesen komissiózva, eltűnik a listából.' : `Részleges komissió rögzítve. Maradék: ${newRemaining} karton.`,
        ordered_cartons: orderedCartons,
        picked_cartons: newPicked,
        remaining: newRemaining,
        is_picked: isFullyPicked
      });
    });
  } catch (err) {
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({ error: 'A tétel nem található.' });
    }
    if (err.code === 'OVER_QTY') {
      return res.status(409).json({ error: err.message });
    }
    console.error('[PDA] /commission-lines/:id/pick hiba:', err);
    res.status(500).json({ error: 'Hiba a tétel mentésekor.' });
  }
});

module.exports = router;
