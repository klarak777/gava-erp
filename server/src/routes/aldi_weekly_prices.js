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
const { validateAldiPeriod, getAldiWeekFromDate, findFirstWednesday } = require('../utils/aldiWeeklyDates');
const { classifyWeeklyPriceUpload } = require('../utils/weeklyPriceMerge');

// ─── Konfiguráció ─────────────────────────────────────────────────────────────
const IS_WINDOWS = process.platform === 'win32';

// Hálózati útvonal (Windows: UNC, Linux: mount pont)
const RAKTAR_BASE = process.env.RAKTAR_PATH || (IS_WINDOWS
  ? '\\\\192.168.1.5\\raktar'
  : '/mnt/raktar'
);

const ALDI_BASE_PATH = IS_WINDOWS
  ? path.win32.join(RAKTAR_BASE, 'Gava Hungria System', 'ERP ALDI', 'Heti árak')
  : path.posix.join(RAKTAR_BASE, 'Gava Hungria System', 'ERP ALDI', 'Heti árak');

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

/**
 * Eltávolítja az Incoterm kódokat (pl. DDP) az ár szövegekből
 */
function stripIncoterm(str) {
  if (!str) return '';
  let cleaned = String(str)
    .replace(/\b(DDP|DPT|EXW|FCA|CPT|CIP|DAP|DPU|FAS|FOB|CFR|CIF)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (/Ft|HUF/i.test(cleaned)) {
    cleaned = cleaned.replace(/[,.]\d+/g, '');
  }
  return cleaned;
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

    // Ha van olyan sor, aminek nincs még deviza periódusa, automatikusan létrehozzuk az alapértelmezettet
    const linesNeedingDefault = lines.filter(l => {
      const existing = currencyPeriods.filter(cp => cp.price_line_id === l.id);
      return existing.length === 0 && l.delivery_period_start && l.delivery_period_end;
    });

    if (linesNeedingDefault.length > 0) {
      const defaultInserts = linesNeedingDefault.map(l => {
        const isEur = (l.crate_cost && l.crate_cost.startsWith('€')) || (l.unit_cost && l.unit_cost.startsWith('€'));
        const currencyCode = isEur ? 'EUR' : 'HUF';
        return {
          price_line_id: l.id,
          currency_code: currencyCode,
          period_start: l.delivery_period_start,
          period_end: l.delivery_period_end,
          crate_cost: l.crate_cost || null,
          unit_cost: l.unit_cost || null,
          note: 'Alapértelmezett'
        };
      });

      const createdDefaults = await db('aldi_price_currency_periods').insert(defaultInserts).returning('*');
      currencyPeriods.push(...createdDefaults);
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
    const { merge_action } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Nincs feltöltött fájl.' });
    }

    // 1. XLSX parse
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Konvertáljuk 2D tömbbé
    const sheetData = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (!sheetData || sheetData.length === 0) {
      return res.status(400).json({ error: 'Az XLSX munkalap üres.' });
    }

    // Fejléc sor megkeresése (ahol a "Rendelési GTIN" vagy "Termék leírása" szerepel)
    let headerRowIdx = -1;
    for (let r = 0; r < Math.min(15, sheetData.length); r++) {
      const row = sheetData[r];
      const joined = row.join(' ').toLowerCase();
      if (joined.includes('gtin') || joined.includes('termék') || joined.includes('rekeszköltség')) {
        headerRowIdx = r;
        break;
      }
    }

    if (headerRowIdx === -1) {
      return res.status(400).json({ error: 'Nem található azonosítható fejléc az XLSX fájlban.' });
    }

    const headers = sheetData[headerRowIdx].map(h => String(h).trim());

    // Oszlop indexek beazonosítása
    const colMap = {};
    headers.forEach((h, idx) => {
      if (/gtin/i.test(h)) colMap['Rendelési GTIN'] = idx;
      else if (/termék/i.test(h) || /cikk/i.test(h) || /megnevezés/i.test(h)) colMap['Termék leírása'] = idx;
      else if (/karton/i.test(h)) colMap['Kartontartalom'] = idx;
      else if (/származás/i.test(h)) colMap['Származás'] = idx;
      else if (/csomagolás/i.test(h)) colMap['Szállítási csomagolás'] = idx;
      else if (/rekeszköltség/i.test(h)) colMap['Rekeszköltség'] = idx;
      else if (/egységköltség/i.test(h)) colMap['Egységköltség'] = idx;
      else if (/szállítási időszak/i.test(h) || /időszak/i.test(h)) colMap['Szállítási időszak'] = idx;
    });

    // Adatsorok kinyerése
    const dataRows = [];
    for (let r = headerRowIdx + 1; r < sheetData.length; r++) {
      const row = sheetData[r];
      // Ha a sor teljesen üres, kihagyjuk
      if (row.every(cell => String(cell).trim() === '')) continue;
      // Ha nincs terméknév vagy GTIN, kihagyjuk
      const pName = colMap['Termék leírása'] !== undefined ? String(row[colMap['Termék leírása']]).trim() : '';
      const gtinVal = colMap['Rendelési GTIN'] !== undefined ? String(row[colMap['Rendelési GTIN']]).trim() : '';
      if (!pName && !gtinVal) continue;
      dataRows.push(row);
    }

    if (dataRows.length === 0) {
      return res.status(400).json({ error: 'Nem találtunk feldolgozható adatsorokat a fájlban.' });
    }

    // Dátumok és hét meghatározása az első szerdát tartalmazó, vagy első érvényes "Szállítási időszak" alapján
    let foundWeek = null;
    for (const row of dataRows) {
      const deliveryStr = colMap['Szállítási időszak'] !== undefined ? String(row[colMap['Szállítási időszak']]) : '';
      const { start: rawStart, end: rawEnd } = parseDeliveryPeriod(deliveryStr);
      if (rawStart) {
        const firstWed = findFirstWednesday(rawStart, rawEnd);
        const wInfo = getAldiWeekFromDate(firstWed);
        if (wInfo) {
          foundWeek = wInfo;
          break;
        }
      }
    }

    if (!foundWeek) {
      return res.status(400).json({ error: 'Nem található érvényes Szállítási időszak a fájlban, a hét azonosítása sikertelen.' });
    }

    const parsedYear = foundWeek.year;
    const parsedWeekNum = foundWeek.weekNumber;
    const weekCode = toWeekCode(parsedWeekNum);

    const comparableRows = dataRows.map(row => {
      const deliveryStr = colMap['Szállítási időszak'] !== undefined ? String(row[colMap['Szállítási időszak']]) : '';
      const { start, end } = parseDeliveryPeriod(deliveryStr);
      return {
        gtin: colMap['Rendelési GTIN'] !== undefined ? String(row[colMap['Rendelési GTIN']]).trim() : '',
        xlsx_product_name: colMap['Termék leírása'] !== undefined ? String(row[colMap['Termék leírása']]).trim() : '',
        carton_content: colMap['Kartontartalom'] !== undefined ? parseInt(row[colMap['Kartontartalom']], 10) || null : null,
        origin: colMap['Származás'] !== undefined ? String(row[colMap['Származás']]).trim() : '',
        packaging: colMap['Szállítási csomagolás'] !== undefined ? String(row[colMap['Szállítási csomagolás']]).trim() : '',
        crate_cost: colMap['Rekeszköltség'] !== undefined ? stripIncoterm(row[colMap['Rekeszköltség']]) : '',
        unit_cost: colMap['Egységköltség'] !== undefined ? stripIncoterm(row[colMap['Egységköltség']]) : '',
        original_period_start: start,
        original_period_end: end
      };
    });

    // Konfliktus ellenőrzése és az ugyanazon héthez tartozó új sorok kiválasztása.
    let existingWeekRecord = await db('aldi_weekly_prices')
      .where({ year: parsedYear, week_code: weekCode })
      .first();
    let effectiveMergeAction = existingWeekRecord ? merge_action : 'create';
    let mergeAnalysis = classifyWeeklyPriceUpload([], comparableRows);
    let selectedIndexes = mergeAnalysis.newIndexes;

    if (!existingWeekRecord && mergeAnalysis.changedIndexes.length) {
      return res.status(400).json({ error:'Az XLSX ugyanahhoz a GTIN-hez és szállítási időszakhoz több, egymástól eltérő sort tartalmaz.' });
    }

    if (existingWeekRecord) {
      const oldLines = await db('aldi_weekly_price_lines').where('weekly_price_id', existingWeekRecord.id).orderBy('row_order', 'asc');
      mergeAnalysis = classifyWeeklyPriceUpload(oldLines, comparableRows);

      if (merge_action === 'overwrite') {
        effectiveMergeAction = 'overwrite';
      } else if (merge_action === 'append_new') {
        if (!mergeAnalysis.newIndexes.length) {
          return res.status(409).json({ success:false, action:'identical', error:'A feltöltött fájl nem tartalmaz hozzáadható új tételt.' });
        }
        effectiveMergeAction = 'append_new';
        selectedIndexes = mergeAnalysis.newIndexes;
      } else if (!mergeAnalysis.newIndexes.length && !mergeAnalysis.changedIndexes.length) {
        return res.status(409).json({
          success: false,
          action: 'identical',
          error: 'A feltöltött fájl minden tétele már szerepel ennek a hétnek a táblájában.'
        });
      } else if (mergeAnalysis.changedIndexes.length) {
        const hasNew = mergeAnalysis.newIndexes.length > 0;
        return res.status(409).json({
          success: false,
          action: hasNew ? 'confirm_merge' : 'confirm_overwrite',
          error: hasNew
            ? `A fájl ${mergeAnalysis.newIndexes.length} új és ${mergeAnalysis.changedIndexes.length} megváltozott tételt tartalmaz. Hozzáadhatók csak az új tételek, vagy felülírható a teljes heti adat.`
            : `A fájl ${mergeAnalysis.changedIndexes.length} már létező, de megváltozott tételt tartalmaz. Szeretné felülírni a teljes heti adatot az új fájllal?`,
          newItemsCount: mergeAnalysis.newIndexes.length,
          changedItemsCount: mergeAnalysis.changedIndexes.length,
          weekRecord: existingWeekRecord
        });
      } else {
        effectiveMergeAction = 'append_new';
        selectedIndexes = mergeAnalysis.newIndexes;
      }
    }

    // 2. GTIN azonosítás a chain_products táblából (chain = 'ALDI')
    const chainProducts = await db('chain_products')
      .where('chain', 'ALDI')
      .select('id', 'gtin', 'product_name', 'article_number');

    const gtinToProduct = new Map();
    chainProducts.forEach(cp => {
      if (cp.gtin) {
        gtinToProduct.set(String(cp.gtin).trim(), cp);
      }
    });

    // 3. Fájl mentése a hálózati meghajtóra
    const networkFolder = buildNetworkFolderPath(parsedYear, weekCode);
    const fileName = req.file.originalname;
    const fullFilePath = IS_WINDOWS
      ? path.win32.join(networkFolder, fileName)
      : path.posix.join(networkFolder, fileName);

    let fileWriteSuccess = false;
    let fileWriteError = null;

    try {
      if (!fs.existsSync(networkFolder)) {
        fs.mkdirSync(networkFolder, { recursive: true });
      }
      fs.writeFileSync(fullFilePath, req.file.buffer);
      fileWriteSuccess = true;
    } catch (fsErr) {
      console.warn('[aldi-weekly-prices] Hálózati mentés sikertelen (a DB mentés folytatódik):', fsErr.message);
      fileWriteError = fsErr.message;
    }

    // 4. DB mentés Tranzakcióban
    const result = await db.transaction(async (trx) => {
      // Meglévő heti fejléc keresése
      let weekRecord = await trx('aldi_weekly_prices')
        .where({ year: parsedYear, week_code: weekCode })
        .first();

      if (weekRecord) {
        // Frissítjük a meglévő rekordot
        await trx('aldi_weekly_prices')
          .where('id', weekRecord.id)
          .update({
            week_number: parsedWeekNum,
            xlsx_file_path: fileWriteSuccess ? fullFilePath : weekRecord.xlsx_file_path,
            network_folder_path: networkFolder,
            updated_at: db.fn.now()
          });
      } else {
        // Új fejléc létrehozása
        const [inserted] = await trx('aldi_weekly_prices')
          .insert({
            year: parsedYear,
            week_code: weekCode,
            week_number: parsedWeekNum,
            xlsx_file_path: fileWriteSuccess ? fullFilePath : null,
            network_folder_path: networkFolder
          })
          .returning('*');
        weekRecord = inserted;
      }

      let rowOrderOffset = 0;
      if (effectiveMergeAction === 'overwrite') {
        // Teljes felülírás csak a felhasználó kifejezett jóváhagyásával történik.
        const oldLines = await trx('aldi_weekly_price_lines')
          .where('weekly_price_id', weekRecord.id)
          .select('id');
        const oldLineIds = oldLines.map(l => l.id);
        if (oldLineIds.length > 0) {
          await trx('aldi_price_currency_periods').whereIn('price_line_id', oldLineIds).delete();
        }
        await trx('aldi_weekly_price_lines').where('weekly_price_id', weekRecord.id).delete();
      } else if (effectiveMergeAction === 'append_new') {
        const maxOrder = await trx('aldi_weekly_price_lines')
          .where('weekly_price_id', weekRecord.id)
          .max('row_order as max')
          .first();
        rowOrderOffset = maxOrder?.max == null ? 0 : Number(maxOrder.max) + 1;
      }

      // Sorok beszúrása
      const lineInserts = [];
      const warnings = [];
      const selectedRows = selectedIndexes.map(sourceIndex => ({ row:dataRows[sourceIndex], sourceIndex }));
      selectedRows.forEach(({ row, sourceIndex }, idx) => {
        const gtin = colMap['Rendelési GTIN'] !== undefined ? String(row[colMap['Rendelési GTIN']]).trim() : '';
        const xlsxName = colMap['Termék leírása'] !== undefined ? String(row[colMap['Termék leírása']]).trim() : '';
        const origin = colMap['Származás'] !== undefined ? String(row[colMap['Származás']]).trim() : '';
        const deliveryStr = colMap['Szállítási időszak'] !== undefined ? String(row[colMap['Szállítási időszak']]) : '';
        const { start: rawStart, end: rawEnd } = parseDeliveryPeriod(deliveryStr);

        const matched = gtin ? gtinToProduct.get(gtin) : null;
        
        let finalStart = rawStart;
        let finalEnd = rawEnd;
        let pStatus = 'valid';
        
        if (rawStart && rawEnd) {
            const val = validateAldiPeriod(rawStart, rawEnd, parsedYear, parsedWeekNum);
            pStatus = val.status;
            if (val.status === 'clamped') {
                finalStart = val.start;
                finalEnd = val.end;
                warnings.push({ row: sourceIndex + 1, item: xlsxName, msg: `Időszak csonkolva a heti határokra: ${val.start} - ${val.end}` });
            } else if (val.status !== 'valid') {
                finalStart = null;
                finalEnd = null;
                const boundsMsg = val.boundaries ? `Heti határ: ${val.boundaries.start} - ${val.boundaries.end}` : '';
                warnings.push({ row: sourceIndex + 1, item: xlsxName, msg: `Érvénytelen időszak (${val.status}). Dátumok törölve. ${boundsMsg}` });
            }
        } else if (rawStart || rawEnd) {
             pStatus = 'invalid_format';
             finalStart = null;
             finalEnd = null;
             warnings.push({ row: sourceIndex + 1, item: xlsxName, msg: `Hiányos dátumformátum.` });
        }

        lineInserts.push({
          weekly_price_id: weekRecord.id,
          chain_product_id: matched ? matched.id : null,
          xlsx_product_name: xlsxName,
          gtin: gtin || null,
          carton_content: colMap['Kartontartalom'] !== undefined ? parseInt(row[colMap['Kartontartalom']], 10) || null : null,
          origin,
          packaging: colMap['Szállítási csomagolás'] !== undefined ? String(row[colMap['Szállítási csomagolás']]).trim() : '',
          crate_cost: colMap['Rekeszköltség'] !== undefined ? stripIncoterm(row[colMap['Rekeszköltség']]) : '',
          unit_cost: colMap['Egységköltség'] !== undefined ? stripIncoterm(row[colMap['Egységköltség']]) : '',
          delivery_period_start: finalStart,
          delivery_period_end: finalEnd,
          original_period_start: rawStart,
          original_period_end: rawEnd,
          period_status: pStatus,
          delivery_period_raw: deliveryStr,
          is_gtin_matched: !!matched,
          row_order: rowOrderOffset + idx,
        });
      });

      if (lineInserts.length > 0) {
        const insertedLines = await trx('aldi_weekly_price_lines').insert(lineInserts).returning('*');

        // Automatikus alapértelmezett deviza periódus létrehozása minden sorhoz a teljes időszakra
        const defaultPeriods = [];
        insertedLines.forEach(l => {
          if (l.delivery_period_start && l.delivery_period_end) {
            const isEur = (l.crate_cost && l.crate_cost.startsWith('€')) || (l.unit_cost && l.unit_cost.startsWith('€'));
            const currencyCode = isEur ? 'EUR' : 'HUF';
            defaultPeriods.push({
              price_line_id: l.id,
              currency_code: currencyCode,
              period_start: l.delivery_period_start,
              period_end: l.delivery_period_end,
              crate_cost: l.crate_cost || null,
              unit_cost: l.unit_cost || null,
              note: 'Alapértelmezett XLSX'
            });
          }
        });

        if (defaultPeriods.length > 0) {
          await trx('aldi_price_currency_periods').insert(defaultPeriods);
        }
      }

      return { weekRecord, warnings };
    });

    // 5. Sorok visszaküldése (ERP névvel együtt)
    const lines = await db('aldi_weekly_price_lines')
      .leftJoin('chain_products', 'aldi_weekly_price_lines.chain_product_id', 'chain_products.id')
      .where('aldi_weekly_price_lines.weekly_price_id', result.weekRecord.id)
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
      weekRecord: result.weekRecord,
      lines,
      fileWriteSuccess,
      fileWriteError,
      warnings: result.warnings,
      mergeAction: effectiveMergeAction,
      addedCount: effectiveMergeAction === 'append_new' ? selectedIndexes.length : lines.length,
      skippedExistingCount: effectiveMergeAction === 'append_new' ? mergeAnalysis.duplicateIndexes.length : 0,
      skippedChangedCount: effectiveMergeAction === 'append_new' ? mergeAnalysis.changedIndexes.length : 0,
      message: effectiveMergeAction === 'append_new'
        ? `${selectedIndexes.length} új tétel hozzáadva. A hét táblája most ${lines.length} sort tartalmaz.${mergeAnalysis.changedIndexes.length ? ` ${mergeAnalysis.changedIndexes.length} megváltozott meglévő tétel kihagyva.` : ''}`
        : `${lines.length} sor feldolgozva, ${lines.filter(l => l.is_gtin_matched).length} GTIN azonosítva.`
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
    let periods = await db('aldi_price_currency_periods')
      .where('price_line_id', lineId)
      .orderBy('period_start', 'asc');

    // Ha nincs még rögzített periódus, létrehozzuk az alapértelmezettet
    if (periods.length === 0) {
      const line = await db('aldi_weekly_price_lines').where('id', lineId).first();
      if (line && line.delivery_period_start && line.delivery_period_end) {
        const isEur = (line.crate_cost && line.crate_cost.startsWith('€')) || (line.unit_cost && line.unit_cost.startsWith('€'));
        const currencyCode = isEur ? 'EUR' : 'HUF';
        const [inserted] = await db('aldi_price_currency_periods').insert({
          price_line_id: lineId,
          currency_code: currencyCode,
          period_start: line.delivery_period_start,
          period_end: line.delivery_period_end,
          crate_cost: line.crate_cost || null,
          unit_cost: line.unit_cost || null,
          note: 'Alapértelmezett'
        }).returning('*');
        periods = [inserted];
      }
    }

    res.json(periods);
  } catch (err) {
    console.error('[aldi-weekly-prices] GET currency-periods hiba:', err);
    res.status(500).json({ error: 'Szerver hiba', detail: err.message });
  }
});

// ─── POST /api/v1/aldi-weekly-prices/:id/lines/:lineId/currency-periods ───────
router.post('/:id/lines/:lineId/currency-periods', async (req, res) => {
  try {
    const { id, lineId } = req.params;
    const { currency_code, period_start, period_end, crate_cost, unit_cost, note } = req.body;

    if (!currency_code || !period_start || !period_end) {
      return res.status(400).json({ error: 'currency_code, period_start, period_end kötelező.' });
    }

    const weekRecord = await db('aldi_weekly_prices').where({ id }).first();
    if (!weekRecord) return res.status(404).json({ error: 'Heti ár rekord nem található.' });
    
    // Ensure line belongs to this week
    const lineRecord = await db('aldi_weekly_price_lines').where({ id: lineId, weekly_price_id: id }).first();
    if (!lineRecord) return res.status(404).json({ error: 'Sor nem található ehhez a héthez.' });

    const val = validateAldiPeriod(period_start.split('T')[0], period_end.split('T')[0], weekRecord.year, weekRecord.week_number);
    if (val.status !== 'valid') {
        const boundsMsg = val.boundaries ? ` Heti határ: ${val.boundaries.start} - ${val.boundaries.end}.` : '';
        return res.status(400).json({ error: `Érvénytelen időszak (${val.status}). Kérjük, módosítsd a dátumokat a megengedett határokon belülre.${boundsMsg}` });
    }

    const [inserted] = await db('aldi_price_currency_periods')
      .insert({
        price_line_id: lineId,
        currency_code,
        period_start: period_start.split('T')[0],
        period_end: period_end.split('T')[0],
        crate_cost: crate_cost || null,
        unit_cost: unit_cost || null,
        note: note || null
      })
      .returning('*');
    res.status(201).json(inserted);
  } catch (err) {
    console.error('[aldi-weekly-prices] POST currency-period hiba:', err);
    res.status(500).json({ error: 'Szerver hiba', detail: err.message });
  }
});

// ─── PUT /api/v1/aldi-weekly-prices/:id/lines/:lineId/currency-periods ────────
// Kicseréli egy sor összes deviza periódusát a megadott listára (tranzakcióban)
router.put('/:id/lines/:lineId/currency-periods', async (req, res) => {
  try {
    const { id, lineId } = req.params;
    const { periods } = req.body;

    if (!Array.isArray(periods)) {
      return res.status(400).json({ error: 'A periods tömb megadása kötelező.' });
    }

    const weekRecord = await db('aldi_weekly_prices').where({ id }).first();
    if (!weekRecord) return res.status(404).json({ error: 'Heti ár rekord nem található.' });
    
    // Ensure line belongs to this week
    const lineRecord = await db('aldi_weekly_price_lines').where({ id: lineId, weekly_price_id: id }).first();
    if (!lineRecord) return res.status(404).json({ error: 'Sor nem található ehhez a héthez.' });

    for (const p of periods) {
      if (p.period_start && p.period_end) {
        const val = validateAldiPeriod(p.period_start.split('T')[0], p.period_end.split('T')[0], weekRecord.year, weekRecord.week_number);
        if (val.status !== 'valid') {
          const boundsMsg = val.boundaries ? ` Heti határ: ${val.boundaries.start} - ${val.boundaries.end}.` : '';
          return res.status(400).json({ error: `Érvénytelen időszak az egyik tételnél (${val.status}).${boundsMsg}` });
        }
      } else {
        return res.status(400).json({ error: 'Minden deviza időszakhoz kötelező megadni a kezdő és végdátumot.' });
      }
    }

    const inserted = await db.transaction(async trx => {
      await trx('aldi_price_currency_periods')
        .where('price_line_id', lineId)
        .delete();

      if (periods.length > 0) {
        const rowsToInsert = periods.map(p => ({
          price_line_id: lineId,
          currency_code: p.currency_code,
          period_start: p.period_start ? p.period_start.split('T')[0] : null,
          period_end: p.period_end ? p.period_end.split('T')[0] : null,
          crate_cost: p.crate_cost !== undefined ? p.crate_cost : null,
          unit_cost: p.unit_cost !== undefined ? p.unit_cost : null,
          note: p.note || null
        }));
        await trx('aldi_price_currency_periods').insert(rowsToInsert);
      }
      
      // Update line status if it was invalid
      await trx('aldi_weekly_price_lines').where({ id: lineId }).update({ period_status: 'valid' });
      
      return await trx('aldi_price_currency_periods').where('price_line_id', lineId).orderBy('period_start', 'asc');
    });
    res.json(inserted);

  } catch (err) {
    console.error('[aldi-weekly-prices] PUT currency-periods hiba:', err);
    res.status(500).json({ error: 'Szerver hiba', detail: err.message });
  }
});

// ─── GET /api/v1/aldi-weekly-prices/:id/file ────────────────────────────────
router.get('/:id/file', async (req, res) => {
  try {
    const { id } = req.params;
    const weekRecord = await db('aldi_weekly_prices').where({ id }).first();
    if (!weekRecord) {
      return res.status(404).send('Heti ár rekord nem található.');
    }

    let filePath = weekRecord.xlsx_file_path;
    if (!filePath && weekRecord.network_folder_path) {
      // Ha nincs közvetlen fájlútvonal tárolva, keressük a mappában
      try {
        if (fs.existsSync(weekRecord.network_folder_path)) {
          const files = fs.readdirSync(weekRecord.network_folder_path);
          const xlsxFile = files.find(f => f.toLowerCase().endsWith('.xlsx'));
          if (xlsxFile) {
            filePath = path.join(weekRecord.network_folder_path, xlsxFile);
          }
        }
      } catch (e) {
        console.warn('Hiba a mappa olvasásakor:', e.message);
      }
    }

    if (filePath && fs.existsSync(filePath)) {
      res.download(filePath, path.basename(filePath));
    } else {
      res.status(404).send('A fájl nem található a hálózati elérési úton.');
    }
  } catch (err) {
    console.error('[aldi-weekly-prices] File letöltés hiba:', err);
    res.status(500).send('Hiba a fájl letöltésekor.');
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

// ─── DELETE /api/v1/aldi-weekly-prices/:id/lines/:lineId ──────────────────
router.delete('/:id/lines/:lineId', async (req, res) => {
  try {
    const { id, lineId } = req.params;
    await db.transaction(async (trx) => {
      // First delete currency periods associated with the line
      await trx('aldi_price_currency_periods').where({ price_line_id: lineId }).delete();
      // Then delete the line itself
      await trx('aldi_weekly_price_lines').where({ id: lineId, weekly_price_id: id }).delete();
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[aldi-weekly-prices] DELETE line hiba:', err);
    res.status(500).json({ error: 'Szerver hiba', detail: err.message });
  }
});

// ─── PUT /api/v1/aldi-weekly-prices/:id/lines/reorder ─────────────────────
router.put('/:id/lines/reorder', async (req, res) => {
  try {
    const { id } = req.params;
    const { order } = req.body; // Array of { id: lineId, row_order: newOrder }
    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'Hibás formátum. Tömb várt.' });
    }

    await db.transaction(async (trx) => {
      for (const item of order) {
        await trx('aldi_weekly_price_lines')
          .where({ id: item.id, weekly_price_id: id })
          .update({ row_order: item.row_order });
      }
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[aldi-weekly-prices] PUT reorder hiba:', err);
    res.status(500).json({ error: 'Szerver hiba', detail: err.message });
  }
});

// ─── PUT /api/v1/aldi-weekly-prices/:id/lines/:lineId/delivery-period ─────
router.put('/:id/lines/:lineId/delivery-period', async (req, res) => {
  try {
    const { id, lineId } = req.params;
    const { start, end } = req.body;
    
    if (!start || !end) {
      return res.status(400).json({ error: 'A szállítási időszak kezdő és végdátuma is kötelező.' });
    }
    
    const weekRecord = await db('aldi_weekly_prices').where({ id }).first();
    if (!weekRecord) return res.status(404).json({ error: 'Heti ár rekord nem található.' });
    
    const lineRecord = await db('aldi_weekly_price_lines').where({ id: lineId, weekly_price_id: id }).first();
    if (!lineRecord) return res.status(404).json({ error: 'Sor nem található ehhez a héthez.' });

    const val = validateAldiPeriod(start, end, weekRecord.year, weekRecord.week_number);
    if (val.status !== 'valid') {
        const boundsMsg = val.boundaries ? ` Heti határ: ${val.boundaries.start} - ${val.boundaries.end}.` : '';
        return res.status(400).json({ error: `Érvénytelen szállítási időszak (${val.status}).${boundsMsg}` });
    }
    
    await db.transaction(async (trx) => {
      // Update line
      await trx('aldi_weekly_price_lines')
        .where({ id: lineId, weekly_price_id: id })
        .update({
          delivery_period_start: start || null,
          delivery_period_end: end || null,
          period_status: 'valid' // Reset status upon manual save
        });
      
      // We do NOT update currency periods here automatically because the frontend
      // handles the logic of what happens to currency periods when dates change
      // (as it might require user confirmation for overlaps, etc.).
    });
    
    res.json({ success: true });
  } catch (err) {
    console.error('[aldi-weekly-prices] PUT delivery-period hiba:', err);
    res.status(500).json({ error: 'Szerver hiba', detail: err.message });
  }
});

module.exports = router;
