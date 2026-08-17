/**
 * ALDI Heti Árak API Route
 * 
 * Endpoints:
 *   GET    /api/v1/aldi-weekly-prices?year=2026        – Adott év hetei
 *   GET    /api/v1/aldi-weekly-prices/:id/lines        – Egy hét sorai
 *   POST   /api/v1/aldi-weekly-prices/upload           – XLSX feltöltés + parsing
 *   GET    /api/v1/aldi-weekly-prices/:id/lines/:lineId/currency-periods
 *   POST   /api/v1/aldi-weekly-prices/:id/lines/:lineId/currency-periods
 *   DELETE /api/v1/aldi-weekly-prices/:id/lines/:lineId/currency-periods/:cpId
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const db = require('../db/db');

// ─── Konfiguráció ─────────────────────────────────────────────────────────────
const IS_WINDOWS = process.platform === 'win32';

// Hálózati útvonal (Windows: UNC, Linux: mount pont)
const RAKTAR_BASE = process.env.RAKTAR_PATH || (IS_WINDOWS
  ? '\\\\192.168.1.5\\raktar'
  : '/mnt/raktar'
);

const ALDI_BASE_PATH = IS_WINDOWS
  ? path.win32.join(RAKTAR_BASE, 'Aldi', 'ALDI RENDELÉSEK', 'ERP ALDI')
  : path.posix.join(RAKTAR_BASE, 'Aldi', 'ALDI RENDELÉSEK', 'ERP ALDI');

// Multer: memóriában tartja a fájlt a parse-oláshoz
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // max 20 MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') {
      cb(null, true);
    } else {
      cb(new Error('Csak XLSX/XLS fájl töltható fel!'));
    }
  }
});

// ─── Segédfüggvények ─────────────────────────────────────────────────────────

/**
 * Hét szám → KW kód
 * pl. 33 → 'KW33', 5 → 'KW05'
 */
function toWeekCode(weekNum) {
  return `KW${String(weekNum).padStart(2, '0')}`;
}

/**
 * XLSX fejlécből kinyeri a hétszámot
 * pl. "33. HÉT" → 33, "KW33" → 33
 */
function extractWeekNumber(headerText) {
  if (!headerText) return null;
  const match = String(headerText).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Magyar nap-rövidítés alapú dátum parse:
 * "Sze 2026.08.12 - K 2026.08.25" → { start: '2026-08-12', end: '2026-08-25' }
 */
function parseDeliveryPeriod(rawStr) {
  if (!rawStr) return { start: null, end: null };
  const dateRegex = /(\d{4})\.(\d{2})\.(\d{2})/g;
  const matches = [...String(rawStr).matchAll(dateRegex)];
  if (matches.length >= 2) {
    return {
      start: `${matches[0][1]}-${matches[0][2]}-${matches[0][3]}`,
      end: `${matches[1][1]}-${matches[1][2]}-${matches[1][3]}`
    };
  } else if (matches.length === 1) {
    return {
      start: `${matches[0][1]}-${matches[0][2]}-${matches[0][3]}`,
      end: null
    };
  }
  return { start: null, end: null };
}

/**
 * Hálózati mappa elérési útjának összeállítása
 * Windows: UNC (\\...\...\2026\KW33)
 * Linux: /mnt/raktar/.../2026/KW33
 */
function buildNetworkFolderPath(year, weekCode) {
  if (IS_WINDOWS) {
    return path.win32.join(ALDI_BASE_PATH, String(year), weekCode);
  } else {
    return path.posix.join(ALDI_BASE_PATH, String(year), weekCode);
  }
}

// ─── GET /api/v1/aldi-weekly-prices?year=2026 ────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { year } = req.query;
    let query = db('aldi_weekly_prices').orderBy('week_number', 'asc');
    if (year) {
      query = query.where('year', parseInt(year, 10));
    }
    const rows = await query;
    res.json(rows);
  } catch (err) {
    console.error('[aldi-weekly-prices] GET hiba:', err);
    res.status(500).json({ error: 'Szerver hiba', detail: err.message });
  }
});

// ─── GET /api/v1/aldi-weekly-prices/:id/lines ────────────────────────────────
router.get('/:id/lines', async (req, res) => {
  try {
    const { id } = req.params;
    const lines = await db('aldi_weekly_price_lines')
      .leftJoin('chain_products', 'aldi_weekly_price_lines.chain_product_id', 'chain_products.id')
      .where('aldi_weekly_price_lines.weekly_price_id', id)
      .select(
        'aldi_weekly_price_lines.*',
        'chain_products.product_name as erp_product_name',
        'chain_products.article_number as erp_article_number',
        'chain_products.ean as erp_ean'
      )
      .orderBy('aldi_weekly_price_lines.row_order', 'asc');

    const lineIds = lines.map(l => l.id);
    let currencyPeriods = [];
    if (lineIds.length > 0) {
      currencyPeriods = await db('aldi_price_currency_periods')
        .whereIn('price_line_id', lineIds)
        .orderBy('period_start', 'asc');
    }

    lines.forEach(line => {
      line.currency_periods = currencyPeriods.filter(cp => cp.price_line_id === line.id);
    });

    res.json(lines);
  } catch (err) {
    console.error('[aldi-weekly-prices] GET lines hiba:', err);
    res.status(500).json({ error: 'Szerver hiba', detail: err.message });
  }
});

// ─── POST /api/v1/aldi-weekly-prices/upload ──────────────────────────────────
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { year, weekCode, weekNumber } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Nincs feltöltött fájl.' });
    }
    if (!year || !weekCode) {
      return res.status(400).json({ error: 'Év és hét megadása kötelező.' });
    }

    const parsedYear = parseInt(year, 10);
    const parsedWeekNum = parseInt(weekNumber, 10) || extractWeekNumber(weekCode);

    // 1. XLSX parse
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    // Ellenőrizzük a fejléc struktúrát (Row 1 tartalmazza az oszlopneveket)
    const headerRow = rows[1] || [];
    const colMap = {};
    headerRow.forEach((col, idx) => {
      if (col) colMap[String(col).trim()] = idx;
    });

    // Adatsorok: Row 2-től
    const dataRows = rows.slice(2).filter(row => row && row.length > 0 && row.some(cell => cell !== undefined && cell !== ''));

    // 2. Hálózati mappa létrehozása
    const networkFolderPath = buildNetworkFolderPath(parsedYear, weekCode);
    const safeFileName = req.file.originalname.replace(/[<>:"|?*]/g, '_');
    const networkFilePath = IS_WINDOWS
      ? path.win32.join(networkFolderPath, safeFileName)
      : path.posix.join(networkFolderPath, safeFileName);

    let fileWriteSuccess = true;
    let fileWriteError = null;
    try {
      fs.mkdirSync(networkFolderPath, { recursive: true });
      fs.writeFileSync(networkFilePath, req.file.buffer);
      console.log(`[aldi-weekly-prices] Fájl mentve: ${networkFilePath}`);
    } catch (fsErr) {
      fileWriteSuccess = false;
      fileWriteError = fsErr.message;
      console.warn(`[aldi-weekly-prices] Hálózati mentés sikertelen: ${fsErr.message}`);
      // Nem állunk meg – az adatbázisba azért mentjük az adatokat
    }

    // 3. GTIN-ek összegyűjtése batch lookup-hoz
    const gtins = dataRows
      .map(row => row[colMap['Rendelési GTIN']])
      .filter(g => g)
      .map(g => String(g).trim());

    const matchedProducts = gtins.length > 0
      ? await db('chain_products')
          .whereIn('gtin', gtins)
          .whereRaw("LOWER(chain) = 'aldi'")
          .where('is_active', true)
          .select('id', 'gtin', 'product_name', 'article_number', 'ean')
      : [];

    const gtinToProduct = new Map(matchedProducts.map(p => [String(p.gtin).trim(), p]));

    // 4. DB tranzakció: heti fejléc + sorok mentése
    const result = await db.transaction(async trx => {
      // Meglévő hét ellenőrzés/upsert
      let weekRecord = await trx('aldi_weekly_prices')
        .where({ year: parsedYear, week_code: weekCode })
        .first();

      if (weekRecord) {
        // Frissítjük a fájl elérési útját
        await trx('aldi_weekly_prices')
          .where('id', weekRecord.id)
          .update({
            xlsx_file_path: fileWriteSuccess ? networkFilePath : weekRecord.xlsx_file_path,
            network_folder_path: networkFolderPath,
            updated_at: new Date()
          });
      } else {
        // Új hét rekord
        const [inserted] = await trx('aldi_weekly_prices').insert({
          year: parsedYear,
          week_code: weekCode,
          week_number: parsedWeekNum,
          xlsx_file_path: fileWriteSuccess ? networkFilePath : null,
          network_folder_path: networkFolderPath,
        }).returning('*');
        weekRecord = inserted;
      }

      // Töröljük a régi sorokat (újratöltés)
      await trx('aldi_weekly_price_lines')
        .where('weekly_price_id', weekRecord.id)
        .delete();

      // Sorok beszúrása
      const lineInserts = [];
      dataRows.forEach((row, idx) => {
        const gtin = row[colMap['Rendelési GTIN']] !== undefined
          ? String(row[colMap['Rendelési GTIN']]).trim()
          : '';
        const xlsxName = row[colMap['Termék leírása']] !== undefined
          ? String(row[colMap['Termék leírása']]).trim()
          : '';
        const originRaw = row[colMap['Származás']];
        const origin = originRaw !== undefined
          ? String(originRaw).replace(/\r\n/g, ', ').replace(/\n/g, ', ').trim()
          : '';
        const deliveryRaw = row[colMap['Szállítási időszak']];
        const deliveryStr = deliveryRaw !== undefined ? String(deliveryRaw) : '';
        const { start, end } = parseDeliveryPeriod(deliveryStr);

        const matched = gtin ? gtinToProduct.get(gtin) : null;

        lineInserts.push({
          weekly_price_id: weekRecord.id,
          chain_product_id: matched ? matched.id : null,
          xlsx_product_name: xlsxName,
          gtin: gtin || null,
          carton_content: row[colMap['Kartontartalom']] !== undefined
            ? parseInt(row[colMap['Kartontartalom']], 10) || null
            : null,
          origin,
          packaging: row[colMap['Szállítási csomagolás']] !== undefined
            ? String(row[colMap['Szállítási csomagolás']]).trim()
            : '',
          crate_cost: row[colMap['Rekeszköltség']] !== undefined
            ? String(row[colMap['Rekeszköltség']]).trim()
            : '',
          unit_cost: row[colMap['Egységköltség']] !== undefined
            ? String(row[colMap['Egységköltség']]).trim()
            : '',
          delivery_period_start: start,
          delivery_period_end: end,
          delivery_period_raw: deliveryStr,
          is_gtin_matched: !!matched,
          row_order: idx,
        });
      });

      if (lineInserts.length > 0) {
        await trx('aldi_weekly_price_lines').insert(lineInserts);
      }

      return weekRecord;
    });

    // 5. Sorok visszaküldése (ERP névvel együtt)
    const lines = await db('aldi_weekly_price_lines')
      .leftJoin('chain_products', 'aldi_weekly_price_lines.chain_product_id', 'chain_products.id')
      .where('aldi_weekly_price_lines.weekly_price_id', result.id)
      .select(
        'aldi_weekly_price_lines.*',
        'chain_products.product_name as erp_product_name'
      )
      .orderBy('aldi_weekly_price_lines.row_order', 'asc');

    const lineIds = lines.map(l => l.id);
    let currencyPeriods = [];
    if (lineIds.length > 0) {
      currencyPeriods = await db('aldi_price_currency_periods')
        .whereIn('price_line_id', lineIds)
        .orderBy('period_start', 'asc');
    }

    lines.forEach(line => {
      line.currency_periods = currencyPeriods.filter(cp => cp.price_line_id === line.id);
    });

    res.json({
      success: true,
      weekRecord: result,
      lines,
      fileWriteSuccess,
      fileWriteError,
      message: `${lines.length} sor feldolgozva, ${lines.filter(l => l.is_gtin_matched).length} GTIN azonosítva.`
    });

  } catch (err) {
    console.error('[aldi-weekly-prices] Upload hiba:', err);
    res.status(500).json({ error: 'Szerver hiba a feltöltés során.', detail: err.message });
  }
});

// ─── GET /api/v1/aldi-weekly-prices/:id/lines/:lineId/currency-periods ────────
router.get('/:id/lines/:lineId/currency-periods', async (req, res) => {
  try {
    const { lineId } = req.params;
    const periods = await db('aldi_price_currency_periods')
      .where('price_line_id', lineId)
      .orderBy('period_start', 'asc');
    res.json(periods);
  } catch (err) {
    console.error('[aldi-weekly-prices] GET currency-periods hiba:', err);
    res.status(500).json({ error: 'Szerver hiba', detail: err.message });
  }
});

// ─── POST /api/v1/aldi-weekly-prices/:id/lines/:lineId/currency-periods ───────
router.post('/:id/lines/:lineId/currency-periods', async (req, res) => {
  try {
    const { lineId } = req.params;
    const { currency_code, period_start, period_end, note } = req.body;

    if (!currency_code || !period_start || !period_end) {
      return res.status(400).json({ error: 'currency_code, period_start, period_end kötelező.' });
    }

    const [inserted] = await db('aldi_price_currency_periods')
      .insert({ price_line_id: lineId, currency_code, period_start, period_end, note })
      .returning('*');
    res.status(201).json(inserted);
  } catch (err) {
    console.error('[aldi-weekly-prices] POST currency-period hiba:', err);
    res.status(500).json({ error: 'Szerver hiba', detail: err.message });
  }
});

// ─── DELETE /api/v1/aldi-weekly-prices/:id/lines/:lineId/currency-periods/:cpId
router.delete('/:id/lines/:lineId/currency-periods/:cpId', async (req, res) => {
  try {
    const { lineId, cpId } = req.params;
    await db('aldi_price_currency_periods')
      .where({ id: cpId, price_line_id: lineId })
      .delete();
    res.json({ success: true });
  } catch (err) {
    console.error('[aldi-weekly-prices] DELETE currency-period hiba:', err);
    res.status(500).json({ error: 'Szerver hiba', detail: err.message });
  }
});

module.exports = router;
