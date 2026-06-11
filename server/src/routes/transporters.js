const express = require('express');
const router = express.Router();
const db = require('../db/db');

// GET /api/v1/transporters
router.get('/', async (req, res) => {
  try {
    const transporters = await db('transporters')
      .where('is_active', true)
      .orderBy('name', 'asc');
    res.json(transporters);
  } catch (err) {
    console.error('Hiba a fuvarozók lekérdezésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

module.exports = router;
