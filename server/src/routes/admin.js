const express = require('express');
const router = express.Router();
const db = require('../db/db');

// GET /api/v1/admin/export-identifiers
router.get('/export-identifiers', async (req, res) => {
    try {
        const data = await db('partner_identifiers')
            .join('partners', 'partner_identifiers.partner_id', 'partners.id')
            .where('partner_identifiers.is_inactive', false)
            .select('partners.name as partner_name', 'partner_identifiers.id_type', 'partner_identifiers.value')
            .orderBy('partners.name', 'asc');
        
        res.setHeader('Content-disposition', 'attachment; filename=active_identifiers_export.json');
        res.setHeader('Content-type', 'application/json');
        res.send(JSON.stringify(data, null, 2));
    } catch (err) {
        res.status(500).json({ error: 'Szerverhiba' });
    }
});

// GET /api/v1/admin/pallet-labels
router.get('/pallet-labels', async (req, res) => {
  try {
    const labels = await db('sscc_labels as s')
      .leftJoin('aldi_commission_lines as c', 'c.id', 's.commission_line_id')
      .leftJoin('ref_packaging_types as p', 'p.name', 'c.pallet_type')
      .where('s.is_provisional', false)
      .select(
        's.id', 's.created_at', 's.sscc', 's.truck_number', 's.product_name',
        's.picked_cartons', 's.supplier', 's.destination', 's.origin_country',
        's.pallets_json', 's.location_name', 's.delivery_date',
        's.gross_weight', 's.net_weight', 's.lot_number',
        's.consolidated_sscc', 's.is_consolidated_master',
        'c.pallets_json as commission_pallets_json',
        'p.name as legacy_pallet_name', 'p.category as legacy_pallet_category',
        'p.tare_weight_kg as legacy_pallet_tare_weight_kg'
      )
      // Összeemelés csoportok egymás mellé: mester és tagok együtt, azon belül id DESC
      .orderByRaw(`
        COALESCE(s.consolidated_sscc, s.sscc) DESC,
        s.is_consolidated_master DESC,
        s.id DESC
      `);
    res.json(labels);
  } catch (err) {
    console.error('Hiba a raklapcímkék lekérésekor:', err);
    res.status(500).json({ error: 'Hiba a raklapcímkék lekérdezésekor.' });
  }
});


// Engedélyezett táblák a generic végpontokhoz biztonsági okokból
const ALLOWED_TABLES = ['products', 'partners', 'transporters', 'finance_truck_types', 'finance_tax_rates', 'currencies', 'ref_packaging_types', 'ref_origin_countries', 'ref_pallet_types', 'printers'];

// GET /api/v1/admin/:table
router.get('/:table', async (req, res) => {
  const table = req.params.table;
  if (!ALLOWED_TABLES.includes(table)) {
    return res.status(400).json({ error: 'Érvénytelen tábla.' });
  }

  try {
    const query = db(table).orderBy('id', 'asc');
    if (!['finance_tax_rates', 'currencies'].includes(table)) {
        query.where('is_active', true);
    }
    
    // Opcionális szűrés (pl. ?type=vevő)
    if (req.query.type && table === 'partners') {
      query.where('type', req.query.type);
    }

    const data = await query;
    res.json(data);
  } catch (err) {
    console.error(`Hiba a(z) ${table} lekérdezésekor:`, err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

// POST /api/v1/admin/:table
router.post('/:table', async (req, res) => {
  const table = req.params.table;
  if (!ALLOWED_TABLES.includes(table)) {
    return res.status(400).json({ error: 'Érvénytelen tábla.' });
  }

  try {
    const payload = req.body;
    const [insertedId] = await db(table).insert(payload).returning('id');
    const newRecord = await db(table).where('id', insertedId?.id || insertedId).first();

    // Ha új fuvarozót adunk hozzá, automatikusan létrehozzuk a 25-26-os ERP Fuvarm almappát
    if (table === 'transporters' && newRecord && newRecord.name) {
      try {
        const path = require('path');
        const fs = require('fs');
        const { getFolderName } = require('../config/transporterConfig');
        const raktarPath = process.env.RAKTAR_PATH || '\\\\192.168.1.5\\raktar';
        const folderName = getFolderName(newRecord.name, '25-26') || newRecord.name;
        const newFolderPath = path.join(raktarPath, 'MI Teszt', 'ERP Fuvarm', '25-26', folderName);
        if (!fs.existsSync(newFolderPath)) {
          fs.mkdirSync(newFolderPath, { recursive: true });
          console.log(`[Admin] Új fuvarozó mappa létrehozva: ${newFolderPath}`);
        }
      } catch (folderErr) {
        // Mappa létrehozási hiba nem akadályozza meg a sikeres választ
        console.error('[Admin] Fuvarozó mappa létrehozási hiba:', folderErr.message);
      }
    }

    res.status(201).json(newRecord);
  } catch (err) {
    console.error(`Hiba a(z) ${table} beszúrásakor:`, err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});


// PUT /api/v1/admin/:table/:id
router.put('/:table/:id', async (req, res) => {
  const table = req.params.table;
  const id = req.params.id;
  if (!ALLOWED_TABLES.includes(table)) {
    return res.status(400).json({ error: 'Érvénytelen tábla.' });
  }

  try {
    const payload = req.body;
    
    // Partner szerkesztésénél a frontend `full_name` mezőt küld a partner nevére
    if (table === 'partners') {
        if (payload.full_name !== undefined) {
            payload.name = payload.full_name;
            delete payload.full_name;
        }
        if (payload.short_name !== undefined) {
            delete payload.short_name;
        }
    }
    
    await db(table).where('id', id).update(payload);
    const updatedRecord = await db(table).where('id', id).first();
    res.json(updatedRecord);
  } catch (err) {
    console.error(`Hiba a(z) ${table} módosításakor:`, err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

// DELETE /api/v1/admin/:table/:id
router.delete('/:table/:id', async (req, res) => {
  const table = req.params.table;
  const id = req.params.id;
  if (!ALLOWED_TABLES.includes(table)) {
    return res.status(400).json({ error: 'Érvénytelen tábla.' });
  }

  try {
    await db(table).where('id', id).update({ is_active: false });
    res.json({ success: true });
  } catch (err) {
    console.error(`Hiba a(z) ${table} törlésekor:`, err);
    res.status(500).json({ error: 'Belső szerverhiba (lehet, hogy más adatok hivatkoznak erre)' });
  }
});

module.exports = router;
