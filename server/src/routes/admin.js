const express = require('express');
const router = express.Router();
const db = require('../db/db');

// Engedélyezett táblák a generic végpontokhoz biztonsági okokból
const ALLOWED_TABLES = ['products', 'partners', 'transporters'];

// GET /api/v1/admin/:table
router.get('/:table', async (req, res) => {
  const table = req.params.table;
  if (!ALLOWED_TABLES.includes(table)) {
    return res.status(400).json({ error: 'Érvénytelen tábla.' });
  }

  try {
    const query = db(table).where('is_active', true).orderBy('id', 'asc');
    
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
