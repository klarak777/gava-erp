const express = require('express');
const router = express.Router();
const knex = require('../db/db');

// Get all trucks, optionally filtered by delivery date
router.get('/trucks', async (req, res) => {
  try {
    const { date } = req.query;
    let query = knex('aldi_trucks').select('*').orderBy('id', 'asc');
    if (date) {
      query = query.where('delivery_date', date);
    }
    const trucks = await query;
    res.json(trucks);
  } catch (err) {
    console.error('Error fetching aldi_trucks:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a truck
router.post('/trucks', async (req, res) => {
  try {
    const { truck_number, delivery_date, transporter, license_plate_1, license_plate_2 } = req.body;
    const [id] = await knex('aldi_trucks').insert({
      truck_number,
      delivery_date,
      transporter,
      license_plate_1,
      license_plate_2,
      sent_to_pda: false,
      preparation_status: 0,
      is_loaded: false
    }).returning('id');
    const newTruck = await knex('aldi_trucks').where('id', id.id || id).first();
    res.status(201).json(newTruck);
  } catch (err) {
    console.error('Error creating aldi truck:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a truck
router.put('/trucks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { truck_number, delivery_date, transporter, license_plate_1, license_plate_2, sent_to_pda, preparation_status, is_loaded } = req.body;
    
    await knex('aldi_trucks').where('id', id).update({
      truck_number,
      delivery_date,
      transporter,
      license_plate_1,
      license_plate_2,
      sent_to_pda,
      preparation_status,
      is_loaded,
      updated_at: knex.fn.now()
    });
    
    const updatedTruck = await knex('aldi_trucks').where('id', id).first();
    res.json(updatedTruck);
  } catch (err) {
    console.error('Error updating aldi truck:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a truck
router.delete('/trucks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await knex('aldi_trucks').where('id', id).delete();
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting aldi truck:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get lines for a specific truck
router.get('/trucks/:id/lines', async (req, res) => {
  try {
    const { id } = req.params;
    const lines = await knex('aldi_truck_lines').where('aldi_truck_id', id).orderBy('id', 'asc');
    res.json(lines);
  } catch (err) {
    console.error('Error fetching aldi truck lines:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Transfer/add line to truck
router.post('/trucks/:id/lines', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      aldi_daily_order_line_id,
      product_name,
      ordered_cartons,
      cartons_per_pallet,
      pallets,
      delivery_date,
      order_number,
      order_type
    } = req.body;

    // Check if the exact same line from the same order exists on this truck
    // If it does, we just add the quantity to it
    if (aldi_daily_order_line_id) {
        const existing = await knex('aldi_truck_lines')
            .where({ aldi_truck_id: id, aldi_daily_order_line_id })
            .first();

        if (existing) {
            const newCartons = existing.ordered_cartons + ordered_cartons;
            const newPallets = existing.pallets ? parseFloat(existing.pallets) + (pallets ? parseFloat(pallets) : 0) : pallets;

            await knex('aldi_truck_lines')
                .where('id', existing.id)
                .update({
                    ordered_cartons: newCartons,
                    pallets: newPallets,
                    updated_at: knex.fn.now()
                });
            
            const updated = await knex('aldi_truck_lines').where('id', existing.id).first();
            return res.json(updated);
        }
    }

    const [lineId] = await knex('aldi_truck_lines').insert({
      aldi_truck_id: id,
      aldi_daily_order_line_id,
      product_name,
      ordered_cartons,
      cartons_per_pallet,
      pallets,
      delivery_date,
      order_number,
      order_type
    }).returning('id');

    const newLine = await knex('aldi_truck_lines').where('id', lineId.id || lineId).first();
    res.status(201).json(newLine);
  } catch (err) {
    console.error('Error adding line to aldi truck:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete line from truck
router.delete('/trucks/:truckId/lines/:lineId', async (req, res) => {
  try {
    const { truckId, lineId } = req.params;
    await knex('aldi_truck_lines')
      .where({ id: lineId, aldi_truck_id: truckId })
      .delete();
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting aldi truck line:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete line directly by lineId
router.delete('/truck-lines/:lineId', async (req, res) => {
  try {
    const { lineId } = req.params;
    await knex('aldi_truck_lines')
      .where({ id: lineId })
      .delete();
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting aldi truck line by id:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unassigned (or partially assigned) ALDI order demands
// This provides the data for the right side "Áru igény" panel
router.get('/demands', async (req, res) => {
  try {
    const { delivery_date, order_number } = req.query;

    let orderQuery = knex('aldi_daily_orders').select('id', 'order_number', 'delivery_date').where('sent_to_rakodas', true);
    if (delivery_date) orderQuery = orderQuery.where('delivery_date', delivery_date);
    if (order_number) orderQuery = orderQuery.where('order_number', 'ilike', `%${order_number}%`);

    const orders = await orderQuery;
    if (orders.length === 0) return res.json([]);

    const orderIds = orders.map(o => o.id);
    const orderLines = await knex('aldi_daily_order_lines').whereIn('daily_order_id', orderIds);

    // Get loaded quantities
    const loadedLines = await knex('aldi_truck_lines')
      .select('aldi_daily_order_line_id')
      .sum('ordered_cartons as total_loaded')
      .whereNotNull('aldi_daily_order_line_id')
      .groupBy('aldi_daily_order_line_id');
      
    const loadedMap = {};
    loadedLines.forEach(l => {
      loadedMap[l.aldi_daily_order_line_id] = parseInt(l.total_loaded) || 0;
    });

    // We also need product names from chain_products
    const gtins = orderLines.map(l => l.gtin);
    const products = await knex('chain_products').whereIn('gtin', gtins).andWhere('chain', 'ALDI');
    const productMap = {};
    products.forEach(p => {
        productMap[p.gtin] = p;
    });

    const demands = [];
    for (const line of orderLines) {
        const order = orders.find(o => o.id === line.daily_order_id);
        const loaded = loadedMap[line.id] || 0;
        const remaining = line.ordered_cartons - loaded;

        if (remaining > 0) {
            const product = productMap[line.gtin];
            
            let currency = 'Nincs heti ár megadva a tételhez';
            if (product) {
                let dDate = order.delivery_date;
                if (dDate instanceof Date) {
                    const y = dDate.getFullYear();
                    const m = String(dDate.getMonth() + 1).padStart(2, '0');
                    const d = String(dDate.getDate()).padStart(2, '0');
                    dDate = `${y}-${m}-${d}`;
                } else if (typeof dDate === 'string' && dDate.includes('T')) {
                    dDate = dDate.split('T')[0];
                }

                const period = await knex('aldi_price_currency_periods')
                    .join('aldi_weekly_price_lines', 'aldi_price_currency_periods.price_line_id', 'aldi_weekly_price_lines.id')
                    .where('aldi_weekly_price_lines.chain_product_id', product.id)
                    .where(function() {
                        this.where('aldi_price_currency_periods.period_start', '<=', dDate)
                            .andWhere('aldi_price_currency_periods.period_end', '>=', dDate);
                    })
                    .first('aldi_price_currency_periods.currency_code');

                if (period && period.currency_code) {
                    currency = period.currency_code;
                }
                // Ha nincs egyező időszak a dátumhoz, currency marad 'Nincs heti ár megadva a tételhez'
            }

            const cpp = line.cartons_per_pallet ? parseInt(line.cartons_per_pallet) : null;
            const calcPallets = (cpp && cpp > 0) ? (remaining / cpp) : null;

            demands.push({
                id: line.id,
                aldi_daily_order_line_id: line.id, // For easy mapping
                product_name: product ? product.product_name : `Ismeretlen termék (${line.gtin})`,
                gtin: line.gtin,
                ordered_cartons: remaining,
                total_ordered_cartons: line.ordered_cartons,
                delivery_date: order.delivery_date,
                order_number: order.order_number,
                cartons_per_pallet: cpp, 
                pallets: calcPallets,
                order_type: currency
            });
        }
    }

    res.json(demands);
  } catch (err) {
    console.error('Error fetching aldi demands:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Batch update cartons_per_pallet for daily order lines
router.put('/demands/cartons-per-pallet', async (req, res) => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'Az updates mezőnek tömbnek kell lennie.' });
    }

    await knex.transaction(async (trx) => {
      for (const item of updates) {
        if (item.id) {
          const cpp = item.cartons_per_pallet !== '' && item.cartons_per_pallet !== null && !isNaN(item.cartons_per_pallet)
            ? parseInt(item.cartons_per_pallet)
            : null;
          await trx('aldi_daily_order_lines')
            .where({ id: item.id })
            .update({ cartons_per_pallet: cpp });
        }
      }
    });

    res.json({ success: true, message: 'Karton/raklap értékek sikeresen mentve.' });
  } catch (err) {
    console.error('Error updating cartons_per_pallet:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Commissioning Endpoints ---

// GET commission summary for trucks
router.get('/commission-summary', async (req, res) => {
  try {
    const { date, truck_id } = req.query;
    
    let query = knex('aldi_trucks').select('*').orderBy('delivery_date', 'desc').orderBy('id', 'desc');
    if (date) query = query.where('delivery_date', date);
    if (truck_id) query = query.where('id', truck_id);
    const trucks = await query;
    
    const truckIds = trucks.map(t => t.id);
    if (truckIds.length === 0) return res.json([]);
    
    const truckLines = await knex('aldi_truck_lines')
      .whereIn('aldi_truck_id', truckIds)
      .select('aldi_truck_id')
      .sum('ordered_cartons as total_ordered_cartons')
      .sum('pallets as total_ordered_pallets')
      .groupBy('aldi_truck_id');
      
    const commissionLines = await knex('aldi_commission_lines')
      .whereIn('aldi_truck_id', truckIds)
      .select('aldi_truck_id')
      .sum('cartons as total_commissioned_cartons')
      .sum('gross_weight as total_gross_weight')
      .sum('net_weight as total_net_weight')
      .groupBy('aldi_truck_id');
      
    const summary = trucks.map(t => {
      const tl = truckLines.find(l => l.aldi_truck_id === t.id) || {};
      const cl = commissionLines.find(c => c.aldi_truck_id === t.id) || {};
      
      const ordered = parseInt(tl.total_ordered_cartons) || 0;
      const commissioned = parseInt(cl.total_commissioned_cartons) || 0;
      const pallets = parseFloat(tl.total_ordered_pallets) || 0;
      const gross = parseFloat(cl.total_gross_weight) || 0;
      const net = parseFloat(cl.total_net_weight) || 0;
      
      const remaining = Math.max(0, ordered - commissioned);
      const status_percent = ordered > 0 ? Math.round((commissioned / ordered) * 100) : (commissioned > 0 ? 100 : 0);
      
      return {
        id: t.id,
        delivery_date: t.delivery_date,
        truck_number: t.truck_number,
        pallets: pallets,
        ordered_cartons: ordered,
        gross_weight: gross,
        net_weight: net,
        status_percent: Math.min(status_percent, 100), // Cap at 100% just in case
        commissioned_cartons: commissioned,
        remaining_cartons: remaining
      };
    });
    
    res.json(summary);
  } catch (err) {
    console.error('Error in commission-summary:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET commission lines for a truck
router.get('/trucks/:id/commission-lines', async (req, res) => {
  try {
    const lines = await knex('aldi_commission_lines')
      .where('aldi_truck_id', req.params.id)
      .orderBy('id', 'asc');
    res.json(lines);
  } catch (err) {
    console.error('Error fetching commission lines:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST commission line
router.post('/trucks/:id/commission-lines', async (req, res) => {
  try {
    const { product_name, cartons, gross_weight, net_weight, average_weight, pallets, origin_country, carton_type, tare_weight, pallet_type, lot_number } = req.body;
    
    const [id] = await knex('aldi_commission_lines').insert({
      aldi_truck_id: req.params.id,
      product_name,
      cartons: cartons || 0,
      gross_weight: gross_weight === '' ? null : gross_weight,
      net_weight: net_weight === '' ? null : net_weight,
      average_weight: average_weight === '' ? null : average_weight,
      pallets: pallets === '' ? null : pallets,
      origin_country, carton_type, 
      tare_weight: tare_weight === '' ? null : tare_weight, 
      pallet_type, lot_number
    }).returning('id');
    
    const newLine = await knex('aldi_commission_lines').where('id', id.id || id).first();
    res.status(201).json(newLine);
  } catch (err) {
    console.error('Error creating commission line:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT commission line
router.put('/trucks/:id/commission-lines/:lineId', async (req, res) => {
  try {
    const { product_name, cartons, gross_weight, net_weight, average_weight, pallets, origin_country, carton_type, tare_weight, pallet_type, lot_number } = req.body;
    
    await knex('aldi_commission_lines').where({ id: req.params.lineId, aldi_truck_id: req.params.id }).update({
      product_name,
      cartons: cartons || 0,
      gross_weight: gross_weight === '' ? null : gross_weight,
      net_weight: net_weight === '' ? null : net_weight,
      average_weight: average_weight === '' ? null : average_weight,
      pallets: pallets === '' ? null : pallets,
      origin_country, carton_type, 
      tare_weight: tare_weight === '' ? null : tare_weight, 
      pallet_type, lot_number,
      updated_at: knex.fn.now()
    });
    
    const updatedLine = await knex('aldi_commission_lines').where('id', req.params.lineId).first();
    res.json(updatedLine);
  } catch (err) {
    console.error('Error updating commission line:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE commission line
router.delete('/trucks/:id/commission-lines/:lineId', async (req, res) => {
  try {
    await knex('aldi_commission_lines').where({ id: req.params.lineId, aldi_truck_id: req.params.id }).delete();
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting commission line:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
