const express = require('express');
const router = express.Router();
const db = require('../db/db');

// GET /api/v1/chain-products?chain=ALDI
router.get('/', async (req, res) => {
  try {
    const { chain = 'ALDI', search } = req.query;
    let query = db('chain_products')
      .where('is_active', true)
      .whereRaw('LOWER(chain) = ?', [chain.toLowerCase()]);

    if (search) {
      const s = `%${search.toLowerCase()}%`;
      query = query.where(function() {
        this.whereRaw('LOWER(product_name) LIKE ?', [s])
            .orWhereRaw('LOWER(article_number) LIKE ?', [s])
            .orWhereRaw('LOWER(gtin) LIKE ?', [s])
            .orWhereRaw('LOWER(ean) LIKE ?', [s])
            .orWhereRaw('LOWER(label) LIKE ?', [s]);
      });
    }

    const rows = await query.orderBy('id', 'asc');
    res.json(rows);
  } catch (err) {
    console.error('Hiba a lánc termékek lekérdezésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

// POST /api/v1/chain-products
router.post('/', async (req, res) => {
  try {
    const { chain = 'ALDI', product_name, name, article_number, articleNo, gtin, ean, label } = req.body;
    const finalName = product_name || name;

    if (!finalName) {
      return res.status(400).json({ error: 'A termék megnevezése kötelező!' });
    }

    const [inserted] = await db('chain_products').insert({
      chain: (chain || 'ALDI').toUpperCase(),
      product_name: finalName,
      article_number: article_number || articleNo || '',
      gtin: gtin || '',
      ean: ean || '',
      label: label || '',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('*');

    res.status(201).json(inserted);
  } catch (err) {
    console.error('Hiba az új lánc termék létrehozásakor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

// PUT /api/v1/chain-products/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { product_name, name, article_number, articleNo, gtin, ean, label, is_active } = req.body;

    const updateData = {
      updated_at: new Date()
    };

    if (product_name !== undefined || name !== undefined) updateData.product_name = product_name || name;
    if (article_number !== undefined || articleNo !== undefined) updateData.article_number = article_number !== undefined ? article_number : articleNo;
    if (gtin !== undefined) updateData.gtin = gtin;
    if (ean !== undefined) updateData.ean = ean;
    if (label !== undefined) updateData.label = label;
    if (is_active !== undefined) updateData.is_active = is_active;

    const [updated] = await db('chain_products')
      .where('id', id)
      .update(updateData)
      .returning('*');

    if (!updated) {
      return res.status(404).json({ error: 'A megadott termék nem található!' });
    }

    res.json(updated);
  } catch (err) {
    console.error('Hiba a lánc termék frissítésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

// DELETE /api/v1/chain-products/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [deleted] = await db('chain_products')
      .where('id', id)
      .update({ is_active: false, updated_at: new Date() })
      .returning('*');

    if (!deleted) {
      return res.status(404).json({ error: 'A megadott termék nem található!' });
    }

    res.json({ success: true, message: 'Termék sikeresen inaktiválva/törölve' });
  } catch (err) {
    console.error('Hiba a lánc termék törlésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

module.exports = router;
