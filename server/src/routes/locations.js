const express = require('express');
const router = express.Router();
const knex = require('../db/db');

async function updateParentCapacity(parentId) {
  if (!parentId) return;
  const res = await knex('aldi_locations').where('parent_id', parentId).sum('capacity as total');
  const total = parseInt(res[0].total) || 0;
  await knex('aldi_locations').where('id', parentId).update({ capacity: total, updated_at: knex.fn.now() });
}

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
        knex.raw('COUNT(s.id)::integer as occupied_pallets')
      )
      .orderBy('l.type_code')
      .orderBy('l.building_num')
      .orderBy('l.row_num')
      .orderBy('l.aisle_num')
      .orderBy('l.location_num');

    // Szülő (Sor) lokációk kapacitásának és készletének dinamikus összesítése
    const parentMap = {};
    for (const loc of locations) {
      if (loc.parent_id) {
        if (!parentMap[loc.parent_id]) {
          parentMap[loc.parent_id] = { capacity: 0, current_cartons: 0, occupied_pallets: 0 };
        }
        parentMap[loc.parent_id].capacity += (parseInt(loc.capacity) || 0);
        parentMap[loc.parent_id].current_cartons += (parseInt(loc.current_cartons) || 0);
        parentMap[loc.parent_id].occupied_pallets += (parseInt(loc.occupied_pallets) || 0);
      }
    }

    for (const loc of locations) {
      if (parentMap[loc.id]) {
        loc.capacity = parentMap[loc.id].capacity;
        loc.current_cartons = parentMap[loc.id].current_cartons;
        loc.occupied_pallets = parentMap[loc.id].occupied_pallets;
      }
    }

    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Lokáció aktuális készletének lekérdezése
router.get('/:id/stock', async (req, res) => {
  try {
    const loc = await knex('aldi_locations').where('id', req.params.id).first();
    if (!loc) {
      return res.status(404).json({ error: 'Lokáció nem található' });
    }

    let locationIds = [req.params.id];
    if (loc.location_type === 'Szülő') {
      const children = await knex('aldi_locations').where('parent_id', req.params.id).select('id');
      if (children.length > 0) {
        locationIds = children.map(c => c.id);
      } else {
        locationIds = [-1]; // Ha nincs gyermek, ne adjon vissza semmit
      }
    }

    // 1. Készlet lekérdezése különálló raklaponként (minden raklap külön tételként szerepel)
    const stockItems = await knex('aldi_stock_locations as s')
      .leftJoin('aldi_daily_order_lines as l', 'l.id', 's.order_line_id')
      .leftJoin('aldi_truck_lines as tl', 'tl.id', 's.truck_line_id')
      .leftJoin('aldi_locations as loc', 'loc.id', 's.location_id')
      .whereIn('s.location_id', locationIds)
      .select(
        's.id as stock_id',
        knex.raw('COALESCE(l.gtin, tl.product_name) as gtin'),
        knex.raw('COALESCE(l.cartons_per_pallet, tl.cartons_per_pallet) as cartons_per_pallet'),
        knex.raw('s.quantity_cartons::integer as total_cartons'),
        knex.raw('1::integer as item_count'),
        's.gross_weight',
        's.net_weight',
        's.created_at',
        'loc.id as location_id',
        'loc.name as location_name',
        'loc.barcode as location_barcode'
      )
      .orderBy('s.created_at', 'desc')
      .orderBy('s.id', 'desc');

    // 2. Külön kérésben hozzárendeljük a termékneveket, hogy ne sokszorozódjon a mennyiség
    for (let item of stockItems) {
      if (!item.gtin) continue;
      
      // Ha a gtin valójában a terméknév (mert truck_line_id-ből jött és nem számokból áll)
      if (!/^\d{13,14}$/.test(item.gtin)) {
        item.product_name = item.gtin;
        continue;
      }
      
      // Megpróbáljuk a chain_products-ból
      const cp = await knex('chain_products').where('gtin', item.gtin).first('product_name');
      if (cp && cp.product_name) {
        item.product_name = cp.product_name;
        continue;
      }
      // Ha nincs, akkor aldi_weekly_price_lines-ből
      const wp = await knex('aldi_weekly_price_lines').where('gtin', item.gtin).first('xlsx_product_name');
      if (wp && wp.xlsx_product_name) {
        item.product_name = wp.xlsx_product_name;
        continue;
      }
      // Ha egyik sincs, legyen a GTIN
      item.product_name = item.gtin;
    }

    res.json(stockItems);
  } catch (error) {
    console.error('Error fetching location stock:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Tétel törlése a lokációról (Visszavonás komissiózásról)
router.delete('/stock/:stock_id/revert', async (req, res) => {
  try {
    const stockId = req.params.stock_id;
    await knex.transaction(async trx => {
      const stock = await trx('aldi_stock_locations').where('id', stockId).forUpdate().first();
      if (!stock) {
        throw new Error('A tétel nem található a tárhelyen.');
      }

      // Ha kamionos komissió (PDA)
      if (stock.truck_line_id) {
        const truckLine = await trx('aldi_truck_lines').where('id', stock.truck_line_id).forUpdate().first();
        if (truckLine) {
          const newPicked = Math.max(0, (truckLine.picked_cartons || 0) - stock.quantity_cartons);
          await trx('aldi_truck_lines').where('id', stock.truck_line_id).update({
            picked_cartons: newPicked,
            is_picked: newPicked >= truckLine.ordered_cartons
          });
        }
        
        // Töröljük a legutóbbi megfelelő commission_line-t (hozzávetőleges párosítás)
        const commLine = await trx('aldi_commission_lines')
          .where('aldi_truck_line_id', stock.truck_line_id)
          .andWhere('cartons', stock.quantity_cartons)
          .orderBy('id', 'desc')
          .first();
          
        if (commLine) {
          await trx('aldi_commission_lines').where('id', commLine.id).del();
        }
      }

      // Végül a raklap törlése a lokációról
      await trx('aldi_stock_locations').where('id', stockId).del();
    });

    res.json({ success: true, message: 'Tétel sikeresen visszavonva a komissiózásról.' });
  } catch (error) {
    console.error('Error reverting stock:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Új tárhely hozzáadása
router.post('/', async (req, res) => {
  try {
    const { name, barcode, type_code, building_num, row_num, aisle_num, location_num, cooling_type, status, location_type, capacity, notes, parent_id } = req.body;
    
    // Check for existing barcode
    const existing = await knex('aldi_locations').where('barcode', barcode).first();
    if (existing) {
      return res.status(400).json({ error: 'Ez a vonalkód már létezik az adatbázisban!' });
    }

    const [id] = await knex('aldi_locations').insert({
      name, barcode, type_code, building_num, row_num, aisle_num, location_num, cooling_type, status, location_type, capacity, notes, parent_id
    }).returning('id');

    if (parent_id) {
      await updateParentCapacity(parent_id);
    }

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
    const { name, barcode, type_code, building_num, row_num, aisle_num, location_num, cooling_type, status, location_type, capacity, notes, parent_id } = req.body;
    
    const existing = await knex('aldi_locations').where('barcode', barcode).whereNot('id', req.params.id).first();
    if (existing) {
      return res.status(400).json({ error: 'Ez a vonalkód már létezik egy másik tárhelynél!' });
    }

    const oldLoc = await knex('aldi_locations').where('id', req.params.id).first();

    await knex('aldi_locations').where('id', req.params.id).update({
      name, barcode, type_code, building_num, row_num, aisle_num, location_num, cooling_type, status, location_type, capacity, notes, parent_id, updated_at: knex.fn.now()
    });

    if (parent_id) {
      await updateParentCapacity(parent_id);
    }
    if (oldLoc && oldLoc.parent_id && oldLoc.parent_id !== parent_id) {
      await updateParentCapacity(oldLoc.parent_id);
    }

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
    const oldLoc = await knex('aldi_locations').where('id', req.params.id).first();
    await knex('aldi_locations').where('id', req.params.id).del();
    
    if (oldLoc && oldLoc.parent_id) {
      await updateParentCapacity(oldLoc.parent_id);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
