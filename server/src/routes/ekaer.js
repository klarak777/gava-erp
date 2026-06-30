const express = require('express');
const router = express.Router();
const db = require('../db/db');
const path = require('path');
const fs = require('fs');
const mammoth = require('mammoth');

// Helper: Windows hálózati útvonal → Docker/Linux útvonal feloldása
function resolveFilePath(filePath) {
  const raktarPath = process.env.RAKTAR_PATH || '\\\\192.168.1.5\\raktar';
  if (!filePath) return filePath;

  const normalizedFilePath = filePath.replace(/\\/g, '/');

  // Ha a Docker/Linux útvonal van az adatbázisban (/mnt/raktar), de mi Windows-on futunk
  if (normalizedFilePath.startsWith('/mnt/raktar/')) {
    return path.join(raktarPath, normalizedFilePath.replace('/mnt/raktar/', ''));
  }

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

// GET /api/v1/ekaer-records - Lekéri az összes EKAER bejegyzést a szükséges csatolt adatokkal
router.get('/', async (req, res) => {
  try {
    const records = await db('ekaer_records')
      .join('shipments', 'ekaer_records.shipment_id', 'shipments.id')
      .join('seasons', 'ekaer_records.season_id', 'seasons.id')
      .join('transporters', 'ekaer_records.transporter_id', 'transporters.id')
      .select(
        'ekaer_records.id',
        'ekaer_records.ekaer_file_name',
        'ekaer_records.file_path',
        'ekaer_records.file_date',
        'ekaer_records.load_date as record_load_date',
        'shipments.loading_date as shipment_loading_date',
        'shipments.order_number',
        'seasons.code as season_code',
        'transporters.name as transporter_name',
        'ekaer_records.is_sent'
      )
      .orderBy('ekaer_records.id', 'desc');

    // A frontend számára könnyebben feldolgozható formátumra alakítjuk
    const formattedRecords = records.map(record => {
      // Dátum kiválasztása: file_date > record_load_date > shipment_loading_date
      let rawDate = record.file_date || record.record_load_date || record.shipment_loading_date;
      let formattedDate = '';
      if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          formattedDate = `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')}.`;
        }
      }

      return {
        id: record.id,
        docName: record.ekaer_file_name || '-',
        filePath: record.file_path || null,
        date: formattedDate || '-',
        tour: record.order_number || '-',
        transporter: record.transporter_name || '-',
        sent: !!record.is_sent,
        season: record.season_code || '-'
      };
    });

    res.json({
      status: 'success',
      results: formattedRecords.length,
      data: {
        ekaer_records: formattedRecords
      }
    });
  } catch (error) {
    console.error('Hiba az EKAER bejegyzések lekérdezésekor:', error);
    res.status(500).json({
      status: 'error',
      message: 'Szerverhiba az EKAER bejegyzések lekérdezésekor'
    });
  }
});

// GET /api/v1/ekaer-records/:id/preview - DOCX előnézet HTML-ként (Mammoth.js)
router.get('/:id/preview', async (req, res) => {
  try {
    const { id } = req.params;
    const record = await db('ekaer_records').where({ id }).first();

    if (!record) {
      return res.status(404).json({ status: 'error', message: 'EKAER rekord nem található' });
    }

    const filePath = record.file_path;
    if (!filePath) {
      return res.status(404).json({ status: 'error', message: 'Ehhez az EKAER bejegyzéshez nincs fájl elérési út rögzítve.' });
    }

    let resolvedPath = resolveFilePath(filePath);

    if (!fs.existsSync(resolvedPath)) {
      // 1. Fallback: Hátha csak egy " OK" utótag lett utólag hozzáfűzve a mappához, VAGY a fájlnévben lettek szóközök
      const pathInfo = path.parse(resolvedPath);
      const parentDir = path.dirname(resolvedPath);
      const parentDirName = path.basename(parentDir);
      
      let foundAlternative = false;

      const checkDirectoryForDocx = async (dirPath) => {
        if (fs.existsSync(dirPath)) {
          const files = fs.readdirSync(dirPath);
          const docxFiles = files.filter(f => f.endsWith('.docx') && !f.startsWith('~$'));
          if (docxFiles.length === 1) {
            resolvedPath = path.join(dirPath, docxFiles[0]);
            await db('ekaer_records').where({ id }).update({ file_path: resolvedPath });
            return true;
          }
        }
        return false;
      };

      if (fs.existsSync(parentDir)) {
        foundAlternative = await checkDirectoryForDocx(parentDir);
      }
      
      if (!foundAlternative && !parentDirName.endsWith(' OK')) {
        const okDir = path.join(path.dirname(parentDir), parentDirName + ' OK');
        const okResolvedPath = path.join(okDir, pathInfo.base);
        if (fs.existsSync(okResolvedPath)) {
          resolvedPath = okResolvedPath;
          await db('ekaer_records').where({ id }).update({ file_path: resolvedPath });
          foundAlternative = true;
        } else {
          foundAlternative = await checkDirectoryForDocx(okDir);
        }
      }
    }

    if (!fs.existsSync(resolvedPath)) {
      // Fallback: próbáljuk meg dinamikusan generálni a helyes útvonalat
      const shipment = await db('shipments')
        .leftJoin('seasons', 'shipments.season_id', 'seasons.id')
        .where('shipments.id', record.shipment_id)
        .select('shipments.order_number', 'shipments.plate_number', 'seasons.code as season_code')
        .first();

      if (shipment) {
        const { generateEkaerPath } = require('../config/transporterConfig');
        const seasonCode = shipment.season_code || '24-25';
        const safeOrderNum = (shipment.order_number || '').replace(/\//g, '-').replace(/[\\:*?"<>|]/g, '');
        
        let generated = generateEkaerPath(seasonCode, safeOrderNum, shipment.plate_number || 'UNKNOWN', process.env.RAKTAR_PATH);
        let checkPath = resolveFilePath(generated.filePath);
        if (generated && !fs.existsSync(checkPath)) {
          generated = generateEkaerPath(seasonCode, safeOrderNum, shipment.plate_number || 'UNKNOWN'); // without env override
          checkPath = resolveFilePath(generated.filePath);
        }

        if (generated) {
          // Ha az alapértelmezett (pl. H200) útvonal nem létezik, próbáljuk meg az " OK" (pl. H200 OK) kiegészítéssel
          let okCheckPath = generated.filePath.replace(`\\${safeOrderNum}\\`, `\\${safeOrderNum} OK\\`).replace(`/${safeOrderNum}/`, `/${safeOrderNum} OK/`);
          okCheckPath = resolveFilePath(okCheckPath);
          
          if (fs.existsSync(checkPath)) {
            resolvedPath = checkPath;
            await db('ekaer_records').where({ id }).update({ file_path: resolvedPath });
          } else if (fs.existsSync(okCheckPath)) {
            resolvedPath = okCheckPath;
            await db('ekaer_records').where({ id }).update({ file_path: resolvedPath });
          }
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
      fileName: record.ekaer_file_name || path.basename(resolvedPath)
    });
  } catch (error) {
    console.error('Hiba az EKAER előnézetének generálásakor:', error);
    res.status(500).json({
      status: 'error',
      message: 'Szerverhiba az előnézet generálásakor: ' + error.message
    });
  }
});

// GET /api/v1/ekaer-records/:id/download - DOCX fájl letöltése
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const record = await db('ekaer_records').where({ id }).first();

    if (!record) {
      return res.status(404).json({ status: 'error', message: 'EKAER rekord nem található' });
    }

    const filePath = record.file_path;
    if (!filePath) {
      return res.status(404).json({ status: 'error', message: 'Ehhez az EKAER bejegyzéshez nincs fájl elérési út rögzítve.' });
    }

    let resolvedPath = resolveFilePath(filePath);

    if (!fs.existsSync(resolvedPath)) {
      // 1. Fallback: Hátha csak egy " OK" utótag lett utólag hozzáfűzve a mappához, VAGY a fájlnévben lettek szóközök
      const pathInfo = path.parse(resolvedPath);
      const parentDir = path.dirname(resolvedPath);
      const parentDirName = path.basename(parentDir);
      
      let foundAlternative = false;

      // Segédfüggvény a mappa tartalmának ellenőrzésére
      const checkDirectoryForDocx = async (dirPath) => {
        console.log('[EKAER DOWNLOAD] checkDirectoryForDocx hívva erre:', dirPath);
        if (fs.existsSync(dirPath)) {
          const files = fs.readdirSync(dirPath);
          console.log('[EKAER DOWNLOAD] Mappa tartalma:', files);
          const docxFiles = files.filter(f => f.endsWith('.docx') && !f.startsWith('~$')); // Ignoráljuk a temp fájlokat
          console.log('[EKAER DOWNLOAD] Szűrt docx fájlok:', docxFiles);
          if (docxFiles.length === 1) {
            resolvedPath = path.join(dirPath, docxFiles[0]);
            console.log('[EKAER DOWNLOAD] resolvedPath frissítve:', resolvedPath);
            await db('ekaer_records').where({ id }).update({ file_path: resolvedPath });
            return true;
          }
        } else {
          console.log('[EKAER DOWNLOAD] Mappa NEM létezik:', dirPath);
        }
        return false;
      };

      // Először megnézzük az eredeti mappában, hátha csak a fájlnév változott
      console.log('[EKAER DOWNLOAD] Eredeti mappa ellenőrzése:', parentDir);
      if (fs.existsSync(parentDir)) {
        foundAlternative = await checkDirectoryForDocx(parentDir);
      }
      
      // Ha nem találtuk az eredeti mappában, és az eredeti mappa nem " OK"-ra végződik, akkor megnézzük az " OK"-s mappát
      if (!foundAlternative && !parentDirName.endsWith(' OK')) {
        const okDir = path.join(path.dirname(parentDir), parentDirName + ' OK');
        console.log('[EKAER DOWNLOAD] OK mappa ellenőrzése:', okDir);
        // Itt is először a pontos fájlnévvel próbálkozunk
        const okResolvedPath = path.join(okDir, pathInfo.base);
        if (fs.existsSync(okResolvedPath)) {
          console.log('[EKAER DOWNLOAD] Pontos fájl megtalálva OK mappában:', okResolvedPath);
          resolvedPath = okResolvedPath;
          await db('ekaer_records').where({ id }).update({ file_path: resolvedPath });
          foundAlternative = true;
        } else {
          // Ha pontos névvel nem lett meg, megnézzük van-e benne .docx
          console.log('[EKAER DOWNLOAD] Pontos fájl nincs az OK mappában, megnézzük a tartalmat...');
          foundAlternative = await checkDirectoryForDocx(okDir);
        }
      }
      console.log('[EKAER DOWNLOAD] Fallback 1 eredmény:', foundAlternative, ' Új resolvedPath:', resolvedPath);
    }

    if (!fs.existsSync(resolvedPath)) {
      // 2. Fallback: próbáljuk meg dinamikusan generálni a helyes útvonalat
      const shipment = await db('shipments')
        .leftJoin('seasons', 'shipments.season_id', 'seasons.id')
        .where('shipments.id', record.shipment_id)
        .select('shipments.order_number', 'shipments.plate_number', 'seasons.code as season_code')
        .first();

      if (shipment) {
        const { generateEkaerPath } = require('../config/transporterConfig');
        const seasonCode = shipment.season_code || '24-25';
        const safeOrderNum = (shipment.order_number || '').replace(/\//g, '-').replace(/[\\:*?"<>|]/g, '');
        
        let generated = generateEkaerPath(seasonCode, safeOrderNum, shipment.plate_number || 'UNKNOWN', process.env.RAKTAR_PATH);
        let checkPath = resolveFilePath(generated.filePath);
        if (generated && !fs.existsSync(checkPath)) {
          generated = generateEkaerPath(seasonCode, safeOrderNum, shipment.plate_number || 'UNKNOWN'); // without env override
          checkPath = resolveFilePath(generated.filePath);
        }

        if (generated) {
          let okCheckPath = generated.filePath.replace(`\\${safeOrderNum}\\`, `\\${safeOrderNum} OK\\`).replace(`/${safeOrderNum}/`, `/${safeOrderNum} OK/`);
          okCheckPath = resolveFilePath(okCheckPath);
          
          if (fs.existsSync(checkPath)) {
            resolvedPath = checkPath;
            await db('ekaer_records').where({ id }).update({ file_path: resolvedPath });
          } else if (fs.existsSync(okCheckPath)) {
            resolvedPath = okCheckPath;
            await db('ekaer_records').where({ id }).update({ file_path: resolvedPath });
          }
        }
      }
    }

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({
        status: 'error',
        message: `A dokumentum fájl nem található a szerveren.\nElérési út: ${resolvedPath}`
      });
    }

    const fileName = record.ekaer_file_name || path.basename(resolvedPath);
    const safeFileName = fileName.endsWith('.docx') ? fileName : fileName + '.docx';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeFileName)}"`);
    res.setHeader('Content-Length', fs.statSync(resolvedPath).size);

    const fileStream = fs.createReadStream(resolvedPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Hiba az EKAER letöltésekor:', error);
    res.status(500).json({
      status: 'error',
      message: 'Szerverhiba a letöltés során: ' + error.message
    });
  }
});

// PUT /api/v1/ekaer-records/:id - Egy bejegyzés státuszának (pl. is_sent) frissítése
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { is_sent } = req.body;

    const updateData = {};
    if (is_sent !== undefined) updateData.is_sent = is_sent;
    updateData.updated_at = db.fn.now();

    const affected = await db('ekaer_records')
      .where({ id })
      .update(updateData)
      .returning('*');

    if (affected.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: 'Az EKAER bejegyzés nem található'
      });
    }

    res.json({
      status: 'success',
      data: {
        ekaer_record: affected[0]
      }
    });
  } catch (error) {
    console.error('Hiba az EKAER bejegyzés frissítésekor:', error);
    res.status(500).json({
      status: 'error',
      message: 'Szerverhiba az EKAER bejegyzés frissítésekor'
    });
  }
});

module.exports = router;



// DELETE /api/v1/ekaer-records/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../config/db');
    const deleted = await db('ekaer_records').where({ id }).del();
    if (deleted) { res.json({ status: 'success' }); } else { res.status(404).json({ status: 'error', message: 'Not found' }); }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});
