const test = require('node:test');
const assert = require('node:assert/strict');
const knex = require('knex');
const express = require('express');
const path = require('node:path');
const { chromium } = require('playwright');
const { parseOrders } = require('../src/services/aldiEdiOrders');
const { createArchive } = require('../src/services/aldiEdiTestArchive');
const migration = require('../src/db/migrations/20261013000001_create_aldi_edi_test_archive');
const { order, interchange } = require('./helpers/aldiEdiFixtures.cjs');

const connection = process.env.ALDI_EDI_TEST_DATABASE_URL;
test('EDI archive and HTTP upload on isolated PostgreSQL', { skip: !connection }, async t => {
  const url = new URL(connection);
  assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname) && url.pathname === '/edi_test', 'Use only the dedicated local edi_test database');
  const schema = 'edi_test_' + Date.now();
  const db = knex({ client: 'pg', connection, searchPath: [schema], pool: { min: 0, max: 5 } });
  t.after(async () => { await db.raw('DROP SCHEMA IF EXISTS ?? CASCADE', [schema]); await db.destroy(); });
  await db.raw('CREATE SCHEMA ??', [schema]);
  await migration.up(db);
  const archive = createArchive(db), profile = { mode: 'delta' };

  await t.test('original bytes, all versions, changes and duplicate receipts persist independently', async () => {
    const original = interchange();
    const first = await archive.receive(original, 'original.edi', profile);
    assert.equal(first.status, 'processed');
    assert.deepEqual((await db('aldi_edi_test_files').where('id', first.fileId).first()).raw_bytes, original);
    const second = await archive.receive(interchange([order({ kind: '230', version: 2, items: [['3', 40], ['3', 52]] })], { control: 'TEST2' }), 'change.edi', profile);
    assert.equal(second.status, 'processed');
    assert.deepEqual((await archive.detail(second.fileId)).versions[0].snapshot.changes.map(c => c.delta), [20, 8]);
    const third = await archive.receive(interchange([order({ kind: '230', version: 3, items: [['2', 40]] })], { control: 'TEST3' }), 'delete.edi', profile);
    assert.deepEqual((await archive.detail(third.fileId)).versions[0].snapshot.items.map(i => i.quantity), [0, 52]);
    const again = await archive.receive(original, 'same-message.edi', profile);
    assert.equal(again.status, 'duplicate');
    assert.equal(again.fileId, first.fileId);
    const retry = await archive.processFile(await db('aldi_edi_test_files').where('id', first.fileId).first(), true);
    assert.equal(retry.status, 'duplicate');
    assert.equal((await archive.list()).find(f => f.id === first.fileId).status, 'processed');
    assert.deepEqual((await archive.detail(first.fileId)).events.map(e => e.status), ['received', 'processing', 'processed', 'duplicate', 'duplicate']);
    assert.equal((await db('aldi_edi_test_versions')).length, 3);
  });

  await t.test('invalid files and their blocking errors stay archived', async () => {
    const bytes = Buffer.from('invalid original content');
    const result = await archive.receive(bytes, 'bad.edi', profile);
    assert.equal(result.status, 'failed');
    const detail = await archive.detail(result.fileId);
    assert.equal(detail.originalText, bytes.toString());
    assert.deepEqual(detail.events.map(e => e.status), ['received', 'failed']);
    assert.equal(detail.versions.length, 0);
  });

  await t.test('a bad message rolls back every processed order in its interchange', async () => {
    const result = await archive.receive(interchange([order({ orderNumber: 'ATOMIC' }), order({ orderNumber: 'MISSING', kind: '230', version: 2, items: [['3', 40]] })], { control: 'ATOMIC' }), 'atomic.edi', profile);
    assert.equal(result.status, 'failed');
    assert.equal((await archive.detail(result.fileId)).versions.length, 0);
    assert.equal((await db('aldi_edi_test_versions').where('order_number', 'ATOMIC')).length, 0);
  });

  await t.test('an out of order change can be retried after its original arrives', async () => {
    const failed = await archive.receive(interchange([order({ orderNumber: 'LATE', kind: '230', version: 2, items: [['3', 40]] })], { control: 'LATE2' }), 'late-change.edi', profile);
    assert.equal(failed.status, 'failed');
    await archive.receive(interchange([order({ orderNumber: 'LATE' })], { control: 'LATE1' }), 'late-original.edi', profile);
    const result = await archive.processFile(await db('aldi_edi_test_files').where('id', failed.fileId).first(), true);
    assert.equal(result.status, 'processed');
    assert.deepEqual((await archive.detail(failed.fileId)).events.map(e => e.status), ['received', 'failed', 'processing', 'processed']);
  });

  await t.test('concurrent duplicate imports never create two versions', async () => {
    const bytes = interchange([order({ orderNumber: 'CONCURRENT' })], { control: 'CONCURRENT' });
    const results = await Promise.all([archive.receive(bytes, 'concurrent.edi', profile), archive.receive(bytes, 'concurrent-again.edi', profile)]);
    assert.ok(results.some(r => r.status === 'processed'));
    assert.ok(results.some(r => r.status === 'duplicate'));
    assert.equal((await db('aldi_edi_test_versions').where('order_number', 'CONCURRENT')).length, 1);
  });

  await t.test('SFTP retries a missing predecessor without losing the earlier failed attempt', async () => {
    const bytes = interchange([order({ orderNumber: 'SFTP-LATE', kind: '230', version: 2, items: [['3', 40]] })], { control: 'SFTPLATE2' });
    const failed = await archive.receive(bytes, 'sftp-late.edi', profile, 'sftp');
    assert.equal(failed.retryable, true);
    await archive.receive(interchange([order({ orderNumber: 'SFTP-LATE' })], { control: 'SFTPLATE1' }), 'sftp-original.edi', profile, 'sftp');
    const retry = await archive.receive(bytes, 'sftp-late.edi', profile, 'sftp');
    assert.equal(retry.status, 'processed');
    assert.deepEqual((await archive.detail(failed.fileId)).events.map(e => e.status), ['received', 'failed', 'duplicate', 'processing', 'processed']);
  });

  await t.test('UPDATE, DELETE and TRUNCATE are rejected for original, snapshot and log', async () => {
    for (const table of ['aldi_edi_test_files', 'aldi_edi_test_versions', 'aldi_edi_test_events']) {
      const first = await db(table).first();
      await assert.rejects(db(table).where('id', first.id).update({ id: first.id }), /nem módosíthatók/);
      await assert.rejects(db(table).where('id', first.id).delete(), /nem módosíthatók/);
      await assert.rejects(db.raw('TRUNCATE ?? CASCADE', [table]), /nem módosíthatók/);
    }
    await assert.rejects(migration.down(db), /nem vonható vissza/);
  });

  // Use the real router with the isolated database, without connecting to the ERP database.
  const dbPath = require.resolve('../src/db/db');
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: db };
  const router = require('../src/routes/aldi_edi_test');
  const app = express(); app.use('/api/v1/aldi-edi-test', router);
  app.use('/src', express.static(path.resolve(__dirname, '../../Access UI/src')));
  app.get('/edi-browser-test', (_req, res) => res.type('html').send('<html><body><div id="edi"></div><script type="module">import { renderAldiEdiTest } from "/src/modules/aldi_edi_test.js"; renderAldiEdiTest(document.querySelector("#edi"));</script></body></html>'));
  const server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
  const base = `http://127.0.0.1:${server.address().port}/api/v1/aldi-edi-test`;
  await t.test('HTTP multipart upload, original download, detail, invalid file and SFTP status', async () => {
    const bytes = interchange([order({ orderNumber: 'HTTP' })], { control: 'HTTP1' });
    const body = new FormData(); body.append('file', new Blob([bytes]), 'http.edi'); body.append('mode', 'delta');
    const response = await fetch(base + '/upload', { method: 'POST', body });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.status, 'processed');
    const download = await fetch(`${base}/files/${result.fileId}/original`);
    assert.deepEqual(Buffer.from(await download.arrayBuffer()), bytes);
    const detail = await (await fetch(`${base}/files/${result.fileId}`)).json();
    assert.equal(detail.versions[0].snapshot.orderNumber, 'HTTP');
    assert.equal(detail.originalText, bytes.toString('latin1'));
    const broken = new FormData(); broken.append('file', new Blob(['bad bytes']), 'bad-http.edi'); broken.append('mode', 'delta');
    const invalid = await fetch(base + '/upload', { method: 'POST', body: broken });
    assert.equal(invalid.status, 422);
    assert.ok((await invalid.json()).fileId);
    assert.equal((await fetch(base + '/files/invalid')).status, 400);
    assert.equal((await fetch(base + '/files/99999999')).status, 404);
    const status = await (await fetch(base + '/status')).json();
    assert.equal(status.productionReady, false);
    assert.equal(status.enabled, false);
    assert.equal((await fetch(base + '/poll', { method: 'POST' })).status, 409);
  });

  await t.test('real browser uploads original, change and deletion; errors remain visible and archived', async () => {
    const browser = await chromium.launch({ headless: true });
    t.after(() => browser.close());
    const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(base.replace('/api/v1/aldi-edi-test', '/edi-browser-test'));
    await page.waitForFunction(() => document.querySelector('[data-edi="status"]')?.textContent.includes('60 perc'));
    assert.equal(await page.locator('[data-edi="poll"]').isDisabled(), true);
    assert.equal(await page.locator('select[name="mode"]').inputValue(), 'full');
    await page.locator('select[name="mode"]').selectOption('delta');
    const upload = async (bytes, name) => {
      await page.locator('input[name="file"]').setInputFiles({ name, mimeType: 'application/octet-stream', buffer: bytes });
      await Promise.all([page.waitForResponse(r => r.url() === base + '/upload'), page.getByRole('button', { name: 'Tesztfájl feldolgozása', exact: true }).click()]);
      await page.waitForFunction(() => !document.querySelector('[data-edi="form"] button').disabled);
    };
    await upload(interchange([order({ orderNumber: 'BROWSER' })], { control: 'BROWSER1' }), 'browser-original.edi');
    assert.match(await page.locator('[data-edi="detail"]').textContent(), /BROWSER.*Tesztverzió: 1/s);
    await upload(interchange([order({ orderNumber: 'BROWSER', kind: '230', version: 2, items: [['3', 40], ['3', 52]] })], { control: 'BROWSER2' }), 'browser-change.edi');
    assert.match(await page.locator('[data-edi="detail"]').textContent(), /\+20/);
    assert.match(await page.locator('[data-edi="detail"]').textContent(), /\+8/);
    await upload(interchange([order({ orderNumber: 'BROWSER', kind: '230', version: 3, items: [['2', 40]] })], { control: 'BROWSER3' }), 'browser-delete.edi');
    assert.match(await page.locator('[data-edi="detail"]').textContent(), /Törölt/);
    assert.match(await page.locator('[data-edi="detail"]').textContent(), /-40/);
    await upload(Buffer.from('<img src=x onerror="window.unsafeExecuted=true">'), 'broken.edi');
    assert.match(await page.locator('[data-edi="feedback"]').textContent(), /UNA szervizfejléc/);
    assert.match(await page.locator('[data-edi="detail"]').textContent(), /broken.edi/);
    assert.equal(await page.locator('[data-edi="detail"] img').count(), 0);
    assert.equal(await page.evaluate(() => window.unsafeExecuted), undefined);
    await page.locator('[data-edi="samples"]').click();
    const links = page.locator('[data-edi="sample-links"] a');
    assert.equal(await links.count(), 4);
    const samplePayloads = await links.evaluateAll(async anchors => Promise.all(anchors.map(async a => (await fetch(a.href)).text())));
    let previous = null;
    const { applyOrderMessage } = require('../src/services/aldiEdiOrders');
    assert.equal(await page.locator('select[name="mode"]').inputValue(), 'full');
    for (const payload of samplePayloads) previous = applyOrderMessage(previous, parseOrders(Buffer.from(payload)).messages[0], 'full');
    assert.equal(previous.internalVersion, 4);
    assert.deepEqual(previous.items.map(i => i.quantity), [0, 0]);
    assert.deepEqual(errors, []);
  });
});
