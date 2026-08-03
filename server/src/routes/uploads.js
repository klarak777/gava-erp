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
router.post('/delivery-note', upload.single('file'), async (req, res) => {
    try {
        const { season, orderNumber } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'Nincs feltöltött fájl.' });
        }
        if (!season || !orderNumber) {
            return res.status(400).json({ error: 'A season és orderNumber mezők kötelezők.' });
        }

        // Elérési út összeállítása: \\192.168.1.5\raktar\MI Teszt\ERP Fuvarok\Season {season}\{orderNumber}\
        const seasonFolder = `Season ${season}`;
        const targetDir = path.join(ERP_FUVAROK_PATH, seasonFolder, orderNumber);

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

        // Fájlnév: eredeti fájlnevet megőrizzük
        const safeFileName = req.file.originalname.replace(/[<>:"/\\|?*]/g, '_');
        const targetFilePath = path.join(targetDir, safeFileName);

        // Fájl kiírása a hálózati meghajtóra
        try {
            fs.writeFileSync(targetFilePath, req.file.buffer);
        } catch (writeErr) {
            console.error('[uploads] Fájl írási hiba:', writeErr);
            return res.status(500).json({
                error: `Nem sikerült a fájlt elmenteni: ${targetFilePath}`,
                detail: writeErr.message
            });
        }

        console.log(`[uploads] Szállítólevél feltöltve: ${targetFilePath}`);

        res.json({
            success: true,
            filePath: targetFilePath,
            fileName: safeFileName,
            message: `Fájl sikeresen feltöltve: ${safeFileName}`
        });

    } catch (err) {
        console.error('[uploads] Általános hiba:', err);
        res.status(500).json({ error: 'Szerver hiba a feltöltés során.', detail: err.message });
    }
});

/**
 * GET /api/v1/uploads/delivery-note/:season/:orderNumber/check
 * Ellenőrzi, hogy van-e feltöltött szállítólevél az adott kamionhoz.
 */
router.get('/delivery-note/:season/:orderNumber/check', async (req, res) => {
    try {
        const { season, orderNumber } = req.params;
        const seasonFolder = `Season ${season}`;
        const targetDir = path.join(ERP_FUVAROK_PATH, seasonFolder, orderNumber);

        if (!fs.existsSync(targetDir)) {
            return res.json({ exists: false });
        }

        const files = fs.readdirSync(targetDir).filter(f => !fs.statSync(path.join(targetDir, f)).isDirectory());
        if (files.length > 0) {
            return res.json({ exists: true, fileName: files[0] }); // Visszaadjuk az első fájlt
        } else {
            return res.json({ exists: false });
        }
    } catch (err) {
        console.error('[uploads check] Általános hiba:', err);
        res.status(500).json({ error: 'Szerver hiba az ellenőrzés során.' });
    }
});

/**
 * GET /api/v1/uploads/delivery-note/:season/:orderNumber/:fileName
 * Letölti vagy megjeleníti a kiválasztott szállítólevelet.
 */
router.get('/delivery-note/:season/:orderNumber/:fileName', async (req, res) => {
    try {
        const { season, orderNumber, fileName } = req.params;
        const seasonFolder = `Season ${season}`;
        const targetFilePath = path.join(ERP_FUVAROK_PATH, seasonFolder, orderNumber, fileName);

        if (!fs.existsSync(targetFilePath)) {
            return res.status(404).send('A kért fájl nem található.');
        }

        res.sendFile(targetFilePath);
    } catch (err) {
        console.error('[uploads get] Általános hiba:', err);
        res.status(500).send('Szerver hiba a fájl lekérése során.');
    }
});

/**
 * GET /api/v1/uploads/delivery-note/:season/:orderNumber/:fileName/html
 * DOCX fájl HTML nézetének lekérése mammoth segítségével
 */
router.get('/delivery-note/:season/:orderNumber/:fileName/html', async (req, res) => {
    try {
        const { season, orderNumber, fileName } = req.params;
        const seasonFolder = `Season ${season}`;
        const targetFilePath = path.join(ERP_FUVAROK_PATH, seasonFolder, orderNumber, fileName);

        if (!fs.existsSync(targetFilePath)) {
            return res.status(404).json({ error: 'A kért fájl nem található.' });
        }

        if (fileName.toLowerCase().endsWith('.docx')) {
            const result = await mammoth.convertToHtml({ path: targetFilePath });
            res.json({ html: result.value });
        } else {
            res.status(400).json({ error: 'Nem DOCX fájl.' });
        }
    } catch (err) {
        console.error('[uploads docx html] Hiba:', err);
        res.status(500).json({ error: 'Szerver hiba a DOCX feldolgozása során.' });
    }
});

module.exports = router;
