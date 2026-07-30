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

// ============================================================
// Jóváhagyott (aktív) partnerek listája szerepkörönként CSV alapján
// Csak ezek fognak megjelenni a legördülőkben.
// ============================================================
const ALLOWED_REFERENCES = new Set([
  'AGRONERVION', 'AGROPONIENTE', 'AGROPONIENTE NATURAL', 'AGROPONIENTE NIJAR', 
  'ANTON DÜRBECK', 'ANTON DURBECK', 'AXARFRUIT', 'BERTIPACK', 'BILEK', 'CASAS ROYES',
  'CASI', 'CASI AEROPORTO', 'CASI AIRPORT', 'CASI PARTIDORES', 'CLARA', 'COMPAGRI', 
  'CORD', 'CRETAN ROOT', 'DELGAFRUITS', 'DG69', 'ECOINVER BIO', 'ESCOBAR', 
  'ESCOFRESH', 'ESMAR', 'EUROGROUP DEUTSCHLAND', 'EUROGROUP ESPANA', 'EXOTIC FRESH', 
  'EXPOALMA', 'FA. DE JONG', 'FARAON', 'FRANIAL', 'FRESSAN', 'FRUBALMED', 
  'FRUTAS GAVA', 'GALLARDO', 'GAVA', 'GAVA POLSKA', 'GEMÜSERING', 'GEMUSERING', 
  'GLOBAL BERRY', 'GREEN QUALITY', 'GREENCOOP', 'GREENYARD', 'GYÜMÖLCSÉRT', 
  'IDEAL FRUITS', 'KOMPAGRI', 'KONYA', 'KÓNYA', 'KOPALMERIA', 'KOPFSALAT', 'KUSEK', 
  'LA CALIFORNIA', 'LEHMANN & TROOST', 'LEVENTE', 'MALENO', 'MALENO Y TORRES', 
  'MANDERSLOOT', 'NATURINDA', 'NATURNAR', 'OLASO', 'OLYMPIC FRUIT', 'R&M', 
  'ROMANIA', 'SAN NICOLA', 'SENOR TOMATE', 'SHEBA', 'SMART', 'SOLHERBS', 
  'SPAR HU', 'SYLVAN', 'TOMATO-AL', 'VEGACANADA', 'VERMION', 'WRAPPING'
].map(s => s.toUpperCase()));

const ALLOWED_CUSTOMERS = new Set([
  'ALDI AT', 'ANTON DÜRBECK', 'ANTON DURBECK', 'BILEK', 'CASAS ROYES', 'CORD', 
  'CRETAN ROOT', 'DG69', 'EUROGROUP DEUTSCHLAND', 'EUROGROUP ESPANA', 'EXOTIC FRESH', 
  'FRUBALMED', 'GAVA', 'GEMÜSERING', 'GEMUSERING', 'GHU', 'GLOBAL BERRY', 
  'GREENCOOP', 'GREENYARD', 'GYÜMÖLCSÉRT', 'HOFER', 'IDEAL FRUITS', 'KONYA', 'KÓNYA', 
  'KOPFSALAT', 'KV LOGISTIKA', 'LEHMANN & TROOST', 'LEVENTE', 'MANDERSLOOT', 
  'OLYMPIC FRUIT', 'R&M', 'ROMANIA', 'SAN NICOLA', 'SPAR HU', 'SYLVAN', 'VILLAFRUT'
].map(s => s.toUpperCase()));

const ALLOWED_TRANSPORTERS = new Set([
  'ALL FRESH', 'BILEK', 'BOGNÁR', 'BUGYI FERENC', 'BVT', 'CRETAN ROOT',
  'DERBY', 'ESKADA', 'FARAON', 'FER TRANS', 'FRIGOSPED', 'FRUBALMED',
  'FRUCTUS', 'FUSTER', 'GAVA', 'GAVA POLSKA', 'HANKA', 'HILLTOP', 'HZ',
  'KERMOR', 'KÓNYA', 'KUSEK', 'KV LOG', 'LIVIU', 'LOGISTICHOME',
  'MANDERSLOOT', 'MESAVERDE', 'MÜLLER', 'NH CARGO', 'PAP JÓZSEFNÉ',
  'PET-IMPEX', 'RAINBOW', 'RENACRIS', 'RONI', 'SHEBA', 'STI',
  'S-TRANSPORT', 'SWISS', 'SZÉKESI', 'THERMO FRUCHT', 'TÓTH FRIGO',
  'TRANS-SPED', 'VERMION'
].map(s => s.toUpperCase()));

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
      .andWhere(function() {
        this.where('pi.is_inactive', false).orWhereNull('pi.is_inactive');
      })
      .select(
        'p.id as id',
        'p.name as name',
        'pi.value as short_name'
      )
      .orderBy('pi.value', 'asc');

    // Return in a format compatible with the existing frontend expectations
    // The frontend currently expects { id, name } where name is the short/display name
    let result = rows.map(r => ({
      id: r.id,
      name: r.short_name || r.name, // Use short_name as primary display name
      full_name: r.name,
      short_name: r.short_name || r.name,
    }));

    // Filter by allowed lists
    if (role === 'reference') {
      result = result.filter(r => ALLOWED_REFERENCES.has((r.name || '').toUpperCase().trim()));
    } else if (role === 'customer') {
      result = result.filter(r => ALLOWED_CUSTOMERS.has((r.name || '').toUpperCase().trim()));
    } else if (role === 'transporter') {
      result = result.filter(r => ALLOWED_TRANSPORTERS.has((r.name || '').toUpperCase().trim()));
    }

    res.json(result);
  } catch (err) {
    console.error('Hiba a partners-by-role lekérdezésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

module.exports = router;
