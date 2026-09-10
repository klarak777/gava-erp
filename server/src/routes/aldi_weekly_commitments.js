const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const db = require('../db/db');

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
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Csak XLSX vagy XLS fájlok tölthetők fel.'));
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
    if (lowerName.includes('keresleti') || lowerName.includes('normál') || lowerName.includes('normal')) type = 'normal';
    else if (lowerName.includes('terv') || lowerName.includes('akciós') || lowerName.includes('akcios')) type = 'action';

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
            d.setDate(d.getDate() + 1);
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
        
        if (!week_number) {
            if (req.body.week_number && req.body.year) {
                week_number = parseInt(req.body.week_number, 10);
                year = parseInt(req.body.year, 10);
            } else {
                throw new Error("Nem sikerült megállapítani a hetet a fájlnévből, és nem volt előzetesen kiválasztott hét.");
            }
        }
        
        const week_str = `KW${week_number}`;

        trx = await db.transaction();

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
        
        const suffix = type === 'normal' ? 'HLK' : 'HLA';
        const fileName = `${week_str} ${suffix}.xlsx`;
        const targetPath = path.join(targetDir, fileName);
        
        fs.writeFileSync(targetPath, req.file.buffer);

        const updateData = {};
        if (type === 'normal') updateData.normal_file_path = fileName;
        else updateData.action_file_path = fileName;
        await trx('aldi_weekly_commitments').where({ id: commitment.id }).update(updateData);

        await trx('aldi_weekly_commitment_items').where({ commitment_id: commitment.id, type }).delete();

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet, { defval: null, header: 1 });

        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
            if (jsonData[i].some(cell => cell && typeof cell === 'string' && cell.toLowerCase().includes('display'))) {
                headerRowIdx = i;
                break;
            }
        }
        if (headerRowIdx === -1) throw new Error("Nem található 'Display' oszlop a táblázatban.");

        const headers = jsonData[headerRowIdx];
        const displayIdx = headers.findIndex(h => h && h.toLowerCase().includes('display'));
        const actionPeriodIdx = headers.findIndex(h => h && h.toLowerCase().includes('akciós időszak'));
        
        let qtyIdx = -1;
        if (type === 'normal') {
            qtyIdx = headers.findIndex(h => h && h.toLowerCase().includes('becsült mennyiség'));
        } else {
            qtyIdx = headers.findIndex(h => h && h.toLowerCase().includes('értékesítési előrejelzés'));
        }
        
        if (qtyIdx === -1) throw new Error(`Nem található mennyiség oszlop a ${type} típushoz.`);

        const itemsToInsert = [];
        
        // Load chain products mapped by article number (cikkszám)
        const chainProds = await trx('chain_products').where('chain', 'ALDI');
        const prodMap = new Map();
        chainProds.forEach(p => { if (p.article_number) prodMap.set(p.article_number.toString().trim(), p); });

        for (let i = headerRowIdx + 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            const displayStr = row[displayIdx] ? row[displayIdx].toString().trim() : '';
            if (!displayStr) continue;
            
            const qtyStr = row[qtyIdx];
            let qty = 0;
            if (typeof qtyStr === 'number') qty = qtyStr;
            else if (typeof qtyStr === 'string') qty = parseFloat(qtyStr.replace(/\s/g, '').replace(',', '.'));
            
            if (isNaN(qty) || qty <= 0) continue; 
            
            // Map directly by ALDI item code (strict exact match)
            const prod = prodMap.get(displayStr);
            const productId = prod ? prod.id : null; // we keep product_id if mapped

            itemsToInsert.push({
                commitment_id: commitment.id,
                product_id: productId, // can be null if missing
                type: type,
                display_name: displayStr, // item code
                action_period: actionPeriodIdx !== -1 && row[actionPeriodIdx] ? row[actionPeriodIdx].toString().trim() : null,
                total_forecast_cartons: qty
            });
        }

        if (itemsToInsert.length > 0) {
            await trx('aldi_weekly_commitment_items').insert(itemsToInsert);
        }

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
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4)
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    
    // ISO week start is Monday. Aldi week start is Wednesday (Monday + 2 days)
    const dates = [];
    const wednesday = new Date(ISOweekStart);
    wednesday.setDate(wednesday.getDate() + 2);
    
    for (let i = 0; i < 7; i++) {
        const d = new Date(wednesday);
        d.setDate(d.getDate() + i);
        
        const yy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        dates.push(`${yy}-${mm}-${dd}`);
    }
    return dates; // [wed, thu, fri, sat, sun, mon, tue]
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
            items = await db('aldi_weekly_commitment_items as i')
                .leftJoin('chain_products as cp', 'cp.article_number', 'i.display_name')
                .select('i.*', 'cp.product_name')
                .where({ commitment_id: commitment.id });
                
            stocks = await db('aldi_weekly_stock_inputs').where({ year, week_number });
        }

        // Tényleges rendelések lekérése
        const dates = getDatesOfISOWeek(parseInt(year, 10), parseInt(week_number, 10));
        const startDate = dates[0];
        const endDate = dates[6];

        const realOrders = await db('aldi_daily_order_lines as l')
            .join('aldi_daily_orders as o', 'o.id', 'l.daily_order_id')
            .join('chain_products as cp', 'cp.gtin', 'l.gtin')
            .where('o.version_status', 'current')
            .whereBetween('o.delivery_date', [startDate, endDate])
            .select('o.delivery_date', 'cp.article_number', 'l.ordered_cartons');

        // Grouping
        const ordersByDateAndItem = {};
        for (const o of realOrders) {
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
        let record = await trx('aldi_weekly_stock_inputs')
            .where({ article_number: artNo, year: parseInt(year, 10), week_number: parseInt(week_number, 10) })
            .first()
            .forUpdate();
        
        const data = {};
        const fields = ['initial_stock', 'inc_wed', 'inc_thu', 'inc_fri', 'inc_sat', 'inc_sun', 'inc_mon', 'inc_tue'];
        
        for (const f of fields) {
            if (payload[f] !== undefined) {
                data[f] = parseFloat(payload[f]) || 0;
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

module.exports = router;
