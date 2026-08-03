const express = require('express');
const mammoth = require('mammoth');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
                const safeFileName = file.originalname.replace(/[<>:"/\\|?*]/g, '_');
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

module.exports = router;
