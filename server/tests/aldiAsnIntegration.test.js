const test = require('node:test');
const assert = require('node:assert/strict');
const knex = require('knex');
const express = require('express');
const path = require('node:path');
const { chromium } = require('playwright');
const { profile } = require('./helpers/aldiAsnFixtures.cjs');
const { generateSscc } = require('../src/utils/gs1');
const migration = require('../src/db/migrations/20261014000001_create_aldi_asn');
const { createAsn } = require('../src/services/aldiAsn');
const { createTransport } = require('../src/services/aldiAsnTransport');
const connection = process.env.ALDI_EDI_TEST_DATABASE_URL;
test('Warehouse ASN lifecycle on isolated PostgreSQL, real HTTP and browser', { skip: !connection }, async t => {
  const url = new URL(connection);
  assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname) && url.pathname === '/edi_test');
  const schema = 'asn_test_' + Date.now();
  const db = knex({ client: 'pg', connection, searchPath: [schema], pool: { min: 0, max: 5 } });
  t.after(async () => { await db.raw('DROP SCHEMA ?? CASCADE', [schema]); await db.destroy(); });
  await db.raw('CREATE SCHEMA ??', [schema]);
  await db.schema.createTable('aldi_trucks', b => { b.increments('id'); b.string('truck_number'); b.date('delivery_date'); b.boolean('is_loaded').defaultTo(false); b.timestamps(true, true); });
  await db.schema.createTable('aldi_order_families', b => { b.increments('id'); b.string('base_order_number'); });
  await db.schema.createTable('aldi_daily_orders', b => { b.increments('id'); b.integer('order_family_id'); });
  await db.schema.createTable('aldi_daily_order_lines', b => { b.increments('id'); b.integer('daily_order_id'); b.string('gtin'); b.integer('ordered_cartons'); b.integer('fulfilled_cartons').defaultTo(0); });
  await db.schema.createTable('aldi_truck_lines', b => { b.increments('id'); b.integer('aldi_truck_id'); b.integer('aldi_daily_order_line_id'); b.string('product_name'); b.string('destination'); b.integer('ordered_cartons'); b.integer('picked_cartons'); b.decimal('pallets'); });
  await db.schema.createTable('aldi_commission_lines', b => { b.increments('id'); b.integer('aldi_truck_id'); b.integer('aldi_truck_line_id'); b.string('product_name'); b.integer('cartons'); b.integer('pallets'); b.string('lot_number'); });
  await db.schema.createTable('aldi_stock_locations', b => { b.increments('id'); b.integer('commission_line_id'); b.integer('truck_line_id'); });
  await db.schema.createTable('sscc_labels', b => { b.increments('id'); b.string('sscc'); b.integer('commission_line_id'); b.integer('aldi_truck_line_id'); b.integer('picked_cartons'); b.boolean('is_provisional'); b.boolean('is_consolidated_master'); b.string('consolidated_sscc'); b.text('pallets_json'); b.string('lot_number'); b.timestamp('reservation_cancelled_at'); });
  await migration.up(db);
  await db('aldi_asn_settings').where({ id: 1 }).update({ profile: JSON.stringify(profile) });
  const dbPath = require.resolve('../src/db/db');
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: db };
  const app = express(); app.use(express.json());
  app.use('/api/v1/aldi-cross-docking', require('../src/routes/aldi_cross_docking'));
  app.use('/api/v1/aldi-asn', require('../src/routes/aldi_asn'));
  app.use('/src', express.static(path.resolve(__dirname, '../../Access UI/src')));
  app.get('/asn-test', (_req, res) => res.type('html').send('<div id="asn"></div><script type="module">import {renderAldiAsn} from "/src/modules/aldi_asn.js";renderAldiAsn(document.querySelector("#asn"));</script>'));
  const server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  async function call(route, body, method = 'POST') {
    const r = await fetch(base + route, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return { status: r.status, data: await r.json() };
  }
  let serial = 0;
  async function seed(withLabel = true) {
    const id = ++serial;
    await db('aldi_order_families').insert({ id, base_order_number: '450000' + id });
    await db('aldi_daily_orders').insert({ id, order_family_id: id });
    await db('aldi_daily_order_lines').insert({ id, daily_order_id: id, gtin: '4061462846892', ordered_cartons: 100, edi_line_reference: '00040' });
    await db('aldi_trucks').insert({ id, truck_number: 'ASN TEST ' + id, delivery_date: '2026-10-15' });
    await db('aldi_truck_lines').insert({ id, aldi_truck_id: id, aldi_daily_order_line_id: id, product_name: 'Teszttermék', destination: 'Raktár A', ordered_cartons: 100, picked_cartons: 30, pallets: 1 });
    await db('aldi_commission_lines').insert({ id, aldi_truck_id: id, aldi_truck_line_id: id, product_name: 'Teszttermék', cartons: 30, pallets: 1 });
    await db('aldi_stock_locations').insert({ commission_line_id: id, truck_line_id: id });
    if (withLabel) await db('sscc_labels').insert({ id, sscc: generateSscc(id, '5999883976'), commission_line_id: id, aldi_truck_line_id: id, picked_cartons: 30, is_provisional: false, is_consolidated_master: false });
    return id;
  }
  const asn = createAsn(db);
  let goodId, goodMessage;
  await t.test('Rakodva atomically freezes actual cargo, fulfils order once and removes stock', async () => {
    goodId = await seed();
    const before = await call(`/api/v1/aldi-asn/trucks/${goodId}/prepare`, {});
    assert.equal(before.status, 400);
    const r = await call(`/api/v1/aldi-cross-docking/trucks/${goodId}`, { is_loaded: true }, 'PUT');
    assert.equal(r.status, 200, JSON.stringify(r.data)); assert.equal(r.data.asn.status, 'queued');
    assert.equal((await db('aldi_daily_order_lines').where({ id: goodId }).first()).fulfilled_cartons, 30);
    assert.equal((await db('aldi_stock_locations').where({ truck_line_id: goodId })).length, 0);
    await call(`/api/v1/aldi-cross-docking/trucks/${goodId}`, { is_loaded: true }, 'PUT');
    assert.equal((await db('aldi_asn_shipments').where({ truck_id: goodId })).length, 1);
    assert.equal((await db('aldi_daily_order_lines').where({ id: goodId }).first()).fulfilled_cartons, 30);
    goodMessage = await db('aldi_asn_messages').where({ shipment_id: r.data.asn.shipmentId }).first();
    const downloaded = await fetch(`${base}/api/v1/aldi-asn/messages/${goodMessage.id}/original`);
    assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), goodMessage.raw_bytes);
    assert.match(goodMessage.raw_bytes.toString(), /QTY\+12:30'/);
    assert.match(goodMessage.raw_bytes.toString(), /DTM\+191:20261015:102'/);
    assert.equal((await fetch(`${base}/api/v1/aldi-cross-docking/trucks/${goodId}`, { method: 'DELETE' })).status, 409);
  });
  await t.test('missing label archives a blocked ASN without losing physical loading state; repair adds a revision', async () => {
    const id = await seed(false);
    const r = await call(`/api/v1/aldi-cross-docking/trucks/${id}`, { is_loaded: true }, 'PUT');
    assert.equal(r.status, 200); assert.equal(r.data.asn.status, 'blocked');
    assert.equal((await db('aldi_trucks').where({ id }).first()).is_loaded, true);
    assert.ok((await asn.detail(r.data.asn.shipmentId)).issues.some(i => i.code === 'PALLET_LABEL'));
    await db('sscc_labels').insert({ id, sscc: generateSscc(id, '5999883976'), commission_line_id: id, aldi_truck_line_id: id, picked_cartons: 30, is_provisional: false, is_consolidated_master: false });
    assert.equal((await asn.prepare(id)).status, 'queued');
    assert.equal((await db('aldi_asn_shipments').where({ truck_id: id })).length, 2);
  });
  await t.test('original cargo, bytes and events reject edits, deletion, truncation and rollback', async () => {
    for (const table of ['aldi_asn_shipments', 'aldi_asn_messages', 'aldi_asn_events']) {
      await assert.rejects(db(table).update({ id: 99 }), /nem módosítható/);
      await assert.rejects(db(table).delete(), /nem módosítható/);
      await assert.rejects(db.raw('TRUNCATE ?? CASCADE', [table]), /nem módosítható/);
    }
    await assert.rejects(migration.down(db), /Nem üres/);
  });
  const env = { ALDI_ASN_SFTP_ENABLED: 'true', ALDI_ASN_SFTP_HOST: 'test-host', ALDI_ASN_SFTP_USERNAME: 'test', ALDI_ASN_SFTP_PASSWORD: 'secret-never-log', ALDI_ASN_SFTP_DIRECTORY: '/out', ALDI_ASN_SFTP_HOST_SHA256: 'SHA256:test' };
  const files = new Map(), writes = [];
  let failRename = false, disconnects = 0;
  const factory = () => ({ connect: async () => {}, exists: async p => files.has(p) ? '-' : false, stat: async p => ({ size: files.get(p).length }), get: async p => files.get(p), put: async (b, p) => { writes.push(p); files.set(p, Buffer.from(b)); }, rename: async (a, b) => { if (failRename) throw new Error(env.ALDI_ASN_SFTP_PASSWORD); files.set(b, files.get(a)); files.delete(a); }, end: async () => { disconnects++; } });
  await t.test('unconfirmed profiles and disabled connections never transmit', async () => {
    assert.equal((await createTransport(asn, { env: {} }).process()).processed, 0);
    assert.equal((await createTransport(asn, { env, clientFactory: factory }).process()).processed, 0);
    assert.equal(writes.length, 0);
  });
  await t.test('confirmed profile transfers frozen bytes via staging rename once; repeated saves/polls do not duplicate', async () => {
    await db('aldi_asn_settings').where({ id: 1 }).update({ profile: JSON.stringify({ ...profile, confirmed: true, quantityConfirmed: true }) });
    const transport = createTransport(asn, { env, clientFactory: factory });
    assert.equal((await transport.process()).processed, 2);
    assert.deepEqual(files.get('/out/' + goodMessage.filename), goodMessage.raw_bytes);
    assert.equal((await transport.process()).processed, 0);
    assert.equal((await db('aldi_asn_jobs').where({ message_id: goodMessage.id }).first()).state, 'sent');
    await assert.rejects(asn.prepare(goodId, true), /nem építhető/);
    assert.equal(disconnects, 2);
  });
  await t.test('only an unsent payload can be regenerated; original bytes and superseded attempts remain', async () => {
    const id = await seed();
    const loaded = await call(`/api/v1/aldi-cross-docking/trucks/${id}`, { is_loaded: true }, 'PUT');
    const old = await db('aldi_asn_messages').where({ shipment_id: loaded.data.asn.shipmentId }).first();
    await db('sscc_labels').where({ id }).update({ asn_best_before: '2026-10-20' });
    const next = await asn.prepare(id, true), m = await db('aldi_asn_messages').where({ shipment_id: next.shipmentId }).first();
    assert.notEqual(m.asn_number, old.asn_number);
    assert.equal((await db('aldi_asn_jobs').where({ message_id: old.id }).first()).state, 'superseded');
    assert.deepEqual((await db('aldi_asn_messages').where({ id: old.id }).first()).raw_bytes, old.raw_bytes);
    assert.match(m.raw_bytes.toString(), /DTM\+361:20261020:102'/);
    assert.equal((await createTransport(asn, { env, clientFactory: factory }).process()).processed, 1);
    assert.equal(files.has('/out/' + old.filename), false);
  });
  await t.test('failure before publication can retry the same bytes and identifier without another shipment', async () => {
    const id = await seed();
    const loaded = await call(`/api/v1/aldi-cross-docking/trucks/${id}`, { is_loaded: true }, 'PUT');
    const m = await db('aldi_asn_messages').where({ shipment_id: loaded.data.asn.shipmentId }).first();
    const fail = () => ({ connect: async () => { throw new Error(env.ALDI_ASN_SFTP_PASSWORD); }, end: async () => {} });
    await createTransport(asn, { env, clientFactory: fail }).process();
    assert.equal((await db('aldi_asn_jobs').where({ message_id: m.id }).first()).state, 'retry');
    assert.equal((await call(`/api/v1/aldi-asn/messages/${m.id}/retry`, {})).status, 200);
    await createTransport(asn, { env, clientFactory: factory }).process();
    assert.deepEqual(files.get('/out/' + m.filename), m.raw_bytes);
    assert.equal((await db('aldi_asn_shipments').where({ truck_id: id })).length, 1);
  });
  await t.test('uncertain remote publication blocks automatic/manual resend and redacts secrets', async () => {
    const id = await seed(); await call(`/api/v1/aldi-cross-docking/trucks/${id}`, { is_loaded: true }, 'PUT');
    failRename = true;
    const transport = createTransport(asn, { env, clientFactory: factory });
    assert.equal((await transport.process()).processed, 1);
    const shipment = await db('aldi_asn_shipments').where({ truck_id: id }).first();
    const m = await db('aldi_asn_messages').where({ shipment_id: shipment.id }).first();
    assert.equal((await db('aldi_asn_jobs').where({ message_id: m.id }).first()).state, 'uncertain');
    assert.equal((await transport.process()).processed, 0);
    assert.equal((await call(`/api/v1/aldi-asn/messages/${m.id}/retry`, {})).status, 400);
    assert.ok(!JSON.stringify(await asn.detail(shipment.id)).includes(env.ALDI_ASN_SFTP_PASSWORD));
    failRename = false;
  });
  await t.test('real local SSH/SFTP publishes the actual archived DESADV bytes with a pinned server key', async () => {
    const crypto = require('node:crypto');
    const { Server, utils } = require('ssh2');
    const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048, privateKeyEncoding: { type: 'pkcs1', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } });
    const publicKey = utils.parseKey(privateKey).getPublicSSH();
    const files = new Map(), sessions = new Set();
    const ssh = new Server({ hostKeys: [privateKey] }, client => {
      sessions.add(client); client.on('close', () => sessions.delete(client)); client.on('error', () => {});
      client.on('authentication', ctx => ctx.method === 'password' && ctx.username === 'asn-test' && ctx.password === 'local-test' ? ctx.accept() : ctx.reject());
      client.on('ready', () => client.on('session', accept => accept().on('sftp', acceptSftp => {
        const stream = acceptSftp(), handles = new Map(); let handleId = 0;
        const attrs = file => ({ mode: file === '/out' ? 0o40755 : 0o100644, uid: 1, gid: 1, size: files.get(file)?.length || 0, atime: 1, mtime: 1 });
        const stat = (id, file) => file === '/out' || files.has(file) ? stream.attrs(id, attrs(file)) : stream.status(id, 2);
        stream.on('STAT', stat); stream.on('LSTAT', stat);
        stream.on('REALPATH', (id, file) => stream.name(id, [{ filename: file, longname: file, attrs: attrs(file) }]));
        stream.on('OPEN', (id, file, flags) => {
          if (!(flags & 2) && !files.has(file)) return stream.status(id, 2);
          if (flags & 2) files.set(file, Buffer.alloc(0));
          const h = Buffer.from(String(++handleId)); handles.set(h.toString(), file); stream.handle(id, h);
        });
        stream.on('WRITE', (id, handle, offset, bytes) => {
          const file = handles.get(handle.toString()), previous = files.get(file), next = Buffer.alloc(Math.max(previous.length, offset + bytes.length));
          previous.copy(next); bytes.copy(next, offset); files.set(file, next); stream.status(id, 0);
        });
        stream.on('READ', (id, handle, offset, length) => { const b = files.get(handles.get(handle.toString())); offset >= b.length ? stream.status(id, 1) : stream.data(id, b.subarray(offset, offset + length)); });
        stream.on('FSTAT', (id, handle) => stream.attrs(id, attrs(handles.get(handle.toString()))));
        stream.on('CLOSE', (id, handle) => { handles.delete(handle.toString()); stream.status(id, 0); });
        stream.on('RENAME', (id, from, to) => { files.set(to, files.get(from)); files.delete(from); stream.status(id, 0); });
      })));
    });
    await new Promise(resolve => ssh.listen(0, '127.0.0.1', resolve));
    t.after(async () => { for (const s of sessions) s.end(); await new Promise(resolve => ssh.close(resolve)); });
    const id = await seed();
    const loaded = await call(`/api/v1/aldi-cross-docking/trucks/${id}`, { is_loaded: true }, 'PUT');
    const m = await db('aldi_asn_messages').where({ shipment_id: loaded.data.asn.shipmentId }).first();
    const realEnv = { ...env, ALDI_ASN_SFTP_HOST: '127.0.0.1', ALDI_ASN_SFTP_PORT: String(ssh.address().port), ALDI_ASN_SFTP_USERNAME: 'asn-test', ALDI_ASN_SFTP_PASSWORD: 'local-test', ALDI_ASN_SFTP_HOST_SHA256: 'SHA256:' + crypto.createHash('sha256').update(publicKey).digest('base64') };
    assert.equal((await createTransport(asn, { env: realEnv }).process()).processed, 1);
    assert.deepEqual(files.get('/out/' + m.filename), m.raw_bytes);
    assert.equal(files.has('/out/' + m.filename + '.part'), false);
    assert.equal((await db('aldi_asn_jobs').where({ message_id: m.id }).first()).state, 'sent');
    const badId = await seed();
    const badLoad = await call(`/api/v1/aldi-cross-docking/trucks/${badId}`, { is_loaded: true }, 'PUT');
    const bad = await db('aldi_asn_messages').where({ shipment_id: badLoad.data.asn.shipmentId }).first();
    await createTransport(asn, { env: { ...realEnv, ALDI_ASN_SFTP_HOST_SHA256: 'SHA256:wrong' } }).process();
    assert.equal(files.has('/out/' + bad.filename), false);
    assert.equal((await db('aldi_asn_jobs').where({ message_id: bad.id }).first()).state, 'retry');
  });
  await t.test('browser edits original references/dates and shows blocked/queued/downloadable ASN', async () => {
    const id = await seed(); await db('aldi_truck_lines').where({ id }).update({ destination: null });
    const browser = await chromium.launch({ headless: true }); t.after(() => browser.close());
    const page = await browser.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(base + '/asn-test');
    await page.locator('[data-asn="truck"] option').first().waitFor({ state: 'attached' });
    await page.locator('[data-asn="truck"]').selectOption(String(id));
    await page.getByRole('button', { name: 'Adatok ellenőrzése', exact: true }).click();
    await page.locator(`[data-asn-dest="${id}"]`).fill('Raktár A');
    await page.locator(`[data-asn-ref="${id}"]`).fill('00090');
    await page.getByRole('button', { name: 'Hivatkozások és célraktár mentése' }).click();
    await page.waitForFunction(() => document.querySelector('[data-asn="feedback"]').textContent.includes('mentve'));
    assert.equal((await db('aldi_truck_lines').where({ id }).first()).asn_order_line_reference, '00090');
    await call(`/api/v1/aldi-cross-docking/trucks/${id}`, { is_loaded: true }, 'PUT');
    await page.getByRole('button', { name: 'ASN napló frissítése' }).click();
    await page.locator('[data-asn-shipment]').first().click();
    await page.getByText('DESADV fájl letöltése', { exact: true }).waitFor();
    assert.deepEqual(errors, []);
  });
});
