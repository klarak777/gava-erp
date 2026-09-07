const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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
    let writtenPath = null;
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
        const orderNumberBase = orderNumberMatch[1];

        // 2. Extract Pallet Count
        // "Total Number of Pallets (Estimated): 13"
        const palletMatch = text.match(/Total\s+Number\s+of\s+Pallets\s*\(Estimated\):\s*([\d\.,]+)/i);
        let palletCount = 0;
        if (palletMatch) {
            palletCount = Math.ceil(parseFloat(palletMatch[1].replace(',', '.')));
        }

        // 3. Extract Delivery Date from Line Item rows
        // Format: "00010 4061462848544 27 20260815 DDP ..." or with comma "00010 4061462848544 4,371 20260815 DDP ..."
        // The delivery date is the date AFTER the quantity in the line item row
        const lineItemPattern = /^\d{5}\s+(\d{13,14})\s+([\d,]+)\s+(20\d{2}[01]\d[0-3]\d)/;

        let deliveryDateStr = null;
        const itemTotals = new Map();

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
                    itemTotals.set(gtin, (itemTotals.get(gtin) || 0) + quantity);
                }
            }
        }

        if (!deliveryDateStr) {
            return res.status(400).json({ error: 'Nem található a Szállítási dátum (Delivery Date) a tételsorok között.' });
        }

        const lineItems = [...itemTotals.entries()].map(([gtin, quantity]) => ({ gtin, quantity }));
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

        const ext = path.extname(req.file.originalname);
        const baseName = path.basename(req.file.originalname, ext);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileName = `${baseName}_${uniqueSuffix}${ext}`;
        const targetPath = path.join(targetDir, fileName);

        try {
            fs.writeFileSync(targetPath, dataBuffer);
            writtenPath = targetPath;
        } catch (err) {
            console.error("Error writing file to network path:", err);
            // Ignore error for dev purposes if network is unavailable
        }

        const pdfHash = crypto.createHash('sha256').update(dataBuffer).digest('hex');
        const result = await db.transaction(async trx => {
            await trx.raw('SELECT pg_advisory_xact_lock(hashtext(?))', [`aldi-order:${orderNumberBase}`]);
            let family = await trx('aldi_order_families').where({ base_order_number: orderNumberBase }).first();
            if (!family) {
                [family] = await trx('aldi_order_families').insert({ base_order_number: orderNumberBase }).onConflict('base_order_number').ignore().returning('*');
                family = family || await trx('aldi_order_families').where({ base_order_number: orderNumberBase }).first();
            }
            family = await trx('aldi_order_families').where({ id: family.id }).first().forUpdate();
            const duplicate = await trx('aldi_daily_orders').where({ order_family_id: family.id, pdf_hash: pdfHash }).first();
            if (duplicate) throw new Error('DUPLICATE_PDF');

            const previousOrder = family.current_order_id ? await trx('aldi_daily_orders').where({ id: family.current_order_id }).first() : null;
            const previousLines = previousOrder ? await trx('aldi_daily_order_lines').where({ daily_order_id: previousOrder.id }) : [];
            const previousMap = new Map(previousLines.map(line => [line.gtin, Number(line.ordered_cartons) || 0]));
            const versionNumber = previousOrder ? Number(previousOrder.version_number) + 1 : 1;
            const orderNumber = versionNumber === 1 ? orderNumberBase : `${orderNumberBase}-${versionNumber - 1}`;
            const [newOrder] = await trx('aldi_daily_orders').insert({
                order_number: orderNumber,
                delivery_date: deliveryDateStr,
                pallet_count: palletCount,
                pdf_file_path: fileName,
                network_folder_path: targetDir,
                order_family_id: family.id,
                version_number: versionNumber,
                version_status: 'current',
                pdf_hash: pdfHash
            }).returning('*');

            const incomingMap = new Map(lineItems.map(item => [item.gtin, item.quantity]));
            const allGtins = new Set([...previousMap.keys(), ...incomingMap.keys()]);
            const autoReconcileWarnings = [];

            for (const gtin of allGtins) {
                let state = await trx('aldi_order_item_states').where({ order_family_id: family.id, gtin }).first().forUpdate();
                if (!state) [state] = await trx('aldi_order_item_states').insert({ order_family_id: family.id, gtin }).returning('*');
                const previousQty = previousMap.get(gtin) || 0;
                const currentQty = incomingMap.get(gtin) || 0;
                const delta = previousOrder ? currentQty - previousQty : 0;
                const changeType = !previousOrder
                    ? 'unchanged'
                    : !previousMap.has(gtin)
                        ? 'added'
                        : !incomingMap.has(gtin)
                            ? 'removed'
                            : delta > 0
                                ? 'increased'
                                : delta < 0
                                    ? 'decreased'
                                    : 'unchanged';

                // Auto-reconciliation: if new qty < already sent or on trucks, trim automatically
                const truckLines = await trx('aldi_truck_lines')
                    .where({ order_item_state_id: state.id })
                    .orderBy('id', 'asc');
                const totalLoaded = truckLines.reduce((s, r) => s + (Number(r.ordered_cartons) || 0), 0);
                let currentSent = Number(state.sent_cartons) || 0;

                if (currentQty < currentSent || currentQty < totalLoaded) {
                    // Need to trim
                    const targetMax = currentQty;
                    let warning = `⚠️ Automatikus egyeztetés: ${gtin} - Az új rendelt mennyiség ${currentQty} karton.`;

                    // 1. Trim truck lines if loaded > new qty
                    if (totalLoaded > targetMax) {
                        let excess = totalLoaded - targetMax;
                        // Remove/reduce truck lines from the last one backwards
                        const truckLinesDesc = [...truckLines].reverse();
                        for (const tl of truckLinesDesc) {
                            if (excess <= 0) break;
                            const tlQty = Number(tl.ordered_cartons) || 0;
                            if (tlQty <= excess) {
                                await trx('aldi_truck_lines').where({ id: tl.id }).delete();
                                excess -= tlQty;
                            } else {
                                await trx('aldi_truck_lines').where({ id: tl.id }).update({ ordered_cartons: tlQty - excess });
                                excess = 0;
                            }
                        }
                        warning += ` Kamionról visszavéve: ${totalLoaded - targetMax} karton.`;
                    }

                    // 2. Trim sent_cartons in item state
                    const newSent = Math.min(currentSent, targetMax);
                    currentSent = newSent;
                    warning += ` Árú igényből visszavéve: ${Math.max(0, Number(state.sent_cartons) - newSent)} karton.`;

                    await trx('aldi_order_item_states').where({ id: state.id }).update({
                        sent_cartons: newSent,
                        requires_reconciliation: false,
                        reconciliation_reason: null,
                        updated_at: trx.fn.now()
                    });
                    autoReconcileWarnings.push(warning);
                } else {
                    await trx('aldi_order_item_states').where({ id: state.id }).update({
                        requires_reconciliation: false,
                        reconciliation_reason: null,
                        updated_at: trx.fn.now()
                    });
                }

                // Update sent_to_rakodas flag: if any line still has remaining, set to false
                const remainingForThis = Math.max(0, currentQty - currentSent);

                await trx('aldi_daily_order_lines').insert({
                    daily_order_id: newOrder.id,
                    gtin,
                    ordered_cartons: currentQty,
                    order_item_state_id: state.id,
                    previous_ordered_cartons: previousQty,
                    quantity_delta: delta,
                    change_type: changeType,
                    is_virtual_removed: !incomingMap.has(gtin)
                });
            }

            if (previousOrder) await trx('aldi_daily_orders').where({ id: previousOrder.id }).update({ version_status: 'superseded', superseded_by_order_id: newOrder.id, superseded_at: trx.fn.now() });
            await trx('aldi_order_families').where({ id: family.id }).update({ current_order_id: newOrder.id, updated_at: trx.fn.now() });
            return { newOrder, versionNumber, orderNumber, autoReconcileWarnings };
        });

        res.json({
            success: true,
            orderId: result.newOrder.id,
            orderNumber: result.orderNumber,
            versionNumber: result.versionNumber,
            palletCount,
            deliveryDate: deliveryDateStr,
            lineItemsCount: lineItems.length,
            autoReconcileWarnings: result.autoReconcileWarnings || []
        });
    } catch (err) {
        if (writtenPath && fs.existsSync(writtenPath)) {
            try { fs.unlinkSync(writtenPath); } catch (_) { /* naplózott DB hiba az elsődleges */ }
        }
        if (err.message === 'DUPLICATE_PDF') return res.status(409).json({ error: 'Ez a PDF-verzió már fel lett töltve.' });
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

        const enrichedOrders = [];

        for (let order of orders) {
            order.version = `VERSION ${order.version_number || 1}`;

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

                if (period && period.currency_code) {
                    currency = period.currency_code;
                    break; // Megvan a deviza, nem kell tovább keresni
                }
                // Ha nincs egyező időszak a szállítási dátumhoz → currency marad null → 'Nincs heti ár megadva a tételhez'
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
        const order = await db('aldi_daily_orders').where({ id: req.params.id }).first();
        if (!order) return res.status(404).json({ error: 'Rendelés nem található.' });
        const lines = await db('aldi_daily_order_lines as l')
            .leftJoin('aldi_order_item_states as s', 's.id', 'l.order_item_state_id')
            .where('l.daily_order_id', req.params.id)
            .select('l.*', 's.sent_cartons', 's.requires_reconciliation', 's.reconciliation_reason');

        // Augment with product names
        for (let line of lines) {
            const loadedRow = await db('aldi_truck_lines').where({ order_item_state_id: line.order_item_state_id }).sum('ordered_cartons as total').first();
            line.loaded_cartons = Number(loadedRow && loadedRow.total) || 0;
            line.sent_cartons = Number(line.sent_cartons) || 0;
            line.available_cartons = Math.max(0, line.sent_cartons - line.loaded_cartons);
            line.remaining_to_send = Math.max(0, Number(line.ordered_cartons) - line.sent_cartons);
            line.version_status = order.version_status;
            line.version_number = Number(order.version_number) || 1;
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
// Törli a rendelést és a hozzá tartozó fájlt, de csak ha nincs már kamionra osztott tétel
router.delete('/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        
        let filesToDelete = [];

        await db.transaction(async trx => {
            const order = await trx('aldi_daily_orders').where({ id: orderId }).first().forUpdate();
            if (!order) {
                throw new Error('ORDER_NOT_FOUND');
            }
            if (order.version_status !== 'current') throw new Error('SUPERSEDED_DELETE');
            const family = await trx('aldi_order_families').where({ id: order.order_family_id }).first().forUpdate();
            const familyOrders = await trx('aldi_daily_orders').where({ order_family_id: family.id }).orderBy('id', 'asc').forUpdate();
            filesToDelete = familyOrders.filter(item => item.network_folder_path && item.pdf_file_path).map(item => path.join(item.network_folder_path, item.pdf_file_path));

            const orderIds = familyOrders.map(item => item.id);
            const lines = await trx('aldi_daily_order_lines')
                .whereIn('daily_order_id', orderIds)
                .orderBy('id', 'asc')
                .forUpdate();
            const stateIds = [...new Set(lines.map(line => line.order_item_state_id).filter(Boolean))];
            const loadedRows = stateIds.length ? await trx('aldi_truck_lines').whereIn('order_item_state_id', stateIds).where('ordered_cartons', '>', 0) : [];
            if (loadedRows.length) throw new Error('FAMILY_HAS_LOADED_ITEMS');
            const commissionRows = stateIds.length ? await trx('aldi_commission_lines').whereIn('order_item_state_id', stateIds) : [];
            if (commissionRows.length) throw new Error('FAMILY_HAS_COMMISSION_ITEMS');
            await trx('aldi_order_families').where({ id: family.id }).update({ current_order_id: null });
            if (stateIds.length) await trx('aldi_truck_lines').whereIn('order_item_state_id', stateIds).delete();
            await trx('aldi_daily_orders').whereIn('id', orderIds).delete();
            await trx('aldi_order_item_states').where({ order_family_id: family.id }).delete();
            await trx('aldi_order_families').where({ id: family.id }).delete();
        });

        // 4. PDF törlés csak a sikeres adatbázis tranzakció után
        let warning = null;
        for (const filePath of filesToDelete) {
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (unlinkErr) {
                    console.error('Hiba a PDF fájl törlésekor:', unlinkErr);
                    warning = 'Az adatbázis bejegyzések törlődtek, de egy vagy több PDF eltávolítása sikertelen.';
                }
            }
        }

        res.json({ success: true, message: 'Rendelés sikeresen törölve', warning });
    } catch (err) {
        if (err.message === 'ORDER_NOT_FOUND') return res.status(404).json({ error: 'Rendelés nem található' });
        if (err.message === 'SUPERSEDED_DELETE') return res.status(409).json({ error: 'Elévült verzió külön nem törölhető. A teljes rendeléscsalád az aktuális verzió törlésével távolítható el.' });
        if (err.message === 'FAMILY_HAS_LOADED_ITEMS' || err.message === 'FAMILY_HAS_COMMISSION_ITEMS') return res.status(409).json({ error: 'A rendeléscsalád nem törölhető, mert valamelyik tétele kamionon vagy komissióban van.' });
        if (err.message && err.message.includes('nem törölhető, mert')) {
            return res.status(409).json({ error: err.message });
        }
        console.error('Hiba a rendelés törlése során:', err);
        res.status(500).json({ error: 'Belső szerverhiba a törlés során' });
    }
});

// Endpoint: PATCH /api/v1/aldi-daily-orders/lines/:lineId/send-cartons
// Idempotens részleges vagy teljes tétel küldés
router.patch('/lines/:lineId/send-cartons', async (req, res) => {
    try {
        const { lineId } = req.params;
        const { target_sent_cartons } = req.body;
        
        if (target_sent_cartons === undefined || isNaN(target_sent_cartons) || target_sent_cartons < 0) {
            return res.status(400).json({ error: 'Érvénytelen target_sent_cartons érték.' });
        }

        const result = await db.transaction(async trx => {
            // 1. Lock order line
            const line = await trx('aldi_daily_order_lines').where({ id: lineId }).first().forUpdate();
            if (!line) throw new Error('LINE_NOT_FOUND');
            const order = await trx('aldi_daily_orders').where({ id: line.daily_order_id }).first();
            if (!order || order.version_status !== 'current') throw new Error('SUPERSEDED_ORDER');
            const state = await trx('aldi_order_item_states').where({ id: line.order_item_state_id }).first().forUpdate();
            if (!state) throw new Error('ITEM_STATE_NOT_FOUND');
            if (state.requires_reconciliation) throw new Error('RECONCILIATION_REQUIRED');

            // 2. Összegzés (loaded_cartons)
            const loadedRes = await trx('aldi_truck_lines')
                .where({ order_item_state_id: state.id })
                .sum('ordered_cartons as total_loaded')
                .first();
            const loadedCartons = parseFloat(loadedRes.total_loaded) || 0;
            const orderedCartons = parseFloat(line.ordered_cartons) || 0;
            const targetSent = parseFloat(target_sent_cartons);

            // 3. Invariáns ellenőrzés
            if (targetSent < loadedCartons) {
                throw new Error(`Nem vonható vissza ennyi, mert ${loadedCartons} karton már kamionon van.`);
            }
            if (targetSent > orderedCartons) {
                throw new Error(`Túlküldés: Maximum ${orderedCartons} karton küldhető.`);
            }

            // 4. Módosítás
            await trx('aldi_order_item_states').where({ id: state.id }).update({ sent_cartons: targetSent, updated_at: trx.fn.now() });
            
            // 5. Konzisztencia (sent_to_rakodas order szintre)
            const anySent = await trx('aldi_daily_order_lines as l')
                .join('aldi_order_item_states as s', 's.id', 'l.order_item_state_id')
                .where('l.daily_order_id', line.daily_order_id)
                .andWhere('s.sent_cartons', '>', 0)
                .first();
                
            await trx('aldi_daily_orders')
                .where({ id: line.daily_order_id })
                .update({ sent_to_rakodas: !!anySent });

            return {
                ordered_cartons: orderedCartons,
                sent_cartons: targetSent,
                loaded_cartons: loadedCartons,
                available_cartons: targetSent - loadedCartons,
                remaining_to_send: orderedCartons - targetSent
            };
        });

        res.json(result);
    } catch (err) {
        if (err.message === 'LINE_NOT_FOUND') return res.status(404).json({ error: 'Tétel nem található.' });
        if (err.message === 'ITEM_STATE_NOT_FOUND') return res.status(409).json({ error: 'A tétel verziókon átívelő állapota hiányzik.' });
        if (err.message === 'SUPERSEDED_ORDER') return res.status(403).json({ error: 'Elévült rendelésverzióból nem küldhető tétel.' });
        if (err.message === 'RECONCILIATION_REQUIRED') return res.status(409).json({ error: 'A tétel mennyisége csökkent, ezért előbb rendezd a Rakodáson vagy kamionon lévő többletet.' });
        if (err.message.includes('Nem vonható') || err.message.includes('Túlküldés')) {
            return res.status(409).json({ error: err.message });
        }
        console.error('Hiba tétel küldésekor:', err);
        res.status(500).json({ error: 'Belső szerverhiba' });
    }
});

// Endpoint: PATCH /api/v1/aldi-daily-orders/lines/:lineId/return-available
// A teljes, még kamionra nem rakott mennyiséget visszaveszi az Áruigényből.
router.patch('/lines/:lineId/return-available', async (req, res) => {
    try {
        const result = await db.transaction(async trx => {
            const line = await trx('aldi_daily_order_lines')
                .where({ id: req.params.lineId })
                .first()
                .forUpdate();
            if (!line) throw new Error('LINE_NOT_FOUND');

            const order = await trx('aldi_daily_orders')
                .where({ id: line.daily_order_id })
                .first();
            if (!order || order.version_status !== 'current') throw new Error('SUPERSEDED_ORDER');

            const state = await trx('aldi_order_item_states')
                .where({ id: line.order_item_state_id })
                .first()
                .forUpdate();
            if (!state) throw new Error('ITEM_STATE_NOT_FOUND');

            const loadedRow = await trx('aldi_truck_lines')
                .where({ order_item_state_id: state.id })
                .sum('ordered_cartons as total')
                .first();
            const loadedCartons = Number(loadedRow && loadedRow.total) || 0;
            const orderedCartons = Number(line.ordered_cartons) || 0;
            const conflict = loadedCartons > orderedCartons;

            // A kamionon lévő mennyiség marad Rakodáson, csak a szabad Áruigény
            // kerül vissza a Napi rendelések közé.
            await trx('aldi_order_item_states').where({ id: state.id }).update({
                sent_cartons: loadedCartons,
                requires_reconciliation: conflict,
                reconciliation_reason: conflict
                    ? `A kamionon lévő mennyiség (${loadedCartons}) nagyobb a jelenlegi rendelésnél (${orderedCartons}).`
                    : null,
                updated_at: trx.fn.now()
            });

            const anySent = await trx('aldi_daily_order_lines as l')
                .join('aldi_order_item_states as s', 's.id', 'l.order_item_state_id')
                .where('l.daily_order_id', line.daily_order_id)
                .andWhere('s.sent_cartons', '>', 0)
                .first();
            await trx('aldi_daily_orders')
                .where({ id: line.daily_order_id })
                .update({ sent_to_rakodas: !!anySent });

            return {
                sent_cartons: loadedCartons,
                loaded_cartons: loadedCartons,
                available_cartons: 0,
                remaining_to_send: Math.max(orderedCartons - loadedCartons, 0)
            };
        });

        res.json(result);
    } catch (err) {
        if (err.message === 'LINE_NOT_FOUND') return res.status(404).json({ error: 'Tétel nem található.' });
        if (err.message === 'ITEM_STATE_NOT_FOUND') return res.status(409).json({ error: 'A tétel verziókon átívelő állapota hiányzik.' });
        if (err.message === 'SUPERSEDED_ORDER') return res.status(403).json({ error: 'Elévült rendelésverzió tétele nem módosítható.' });
        console.error('Hiba az Áruigény visszavételekor:', err);
        res.status(500).json({ error: 'Belső szerverhiba' });
    }
});

// Endpoint: PATCH /api/v1/aldi-daily-orders/:id/send-to-rakodas
// Teljes rendelés átküldése
router.patch('/:id/send-to-rakodas', async (req, res) => {
    try {
        const orderId = req.params.id;
        
        await db.transaction(async trx => {
            const order = await trx('aldi_daily_orders').where({ id: orderId }).first();
            if (!order) {
                throw new Error('ORDER_NOT_FOUND');
            }
            if (order.version_status !== 'current') throw new Error('SUPERSEDED_ORDER');

            // Lock mindent
            const lines = await trx('aldi_daily_order_lines')
                .where({ daily_order_id: orderId })
                .orderBy('id', 'asc')
                .forUpdate();

            for (const line of lines) {
                if (line.is_virtual_removed) continue;
                const state = await trx('aldi_order_item_states').where({ id: line.order_item_state_id }).first().forUpdate();
                if (!state) throw new Error('ITEM_STATE_NOT_FOUND');
                if (state.requires_reconciliation) throw new Error('RECONCILIATION_REQUIRED');
                await trx('aldi_order_item_states').where({ id: state.id }).update({ sent_cartons: line.ordered_cartons, updated_at: trx.fn.now() });
            }

            await trx('aldi_daily_orders').where({ id: orderId }).update({ sent_to_rakodas: true });
        });
        
        res.json({ success: true, message: 'Rendelés átküldve a Rakodás modulba.' });
    } catch (err) {
        if (err.message === 'ORDER_NOT_FOUND') return res.status(404).json({ error: 'Rendelés nem található.' });
        if (err.message === 'SUPERSEDED_ORDER') return res.status(403).json({ error: 'Elévült rendelésverzió nem küldhető Rakodásra.' });
        if (err.message === 'ITEM_STATE_NOT_FOUND' || err.message === 'RECONCILIATION_REQUIRED') return res.status(409).json({ error: 'A rendelés egyik tétele rendezetlen; előbb rendezd a Rakodáson vagy kamionon lévő mennyiséget.' });
        console.error('Hiba a rendelés átküldése során:', err);
        res.status(500).json({ error: 'Belső szerverhiba az átküldés során' });
    }
});

module.exports = router;
