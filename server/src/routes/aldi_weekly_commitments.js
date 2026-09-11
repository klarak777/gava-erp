const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const db = require('../db/db');
const { getAldiWeekBoundaries } = require('../utils/aldiWeeklyDates');

// Konfiguráció
const IS_WINDOWS = process.platform === 'win32';
const RAKTAR_BASE = process.env.RAKTAR_PATH || (IS_WINDOWS ? '\\\\192.168.1.5\\raktar' : '/mnt/raktar');
const ALDI_BASE_PATH = IS_WINDOWS
  ? path.win32.join(RAKTAR_BASE, 'Gava Hungria System', 'ERP ALDI', 'Heti lekötés')
  : path.posix.join(RAKTAR_BASE, 'Gava Hungria System', 'ERP ALDI', 'Heti lekötés');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.xlsx') {
      cb(null, true);
    } else {
      cb(new Error('Csak XLSX fájl tölthető fel.'));
    }
  }
});

function getISOWeekOfWednesday(d) {
    const target = new Date(d.valueOf());
    const dayNr = (d.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target) / 604800000);
}

function parseDatesAndWeek(filename) {
    let year = new Date().getFullYear();
    let week_number = null;
    let type = null;

    const lowerName = filename.toLowerCase();
    if ((/\bhlk\b/i.test(lowerName) || lowerName.includes('keresleti')) || lowerName.includes('normál') || lowerName.includes('normal')) type = 'normal';
    else if ((/\bhla\b/i.test(lowerName) || lowerName.includes('terv')) || lowerName.includes('akciós') || lowerName.includes('akcios')) type = 'action';

    if (!type) {
        throw new Error("A fájlnévből nem derül ki, hogy Akciós (Terv) vagy Normál (Keresleti) feltöltésről van-e szó.");
    }

    // Try finding DD.MM.YYYY - DD.MM.YYYY
    let m = filename.match(/(\d{2})\.(\d{2})\.(\d{4})\s*-\s*(\d{2})\.(\d{2})\.(\d{4})/);
    let startDate = null;
    if (m) {
        startDate = new Date(`${m[3]}-${m[2]}-${m[1]}`);
        year = parseInt(m[3], 10);
    } else {
        // Try finding DD.MM. - DD.MM.
        m = filename.match(/(\d{2})\.(\d{2})\.\s*-\s*(\d{2})\.(\d{2})\./);
        if (m) {
            startDate = new Date(`${year}-${m[2]}-${m[1]}`);
        } else {
            // Try fallback KW form if user uploaded e.g. "KW36 HLK.xlsx"
            const kwMatch = filename.match(/kw(\d+)/i);
            if (kwMatch) {
                week_number = parseInt(kwMatch[1], 10);
            }
        }
    }

    if (startDate && !isNaN(startDate.getTime())) {
        // find Wednesday
        let d = new Date(startDate);
        for (let i = 0; i < 7; i++) {
            if (d.getDay() === 3) break;
            d.setDate(d.getDate() - 1);
        }
        week_number = getISOWeekOfWednesday(d);
    }

    return { year, week_number, type };
}

router.post('/upload', upload.single('file'), async (req, res) => {
    let trx;
    try {
        if (!req.file) throw new Error("Nincs fájl kiválasztva.");

        let { year, week_number, type } = parseDatesAndWeek(req.file.originalname);

        trx = await db.transaction();
        await trx.raw('SELECT pg_advisory_xact_lock(860036)');
        if (!week_number) {
            year = Number(req.body.year) || year;
            const latest = await trx('aldi_weekly_commitments').where({ year }).orderBy('week_number', 'desc').first();
            const field = type === 'normal' ? 'normal_file_path' : 'action_file_path';
            if (req.body.replace_week) week_number = Number(req.body.replace_week);
            else if (!latest) week_number = 36;
            else if (!latest[field]) week_number = latest.week_number;
            else {
                const oldPath = path.join(ALDI_BASE_PATH, String(year), latest[field]);
                const unchanged = fs.existsSync(oldPath) && fs.readFileSync(oldPath).equals(req.file.buffer);
                week_number = unchanged ? latest.week_number : latest.week_number + 1;
                if (!getAldiWeekBoundaries(year, week_number)) { year++; week_number = 1; }
            }
        }
        if (!getAldiWeekBoundaries(year, week_number)) throw new Error('Invalid ALDI year/week');
        const week_str = 'KW' + String(week_number).padStart(2, '0');

        let commitment = await trx('aldi_weekly_commitments').where({ year, week_number }).first().forUpdate();
        if (!commitment) {
            [commitment] = await trx('aldi_weekly_commitments').insert({
                year, week_number, week_str
            }).returning('*');
        }

        const folderName = `${year}`;
        const targetDir = path.join(ALDI_BASE_PATH, folderName);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet, { defval: null, header: 1 });

        // A 'Display' oszlop fejlécsorát keressük (első 20 soron belül)
        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
            if (jsonData[i].some(cell => cell && typeof cell === 'string' && cell.toLowerCase().includes('display'))) {
                headerRowIdx = i;
                break;
            }
        }
        if (headerRowIdx === -1) throw new Error("Nem található 'Display' oszlop a táblázatban.");

        const headers = jsonData[headerRowIdx];
        const nameIdx = headers.findIndex(h => typeof h === 'string' && /term.*(nev|le.r.s)/i.test(h.normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
        const displayIdx = headers.findIndex(h => typeof h === 'string' && h.toLowerCase().includes('display'));
        const actionPeriodIdx = headers.findIndex(h => typeof h === 'string' && h.toLowerCase().includes('akciós időszak'));

        // Normál típusnál: 'becsült mennyiség' oszlop tartalmazza az összesített értéket
        let qtyIdx = -1;
        if (type === 'normal') {
            qtyIdx = headers.findIndex(h => typeof h === 'string' && h.toLowerCase().includes('becsült mennyiség'));
            if (qtyIdx === -1) throw new Error('Nem található mennyiség oszlop a normal típushoz.');
        }
        // Action típusnál: F-L oszlop (index 5-11) fix pozíció alapján naponta
        // F=Csütörtök, G=Péntek, H=Szombat, I=Vasárnap, J=Hétfő, K=Kedd, L=Szerda
        const ACTION_DAY_COLS = [
            { col: 5, key: 'thu' }, // F
            { col: 6, key: 'fri' }, // G
            { col: 7, key: 'sat' }, // H
            { col: 8, key: 'sun' }, // I
            { col: 9, key: 'mon' }, // J
            { col: 10, key: 'tue' }, // K
            { col: 11, key: 'wed' }, // L
        ];

        const itemsToInsert = [];

        for (let i = headerRowIdx + 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            const displayStr = row[displayIdx] ? row[displayIdx].toString().trim() : '';
            if (!displayStr) continue;

            const productId = null;
            const xlsxName = nameIdx >= 0 && row[nameIdx] ? String(row[nameIdx]).trim() : null;
            const actionPeriodStr = actionPeriodIdx !== -1 && row[actionPeriodIdx] ? row[actionPeriodIdx].toString().trim() : null;

            let qty = 0;
            let dailyValues = null;

            if (type === 'normal') {
                const qtyStr = row[qtyIdx];
                if (typeof qtyStr === 'number') qty = qtyStr;
                else if (typeof qtyStr === 'string') qty = parseFloat(qtyStr.replace(/\s/g, '').replace(',', '.'));
                if (!Number.isFinite(qty) || qty < 0) throw new Error('Invalid quantity: ' + displayStr);
            } else {
                // Action típus: naponta kinyerjük az F-L (index 5-11) oszlop értékeit
                dailyValues = {};
                let total = 0;
                for (const { col, key } of ACTION_DAY_COLS) {
                    const cellVal = row[col];
                    let v = 0;
                    if (typeof cellVal === 'number') v = cellVal;
                    else if (typeof cellVal === 'string') v = parseFloat(cellVal.replace(/\s/g, '').replace(',', '.')) || 0;
                    if (v < 0) v = 0;
                    dailyValues[key] = v;
                    total += v;
                }
                qty = total;
            }

            itemsToInsert.push({
                commitment_id: commitment.id,
                product_id: productId,
                type: type,
                display_name: displayStr,
                xlsx_product_name: xlsxName,
                action_period: actionPeriodStr,
                total_forecast_cartons: qty,
                daily_values: dailyValues ? JSON.stringify(dailyValues) : null
            });
        }

        if (!itemsToInsert.length) throw new Error('No valid product rows');

        // Fájlnév: emberi olvashatóság, revision nélkül, ha már létezik, felülírjuk
        const filePrefix = type === 'normal'
            ? `Keresleti adatok ${week_str}`
            : `Rendelési terv ${week_str}`;
        const fileName = `${filePrefix}.xlsx`;
        const filePath = path.join(targetDir, fileName);
        fs.writeFileSync(filePath, req.file.buffer);
        await trx('aldi_weekly_commitments').where({ id: commitment.id }).update({ [type === 'normal' ? 'normal_file_path' : 'action_file_path']: fileName });
        await trx('aldi_weekly_commitment_items').where({ commitment_id: commitment.id, type }).delete();
        await trx('aldi_weekly_commitment_items').insert(itemsToInsert);

        await trx.commit();
        res.json({ success: true, message: `Sikeresen feldolgozva ${itemsToInsert.length} sor.`, commitment: { id: commitment.id, year: commitment.year, week_number: commitment.week_number } });
    } catch (err) {
        if (trx) await trx.rollback();
        console.error("Upload error:", err);
        res.status(400).json({ error: err.message });
    }
});

// Helper a pontos dátumok kiszámításához egy héten
function getDatesOfISOWeek(year, week) {
    const bounds = getAldiWeekBoundaries(year, week);
    if (!bounds) throw new Error('Invalid week');
    return Array.from({ length: 7 }, (_, i) => new Date(Date.parse(bounds.start) + i * 86400000).toISOString().slice(0, 10));
}

router.get('/weeks/:year', async (req, res) => {
  try {
    const weeks = await db('aldi_weekly_commitments').select('week_number').where({ year: req.params.year }).orderBy('week_number', 'asc');
    res.json(weeks.map(w => w.week_number));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:year/:week_number', async (req, res) => {
    try {
        const { year, week_number } = req.params;
        const commitment = await db('aldi_weekly_commitments').where({ year, week_number }).first();

        let items = [];
        let stocks = [];
        let daily_orders = [];

        if (commitment) {
            // Join chain_products to get the exact ALDI product_name
            items = await db('aldi_weekly_commitment_items').where({ commitment_id: commitment.id });
            const products = await db('chain_products').where('chain', 'ALDI');
            const byArticle = new Map(products.map(p => [String(p.article_number).trim(), p.product_name]));
            items = items.map(item => ({ ...item, product_name: byArticle.get(item.display_name) || item.xlsx_product_name }));

            stocks = await db('aldi_weekly_stock_inputs').where({ year, week_number });
        }

        // Tényleges rendelések lekérése
        const dates = getDatesOfISOWeek(parseInt(year, 10), parseInt(week_number, 10));
        const startDate = dates[0];
        const endDate = dates[6];

        const realOrders = await db('aldi_daily_order_lines as l')
            .join('aldi_daily_orders as o', 'o.id', 'l.daily_order_id')
            .where('o.version_status', 'current')
            .whereBetween('o.delivery_date', [startDate, endDate])
            .select('o.delivery_date', 'l.gtin', 'l.ordered_cartons');
        const cpRows = await db('chain_products').where('chain', 'ALDI').select('gtin', 'article_number');
        const articleByGtin = new Map();
        for (const cp of cpRows) {
            if (articleByGtin.has(cp.gtin) && articleByGtin.get(cp.gtin) !== cp.article_number) throw new Error('Ambiguous GTIN: ' + cp.gtin);
            articleByGtin.set(cp.gtin, cp.article_number);
        }

        // Grouping
        const ordersByDateAndItem = {};
        for (const o of realOrders) {
            o.article_number = articleByGtin.get(o.gtin);
            if (!o.article_number) continue;
            // delivery_date could be a Date object depending on driver, format to YYYY-MM-DD
            let d = o.delivery_date;
            if (typeof d !== 'string') d = d.toISOString().split('T')[0];

            const key = `${d}_${o.article_number}`;
            if (!ordersByDateAndItem[key]) {
                ordersByDateAndItem[key] = { date: d, article_number: o.article_number, total: 0 };
            }
            ordersByDateAndItem[key].total += (parseFloat(o.ordered_cartons) || 0);
        }

        res.json({
            commitment: commitment || { year, week_number, week_str: `KW${week_number}` },
            items,
            stocks,
            daily_orders: Object.values(ordersByDateAndItem),
            week_dates: dates
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/stock', async (req, res) => {
    const payload = req.body;
    const { article_number, year, week_number } = payload;
    const prodId = payload.product_id && payload.product_id !== 'null' && !isNaN(parseInt(payload.product_id, 10)) ? parseInt(payload.product_id, 10) : null;
    const artNo = (article_number || payload.display_name || payload.product_id || '').toString().trim();

    if (!artNo || !year || !week_number) {
        return res.status(400).json({ error: 'Hiányzó azonosító (article_number, year, week_number)' });
    }

    let trx;
    try {
        trx = await db.transaction();
        await trx.raw('SELECT pg_advisory_xact_lock(860037)');
        let record = await trx('aldi_weekly_stock_inputs')
            .where({ article_number: artNo, year: parseInt(year, 10), week_number: parseInt(week_number, 10) })
            .first()
            .forUpdate();

        const data = {};
        const fields = ['initial_stock', 'inc_wed', 'inc_thu', 'inc_fri', 'inc_sat', 'inc_sun', 'inc_mon', 'inc_tue'];

        for (const f of fields) {
            if (payload[f] !== undefined) {
                const value = payload[f] === '' ? 0 : Math.round(Number(payload[f]));
                if (!Number.isFinite(value) || value < 0) throw new Error('Invalid stock quantity');
                data[f] = value;
            }
        }

        if (record) {
            if (Object.keys(data).length > 0) {
                await trx('aldi_weekly_stock_inputs').where({ id: record.id }).update(data);
            }
        } else {
            for (const f of fields) {
                if (data[f] === undefined) data[f] = 0;
            }
            await trx('aldi_weekly_stock_inputs').insert({
                product_id: prodId,
                article_number: artNo,
                year: parseInt(year, 10),
                week_number: parseInt(week_number, 10),
                ...data
            });
        }

        await trx.commit();
        res.json({ success: true });
    } catch (err) {
        if (trx) await trx.rollback();
        console.error('Error saving stock:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- Visszamenőleges újrafeldolgozás: meglévő action Excel-ekből daily_values pótlása ---
router.post('/reprocess', async (req, res) => {
    const ACTION_DAY_COLS = [
        { col: 5, key: 'thu' }, // F = Csütörtök
        { col: 6, key: 'fri' }, // G = Péntek
        { col: 7, key: 'sat' }, // H = Szombat
        { col: 8, key: 'sun' }, // I = Vasárnap
        { col: 9, key: 'mon' }, // J = Hétfő
        { col: 10, key: 'tue' }, // K = Kedd
        { col: 11, key: 'wed' }, // L = Szerda
    ];

    try {
        // 1. Lekérjük az összes commitment-et amelyhez action fájl van feltöltve
        const commitments = await db('aldi_weekly_commitments')
            .whereNotNull('action_file_path')
            .select('id', 'year', 'week_number', 'action_file_path');

        let totalUpdated = 0;
        let totalSkipped = 0;
        const results = [];

        for (const commitment of commitments) {
            const filePath = path.join(ALDI_BASE_PATH, String(commitment.year), commitment.action_file_path);

            if (!fs.existsSync(filePath)) {
                results.push({ week: commitment.week_number, year: commitment.year, status: 'fájl_nem_található', path: filePath });
                totalSkipped++;
                continue;
            }

            // 2. Excel kiolvasása
            const buffer = fs.readFileSync(filePath);
            const workbook = xlsx.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = xlsx.utils.sheet_to_json(sheet, { defval: null, header: 1 });

            // 3. Header sor megkeresése ('Display' oszlop alapján)
            let headerRowIdx = -1;
            for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
                if (jsonData[i].some(cell => cell && typeof cell === 'string' && cell.toLowerCase().includes('display'))) {
                    headerRowIdx = i;
                    break;
                }
            }

            if (headerRowIdx === -1) {
                results.push({ week: commitment.week_number, year: commitment.year, status: 'nincs_display_oszlop' });
                totalSkipped++;
                continue;
            }

            const headers = jsonData[headerRowIdx];
            const displayIdx = headers.findIndex(h => typeof h === 'string' && h.toLowerCase().includes('display'));
            const actionPeriodIdx = headers.findIndex(h => typeof h === 'string' && h.toLowerCase().includes('akciós időszak'));

            // 4. Soronként napi értékek kiszámítása és DB frissítés
            let weekUpdated = 0;
            for (let i = headerRowIdx + 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                const displayStr = row[displayIdx] ? row[displayIdx].toString().trim() : '';
                if (!displayStr) continue;

                const dailyValues = {};
                for (const { col, key } of ACTION_DAY_COLS) {
                    const cellVal = row[col];
                    let v = 0;
                    if (typeof cellVal === 'number') v = cellVal;
                    else if (typeof cellVal === 'string') v = parseFloat(cellVal.replace(/\s/g, '').replace(',', '.')) || 0;
                    if (v < 0) v = 0;
                    dailyValues[key] = v;
                }
                const total = Object.values(dailyValues).reduce((s, v) => s + v, 0);

                const actionPeriodStr = actionPeriodIdx !== -1 && row[actionPeriodIdx]
                    ? row[actionPeriodIdx].toString().trim() : null;

                // Csak azokat frissítjük ahol daily_values NULL volt, ÉS az action_period egyezik
                let query = db('aldi_weekly_commitment_items')
                    .where({ commitment_id: commitment.id, type: 'action', display_name: displayStr })
                    .whereNull('daily_values');

                if (actionPeriodStr) {
                    query = query.where('action_period', actionPeriodStr);
                } else {
                    query = query.whereNull('action_period');
                }

                const updated = await query.update({
                    daily_values: JSON.stringify(dailyValues),
                    total_forecast_cartons: total,
                    ...(actionPeriodStr ? { action_period: actionPeriodStr } : {})
                });
                weekUpdated += updated;
            }

            totalUpdated += weekUpdated;
            results.push({ week: commitment.week_number, year: commitment.year, status: 'ok', updated_rows: weekUpdated });
        }

        res.json({
            success: true,
            message: `Újrafeldolgozás kész. Összesen ${totalUpdated} sor frissítve.`,
            total_updated: totalUpdated,
            total_skipped: totalSkipped,
            details: results
        });
    } catch (err) {
        console.error('Reprocess error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

