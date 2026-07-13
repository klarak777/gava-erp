const express = require('express');
const router = express.Router();
const db = require('../db/db');

// GET /api/v1/finance-unit-cost-lines?shipment_id=X&ref_name=Y
router.get('/', async (req, res) => {
  try {
    const { shipment_id, ref_name } = req.query;
    if (!shipment_id) return res.status(400).json({ error: 'shipment_id megadása kötelező' });

    let query = db('finance_unit_cost_lines')
      .leftJoin('products', 'finance_unit_cost_lines.product_id', 'products.id')
      .where('finance_unit_cost_lines.shipment_id', shipment_id)
      .select(
        'finance_unit_cost_lines.*',
        'products.name as product_name',
        'products.code as product_code'
      )
      .orderBy('finance_unit_cost_lines.line_order', 'asc')
      .orderBy('finance_unit_cost_lines.id', 'asc');

    if (ref_name) {
      query = query.where('finance_unit_cost_lines.ref_name', ref_name);
    }

    const lines = await query;
    res.json(lines);
  } catch (err) {
    console.error('Hiba a unit cost sorok lekérdezésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

// POST /api/v1/finance-unit-cost-lines
router.post('/', async (req, res) => {
  try {
    const { shipment_id, ref_name, lines } = req.body;
    if (!shipment_id) return res.status(400).json({ error: 'shipment_id megadása kötelező' });
    if (!Array.isArray(lines)) return res.status(400).json({ error: 'lines tömbnek kell lennie' });

    await db.transaction(async trx => {
      const deleteQuery = trx('finance_unit_cost_lines').where('shipment_id', shipment_id);
      if (ref_name) deleteQuery.where('ref_name', ref_name);
      await deleteQuery.del();

      const validLines = lines.filter(l => l.product_name || l.description || l.netto_kgs);
      if (validLines.length === 0) return;

      const productCache = {};
      const allProducts = await trx('products').select('id', 'name');
      allProducts.forEach(p => { productCache[p.name.toUpperCase()] = p.id; });

      const rows = validLines.map((l, idx) => {
        return {
          shipment_id,
          ref_name: ref_name || '',
          line_order: idx,
          product_id: l.product_name ? (productCache[(l.product_name || '').toUpperCase()] || null) : null,
          description: l.description || '',
          netto_kgs: parseFloat(l.netto_kgs) || 0,
          kgs_per_box: parseFloat(l.kgs_per_box) || 0,
          price_per_kg: parseFloat(l.price_per_kg) || 0,
          trans_per_kg: parseFloat(l.trans_per_kg) || 0,
          v_cost_per_kg: parseFloat(l.v_cost_per_kg) || 0,
          oh_per_kg: parseFloat(l.oh_per_kg) || 0,
          tot_cost_per_kg: parseFloat(l.tot_cost_per_kg) || 0,
          vat_per_kg: parseFloat(l.vat_per_kg) || 0,
          tot_cost_per_box: parseFloat(l.tot_cost_per_box) || 0,
          vat_per_box: parseFloat(l.vat_per_box) || 0,
          v_cost_per_kg_eur: parseFloat(l.v_cost_per_kg_eur) || 0
        };
      });

      await trx('finance_unit_cost_lines').insert(rows);
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Hiba a unit cost sorok mentésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba: ' + err.message });
  }
});

module.exports = router;
