const express = require('express');
const router = express.Router();
const db = require('../db/db');

// GET /api/v1/products
router.get('/', async (req, res) => {
  try {
    const products = await db('products')
      .where('is_active', true)
      .orderBy('name', 'asc');
    res.json(products);
  } catch (err) {
    console.error('Hiba a termékek lekérdezésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

module.exports = router;
