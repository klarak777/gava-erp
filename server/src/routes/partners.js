const express = require('express');
const router = express.Router();
const db = require('../db/db');

// GET /api/v1/partners
router.get('/', async (req, res) => {
  try {
    const partners = await db('partners')
      .where('is_active', true)
      .orderBy('name', 'asc');
    res.json(partners);
  } catch (err) {
    console.error('Hiba a partnerek lekérdezésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

module.exports = router;
