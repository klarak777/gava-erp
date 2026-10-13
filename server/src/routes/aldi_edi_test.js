const express = require('express');
const multer = require('multer');
const db = require('../db/db');
const { createArchive, MAX_BYTES } = require('../services/aldiEdiTestArchive');
const { createPoller } = require('../services/aldiEdiSftp');
const router = express.Router();
const archive = createArchive(db);
const poller = createPoller(archive);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES, files: 1, fields: 6, fieldSize: 1000 } });
const numericId = value => /^\d+$/.test(value);
const handle = action => async (req, res) => {
  try { await action(req, res); }
  catch (error) {
    console.error('[ALDI EDI test]', error.message);
    if (error.code === '42P01') return res.status(503).json({ error: 'Az EDI tesztadatbázis még nincs előkészítve. Futtasd az új migrációt.' });
    res.status(500).json({ error: 'Az EDI tesztművelet nem sikerült. Ellenőrizd a szervernaplót.' });
  }
};
router.get('/status', (_req, res) => res.json({ ...poller.status(), supportedMessageTypes: ['ORDERS'], productionReady: false }));
router.get('/files', handle(async (_req, res) => res.json(await archive.list())));
router.get('/events', handle(async (_req, res) => res.json(await db('aldi_edi_test_events').orderBy('id', 'desc').limit(100))));
router.get('/files/:id', handle(async (req, res) => {
  if (!numericId(req.params.id)) return res.status(400).json({ error: 'Érvénytelen azonosító.' });
  const detail = await archive.detail(req.params.id);
  if (!detail) return res.status(404).json({ error: 'Az EDI fájl nem található.' });
  res.json(detail);
}));
router.get('/files/:id/original', handle(async (req, res) => {
  if (!numericId(req.params.id)) return res.status(400).json({ error: 'Érvénytelen azonosító.' });
  const file = await db('aldi_edi_test_files').where({ id: req.params.id }).first();
  if (!file) return res.status(404).json({ error: 'Az EDI fájl nem található.' });
  res.set('Content-Type', 'application/octet-stream');
  res.set('Content-Disposition', `attachment; filename="edi-test-${file.id}.edi"`);
  res.send(file.raw_bytes);
}));
router.post('/upload', (req, res, next) => upload.single('file')(req, res, error => {
  if (error) return res.status(400).json({ error: 'Egyetlen, legfeljebb 5 MB méretű EDI fájl tölthető fel.' });
  next();
}), handle(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Válassz EDI tesztfájlt.' });
  if (!['delta', 'full'].includes(req.body.mode)) return res.status(400).json({ error: 'Válassz delta vagy full módot.' });
  const result = await archive.receive(req.file.buffer, req.file.originalname, req.body);
  res.status(result.status === 'failed' ? 422 : 200).json(result);
}));
router.post('/files/:id/retry', handle(async (req, res) => {
  if (!numericId(req.params.id)) return res.status(400).json({ error: 'Érvénytelen azonosító.' });
  const file = await db('aldi_edi_test_files').where({ id: req.params.id }).first();
  if (!file) return res.status(404).json({ error: 'Az EDI fájl nem található.' });
  const result = await archive.processFile(file, true);
  res.status(result.status === 'failed' ? 422 : 200).json(result);
}));
router.post('/poll', handle(async (_req, res) => {
  if (!poller.status().enabled || !poller.status().ready) return res.status(409).json({ error: 'Az SFTP tesztkapcsolat még nincs beállítva és engedélyezve.' });
  res.json(await poller.poll());
}));
router.startPolling = () => poller.start();
module.exports = router;
