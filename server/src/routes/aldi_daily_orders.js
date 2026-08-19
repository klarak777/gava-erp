const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const db = require('../db/db');

// Raktar base path for daily orders
const RAKTAR_BASE = process.platform === 'win32'
    ? '\\\\192.168.1.5\\raktar'
    : '/mnt/raktar';
const ALDI_DAILY_ORDERS_PATH = path.join(RAKTAR_BASE, 'Gava Hungria System', 'ERP ALDI', 'Napi rendelés');

// Set up multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Endpoint: POST /api/v1/aldi-daily-orders/upload
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nincs fájl feltöltve.' });
        }

        const dataBuffer = req.file.buffer;

        let text = '';
        if (typeof pdfParse === 'function') {
            const data = await pdfParse(dataBuffer);
            text = data.text;
        } else if (pdfParse && pdfParse.PDFParse) {
            const parser = new pdfParse.PDFParse({ data: dataBuffer });
            const res = await parser.getText();
            text = typeof res === 'string' ? res : (res.text || '');
        } else if (pdfParse && pdfParse.default && typeof pdfParse.default === 'function') {
            const data = await pdfParse.default(dataBuffer);
            text = data.text;
        } else {
            throw new Error('Unsupported pdf-parse module format.');
        }

        // 1. Extract Order Number
        // "Purchase Order Number: 4531560126"
        const orderNumberMatch = text.match(/Purchase\s+Order\s+Number:\s*(\d+)/i);
        if (!orderNumberMatch) {
            return res.status(400).json({ error: 'Nem található a Rendelési szám (Purchase Order Number) a dokumentumban.' });
        }
        let orderNumberBase = orderNumberMatch[1];
        let orderNumber = orderNumberBase;

        // Check if order number already exists and increment
        let counter = 1;
        while (true) {
            const existing = await db('aldi_daily_orders').where({ order_number: orderNumber }).first();
            if (existing) {
                orderNumber = `${orderNumberBase}-${counter}`;
                counter++;
            } else {
                break;
            }
        }

        // 2. Extract Pallet Count
        // "Total Number of Pallets (Estimated): 13"
        const palletMatch = text.match(/Total\s+Number\s+of\s+Pallets\s*\(Estimated\):\s*([\d\.,]+)/i);
        let palletCount = 0;
        if (palletMatch) {
            palletCount = parseFloat(palletMatch[1].replace(',', '.'));
        }

        // 3. Extract Delivery Date from Line Item rows
        // Format: "00010 4061462848544 27 20260815 DDP ..." or with comma "00010 4061462848544 4,371 20260815 DDP ..."
        // The delivery date is the date AFTER the quantity in the line item row
        const lineItemPattern = /^\d{5}\s+(\d{13,14})\s+([\d,]+)\s+(20\d{2}[01]\d[0-3]\d)/;

        let deliveryDateStr = null;
        let lineItems = [];

        const textLines = text.split('\n');
        for (let line of textLines) {
            const m = line.match(lineItemPattern);
            if (m) {
                const gtin = m[1];
                const quantity = parseFloat(m[2].replace(/,/g, '.'));
                const rawDate = m[3]; // e.g. 20260815

                // Use the first found delivery date
                if (!deliveryDateStr) {
                    deliveryDateStr = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
                }

                if (quantity > 0) {
                    lineItems.push({ gtin, quantity });
                }
            }
        }

        if (!deliveryDateStr) {
            return res.status(400).json({ error: 'Nem található a Szállítási dátum (Delivery Date) a tételsorok között.' });
        }

        if (lineItems.length === 0) {
            return res.status(400).json({ error: 'Nem találhatók tételsorok (GTIN és Quantity) a PDF-ben.' });
        }

        // 5. Create folder and save file
        const folderName = deliveryDateStr; // e.g. 2026-08-15
        const targetDir = path.join(ALDI_DAILY_ORDERS_PATH, folderName);

        try {
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }
        } catch (err) {
            console.error("Error creating directory:", err);
            // We continue even if we can't create the network folder in dev
        }

        const fileName = `${req.file.originalname}`;
        const targetPath = path.join(targetDir, fileName);

        try {
            fs.writeFileSync(targetPath, dataBuffer);
        } catch (err) {
            console.error("Error writing file to network path:", err);
            // Ignore error for dev purposes if network is unavailable
        }

        // 6. Save to database
        const insertedIds = await db('aldi_daily_orders').insert({
            order_number: orderNumber,
            delivery_date: deliveryDateStr,
            pallet_count: palletCount,
            pdf_file_path: fileName,
            network_folder_path: targetDir
        }).returning('id');

        const dailyOrderId = insertedIds[0].id || insertedIds[0];

        const linesToInsert = lineItems.map(item => ({
            daily_order_id: dailyOrderId,
            gtin: item.gtin,
            ordered_cartons: item.quantity
        }));

        await db('aldi_daily_order_lines').insert(linesToInsert);

        res.json({
            success: true,
            orderId: dailyOrderId,
            orderNumber,
            palletCount,
            deliveryDate: deliveryDateStr,
            lineItemsCount: lineItems.length
        });
    } catch (err) {
        console.error('Hiba a PDF feldolgozása közben:', err);
        res.status(500).json({ error: 'Szerverhiba a PDF feldolgozása közben.' });
    }
});

// Endpoint: GET /api/v1/aldi-daily-orders
// Fetch orders with dynamic version and currency based on Heti árak
router.get('/', async (req, res) => {
    try {
        const orders = await db('aldi_daily_orders')
            .select('*')
            .orderBy('created_at', 'asc'); // Fontos: feltöltési sorrendben kérjük le a verziók miatt

        const orderCounts = {};
        const enrichedOrders = [];

        for (let order of orders) {
            // Verziószám dinamikus számítása
            // A régi logika "-1", "-2" suffixeket adott az azonos rendelésszámokhoz.
            // Ezeket az alap rendelésszámhoz tartozónak tekintjük a verziószám számításához.
            const baseOrderNumber = order.order_number.replace(/-\d+$/, '');
            if (!orderCounts[baseOrderNumber]) {
                orderCounts[baseOrderNumber] = 1;
            } else {
                orderCounts[baseOrderNumber]++;
            }
            order.version = `VERSION ${orderCounts[baseOrderNumber]}`;

            // Deviza (Rendelés típusa) dinamikus számítása a GTIN alapján
            // Végigmegyünk az összes tételsoron, amíg találunk érvényes deviza-periódust
            let currency = null;
            let dDate = order.delivery_date;
            if (dDate instanceof Date) {
                dDate = dDate.toISOString().split('T')[0];
            } else if (typeof dDate === 'string' && dDate.includes('T')) {
                dDate = dDate.split('T')[0];
            }

            const allLines = await db('aldi_daily_order_lines')
                .where('daily_order_id', order.id)
                .select('gtin');

            for (const line of allLines) {
                if (!line.gtin) continue;
                const cp = await db('chain_products').where('gtin', line.gtin).first('id');
                if (!cp) continue;

                // Helyes dátum konverzió időzóna-elcsúszás nélkül (pl. helyi gép CEST vs DO szerver UTC)
                let dDate = order.delivery_date;
                if (dDate instanceof Date) {
                    const y = dDate.getFullYear();
                    const m = String(dDate.getMonth() + 1).padStart(2, '0');
                    const d = String(dDate.getDate()).padStart(2, '0');
                    dDate = `${y}-${m}-${d}`;
                } else if (typeof dDate === 'string' && dDate.includes('T')) {
                    dDate = dDate.split('T')[0];
                }

                // Nem csak a legutolsó feltöltött heti árat nézzük (mert mi van, ha a KW34-et feltöltötték a KW33 után?),
                // hanem az összes heti ár sorhoz tartozó periódust összekötjük, és a szállítási dátum alapján szűrünk rá.
                const period = await db('aldi_price_currency_periods')
                    .join('aldi_weekly_price_lines', 'aldi_price_currency_periods.price_line_id', 'aldi_weekly_price_lines.id')
                    .where('aldi_weekly_price_lines.chain_product_id', cp.id)
                    .where(function() {
                        this.where('aldi_price_currency_periods.period_start', '<=', dDate)
                            .andWhere('aldi_price_currency_periods.period_end', '>=', dDate);
                    })
                    .first('aldi_price_currency_periods.currency_code');

                if (period) {
                    currency = period.currency_code;
                    break; // Megvan a deviza, nem kell tovább keresni
                }
            }

            order.order_type = currency;
            enrichedOrders.push(order);
        }

        // Végül dátum szerint csökkenő sorrendben küldjük vissza
        enrichedOrders.sort((a, b) => new Date(b.delivery_date) - new Date(a.delivery_date));

        res.json(enrichedOrders);
    } catch (err) {
        console.error('Hiba a rendelések lekérdezésekor:', err);
        res.status(500).json({ error: 'Hiba a rendelések lekérdezésekor.' });
    }
});

// Endpoint: GET /api/v1/aldi-daily-orders/:id/lines
router.get('/:id/lines', async (req, res) => {
    try {
        const lines = await db('aldi_daily_order_lines')
            .where({ daily_order_id: req.params.id })
            .select('*');

        // Augment with product names
        for (let line of lines) {
            // Try chain_products first
            const product = await db('chain_products')
                .where({ gtin: line.gtin })
                .first('product_name');

            if (product && product.product_name) {
                line.product_name = product.product_name;
            } else {
                // Try from aldi_weekly_price_lines
                const wpLine = await db('aldi_weekly_price_lines')
                    .where({ gtin: line.gtin })
                    .first('xlsx_product_name');
                line.product_name = wpLine ? wpLine.xlsx_product_name : 'Ismeretlen termék';
            }
        }

        res.json(lines);
    } catch (err) {
        console.error('Hiba a tételsorok lekérdezésekor:', err);
        res.status(500).json({ error: 'Hiba a tételsorok lekérdezésekor.' });
    }
});

// Endpoint: GET /api/v1/aldi-daily-orders/:id/file
router.get('/:id/file', async (req, res) => {
    try {
        const order = await db('aldi_daily_orders').where({ id: req.params.id }).first();
        if (!order) {
            return res.status(404).send('Rendelés nem található.');
        }

        const filePath = path.join(order.network_folder_path, order.pdf_file_path);
        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            res.status(404).send('A fájl nem található a hálózaton.');
        }
    } catch (err) {
        console.error('Hiba a fájl lekérésekor:', err);
        res.status(500).send('Hiba a fájl lekérésekor.');
    }
});

// Endpoint: DELETE /api/v1/aldi-daily-orders/:id
// Törli a rendelést és a hozzá tartozó fájlt
router.delete('/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await db('aldi_daily_orders').where({ id: orderId }).first();

        if (!order) {
            return res.status(404).json({ error: 'Rendelés nem található' });
        }

        // Töröljük az adatbázisból (a CASCADE miatt a tételek is törlődnek, de azért biztosra megyünk)
        await db('aldi_daily_order_lines').where({ daily_order_id: orderId }).del();
        await db('aldi_daily_orders').where({ id: orderId }).del();

        // Töröljük a fájlt, ha létezik
        if (order.network_folder_path && order.pdf_file_path) {
            const filePath = path.join(order.network_folder_path, order.pdf_file_path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        res.json({ success: true, message: 'Rendelés sikeresen törölve' });
    } catch (err) {
        console.error('Hiba a rendelés törlése során:', err);
        res.status(500).json({ error: 'Belső szerverhiba a törlés során' });
    }
});

module.exports = router;
