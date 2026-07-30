const express = require('express');
const router = express.Router();
const db = require('../db/db');

// ============================================================
// Engedélyezett fuvarozók listája (Transport Company szerepkörök)
// Csak ezek jelenhetnek meg aktívként a rendszerben.
// ============================================================
const ALLOWED_TRANSPORTERS = new Set([
  'ALL FRESH', 'BILEK', 'BOGNÁR', 'BUGYI FERENC', 'BVT', 'CRETAN ROOT',
  'DERBY', 'ESKADA', 'FARAON', 'FER TRANS', 'FRIGOSPED', 'FRUBALMED',
  'FRUCTUS', 'FUSTER', 'GAVA', 'GAVA POLSKA', 'HANKA', 'HILLTOP', 'HZ',
  'KERMOR', 'KÓNYA', 'KUSEK', 'KV LOG', 'LIVIU', 'LOGISTICHOME',
  'MANDERSLOOT', 'MESAVERDE', 'MÜLLER', 'NH CARGO', 'PAP JÓZSEFNÉ',
  'PET-IMPEX', 'RAINBOW', 'RENACRIS', 'RONI', 'SHEBA', 'STI',
  'S-TRANSPORT', 'SWISS', 'SZÉKESI', 'THERMO FRUCHT', 'TÓTH FRIGO',
  'TRANS-SPED', 'VERMION'
]);

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
        if (t.name) existingMap.set(t.name.toUpperCase().trim(), t);
    });

    const newTransporters = [];
    const reactivateIds = [];
    const deactivateIds = [];

    // Deactivate any transporter NOT in the approved allowlist
    for (const t of transporters) {
        const upperName = (t.name || '').toUpperCase().trim();
        const inAllowlist = [...ALLOWED_TRANSPORTERS].some(a => a.toUpperCase() === upperName);
        if (!inAllowlist && t.is_active) {
            deactivateIds.push(t.id);
        }
    }

    // Sync active transporters from partners – only if they are in the allowlist
    for (const p of partners) {
        const pName = (p.short_name || p.name || '').trim();
        if (!pName) continue;

        const upperName = pName.toUpperCase();
        const inAllowlist = [...ALLOWED_TRANSPORTERS].some(a => a.toUpperCase() === upperName);

        if (!inAllowlist) continue; // Skip if not on the approved list

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
        console.log(`[Sync] Deactivating ${deactivateIds.length} transporters not in allowlist`);
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
