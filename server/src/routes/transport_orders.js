const express = require('express');
const router = express.Router();
const db = require('../db/db');
const path = require('path');
const fs = require('fs');
const mammoth = require('mammoth');

// Helper: Windows hálózati útvonal → Docker/Linux útvonal feloldása
function resolveFilePath(filePath) {
  const raktarPath = process.env.RAKTAR_PATH;
  if (!raktarPath || !filePath) return filePath;

  const normalizedFilePath = filePath.replace(/\\/g, '/');
  const raktarPrefixPatterns = [
    /^\/\/192\.168\.\d+\.\d+\/raktar\//i,
    /^\\\\192\.168\.\d+\.\d+\\raktar\\/i,
    /^[A-Z]:\\raktar\\/i,
  ];
  for (const pattern of raktarPrefixPatterns) {
    if (pattern.test(filePath) || pattern.test(normalizedFilePath)) {
      return path.join(raktarPath, normalizedFilePath.replace(pattern, ''));
    }
  }
  if (normalizedFilePath.includes('/MI Teszt/')) {
    const idx = normalizedFilePath.indexOf('/MI Teszt/');
    return path.join(raktarPath, normalizedFilePath.substring(idx));
  }
  if (normalizedFilePath.includes('MI Teszt')) {
    const idx = normalizedFilePath.indexOf('MI Teszt');
    return path.join(raktarPath, normalizedFilePath.substring(idx));
  }
  return filePath;
}

// GET /api/v1/transport-orders - Lekéri az összes fuvarmegbízást a szükséges csatolt adatokkal
router.get('/', async (req, res) => {
  try {
    const orders = await db('transport_orders')
      .join('shipments', 'transport_orders.shipment_id', 'shipments.id')
      .join('seasons', 'transport_orders.season_id', 'seasons.id')
      .join('transporters', 'transport_orders.transporter_id', 'transporters.id')
      .select(
        'transport_orders.id',
        'transport_orders.document_name',
        'transport_orders.file_path',
        'transport_orders.file_date',
        'transport_orders.loading_date as order_loading_date',
        'shipments.loading_date as shipment_loading_date',
        'shipments.order_number',
        'seasons.code as season_code',
        'transporters.name as transporter_name',
        'transport_orders.is_sent'
      )
      .orderBy('transport_orders.id', 'desc');

    // A frontend számára könnyebben feldolgozható formátumra alakítjuk
    const formattedOrders = orders.map(order => {
      // Dátum kiválasztása: file_date > order_loading_date > shipment_loading_date
      let rawDate = order.file_date || order.order_loading_date || order.shipment_loading_date;
      let formattedDate = '';
      if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          formattedDate = `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')}.`;
        }
      }

      return {
        id: order.id,
        docName: order.document_name || '-',
        filePath: order.file_path || null,
        date: formattedDate || '-',
        tour: order.order_number || '-',
        transporter: order.transporter_name || '-',
        sent: !!order.is_sent,
        season: order.season_code || '-'
      };
    });

    res.json({
      status: 'success',
      results: formattedOrders.length,
      data: {
        transport_orders: formattedOrders
      }
    });
  } catch (error) {
    console.error('Hiba a fuvarmegbízások lekérdezésekor:', error);
    res.status(500).json({
      status: 'error',
      message: 'Szerverhiba a fuvarmegbízások lekérdezésekor'
    });
  }
});

// GET /api/v1/transport-orders/:id/preview - DOCX előnézet HTML-ként (Mammoth.js)
router.get('/:id/preview', async (req, res) => {
  try {
    const { id } = req.params;
    const record = await db('transport_orders').where({ id }).first();

    if (!record) {
      return res.status(404).json({ status: 'error', message: 'Fuvarmegbízás nem található' });
    }

    const filePath = record.file_path;
    if (!filePath) {
      return res.status(404).json({ status: 'error', message: 'Ehhez a fuvarmegbízáshoz nincs fájl elérési út rögzítve.' });
    }

    // Docker-ben a RAKTAR_PATH env. változóval lehet felülírni a Windows hálózati útvonalat
    const raktarPath = process.env.RAKTAR_PATH;
    let resolvedPath = filePath;

    // Ha a fájl elérési útja Windows hálózati meghajtóra mutat (\\192.168.1.5\raktar\...)
    // és a Docker-konténerben RAKTAR_PATH van beállítva (/mnt/raktar), akkor cseréljük le
    if (raktarPath && filePath) {
      // Normalizáljuk a path szeparátorokat
      const normalizedFilePath = filePath.replace(/\\/g, '/');
      // Keresünk egy tipikus raktar prefix-et a pathban
      const raktarPrefixPatterns = [
        /^\/\/192\.168\.\d+\.\d+\/raktar\//i,
        /^\\\\192\.168\.\d+\.\d+\\raktar\\/i,
        /^[A-Z]:\\raktar\\/i,
      ];
      let replaced = false;
      for (const pattern of raktarPrefixPatterns) {
        if (pattern.test(filePath) || pattern.test(normalizedFilePath)) {
          resolvedPath = path.join(raktarPath, normalizedFilePath.replace(pattern, ''));
          replaced = true;
          break;
        }
      }
      // Ha nem sikerült prefix-alapon cserélni, de a RAKTAR_PATH be van állítva,
      // próbálkozzunk azzal, hogy kivágunk minden "/MI Teszt/" előtti részt
      if (!replaced && normalizedFilePath.includes('/MI Teszt/')) {
        const idx = normalizedFilePath.indexOf('/MI Teszt/');
        resolvedPath = path.join(raktarPath, normalizedFilePath.substring(idx));
      } else if (!replaced && normalizedFilePath.includes('MI Teszt')) {
        const idx = normalizedFilePath.indexOf('MI Teszt');
        resolvedPath = path.join(raktarPath, normalizedFilePath.substring(idx));
      }
    }

    if (!fs.existsSync(resolvedPath)) {
      // Fallback: próbáljuk meg dinamikusan generálni a helyes útvonalat
      const shipment = await db('shipments')
        .leftJoin('seasons', 'shipments.season_id', 'seasons.id')
        .leftJoin('transporters', 'shipments.transporter_id', 'transporters.id')
        .where('shipments.id', record.shipment_id)
        .select('shipments.order_number', 'seasons.code as season_code', 'transporters.name as transporter_name')
        .first();

      if (shipment) {
        const { generateTransportOrderPath } = require('../config/transporterConfig');
        const seasonCode = shipment.season_code || '24-25';
        const safeOrderNum = (shipment.order_number || '').replace(/\//g, '-').replace(/[\\:*?"<>|]/g, '');
        
        let generated = generateTransportOrderPath(seasonCode, shipment.transporter_name, safeOrderNum, process.env.RAKTAR_PATH);
        let checkPath = resolveFilePath(generated.filePath);
        if (!fs.existsSync(checkPath)) {
          generated = generateTransportOrderPath(seasonCode, shipment.transporter_name, safeOrderNum); // without env override
          checkPath = resolveFilePath(generated.filePath);
        }

        if (fs.existsSync(checkPath)) {
          resolvedPath = checkPath;
          await db('transport_orders').where({ id }).update({ file_path: resolvedPath });
        }
      }
    }

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({
        status: 'error',
        message: `A dokumentum fájl nem található a szerveren.\nElérési út: ${resolvedPath}`
      });
    }

    const result = await mammoth.convertToHtml({ path: resolvedPath });
    res.json({
      status: 'success',
      html: result.value,
      messages: result.messages,
      fileName: record.document_name || path.basename(resolvedPath)
    });
  } catch (error) {
    console.error('Hiba a fuvarmegbízás előnézetének generálásakor:', error);
    res.status(500).json({
      status: 'error',
      message: 'Szerverhiba az előnézet generálásakor: ' + error.message
    });
  }
});

// GET /api/v1/transport-orders/:id/download - DOCX fájl letöltése
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const record = await db('transport_orders').where({ id }).first();

    if (!record) {
      return res.status(404).json({ status: 'error', message: 'Fuvarmegbízás nem található' });
    }

    const filePath = record.file_path;
    if (!filePath) {
      return res.status(404).json({ status: 'error', message: 'Ehhez a fuvarmegbízáshoz nincs fájl elérési út rögzítve.' });
    }

    const raktarPath = process.env.RAKTAR_PATH;
    let resolvedPath = filePath;

    if (raktarPath && filePath) {
      const normalizedFilePath = filePath.replace(/\\/g, '/');
      const raktarPrefixPatterns = [
        /^\/\/192\.168\.\d+\.\d+\/raktar\//i,
        /^\\\\192\.168\.\d+\.\d+\\raktar\\/i,
        /^[A-Z]:\\raktar\\/i,
      ];
      let replaced = false;
      for (const pattern of raktarPrefixPatterns) {
        if (pattern.test(filePath) || pattern.test(normalizedFilePath)) {
          resolvedPath = path.join(raktarPath, normalizedFilePath.replace(pattern, ''));
          replaced = true;
          break;
        }
      }
      if (!replaced && normalizedFilePath.includes('/MI Teszt/')) {
        const idx = normalizedFilePath.indexOf('/MI Teszt/');
        resolvedPath = path.join(raktarPath, normalizedFilePath.substring(idx));
      } else if (!replaced && normalizedFilePath.includes('MI Teszt')) {
        const idx = normalizedFilePath.indexOf('MI Teszt');
        resolvedPath = path.join(raktarPath, normalizedFilePath.substring(idx));
      }
    }

    if (!fs.existsSync(resolvedPath)) {
      // Fallback: próbáljuk meg dinamikusan generálni a helyes útvonalat
      const shipment = await db('shipments')
        .leftJoin('seasons', 'shipments.season_id', 'seasons.id')
        .leftJoin('transporters', 'shipments.transporter_id', 'transporters.id')
        .where('shipments.id', record.shipment_id)
        .select('shipments.order_number', 'seasons.code as season_code', 'transporters.name as transporter_name')
        .first();

      if (shipment) {
        const { generateTransportOrderPath } = require('../config/transporterConfig');
        const seasonCode = shipment.season_code || '24-25';
        const safeOrderNum = (shipment.order_number || '').replace(/\//g, '-').replace(/[\\:*?"<>|]/g, '');
        
        let generated = generateTransportOrderPath(seasonCode, shipment.transporter_name, safeOrderNum, process.env.RAKTAR_PATH);
        let checkPath = resolveFilePath(generated.filePath);
        if (!fs.existsSync(checkPath)) {
          generated = generateTransportOrderPath(seasonCode, shipment.transporter_name, safeOrderNum); // without env override
          checkPath = resolveFilePath(generated.filePath);
        }

        if (fs.existsSync(checkPath)) {
          resolvedPath = checkPath;
          await db('transport_orders').where({ id }).update({ file_path: resolvedPath });
        }
      }
    }

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({
        status: 'error',
        message: `A dokumentum fájl nem található a szerveren.\nElérési út: ${resolvedPath}`
      });
    }

    const fileName = record.document_name || path.basename(resolvedPath);
    const safeFileName = fileName.endsWith('.docx') ? fileName : fileName + '.docx';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeFileName)}"`);
    res.setHeader('Content-Length', fs.statSync(resolvedPath).size);

    const fileStream = fs.createReadStream(resolvedPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Hiba a fuvarmegbízás letöltésekor:', error);
    res.status(500).json({
      status: 'error',
      message: 'Szerverhiba a letöltés során: ' + error.message
    });
  }
});

// PUT /api/v1/transport-orders/:id - Egy megbízás státuszának (pl. is_sent) frissítése
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { is_sent } = req.body;

    const updateData = {};
    if (is_sent !== undefined) updateData.is_sent = is_sent;
    updateData.updated_at = db.fn.now();

    const affected = await db('transport_orders')
      .where({ id })
      .update(updateData)
      .returning('*');

    if (affected.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: 'A fuvarmegbízás nem található'
      });
    }

    res.json({
      status: 'success',
      data: {
        transport_order: affected[0]
      }
    });
  } catch (error) {
    console.error('Hiba a fuvarmegbízás frissítésekor:', error);
    res.status(500).json({
      status: 'error',
      message: 'Szerverhiba a fuvarmegbízás frissítésekor'
    });
  }
});

module.exports = router;



// DELETE /api/v1/transport-orders/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../config/db');
    const deleted = await db('transport_orders').where({ id }).del();
    if (deleted) { res.json({ status: 'success' }); } else { res.status(404).json({ status: 'error', message: 'Not found' }); }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});
