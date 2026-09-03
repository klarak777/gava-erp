const express = require('express');
const router = express.Router();
const knex = require('../db/db');

// Get all trucks, optionally filtered by delivery date
router.get('/trucks', async (req, res) => {
  try {
    const { date } = req.query;
    let query = knex('aldi_trucks')
      .select('aldi_trucks.*')
      .leftJoin('aldi_truck_lines', 'aldi_trucks.id', 'aldi_truck_lines.aldi_truck_id')
      .sum('aldi_truck_lines.pallets as total_pallets')
      .sum('aldi_truck_lines.ordered_cartons as total_ordered_cartons')
      .sum('aldi_truck_lines.picked_cartons as total_picked_cartons')
      .groupBy('aldi_trucks.id')
      .orderBy('aldi_trucks.id', 'asc');
    
    if (date) {
      query = query.where('aldi_trucks.delivery_date', date);
    }
    const trucks = await query;
    
    // Állapot (%) kalkuláció
    trucks.forEach(t => {
      const ordered = parseFloat(t.total_ordered_cartons) || 0;
      const picked = parseFloat(t.total_picked_cartons) || 0;
      t.preparation_status = ordered > 0 ? Math.round((picked / ordered) * 100) : 0;
    });
    
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
    
    await knex.transaction(async trx => {
        // 1. Lock the truck record FIRST to prevent concurrent adds
        const truck = await trx('aldi_trucks').where({ id }).first().forUpdate();
        if (!truck) throw new Error('TRUCK_NOT_FOUND');

        // 2. Find all lines of this truck
        const truckLines = await trx('aldi_truck_lines').where('aldi_truck_id', id);
        
        const orderLineIds = truckLines
            .map(l => l.aldi_daily_order_line_id)
            .filter(Boolean);

        if (orderLineIds.length > 0) {
            // 3. Lock parent order lines in ascending order to prevent deadlocks
            const uniqueOrderLineIds = [...new Set(orderLineIds)].sort((a, b) => a - b);
            await trx('aldi_daily_order_lines')
                .whereIn('id', uniqueOrderLineIds)
                .forUpdate();
        }
        const stateIds = [...new Set(truckLines.map(line => line.order_item_state_id).filter(Boolean))].sort((a, b) => a - b);
        if (stateIds.length) await trx('aldi_order_item_states').whereIn('id', stateIds).orderBy('id', 'asc').forUpdate();

        // 4. Delete
        await trx('aldi_truck_lines').where('aldi_truck_id', id).delete();
        await trx('aldi_trucks').where('id', id).delete();
    });

    res.status(204).end();
  } catch (err) {
    if (err.message === 'TRUCK_NOT_FOUND') return res.status(404).json({ error: 'Kamion nem található.' });
    console.error('Error deleting aldi truck:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get lines for a specific truck
router.get('/trucks/:id/lines', async (req, res) => {
  try {
    const { id } = req.params;
    const lines = await knex('aldi_truck_lines').where('aldi_truck_id', id).orderBy('row_order', 'asc').orderBy('id', 'asc');
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

    // Validation: positive integer cartons only
    const newCartons = Number(ordered_cartons);
    if (!Number.isFinite(newCartons) || !Number.isInteger(newCartons) || newCartons <= 0) {
        return res.status(400).json({ error: 'A kartonszámnak pozitív egész számnak kell lennie.' });
    }

    const result = await knex.transaction(async trx => {
        // 1. Lock the truck record FIRST (same order as DELETE to prevent deadlocks)
        const truck = await trx('aldi_trucks').where({ id }).first().forUpdate();
        if (!truck) throw new Error('TRUCK_NOT_FOUND');

        if (aldi_daily_order_line_id) {
            // 2. Lock the order line
            const orderLine = await trx('aldi_daily_order_lines')
                .where({ id: aldi_daily_order_line_id })
                .first()
                .forUpdate();

            if (!orderLine) throw new Error('LINE_NOT_FOUND');
            const itemState = await trx('aldi_order_item_states').where({ id: orderLine.order_item_state_id }).first().forUpdate();
            if (!itemState) throw new Error('ITEM_STATE_NOT_FOUND');
            if (itemState.requires_reconciliation) throw new Error('RECONCILIATION_REQUIRED');
            const sentCartons = parseFloat(itemState.sent_cartons) || 0;

            // 3. Sum existing loaded cartons for this order line
            const loadedRes = await trx('aldi_truck_lines')
                .where({ order_item_state_id: itemState.id })
                .sum('ordered_cartons as total_loaded')
                .first();
            const totalLoaded = parseFloat(loadedRes.total_loaded) || 0;

            // 4. Invariant check: loaded + new <= sent
            if (totalLoaded + newCartons > sentCartons) {
                throw new Error(`Nem osztható ki több karton a kamionokra. Elérhető: ${sentCartons - totalLoaded}, Kért: ${newCartons}`);
            }

            // 5. Merge into existing truck line if same line already on this truck
            const existing = await trx('aldi_truck_lines')
                .where({ aldi_truck_id: id, order_item_state_id: itemState.id })
                .first();

            if (existing) {
                const updatedCartons = parseInt(existing.ordered_cartons) + newCartons;
                const updatedPallets = existing.pallets
                    ? parseFloat(existing.pallets) + (pallets ? parseFloat(pallets) : 0)
                    : pallets;

                await trx('aldi_truck_lines')
                    .where('id', existing.id)
                    .update({ ordered_cartons: updatedCartons, pallets: updatedPallets, updated_at: knex.fn.now() });
                
                return await trx('aldi_truck_lines').where('id', existing.id).first();
            }
        }

        // 6. Insert new truck line
        const [lineIdObj] = await trx('aldi_truck_lines').insert({
          aldi_truck_id: id,
          aldi_daily_order_line_id,
          order_item_state_id: aldi_daily_order_line_id
            ? (await trx('aldi_daily_order_lines').where({ id: aldi_daily_order_line_id }).first())?.order_item_state_id
            : null,
          product_name,
          ordered_cartons: newCartons,
          cartons_per_pallet,
          pallets,
          delivery_date,
          order_number,
          order_type
        }).returning('id');

        const insertedId = typeof lineIdObj === 'object' ? lineIdObj.id : lineIdObj;
        return await trx('aldi_truck_lines').where('id', insertedId).first();
    });

    res.status(201).json(result);
  } catch (err) {
    if (err.message === 'TRUCK_NOT_FOUND') return res.status(404).json({ error: 'Kamion nem található.' });
    if (err.message === 'LINE_NOT_FOUND') return res.status(404).json({ error: 'Napi rendelési tétel nem található.' });
    if (err.message === 'ITEM_STATE_NOT_FOUND' || err.message === 'RECONCILIATION_REQUIRED') return res.status(409).json({ error: 'A tétel állapota hiányzik vagy mennyiségi egyeztetést igényel.' });
    if (err.message.includes('Nem osztható ki')) return res.status(409).json({ error: err.message });
    console.error('Error adding line to aldi truck:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete line from truck
router.delete('/trucks/:truckId/lines/:lineId', async (req, res) => {
  try {
    const { truckId, lineId } = req.params;
    
    await knex.transaction(async trx => {
        const truckLine = await trx('aldi_truck_lines').where({ id: lineId, aldi_truck_id: truckId }).first();
        if (!truckLine) return;

        if (truckLine.aldi_daily_order_line_id) {
            await trx('aldi_daily_order_lines').where({ id: truckLine.aldi_daily_order_line_id }).first().forUpdate();
        }
        if (truckLine.order_item_state_id) await trx('aldi_order_item_states').where({ id: truckLine.order_item_state_id }).first().forUpdate();
        await trx('aldi_truck_lines').where({ id: lineId }).delete();
    });

    res.status(204).end();
  } catch (err) {
    console.error('Error deleting aldi truck line:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update line directly by lineId
// Only whitelisted fields may be updated.
router.put('/truck-lines/:lineId', async (req, res) => {
  try {
    const { lineId } = req.params;

    // Whitelist: only these fields may be modified by the client
    const ALLOWED = ['partner', 'destination', 'gross_weight', 'net_weight', 'ordered_cartons'];
    const updateData = {};
    for (const field of ALLOWED) {
        if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'Legalább egy módosítható mezőt meg kell adni.' });
    }

    // Validate ordered_cartons if present
    let newCartons;
    if (updateData.ordered_cartons !== undefined) {
        newCartons = Number(updateData.ordered_cartons);
        if (!Number.isFinite(newCartons) || !Number.isInteger(newCartons) || newCartons <= 0) {
            return res.status(400).json({ error: 'A kartonszámnak pozitív egész számnak kell lennie.' });
        }
        updateData.ordered_cartons = newCartons;
    }

    updateData.updated_at = knex.fn.now();

    const updatedLine = await knex.transaction(async trx => {
        const truckLine = await trx('aldi_truck_lines').where({ id: lineId }).first();
        if (!truckLine) throw new Error('TRUCK_LINE_NOT_FOUND');

        // Lock truck to maintain consistent lock order with DELETE /trucks/:id
        await trx('aldi_trucks').where({ id: truckLine.aldi_truck_id }).first().forUpdate();

        if (truckLine.order_item_state_id && newCartons !== undefined) {
            const itemState = await trx('aldi_order_item_states').where({ id: truckLine.order_item_state_id }).first().forUpdate();
            if (itemState) {
                const sentCartons = parseFloat(itemState.sent_cartons) || 0;
                
                // Sum OTHER truck lines for same order line
                const loadedRes = await trx('aldi_truck_lines')
                    .where({ order_item_state_id: itemState.id })
                    .andWhereNot({ id: lineId })
                    .sum('ordered_cartons as total_loaded')
                    .first();
                const otherLoaded = parseFloat(loadedRes.total_loaded) || 0;

                if (otherLoaded + newCartons > sentCartons) {
                    throw new Error(`Nem osztható ki több karton. Elérhető (más kamionokon felül): ${sentCartons - otherLoaded}, Kért: ${newCartons}`);
                }
            }
        }

        await trx('aldi_truck_lines').where({ id: lineId }).update(updateData);
        return await trx('aldi_truck_lines').where({ id: lineId }).first();
    });

    res.json(updatedLine);
  } catch (err) {
    if (err.message === 'TRUCK_LINE_NOT_FOUND') return res.status(404).json({ error: 'Kamionsor nem található.' });
    if (err.message.includes('Nem osztható ki')) return res.status(409).json({ error: err.message });
    console.error('Error updating aldi truck line by id:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete line directly by lineId
router.delete('/truck-lines/:lineId', async (req, res) => {
  try {
    const { lineId } = req.params;

    await knex.transaction(async trx => {
        const truckLine = await trx('aldi_truck_lines').where({ id: lineId }).first();
        if (!truckLine) return;

        if (truckLine.aldi_daily_order_line_id) {
            await trx('aldi_daily_order_lines').where({ id: truckLine.aldi_daily_order_line_id }).first().forUpdate();
        }
        if (truckLine.order_item_state_id) await trx('aldi_order_item_states').where({ id: truckLine.order_item_state_id }).first().forUpdate();
        await trx('aldi_truck_lines').where({ id: lineId }).delete();
    });

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

    let orderQuery = knex('aldi_daily_orders').select('id', 'order_number', 'delivery_date', 'version_number').where({ sent_to_rakodas: true, version_status: 'current' });
    if (delivery_date) orderQuery = orderQuery.where('delivery_date', delivery_date);
    if (order_number) orderQuery = orderQuery.where('order_number', 'ilike', `%${order_number}%`);

    const orders = await orderQuery;
    if (orders.length === 0) return res.json([]);

    const orderIds = orders.map(o => o.id);
    const orderLines = await knex('aldi_daily_order_lines as l')
      .join('aldi_order_item_states as s', 's.id', 'l.order_item_state_id')
      .whereIn('l.daily_order_id', orderIds)
      .where('l.is_virtual_removed', false)
      .select('l.*', 's.sent_cartons', 's.requires_reconciliation', 's.reconciliation_reason');

    // Get loaded quantities
    const loadedLines = await knex('aldi_truck_lines')
      .select('order_item_state_id')
      .sum('ordered_cartons as total_loaded')
      .whereNotNull('order_item_state_id')
      .groupBy('order_item_state_id');
      
    const loadedMap = {};
    loadedLines.forEach(l => {
      loadedMap[l.order_item_state_id] = parseFloat(l.total_loaded) || 0;
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
        const sentCartons = parseFloat(line.sent_cartons) || 0;
        if (sentCartons <= 0) continue; // Csak azt mutatjuk, ami küldve lett

        const order = orders.find(o => o.id === line.daily_order_id);
        const loaded = loadedMap[line.order_item_state_id] || 0;
        const remaining = sentCartons - loaded;

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
                aldi_daily_order_line_id: line.id,
                order_item_state_id: line.order_item_state_id,
                product_name: product ? product.product_name : `Ismeretlen termék (${line.gtin})`,
                gtin: line.gtin,
                // Full quantity breakdown – frontend must use these explicit fields:
                ordered_cartons: parseFloat(line.ordered_cartons) || 0,  // Teljes eredeti rendelés
                sent_cartons: sentCartons,                                 // Mennyi van a Rakodásban
                loaded_cartons: loaded,                                    // Mennyi van kamionon
                available_cartons: remaining,                              // Szabadon osztható (sent - loaded)
                delivery_date: order.delivery_date,
                order_number: order.order_number,
                version_number: order.version_number,
                requires_reconciliation: !!line.requires_reconciliation,
                reconciliation_reason: line.reconciliation_reason,
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

// Split a demand
router.post('/demands/:id/split', async (req, res) => {
  return res.status(410).json({ error: 'A szétbontás funkció megszűnt; használd a tételáthelyezést.' });
  /* legacy implementation retained temporarily for rollback reference
  try {
    const { id } = req.params;
    const { newCartons } = req.body;
    
    if (!newCartons || newCartons <= 0) {
      return res.status(400).json({ error: 'Érvénytelen kartonszám!' });
    }

    const existing = await knex('aldi_daily_order_lines').where('id', id).first();
    if (!existing) return res.status(404).json({ error: 'Tétel nem található' });

    // Ha már küldve lett bármi is a rakodásba, nem engedjük szétbontani
    const sentCartons = parseFloat(existing.sent_cartons) || 0;
    if (sentCartons > 0) {
        return res.status(409).json({ error: 'A tétel nem bontható szét, mert egy része vagy egésze már el lett küldve a Rakodás modulba. Kérlek előbb vond vissza a rakodásból.' });
    }

    // Check loaded quantities (csak a biztonság kedvéért)
    const loadedRow = await knex('aldi_truck_lines')
      .where('aldi_daily_order_line_id', id)
      .sum('ordered_cartons as total_loaded')
      .first();
    
    const loaded = parseFloat(loadedRow?.total_loaded) || 0;
    if (loaded > 0) {
        return res.status(409).json({ error: 'A tétel nem bontható szét, mert már kamionra lett rakva. Kérlek vedd le a kamionról.' });
    }

    const remaining = existing.ordered_cartons - loaded;

    if (newCartons >= remaining) {
      return res.status(400).json({ error: 'Az új kartonszám kisebb kell legyen a jelenleginél!' });
    }

    await knex.transaction(async trx => {
      // reduce original
      await trx('aldi_daily_order_lines')
        .where('id', id)
        .update({ ordered_cartons: existing.ordered_cartons - newCartons });
        
      // insert new
      await trx('aldi_daily_order_lines').insert({
        daily_order_id: existing.daily_order_id,
        gtin: existing.gtin,
        ordered_cartons: newCartons,
        cartons_per_pallet: existing.cartons_per_pallet
      });
    });
    
    res.status(200).json({ success: true });
  } catch (e) {
    console.error('Error splitting demand:', e);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
  */
});

// DELETE /demands/:id – DISABLED
// Ez a végpont megkerülheti az új tételszintű logikát (sent_cartons).
// Használd helyette: PATCH /api/v1/aldi-daily-orders/lines/:lineId/send-cartons
router.delete('/demands/:id', (req, res) => {
  res.status(410).json({
    error: 'Ez a végpont le lett tiltva. Használd a PATCH /api/v1/aldi-daily-orders/lines/:lineId/send-cartons végpontot a visszavételhez.'
  });
});

// Teljes szabad Áruigény visszavétele a Napi rendelésekhez
router.patch('/order-items/:itemStateId/return-available', async (req, res) => {
  try {
    const { return_cartons } = req.body;
    
    const result = await knex.transaction(async trx => {
      const state = await trx('aldi_order_item_states').where({ id: req.params.itemStateId }).first().forUpdate();
      if (!state) throw new Error('ITEM_STATE_NOT_FOUND');
      
      const loadedRow = await trx('aldi_truck_lines').where({ order_item_state_id: state.id }).sum('ordered_cartons as total').first();
      const loaded = Number(loadedRow && loadedRow.total) || 0;
      const sent = Number(state.sent_cartons) || 0;
      
      let newSent = loaded; // Default: return all available
      
      if (return_cartons !== undefined) {
          const toReturn = Number(return_cartons);
          if (toReturn > 0) {
              newSent = Math.max(loaded, sent - toReturn);
          }
      }
      
      await trx('aldi_order_item_states').where({ id: state.id }).update({ sent_cartons: newSent, updated_at: trx.fn.now() });
      
      const family = await trx('aldi_order_families').where({ id: state.order_family_id }).first();
      if (family && family.current_order_id) {
        const anySent = await trx('aldi_daily_order_lines as l').join('aldi_order_item_states as s', 's.id', 'l.order_item_state_id')
          .where('l.daily_order_id', family.current_order_id).where('s.sent_cartons', '>', 0).first();
        await trx('aldi_daily_orders').where({ id: family.current_order_id }).update({ sent_to_rakodas: !!anySent });
      }
      return { sent_cartons: newSent, loaded_cartons: loaded, available_cartons: newSent - loaded };
    });
    res.json(result);
  } catch (err) {
    if (err.message === 'ITEM_STATE_NOT_FOUND') return res.status(404).json({ error: 'A tétel nem található.' });
    console.error('ALDI Áruigény visszavételi hiba:', err);
    res.status(500).json({ error: 'Belső szerverhiba.' });
  }
});

// Kamionsor áthelyezése másik kamionra, Áruigénybe vagy Napi rendelésbe
router.post('/truck-lines/:lineId/transfer', async (req, res) => {
  try {
    const { target_type, target_truck_id, transfer_eu_pallets } = req.body;
    if (!['truck', 'demand', 'daily_order'].includes(target_type)) return res.status(400).json({ error: 'Érvénytelen áthelyezési cél.' });
    const euPallets = Number(transfer_eu_pallets);
    if (!Number.isFinite(euPallets) || euPallets <= 0 || !/^\d+(\.\d{1,3})?$/.test(String(transfer_eu_pallets))) return res.status(400).json({ error: 'Az EU-raklap mennyisége pozitív, legfeljebb 3 tizedesjegyű szám lehet.' });

    const result = await knex.transaction(async trx => {
      const sourceLine = await trx('aldi_truck_lines').where({ id: req.params.lineId }).first();
      if (!sourceLine) throw new Error('TRUCK_LINE_NOT_FOUND');
      if (!sourceLine.order_item_state_id) throw new Error('ITEM_STATE_NOT_FOUND');
      const truckIds = [Number(sourceLine.aldi_truck_id)];
      if (target_type === 'truck') {
        if (!target_truck_id || Number(target_truck_id) === Number(sourceLine.aldi_truck_id)) throw new Error('INVALID_TARGET_TRUCK');
        truckIds.push(Number(target_truck_id));
      }
      const trucks = await trx('aldi_trucks').whereIn('id', [...new Set(truckIds)].sort((a, b) => a - b)).orderBy('id', 'asc').forUpdate();
      if (trucks.length !== new Set(truckIds).size) throw new Error('TRUCK_NOT_FOUND');
      if (trucks.some(truck => truck.sent_to_pda || truck.is_loaded)) throw new Error('TRUCK_LOCKED');
      const state = await trx('aldi_order_item_states').where({ id: sourceLine.order_item_state_id }).first().forUpdate();
      const cpp = Number(sourceLine.cartons_per_pallet);
      if (!Number.isFinite(cpp) || cpp <= 0) throw new Error('MISSING_CPP');
      const moveCartons = euPallets * cpp;
      if (!Number.isInteger(moveCartons)) throw new Error('FRACTIONAL_CARTONS');
      const sourceCartons = Number(sourceLine.ordered_cartons) || 0;
      if (moveCartons > sourceCartons) throw new Error('TOO_MUCH');
      const remainingCartons = sourceCartons - moveCartons;
      const remainingPallets = remainingCartons / cpp;
      let commission = await trx('aldi_commission_lines').where({ aldi_truck_line_id: sourceLine.id }).first().forUpdate();
      if (!commission) {
        const legacyCommission = await trx('aldi_commission_lines').where({ aldi_truck_id: sourceLine.aldi_truck_id, product_name: sourceLine.product_name }).forUpdate();
        if (legacyCommission.length > 1) throw new Error('AMBIGUOUS_COMMISSION');
        commission = legacyCommission[0] || null;
        if (commission) await trx('aldi_commission_lines').where({ id: commission.id }).update({ aldi_truck_line_id: sourceLine.id, order_item_state_id: state.id });
      }

      if (remainingCartons === 0) await trx('aldi_truck_lines').where({ id: sourceLine.id }).delete();
      else await trx('aldi_truck_lines').where({ id: sourceLine.id }).update({ ordered_cartons: remainingCartons, pallets: remainingPallets, updated_at: trx.fn.now() });

      if (target_type === 'truck') {
        const existing = await trx('aldi_truck_lines').where({ aldi_truck_id: target_truck_id, order_item_state_id: state.id }).first();
        if (existing) await trx('aldi_truck_lines').where({ id: existing.id }).update({ ordered_cartons: Number(existing.ordered_cartons) + moveCartons, pallets: Number(existing.pallets || 0) + euPallets, updated_at: trx.fn.now() });
        else await trx('aldi_truck_lines').insert({ ...sourceLine, id: undefined, aldi_truck_id: target_truck_id, ordered_cartons: moveCartons, pallets: euPallets, row_order: 0, created_at: trx.fn.now(), updated_at: trx.fn.now() });
      } else if (target_type === 'daily_order') {
        const loadedRow = await trx('aldi_truck_lines').where({ order_item_state_id: state.id }).sum('ordered_cartons as total').first();
        const loadedAfter = Number(loadedRow && loadedRow.total) || 0;
        const nextSent = Number(state.sent_cartons) - moveCartons;
        if (nextSent < loadedAfter) throw new Error('INVARIANT_VIOLATION');
        await trx('aldi_order_item_states').where({ id: state.id }).update({ sent_cartons: nextSent, updated_at: trx.fn.now() });
      }

      if (commission) {
        const ratio = remainingCartons / sourceCartons;
        if (remainingCartons === 0) await trx('aldi_commission_lines').where({ id: commission.id }).delete();
        else await trx('aldi_commission_lines').where({ id: commission.id }).update({
          cartons: Math.min(Number(commission.cartons) || 0, remainingCartons),
          pallets: commission.pallets == null ? null : Number(commission.pallets) * ratio,
          gross_weight: commission.gross_weight == null ? null : Number(commission.gross_weight) * ratio,
          net_weight: commission.net_weight == null ? null : Number(commission.net_weight) * ratio,
          updated_at: trx.fn.now()
        });
      }
      return { success: true, moved_cartons: moveCartons, moved_eu_pallets: euPallets };
    });
    res.json(result);
  } catch (err) {
    const messages = {
      TRUCK_LINE_NOT_FOUND: ['Kamionsor nem található.', 404], ITEM_STATE_NOT_FOUND: ['A tétel állapota hiányzik.', 409],
      INVALID_TARGET_TRUCK: ['Érvénytelen célkamion.', 400], TRUCK_NOT_FOUND: ['A célkamion nem található.', 404],
      TRUCK_LOCKED: ['Rakodott vagy PDA-nak átadott kamion tétele nem mozgatható.', 409], MISSING_CPP: ['A tételhez nincs érvényes karton/raklap érték.', 409],
      FRACTIONAL_CARTONS: ['Az EU-raklap mennyiségből nem egész kartonszám adódik.', 400], TOO_MUCH: ['A megadott mennyiség meghaladja a forrássor mennyiségét.', 409],
      INVARIANT_VIOLATION: ['A művelet megsértené a rakodási mennyiségi szabályt.', 409],
      AMBIGUOUS_COMMISSION: ['A komissiós sor nem kapcsolható egyértelműen a kamionsorhoz; kézi egyeztetés szükséges.', 409]
    };
    if (messages[err.message]) return res.status(messages[err.message][1]).json({ error: messages[err.message][0] });
    console.error('ALDI tételáthelyezési hiba:', err);
    res.status(500).json({ error: 'Belső szerverhiba.' });
  }
});

router.put('/trucks/:truckId/lines/reorder', async (req, res) => {
  try {
    const ids = Array.isArray(req.body.line_ids) ? req.body.line_ids.map(Number) : [];
    if (!ids.length || new Set(ids).size !== ids.length) return res.status(400).json({ error: 'Érvénytelen vagy ismétlődő sorazonosítók.' });
    await knex.transaction(async trx => {
      const truck = await trx('aldi_trucks').where({ id: req.params.truckId }).first().forUpdate();
      if (!truck) throw new Error('TRUCK_NOT_FOUND');
      const existing = await trx('aldi_truck_lines').where({ aldi_truck_id: req.params.truckId }).orderBy('id').forUpdate();
      if (existing.length !== ids.length || existing.some(line => !ids.includes(Number(line.id)))) throw new Error('INVALID_LINE_SET');
      for (let index = 0; index < ids.length; index += 1) await trx('aldi_truck_lines').where({ id: ids[index] }).update({ row_order: index });
    });
    res.json({ success: true });
  } catch (err) {
    if (err.message === 'TRUCK_NOT_FOUND') return res.status(404).json({ error: 'Kamion nem található.' });
    if (err.message === 'INVALID_LINE_SET') return res.status(400).json({ error: 'A sorrend nem pontosan a kamion jelenlegi sorait tartalmazza.' });
    res.status(500).json({ error: 'Belső szerverhiba.' });
  }
});

// --- Commissioning Endpoints ---

// GET commission summary for trucks
router.get('/commission-summary', async (req, res) => {
  try {
    const { date, truck_id } = req.query;
    
    let query = knex('aldi_trucks').select('*').where('sent_to_pda', true).orderBy('delivery_date', 'desc').orderBy('id', 'desc');
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
      .sum('picked_cartons as total_commissioned_cartons')
      .sum('gross_weight as total_gross_weight')
      .sum('net_weight as total_net_weight')
      .groupBy('aldi_truck_id');
      
    const summary = trucks.map(t => {
      const tl = truckLines.find(l => l.aldi_truck_id === t.id) || {};
      
      const ordered = parseFloat(tl.total_ordered_cartons) || 0;
      const commissioned = parseFloat(tl.total_commissioned_cartons) || 0;
      const pallets = parseFloat(tl.total_ordered_pallets) || 0;
      const gross = parseFloat(tl.total_gross_weight) || 0;
      const net = parseFloat(tl.total_net_weight) || 0;
      
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
    const { product_name, cartons, gross_weight, net_weight, average_weight, pallets, origin_country, carton_type, tare_weight, pallet_type, lot_number, aldi_truck_line_id, order_item_state_id } = req.body;
    
    const [id] = await knex('aldi_commission_lines').insert({
      aldi_truck_id: req.params.id,
      aldi_truck_line_id: aldi_truck_line_id || null,
      order_item_state_id: order_item_state_id || null,
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
