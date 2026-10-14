const express = require('express');
const db = require('../db/db');
const { createAsn } = require('../services/aldiAsn');
const { createTransport } = require('../services/aldiAsnTransport');
const { profileValue, dateValue } = require('../services/aldiAsnMessage');
const router = express.Router(), asn = createAsn(db), transport = createTransport(asn);
const validId = v => /^\d+$/.test(String(v));
const handle = action => async (req, res) => {
  try { await action(req, res); }
  catch (e) { console.error('[ALDI ASN]', e.message); res.status(e.code === '42P01' ? 503 : 400).json({ error: e.code === '42P01' ? 'Az ASN adatbázis még nincs előkészítve.' : e.message }); }
};
router.get('/status', handle(async (_req, res) => res.json({ ...transport.status(), profile: await asn.getProfile(), variant: 'lpn_item', partnerAcceptanceConfirmed: false })));
router.put('/profile', handle(async (req, res) => {
  const profile = profileValue(req.body);
  if (!['test', 'live'].includes(profile.mode) || !['UNOC', 'UNOD'].includes(profile.syntax) || profile.variant !== 'lpn_item' || !['none', 'best_before', 'expiry'].includes(profile.requiredDateType)) throw new Error('Érvénytelen ASN profil.');
  await db('aldi_asn_settings').where({ id: 1 }).update({ profile: JSON.stringify(profile) });
  res.json(profile);
}));
router.get('/shipments', handle(async (_req, res) => res.json(await asn.list())));
router.get('/shipments/:id', handle(async (req, res) => {
  if (!validId(req.params.id)) throw new Error('Érvénytelen azonosító.');
  const detail = await asn.detail(req.params.id);
  if (!detail) return res.status(404).json({ error: 'Az ASN nem található.' });
  res.json(detail);
}));
router.get('/messages/:id/original', handle(async (req, res) => {
  if (!validId(req.params.id)) throw new Error('Érvénytelen azonosító.');
  const m = await db('aldi_asn_messages').where({ id: req.params.id }).first();
  if (!m) return res.status(404).json({ error: 'Az üzenet nem található.' });
  res.set('Content-Type', 'application/octet-stream').set('Content-Disposition', `attachment; filename="${m.filename}"`).send(m.raw_bytes);
}));
router.get('/trucks/:id/audit', handle(async (req, res) => { if (!validId(req.params.id)) throw new Error('Érvénytelen kamion.'); res.json(await asn.audit(req.params.id)); }));
router.put('/trucks/:id/data', handle(async (req, res) => {
  if (!validId(req.params.id) || !Array.isArray(req.body.lines) || req.body.lines.length > 1000) throw new Error('Érvénytelen ASN adatlap.');
  await db.transaction(async trx => {
    await trx('aldi_trucks').where({ id: req.params.id }).forUpdate().first();
    for (const l of req.body.lines) {
      if (!validId(l.id) || (l.reference && !/^\d{1,6}$/.test(l.reference)) || String(l.destination || '').length > 255) throw new Error('Hibás tételhivatkozás vagy célraktár.');
      const updated = await trx('aldi_truck_lines').where({ id: l.id, aldi_truck_id: req.params.id }).update({ asn_order_line_reference: l.reference || null, destination: String(l.destination || '').trim() || null });
      if (!updated) throw new Error('A kamionsor nem ehhez a kamionhoz tartozik.');
    }
    if (req.body.labels) {
      if (!Array.isArray(req.body.labels) || req.body.labels.length > 1000) throw new Error('Érvénytelen raklaplista.');
      const data = await asn.source(trx, req.params.id);
      for (const l of req.body.labels) {
        if (!data.labels.some(label => Number(label.id) === Number(l.id) && !label.is_provisional && !label.is_consolidated_master)) throw new Error('A címke nem ehhez a kamionhoz tartozik.');
        if ((l.bestBefore && !dateValue(l.bestBefore)) || (l.expiryDate && !dateValue(l.expiryDate)) || (l.bestBefore && l.expiryDate)) throw new Error('Hibás vagy kettős eltarthatósági dátum.');
        await trx('sscc_labels').where({ id: l.id }).update({ asn_best_before: l.bestBefore || null, asn_expiry_date: l.expiryDate || null });
      }
    }
  });
  res.json(await asn.audit(req.params.id));
}));
router.post('/trucks/:id/prepare', handle(async (req, res) => { if (!validId(req.params.id)) throw new Error('Érvénytelen kamion.'); res.json(await asn.prepare(req.params.id, req.body?.regenerate === true)); }));
router.post('/send-pending', handle(async (_req, res) => res.json(await transport.process())));
router.post('/messages/:id/retry', handle(async (req, res) => {
  if (!validId(req.params.id)) throw new Error('Érvénytelen azonosító.');
  await db.transaction(async trx => {
    const job = await trx('aldi_asn_jobs').where({ message_id: req.params.id }).forUpdate().first();
    if (!job || !['failed', 'retry'].includes(job.state)) throw new Error('Csak sikertelen, biztosan nem kézbesített ASN próbálható újra.');
    await trx('aldi_asn_jobs').where({ message_id: req.params.id }).update({ state: 'queued', attempts: 0, next_attempt_at: trx.fn.now(), error: null });
    const m = await trx('aldi_asn_messages').where({ id: req.params.id }).first();
    await asn.event(trx, m.shipment_id, m.id, 'queued', 'Kézi újrapróbálás ugyanazzal az archivált ASN-nel.');
  });
  res.json({ success: true });
}));
router.startSending = () => transport.start();
module.exports = router;
