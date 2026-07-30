const express = require('express');
const router = express.Router();
const db = require('../db/db');

// GET /api/v1/transporters
router.get('/', async (req, res) => {
  try {
    // Sync active transporters from partner_identifiers
    const partners = await db('partner_identifiers as pi')
      .join('partners as p', 'p.id', 'pi.partner_id')
      .whereIn('pi.id_type', ['Fuvarozók', 'FuvarozA3k', 'Fuvaroz\xC3\xB3k'])
      .andWhere('p.is_active', true)
      .andWhere(function() {
        this.where('pi.is_inactive', false).orWhereNull('pi.is_inactive');
      })
      .select('p.name as name', 'pi.value as short_name');

    const activePartnerNames = new Set();
    partners.forEach(p => {
        const pName = (p.short_name || p.name || '').trim();
        if (pName) {
            activePartnerNames.add(pName.toUpperCase());
        }
    });

    const transporters = await db('transporters').select('id', 'name', 'is_active');
    const existingMap = new Map();
    transporters.forEach(t => {
        if (t.name) existingMap.set(t.name.toUpperCase().trim(), t);
    });

    const newTransporters = [];
    const reactivateIds = [];
    const deactivateIds = [];

    // Deactivate any transporter that is NOT active in partner_identifiers
    for (const t of transporters) {
        const upperName = (t.name || '').toUpperCase().trim();
        if (!activePartnerNames.has(upperName) && t.is_active) {
            deactivateIds.push(t.id);
        }
    }

    // Add new transporters or reactivate existing ones based on partner_identifiers
    for (const p of partners) {
        const pName = (p.short_name || p.name || '').trim();
        if (!pName) continue;

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
            if (!existing.is_active && existing.id) {
                reactivateIds.push(existing.id);
            }
        }
    }

    if (newTransporters.length > 0) {
        await db('transporters').insert(newTransporters);
    }
    if (reactivateIds.length > 0) {
        await db('transporters').whereIn('id', reactivateIds).update({ is_active: true });
    }
    if (deactivateIds.length > 0) {
        await db('transporters').whereIn('id', deactivateIds).update({ is_active: false });
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
