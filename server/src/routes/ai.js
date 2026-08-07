const express = require('express');
const router = express.Router();
const multer = require('multer');
const aiService = require('../services/aiService');

// Use memory storage for quick parsing without saving to disk
// Méretkorlát: 25 MB – védelem a memória felzabálása ellen
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

// Upload a document and process it (Vectorize or Parse)
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nincs feltöltött fájl.' });
    }

    const { originalname, buffer, mimetype } = req.file;
    const result = await aiService.processDocument(originalname, buffer, mimetype);

    res.json({
      success: true,
      message: 'Fájl sikeresen feldolgozva.',
      documentId: result.documentId,
      category: result.category
    });
  } catch (error) {
    console.error('AI Upload Error:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'A fájl túl nagy (maximum 25 MB).' });
    }
    res.status(500).json({ error: 'Hiba a fájl feldolgozása során.', details: error.message });
  }
});

// Get available interaction options based on document category
router.get('/options/:documentId', async (req, res) => {
  try {
    const documentId = parseInt(req.params.documentId, 10);
    if (isNaN(documentId)) {
      return res.status(400).json({ error: 'Érvénytelen dokumentum ID.' });
    }
    const options = await aiService.getOptionsForDocument(documentId);
    res.json({ success: true, options });
  } catch (error) {
    console.error('AI Options Error:', error);
    res.status(500).json({ error: 'Hiba az opciók lekérésekor.', details: error.message });
  }
});

// Chat with the AI – Server-Sent Events streaming válasszal
// Események: {"delta": "..."} részletek, végén [DONE], hiba esetén {"error": "..."}
router.post('/chat', async (req, res) => {
  const { documentId, message, optionId, history, uiContext } = req.body || {};

  if (!message && !optionId) {
    return res.status(400).json({ error: 'Hiányzó üzenet vagy opció azonosító.' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  const sendEvent = (eventObj) => {
    res.write(`data: ${JSON.stringify(eventObj)}\n\n`);
  };

  try {
    const safeHistory = Array.isArray(history) ? history.slice(-10) : [];
    await aiService.generateChatResponse(documentId, message, optionId, safeHistory, uiContext, sendEvent);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message || 'Hiba a válasz generálásakor.' })}\n\n`);
    res.end();
  }
});

// Delete a temporary document and its vectors
router.delete('/documents/:documentId', async (req, res) => {
  try {
    const documentId = parseInt(req.params.documentId, 10);
    if (!isNaN(documentId)) {
      await aiService.deleteDocument(documentId);
    }
    res.json({ success: true, message: 'Dokumentum sikeresen törölve az adatbázisból.' });
  } catch (error) {
    console.error('AI Delete Doc Error:', error);
    res.status(500).json({ error: 'Hiba a dokumentum törlésekor.' });
  }
});

// Execute an AI proposed action (Human-in-the-loop)
router.post('/actions/execute', async (req, res) => {
  try {
    const { action_name, payload, decision } = req.body;
    // decision: 'approve' or 'reject'
    if (!action_name || !payload || !decision) {
      return res.status(400).json({ error: 'Hiányzó action_name, payload vagy decision.' });
    }

    const result = await aiService.executeAiAction(action_name, payload, decision, req.user?.id || 'system');
    res.json({ success: true, result });
  } catch (error) {
    console.error('AI Action Execution Error:', error);
    res.status(500).json({ error: 'Hiba a művelet végrehajtásakor.', details: error.message });
  }
});

module.exports = router;
