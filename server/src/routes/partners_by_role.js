const express = require('express');
const router = express.Router();
const db = require('../db/db');

/**
 * GET /api/v1/partners-by-role?role=reference|customer|transporter
 * 
 * Returns partners that have the specified role identifier in partner_identifiers.
 * This is the single source of truth for role-based partner lookups.
 * 
 * Response format: [{ id, name, short_name }]
 *   - id: partner ID from partners table
 *   - name: the short/display name from partner_identifiers.value (primary display)
 *   - full_name: full partner name from partners table
 *   - short_name: same as name (explicit alias)
 */

const ROLE_MAP = {
  'reference': ['(Reference) Szállítók', '(Reference) SzAllA-tA3k', '(Reference) SzAllA-tA3k', '(Reference) Sz\xC3\xA1ll\xC3\xADt\xC3\xB3k'],
  'customer': ['(Customer) Vevők', '(Customer) Vev`k', '(Customer) Vev\xC5\x91k'],
  'transporter': ['Fuvarozók', 'FuvarozA3k', 'Fuvaroz\xC3\xB3k'],
};

router.get('/', async (req, res) => {
  const role = req.query.role;
  if (!role || !ROLE_MAP[role]) {
    return res.status(400).json({ 
      error: 'Érvénytelen role paraméter. Használható: reference, customer, transporter' 
    });
  }

  const idType = ROLE_MAP[role];

  try {
    const rows = await db('partner_identifiers as pi')
      .join('partners as p', 'p.id', 'pi.partner_id')
      .whereIn('pi.id_type', idType)
      .andWhere('p.is_active', true)
      // Az archivált partnerek (is_inactive) szerepkörei sem jelenhetnek meg.
      // A partners táblán két külön oszlop létezik: az is_active a régi generic
      // admin törléshez tartozik, az is_inactive az Archív partnerek moduléhoz.
      .andWhere(function() {
        this.where('p.is_inactive', false).orWhereNull('p.is_inactive');
      })
      .andWhere(function() {
        this.where('pi.is_inactive', false).orWhereNull('pi.is_inactive');
      })
      .select(
        'p.id as id',
        'p.name as name',
        'pi.value as short_name',
        'pi.id as identifier_id'
      )
      .orderBy('pi.value', 'asc');

    // Return in a format compatible with the existing frontend expectations
    // The frontend currently expects { id, name } where name is the short/display name
    const result = rows.map(r => ({
      id: r.id,
      name: r.short_name || r.name, // Use short_name as primary display name
      full_name: r.name,
      short_name: r.short_name || r.name,
      identifier_id: r.identifier_id
    }));

    res.json(result);
  } catch (err) {
    console.error('Hiba a partners-by-role lekérdezésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

module.exports = router;
