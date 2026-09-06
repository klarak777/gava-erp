const express = require('express');
const router = express.Router();
const knex = require('../db/db');

// Összes tárhely lekérdezése (készlet összesítéssel)
router.get('/', async (req, res) => {
  try {
    const locations = await knex('aldi_locations as l')
      .leftJoin('aldi_stock_locations as s', 's.location_id', 'l.id')
      .leftJoin('aldi_daily_order_lines as ol', 'ol.id', 's.order_line_id')
      .groupBy('l.id')
      .select(
        'l.*',
        knex.raw('COALESCE(SUM(s.quantity_cartons), 0)::integer as current_cartons'),
        knex.raw('COALESCE(SUM(s.quantity_cartons::decimal / NULLIF(ol.cartons_per_pallet, 0)), 0)::decimal as occupied_pallets')
      )
      .orderBy('l.type_code')
      .orderBy('l.building_num')
      .orderBy('l.row_num')
      .orderBy('l.aisle_num')
      .orderBy('l.location_num');
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Lokáció aktuális készletének lekérdezése
router.get('/:id/stock', async (req, res) => {
  try {
    const stockItems = await knex('aldi_stock_locations as s')
      .join('aldi_daily_order_lines as l', 'l.id', 's.order_line_id')
      .leftJoin('chain_products as cp', 'cp.gtin', 'l.gtin')
      .leftJoin('aldi_weekly_price_lines as wp', 'wp.gtin', 'l.gtin')
      .where('s.location_id', req.params.id)
      .groupBy('l.gtin', 'cp.product_name', 'wp.xlsx_product_name', 'l.cartons_per_pallet')
      .select(
        'l.gtin',
        knex.raw('COALESCE(cp.product_name, wp.xlsx_product_name, l.gtin) as product_name'),
        knex.raw('SUM(s.quantity_cartons)::integer as total_cartons'),
        'l.cartons_per_pallet',
        knex.raw('COUNT(s.id)::integer as item_count')
      )
      .orderBy('total_cartons', 'desc');

    res.json(stockItems);
  } catch (error) {
    console.error('Error fetching location stock:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Új tárhely hozzáadása
router.post('/', async (req, res) => {
  try {
    const { name, barcode, type_code, building_num, row_num, aisle_num, location_num, cooling_type, status, location_type, capacity, notes } = req.body;
    
    // Check for existing barcode
    const existing = await knex('aldi_locations').where('barcode', barcode).first();
    if (existing) {
      return res.status(400).json({ error: 'Ez a vonalkód már létezik az adatbázisban!' });
    }

    const [id] = await knex('aldi_locations').insert({
      name, barcode, type_code, building_num, row_num, aisle_num, location_num, cooling_type, status, location_type, capacity, notes
    }).returning('id');

    const newLoc = await knex('aldi_locations').where('id', id.id || id).first();
    res.status(201).json(newLoc);
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Tárhely módosítása
router.put('/:id', async (req, res) => {
  try {
    const { name, barcode, type_code, building_num, row_num, aisle_num, location_num, cooling_type, status, location_type, capacity, notes } = req.body;
    
    const existing = await knex('aldi_locations').where('barcode', barcode).whereNot('id', req.params.id).first();
    if (existing) {
      return res.status(400).json({ error: 'Ez a vonalkód már létezik egy másik tárhelynél!' });
    }

    await knex('aldi_locations').where('id', req.params.id).update({
      name, barcode, type_code, building_num, row_num, aisle_num, location_num, cooling_type, status, location_type, capacity, notes, updated_at: knex.fn.now()
    });

    const updated = await knex('aldi_locations').where('id', req.params.id).first();
    res.json(updated);
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Tárhely törlése
router.delete('/:id', async (req, res) => {
  try {
    await knex('aldi_locations').where('id', req.params.id).del();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
