const express = require('express');
const router = express.Router();
const db = require('../db/db');

// GET /api/v1/transporters
router.get('/', async (req, res) => {
  try {
    // Sync newly added transporters from partners table
    const partners = await db('partner_identifiers as pi')
      .join('partners as p', 'p.id', 'pi.partner_id')
      .whereIn('pi.id_type', ['Fuvarozók', 'FuvarozA3k', 'Fuvaroz\xC3\xB3k'])
      .andWhere('p.is_active', true)
      .select('p.name as name', 'pi.value as short_name');

    console.log(`[Sync] Found ${partners.length} partners with role Fuvarozók`);

    const transporters = await db('transporters').select('id', 'name', 'is_active');
    const existingMap = new Map();
    transporters.forEach(t => {
        if (t.name) existingMap.set(t.name.toUpperCase(), t);
    });

    const newTransporters = [];
    const reactivateIds = [];

    for (const p of partners) {
        const pName = p.short_name || p.name;
        if (pName) {
            const upperName = pName.toUpperCase();
            if (!existingMap.has(upperName)) {
                newTransporters.push({
                    name: pName,
                    code: pName.substring(0, 3).toUpperCase(),
                    is_active: true
                });
                existingMap.set(upperName, { is_active: true });
            } else {
                const existing = existingMap.get(upperName);
                if (!existing.is_active) {
                    reactivateIds.push(existing.id);
                }
            }
        }
    }
    
    if (newTransporters.length > 0) {
        await db('transporters').insert(newTransporters);
    }
    if (reactivateIds.length > 0) {
        await db('transporters').whereIn('id', reactivateIds).update({ is_active: true });
    }

    const finalTransporters = await db('transporters')
      .where('is_active', true)
      .orderBy('name', 'asc');
      
    res.json(finalTransporters);
  } catch (err) {
    console.error('Hiba a fuvarozók lekérdezésekor/szinkronizálásakor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

module.exports = router;
