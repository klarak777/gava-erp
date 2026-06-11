const express = require('express');
const router = express.Router();
const db = require('../db/db');

// GET /api/v1/seasons
router.get('/', async (req, res) => {
  try {
    const seasons = await db('seasons').orderBy('code', 'desc');
    res.json(seasons);
  } catch (err) {
    console.error('Hiba a szezonok lekérdezésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

module.exports = router;
