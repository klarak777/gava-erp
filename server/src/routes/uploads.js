const express = require('express');
const mammoth = require('mammoth');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/db');

// ─── Konfiguráció ────────────────────────────────────────────────────────────
// Hálózati meghajtó alapútvonala (env-ből vagy alapértelmezett)
const RAKTAR_BASE = process.env.RAKTAR_PATH || '\\\\192.168.1.5\\raktar';
const ERP_FUVAROK_PATH = path.join(RAKTAR_BASE, 'MI Teszt', 'ERP Fuvarok');

// Multer: memóriába tölti fel a fájlt, majd mi írjuk ki a hálózati meghajtóra
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // max 50 MB
});

/**
 * POST /api/v1/uploads/delivery-note
 * Szállítólevél feltöltése hálózati meghajtóra.
 *
 * Body (multipart/form-data):
 *   - file: A feltöltendő fájl
 *   - season: A szezon neve (pl. "25-26")
 *   - orderNumber: A fuvar Order Number (pl. "LOG355")
 *
 * Válasz:
 *   - filePath: Az elmentett fájl teljes UNC elérési útja
 *   - fileName: A fájl neve
 */
router.post('/delivery-note', upload.array('files', 10), async (req, res) => {
    try {
        const { season, orderNumber, customerOrderNo } = req.body;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'Nincs feltöltött fájl.' });
        }
        if (!season || !orderNumber) {
            return res.status(400).json({ error: 'A season és orderNumber mezők kötelezők.' });
        }

        // Elérési út összeállítása: \\192.168.1.5\raktar\MI Teszt\ERP Fuvarok\Season {season}\{orderNumber}\{customerOrderNo}\
        const seasonFolder = `Season ${season}`;
        let targetDir = path.join(ERP_FUVAROK_PATH, seasonFolder, orderNumber);
        
        // Ha van customerOrderNo, almappába tesszük
        if (customerOrderNo && customerOrderNo.trim() !== '') {
            targetDir = path.join(targetDir, customerOrderNo.trim());
        }

        // Mappa létrehozása, ha nem létezik
        try {
            fs.mkdirSync(targetDir, { recursive: true });
        } catch (mkdirErr) {
            console.error('[uploads] Mappa létrehozási hiba:', mkdirErr);
            return res.status(500).json({
                error: `Nem sikerült létrehozni a mappát: ${targetDir}`,
                detail: mkdirErr.message
            });
        }

        const uploadedFiles = [];

        // Fájlok kiírása a hálózati meghajtóra
        try {
            for (const file of req.files) {
                const originalnameUtf8 = Buffer.from(file.originalname, 'latin1').toString('utf8');
                const safeFileName = originalnameUtf8.replace(/[<>:"/\\|?*]/g, '_');
                const targetFilePath = path.join(targetDir, safeFileName);
                fs.writeFileSync(targetFilePath, file.buffer);
                uploadedFiles.push(safeFileName);
            }
        } catch (writeErr) {
            console.error('[uploads] Fájl írási hiba:', writeErr);
            return res.status(500).json({
                error: `Nem sikerült a fájlokat elmenteni a célkönyvtárba.`,
                detail: writeErr.message
            });
        }

        console.log(`[uploads] Szállítólevelek feltöltve: ${uploadedFiles.join(', ')}`);

        res.json({
            success: true,
            files: uploadedFiles,
            message: `${uploadedFiles.length} fájl sikeresen feltöltve.`
        });

    } catch (err) {
        console.error('[uploads] Általános hiba:', err);
        res.status(500).json({ error: 'Szerver hiba a feltöltés során.', detail: err.message });
    }
});

/**
 * POST /api/v1/uploads/invoice
 * Számla (Invoice) feltöltése hálózati meghajtóra és adatbázisba.
 */
router.post('/invoice', upload.array('files', 10), async (req, res) => {
    try {
        const { season, orderNumber, invoiceNumber, shipmentId } = req.body;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'Nincs feltöltött fájl.' });
        }
        if (!season || !orderNumber || !invoiceNumber || !shipmentId) {
            return res.status(400).json({ error: 'A season, orderNumber, invoiceNumber és shipmentId mezők kötelezők.' });
        }

        const seasonFolder = `Season ${season}`;
        // Almappa a kérés szerint: kamionszám (orderNumber) azon belül invoiceNumber
        const targetDir = path.join(ERP_FUVAROK_PATH, seasonFolder, orderNumber, invoiceNumber.trim());

        try {
            fs.mkdirSync(targetDir, { recursive: true });
        } catch (mkdirErr) {
            console.error('[uploads] Számla mappa létrehozási hiba:', mkdirErr);
            return res.status(500).json({ error: `Nem sikerült létrehozni a mappát: ${targetDir}`, detail: mkdirErr.message });
        }

        const uploadedFiles = [];
        const newDbEntries = [];

        try {
            for (const file of req.files) {
                const originalnameUtf8 = Buffer.from(file.originalname, 'latin1').toString('utf8');
                const safeFileName = originalnameUtf8.replace(/[<>:"/\\|?*]/g, '_');
                const targetFilePath = path.join(targetDir, safeFileName);
                fs.writeFileSync(targetFilePath, file.buffer);
                uploadedFiles.push(safeFileName);
                newDbEntries.push({
                    fileName: safeFileName,
                    filePath: targetFilePath
                });
            }
        } catch (writeErr) {
            console.error('[uploads] Számla fájl írási hiba:', writeErr);
            return res.status(500).json({ error: `Nem sikerült a fájlokat elmenteni.`, detail: writeErr.message });
        }

        // Adatbázis frissítése
        const shipment = await db('shipments').where('id', shipmentId).first();
        let currentFiles = [];
        if (shipment && shipment.invoice_files) {
            currentFiles = typeof shipment.invoice_files === 'string' ? JSON.parse(shipment.invoice_files) : shipment.invoice_files;
        }
        if (!Array.isArray(currentFiles)) currentFiles = [];
        
        currentFiles.push(...newDbEntries);
        
        await db('shipments').where('id', shipmentId).update({
            invoice_files: JSON.stringify(currentFiles)
        });

        console.log(`[uploads] Számlák feltöltve és adatbázisba mentve: ${uploadedFiles.join(', ')}`);

        res.json({
            success: true,
            files: currentFiles,
            message: `${uploadedFiles.length} fájl sikeresen feltöltve.`
        });

    } catch (err) {
        console.error('[uploads] Általános hiba számla feltöltéskor:', err);
        res.status(500).json({ error: 'Szerver hiba a feltöltés során.', detail: err.message });
    }
});


/**
 * GET /api/v1/uploads/delivery-note/:season/:orderNumber/:customerOrderNo/check
 * Ellenőrzi, hogy van-e feltöltött szállítólevél az adott kamionhoz/tételhez.
 */
router.get('/delivery-note/check', async (req, res) => {
    try {
        const { season, orderNumber, customerOrderNo } = req.query;
        await handleCheck(season, orderNumber, customerOrderNo, req, res);
    } catch (err) {
        console.error('[uploads check] Általános hiba:', err);
        res.status(500).json({ error: 'Szerver hiba az ellenőrzés során.' });
    }
});

router.get('/delivery-note/:season/:orderNumber/check', async (req, res) => {
    try {
        const { season, orderNumber } = req.params;
        await handleCheck(season, orderNumber, 'none', req, res);
    } catch (err) {
        console.error('[uploads check] Általános hiba:', err);
        res.status(500).json({ error: 'Szerver hiba az ellenőrzés során.' });
    }
});

router.get('/delivery-note/:season/:orderNumber/:customerOrderNo/check', async (req, res) => {
    try {
        const { season, orderNumber, customerOrderNo } = req.params;
        await handleCheck(season, orderNumber, customerOrderNo, req, res);
    } catch (err) {
        console.error('[uploads check] Általános hiba:', err);
        res.status(500).json({ error: 'Szerver hiba az ellenőrzés során.' });
    }
});

async function handleCheck(season, orderNumber, customerOrderNo, req, res) {
    const seasonFolder = `Season ${season}`;
    
    // Ha a customerOrderNo = "none", akkor az alap kamion mappát nézzük (visszafele kompatibilitás)
    let targetDir = path.join(ERP_FUVAROK_PATH, seasonFolder, orderNumber);
    if (customerOrderNo && customerOrderNo !== 'none') {
        targetDir = path.join(targetDir, customerOrderNo);
    }

    if (!fs.existsSync(targetDir)) {
        return res.json({ exists: false });
    }

    const files = fs.readdirSync(targetDir).filter(f => !fs.statSync(path.join(targetDir, f)).isDirectory());
    if (files.length > 0) {
        return res.json({ exists: true, files: files }); // Visszaadjuk az összes fájlt
    } else {
        return res.json({ exists: false });
    }
}

/**
 * GET /api/v1/uploads/delivery-note/:season/:orderNumber/:customerOrderNo/:fileName
 * Letölti vagy megjeleníti a kiválasztott szállítólevelet.
 */
router.get('/delivery-note/file', async (req, res) => {
    try {
        const { season, orderNumber, customerOrderNo, fileName } = req.query;
        await handleFile(season, orderNumber, customerOrderNo, fileName, req, res);
    } catch (err) {
        console.error('[uploads get] Általános hiba:', err);
        res.status(500).send('Szerver hiba a fájl lekérése során.');
    }
});

router.get('/delivery-note/:season/:orderNumber/:fileName', async (req, res) => {
    try {
        const { season, orderNumber, fileName } = req.params;
        await handleFile(season, orderNumber, 'none', fileName, req, res);
    } catch (err) {
        console.error('[uploads get] Általános hiba:', err);
        res.status(500).send('Szerver hiba a fájl lekérése során.');
    }
});

router.get('/delivery-note/:season/:orderNumber/:customerOrderNo/:fileName', async (req, res) => {
    try {
        const { season, orderNumber, customerOrderNo, fileName } = req.params;
        await handleFile(season, orderNumber, customerOrderNo, fileName, req, res);
    } catch (err) {
        console.error('[uploads get] Általános hiba:', err);
        res.status(500).send('Szerver hiba a fájl lekérése során.');
    }
});

async function handleFile(season, orderNumber, customerOrderNo, fileName, req, res) {
    const seasonFolder = `Season ${season}`;
    
    let targetDir = path.join(ERP_FUVAROK_PATH, seasonFolder, orderNumber);
    if (customerOrderNo && customerOrderNo !== 'none') {
        targetDir = path.join(targetDir, customerOrderNo);
    }
    const targetFilePath = path.join(targetDir, fileName);

    if (!fs.existsSync(targetFilePath)) {
        return res.status(404).send('A kért fájl nem található.');
    }

    res.sendFile(targetFilePath);
}

/**
 * GET /api/v1/uploads/delivery-note/:season/:orderNumber/:customerOrderNo/:fileName/html
 * DOCX fájl HTML nézetének lekérése mammoth segítségével
 */
router.get('/delivery-note/html', async (req, res) => {
    try {
        const { season, orderNumber, customerOrderNo, fileName } = req.query;
        await handleHtml(season, orderNumber, customerOrderNo, fileName, req, res);
    } catch (err) {
        console.error('[uploads docx-to-html] Általános hiba:', err);
        res.status(500).json({ error: 'Szerver hiba a konverzió során.' });
    }
});

router.get('/delivery-note/:season/:orderNumber/:fileName/html', async (req, res) => {
    try {
        const { season, orderNumber, fileName } = req.params;
        await handleHtml(season, orderNumber, 'none', fileName, req, res);
    } catch (err) {
        console.error('[uploads docx-to-html] Általános hiba:', err);
        res.status(500).json({ error: 'Szerver hiba a konverzió során.' });
    }
});

router.get('/delivery-note/:season/:orderNumber/:customerOrderNo/:fileName/html', async (req, res) => {
    try {
        const { season, orderNumber, customerOrderNo, fileName } = req.params;
        await handleHtml(season, orderNumber, customerOrderNo, fileName, req, res);
    } catch (err) {
        console.error('[uploads docx-to-html] Általános hiba:', err);
        res.status(500).json({ error: 'Szerver hiba a konverzió során.' });
    }
});

async function handleHtml(season, orderNumber, customerOrderNo, fileName, req, res) {
    const seasonFolder = `Season ${season}`;
    
    let targetDir = path.join(ERP_FUVAROK_PATH, seasonFolder, orderNumber);
    if (customerOrderNo && customerOrderNo !== 'none') {
        targetDir = path.join(targetDir, customerOrderNo);
    }
    const targetFilePath = path.join(targetDir, fileName);

    if (!fs.existsSync(targetFilePath)) {
        return res.status(404).json({ error: 'A kért fájl nem található.' });
    }

    const ext = fileName.split('.').pop().toLowerCase();
    if (ext !== 'docx') {
        return res.status(400).json({ error: 'A kért fájl nem DOCX formátumú.' });
    }

    const mammoth = require('mammoth');
    const result = await mammoth.convertToHtml({ path: targetFilePath });
    res.json({ html: result.value });
}

/**
 * GET /api/v1/uploads/invoice/file
 * Letölti vagy megjeleníti a kiválasztott számlát (Invoice).
 */
router.get('/invoice/file', async (req, res) => {
    try {
        const { shipmentId, fileName } = req.query;
        if (!shipmentId || !fileName) {
            return res.status(400).send('Hiányzó paraméterek.');
        }

        const shipment = await db('shipments').where('id', shipmentId).first();
        if (!shipment || !shipment.invoice_files) {
            return res.status(404).send('Nem található számla fájl az adatbázisban.');
        }

        let files = typeof shipment.invoice_files === 'string' ? JSON.parse(shipment.invoice_files) : shipment.invoice_files;
        if (!Array.isArray(files)) files = [];

        const fileRecord = files.find(f => f.fileName === fileName);
        if (!fileRecord) {
            return res.status(404).send('A kért fájl nem található a nyilvántartásban.');
        }

        if (!fs.existsSync(fileRecord.filePath)) {
            return res.status(404).send('A kért fájl fizikailag nem található a lemezen.');
        }

        res.sendFile(fileRecord.filePath);
    } catch (err) {
        console.error('[uploads invoice get] Általános hiba:', err);
        res.status(500).send('Szerver hiba a fájl lekérése során.');
    }
});

/**
 * DELETE /api/v1/uploads/invoice/file
 * Törli a megadott számlafájlt (fizikailag és az adatbázisból).
 * Query params: shipmentId, fileName
 */
router.delete('/invoice/file', async (req, res) => {
    try {
        const { shipmentId, fileName } = req.query;
        if (!shipmentId || !fileName) {
            return res.status(400).json({ error: 'Hiányzó paraméterek.' });
        }

        const shipment = await db('shipments').where('id', shipmentId).first();
        if (!shipment || !shipment.invoice_files) {
            return res.status(404).json({ error: 'Nem található számla fájl.' });
        }

        let files = typeof shipment.invoice_files === 'string' ? JSON.parse(shipment.invoice_files) : shipment.invoice_files;
        if (!Array.isArray(files)) files = [];

        const fileRecord = files.find(f => f.fileName === fileName);
        if (!fileRecord) {
            return res.status(404).json({ error: 'A megadott fájl nem található a nyilvántartásban.' });
        }

        // Fizikai törlés
        if (fs.existsSync(fileRecord.filePath)) {
            fs.unlinkSync(fileRecord.filePath);
        }

        // Adatbázis frissítése
        const updatedFiles = files.filter(f => f.fileName !== fileName);
        await db('shipments').where('id', shipmentId).update({
            invoice_files: JSON.stringify(updatedFiles)
        });

        // Ha nincs több fájl, töröljük az invoice_number-t is
        if (updatedFiles.length === 0) {
            await db('shipments').where('id', shipmentId).update({ invoice_number: null });
        }

        res.json({ success: true, files: updatedFiles, message: 'Számlafájl sikeresen törölve.' });
    } catch (err) {
        console.error('[uploads invoice delete] Hiba:', err);
        res.status(500).json({ error: 'Szerver hiba a törlés során.' });
    }
});

/**
 * DELETE /api/v1/uploads/delivery-note/file
 * Törli a megadott szállítólevél fájlt fizikailag.
 * Body: { filePath, season, orderNumber, customerOrderNo, fileName }
 */
router.delete('/delivery-note/file', async (req, res) => {
    try {
        const { filePath, fileName } = req.body;
        if (!filePath && !fileName) {
            return res.status(400).json({ error: 'Hiányzó paraméterek.' });
        }

        const raktarPath = process.env.RAKTAR_PATH || path.join('\\\\192.168.1.5', 'raktar');
        let targetPath = filePath;

        // Ellenőrizzük és cseréljük a Windows network path-t Linux-ra ha szükséges
        if (targetPath && process.platform !== 'win32') {
            targetPath = targetPath.replace(/\\\\/g, '/').replace(/\\/g, '/');
            if (!path.isAbsolute(targetPath)) {
                targetPath = path.join(raktarPath, targetPath);
            }
        }

        if (!targetPath || !fs.existsSync(targetPath)) {
            return res.status(404).json({ error: 'A fájl nem található a lemezen.' });
        }

        fs.unlinkSync(targetPath);
        res.json({ success: true, message: 'Szállítólevél fájl sikeresen törölve.' });
    } catch (err) {
        console.error('[uploads delivery-note delete] Hiba:', err);
        res.status(500).json({ error: 'Szerver hiba a törlés során.' });
    }
});

module.exports = router;
