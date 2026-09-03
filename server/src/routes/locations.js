const express = require('express');
const router = express.Router();
const knex = require('../db/db');

// Összes tárhely lekérdezése
router.get('/', async (req, res) => {
  try {
    const locations = await knex('aldi_locations').orderBy('type_code').orderBy('building_num').orderBy('row_num').orderBy('aisle_num').orderBy('location_num');
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Új tárhely hozzáadása
router.post('/', async (req, res) => {
  try {
    const { name, barcode, type_code, building_num, row_num, aisle_num, location_num, cooling_type } = req.body;
    
    // Check for existing barcode
    const existing = await knex('aldi_locations').where('barcode', barcode).first();
    if (existing) {
      return res.status(400).json({ error: 'Ez a vonalkód már létezik az adatbázisban!' });
    }

    const [id] = await knex('aldi_locations').insert({
      name, barcode, type_code, building_num, row_num, aisle_num, location_num, cooling_type
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
    const { name, barcode, type_code, building_num, row_num, aisle_num, location_num, cooling_type } = req.body;
    
    const existing = await knex('aldi_locations').where('barcode', barcode).whereNot('id', req.params.id).first();
    if (existing) {
      return res.status(400).json({ error: 'Ez a vonalkód már létezik egy másik tárhelynél!' });
    }

    await knex('aldi_locations').where('id', req.params.id).update({
      name, barcode, type_code, building_num, row_num, aisle_num, location_num, cooling_type, updated_at: knex.fn.now()
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
