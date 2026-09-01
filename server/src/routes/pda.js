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
  if (!token) return res.status(401).json({ error: 'Hitelesítés szükséges.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Érvénytelen vagy lejárt token.' });
  }
}

// ── GET /commission-tasks ─────────────────────
// Visszaadja az ALDI kamionokat, amelyeket PDA-ra jelöltek (sent_to_pda = true),
// PDA-optimalizált egyszerű JSON formátumban.
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

module.exports = router;
