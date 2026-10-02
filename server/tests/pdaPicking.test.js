const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { validateLot, assertReservation, assertSamePayload, pickPayload, emulatorEnabled } = require('../src/services/pdaPicking');

test('LOT uses Budapest calendar days, real ISO weeks and the year boundary', () => {
  const now = new Date('2026-10-02T12:00:00Z');
  assert.equal(validateLot('4005', now).lotDate, '2026-10-02');
  assert.equal(validateLot('3907', now).expired, false);
  assert.equal(validateLot('3906', now).ageDays, 6);
  assert.equal(validateLot('3906', now).expired, true);
  for (const lot of ['3626', '3926', '0001', '5401', '4000', '4008', '123456', '']) {
    assert.throws(() => validateLot(lot, now), { code: 'INVALID_LOT' });
  }
  assert.equal(validateLot('4005', new Date('2026-10-01T22:01:00Z')).ageDays, 0);
  assert.equal(validateLot('0101', new Date('2025-12-29T12:00:00Z')).lotDate, '2025-12-29');
  assert.equal(validateLot('5305', new Date('2027-01-01T12:00:00Z')).lotDate, '2027-01-01');
  assert.throws(() => validateLot('5301', new Date('2025-10-02T12:00:00Z')), { code: 'INVALID_LOT' });
  assert.equal(validateLot('0101', new Date('2024-12-29T12:00:00Z')).lotDate, '2024-12-30');
});

test('reservation ownership, expiry and immutable label payload are enforced', () => {
  const user = { id: 7, sessionId: 'login-7' };
  const now = new Date('2026-10-02T10:00:00Z');
  const label = { picker_user_id: 7, picker_session_id: 'login-7', pick_session_id: 'pick-7',
    aldi_truck_line_id: 3, is_provisional: true, reservation_expires_at: '2026-10-02T10:01:00Z' };
  assertReservation(label, user, 'pick-7', 3, now);
  for (const changed of [{ id: 8, sessionId: 'login-7' }, { id: 7, sessionId: 'new-login' }]) {
    assert.throws(() => assertReservation(label, changed, 'pick-7', 3, now), { code: 'FORBIDDEN' });
  }
  assert.throws(() => assertReservation(label, user, 'other', 3, now), { code: 'FORBIDDEN' });
  assert.throws(() => assertReservation(label, user, 'pick-7', 4, now), { code: 'FORBIDDEN' });
  assert.throws(() => assertReservation(label, user, 'pick-7', 3, new Date('2026-10-02T10:01:00Z')), { code: 'LABEL_EXPIRED' });
  const payload = { picked_cartons: 10, gross_weight: 100, tare_weight: 1, pallet_types: [25], lot_number: '4005' };
  const stored = { pick_payload: Object.fromEntries(Object.entries(pickPayload(payload)).reverse()) };
  assertSamePayload(stored, payload); // PostgreSQL jsonb does not retain key order.
  assert.throws(() => assertSamePayload(stored, { ...payload, picked_cartons: 11 }), { code: 'PICK_CHANGED' });
});

test('emulator identity requires an explicitly enabled separate test database', () => {
  assert.equal(emulatorEnabled({ NODE_ENV: 'production', PDA_EMULATOR_ENABLED: 'true', PDA_TEST_DATABASE_URL: 'test' }), false);
  assert.equal(emulatorEnabled({ NODE_ENV: 'test', PDA_EMULATOR_ENABLED: 'true' }), false);
  assert.equal(emulatorEnabled({ NODE_ENV: 'test', PDA_EMULATOR_ENABLED: 'true', PDA_TEST_DATABASE_URL: 'test' }), true);
});

test('PostgreSQL: concurrent saves, retries, ownership, expiry, cancellation and final commit',
  { skip: !process.env.PDA_TEST_DATABASE_URL }, async t => {
    const schema = 'pda_review_' + process.pid + '_' + Date.now();
    assert.match(schema, /^pda_review_\d+_\d+$/);
    const factory = require('knex');
    const admin = factory({ client: 'pg', connection: process.env.PDA_TEST_DATABASE_URL });
    let db;
    try {
      await admin.raw('CREATE SCHEMA ' + schema);
      db = factory({ client: 'pg', connection: process.env.PDA_TEST_DATABASE_URL,
        pool: { min: 0, max: 6, afterCreate(conn, done) { conn.query('SET search_path TO ' + schema, err => done(err, conn)); } } });
      await db.raw(`
        CREATE TABLE employees (id serial PRIMARY KEY, full_name text, pda_identifier text, role text, status text,
          pda_session_token text, created_at timestamptz, updated_at timestamptz);
        CREATE TABLE aldi_trucks (id integer PRIMARY KEY, truck_number text, license_plate_1 text, delivery_date text, target_locations jsonb);
        CREATE TABLE aldi_daily_order_lines (id integer PRIMARY KEY, cartons_per_pallet integer);
        CREATE TABLE aldi_truck_lines (id integer PRIMARY KEY, aldi_truck_id integer, aldi_daily_order_line_id integer,
          product_name text, ordered_cartons integer, picked_cartons integer, cartons_per_pallet integer, gross_weight numeric,
          net_weight numeric, delivery_date text, origin_country text, partner text, destination text, lot_number text,
          is_picked boolean, packaging_type text, pallet_type text, tare_weight numeric);
        CREATE TABLE ref_packaging_types (id integer PRIMARY KEY, name text, category text, is_active boolean, tare_weight_kg numeric);
        CREATE TABLE aldi_locations (id integer PRIMARY KEY, barcode text, name text, capacity integer, location_type text, parent_id integer);
        CREATE TABLE aldi_commission_lines (id serial PRIMARY KEY, aldi_truck_id integer, aldi_truck_line_id integer, product_name text,
          cartons integer, pallets integer, gross_weight numeric, net_weight numeric, pallet_type text, pallets_json text,
          tare_weight numeric, carton_type text, lot_number text, origin_country text, pick_session_id text UNIQUE);
        CREATE TABLE aldi_stock_locations (id serial PRIMARY KEY, location_id integer, order_line_id integer, truck_line_id integer,
          commission_line_id integer, quantity_cartons integer, gross_weight numeric, net_weight numeric);
        CREATE TABLE sscc_labels (id serial PRIMARY KEY, sscc text, commission_line_id integer, picked_cartons integer,
          truck_number text, product_name text, delivery_date text, supplier text, destination text, origin_country text,
          gross_weight numeric, net_weight numeric, lot_number text, is_provisional boolean, pallets_json text,
          aldi_truck_line_id integer, created_at timestamptz DEFAULT now(), location_name text, consolidated_sscc text);
      `);
      await db('employees').insert([{ id: 1, full_name: 'Dolgozó Egy' }, { id: 2, full_name: 'Dolgozó Kettő' }]);
      await db.raw("SELECT setval('employees_id_seq', 2)");
      // Exercise the actual migrations against isolated tables, including the FK and unique index.
      await require('../src/db/migrations/20261002180000_add_picker_fields_to_sscc_labels').up(db);
      await require('../src/db/migrations/20261002190000_add_pda_reservation_lifecycle').up(db);
      await db('aldi_trucks').insert({ id: 1, truck_number: 'TEST', target_locations: JSON.stringify([{ id: 10 }]) });
      await db('aldi_daily_order_lines').insert({ id: 1, cartons_per_pallet: 10 });
      await db('ref_packaging_types').insert({ id: 25, name: 'EU', category: 'Raklap', is_active: true, tare_weight_kg: 22 });
      await db('aldi_locations').insert({ id: 10, name: 'Test location', barcode: 'TEST-LOC', capacity: 100, location_type: 'Komissió' });
      const routeFile = path.join(__dirname, '../src/routes/pda.js');
      const actualRequire = createRequire(routeFile), mod = { exports: {} };
      vm.runInNewContext(fs.readFileSync(routeFile, 'utf8'), {
        require: name => name === '../db/db' ? db : actualRequire(name), module: mod, exports: mod.exports,
        process, console: { ...console, error() {} }
      }, { filename: routeFile });
      async function request(route, { body = {}, params = {}, query = {}, employee = 1 } = {}) {
        const layer = mod.exports.stack.find(layer => layer.route?.path === route);
        const result = { status: 200 };
        const res = { status(code) { result.status = code; return this; }, json(value) { result.body = value; return this; } };
        await layer.route.stack.at(-1).handle({ body, params, query, user: { id: employee, sessionId: 'login-' + employee } }, res);
        return result;
      }
      let lineId = 0;
      async function line(cartons = 10) {
        const id = ++lineId;
        await db('aldi_truck_lines').insert({ id, aldi_truck_id: 1, aldi_daily_order_line_id: 1, product_name: 'Test',
          ordered_cartons: cartons, picked_cartons: 0, cartons_per_pallet: 999, gross_weight: 0, net_weight: 0 });
        return id;
      }
      // Use an intentionally old valid LOT: all generations must carry server-issued confirmation.
      async function payload(id, sid, qty = 5, employee = 1) {
        const p = { lineId: id, pickSessionId: sid, picked_cartons: qty, gross_weight: 100, tare_weight: 1,
          pallet_types: [25], lot_number: '0101', packaging_type: 'Doboz', origin_country: 'HU', area: 'aldi' };
        const check = await request('/validate-lot', { body: p, employee });
        assert.equal(check.status, 200);
        p.lotConfirmationToken = check.body.confirmationToken;
        return p;
      }
      const generate = (body, employee = 1) => request('/generate-pallet-label', { body, employee });
      const finalize = (p, label, employee = 1) => request('/commission-lines/:id/pick-and-assign', {
        params: { id: p.lineId }, employee, body: { ...p, labelId: label.id, scannedSscc: label.sscc, barcode: 'TEST-LOC' } });

      await t.test('concurrent last-pallet saves accept one employee and name the other', async () => {
        const id = await line(), a = await payload(id, 'race-a'), b = await payload(id, 'race-b', 5, 2);
        const results = await Promise.all([generate(a), generate(b, 2)]);
        assert.deepEqual(results.map(r => r.status).sort(), [200, 423]);
        assert.match(results.find(r => r.status === 423).body.pickerName, /Dolgozó/);
        assert.equal((await db('sscc_labels').where('aldi_truck_line_id', id)).length, 1);
      });
      await t.test('lost-response retries reuse the same label; changed payload and foreign owner are rejected', async () => {
        const id = await line(100), p = await payload(id, 'retry');
        const first = await generate(p), again = await generate(p);
        assert.equal(first.status, 200, first.body.error);
        assert.equal(again.body.label.id, first.body.label.id);
        assert.equal((await generate({ ...p, picked_cartons: 6 })).status, 409);
        assert.equal((await generate(p, 2)).status, 403);
        assert.equal((await finalize(p, first.body.label, 2)).status, 403);
      });
      await t.test('previously accepted workers may finish after the effective remainder falls to one pallet', async () => {
        const id = await line(30), a = await payload(id, 'multi-a', 10), b = await payload(id, 'multi-b', 10, 2);
        const first = await generate(a), second = await generate(b, 2);
        assert.equal(first.status, 200);
        assert.equal(second.status, 200);
        assert.equal((await generate(await payload(id, 'multi-third', 5))).status, 423);
        assert.equal((await finalize(a, first.body.label)).status, 200);
        assert.equal((await finalize(b, second.body.label, 2)).status, 200);
        assert.equal((await db('aldi_truck_lines').where('id', id).first()).picked_cartons, 20);
      });
      await t.test('final commit is atomic and idempotent; arbitrary label IDs cannot be attached', async () => {
        const id = await line(100), p = await payload(id, 'final');
        const first = await generate(p);
        const other = await generate(await payload(id, 'unrelated'));
        const wrong = await request('/commission-lines/:id/pick-and-assign', { params: { id }, body: {
          ...p, labelId: other.body.label.id, scannedSscc: other.body.label.sscc, barcode: 'TEST-LOC' } });
        assert.equal(wrong.status, 400);
        assert.equal((await db('aldi_commission_lines').where('aldi_truck_line_id', id)).length, 0);
        const results = await Promise.all([finalize(p, first.body.label), finalize(p, first.body.label)]);
        assert.deepEqual(results.map(r => r.status), [200, 200]);
        assert.equal((await db('aldi_commission_lines').where('aldi_truck_line_id', id)).length, 1);
        assert.equal((await db('aldi_stock_locations').where('truck_line_id', id)).length, 1);
        assert.equal((await db('aldi_truck_lines').where('id', id).first()).picked_cartons, 5);
      });
      await t.test('expired reservations cannot finalize or renew, but no consolidation labels are deleted', async () => {
        const id = await line(), p = await payload(id, 'expiry');
        const first = await generate(p);
        await db('sscc_labels').where('id', first.body.label.id).update({ reservation_expires_at: new Date(Date.now() - 1000) });
        assert.equal((await finalize(p, first.body.label)).status, 410);
        assert.equal((await request('/provisional-label/:id/renew', { params: { id: first.body.label.id }, body: { pickSessionId: p.pickSessionId } })).status, 410);
        const [consolidation] = await db('sscc_labels').insert({ sscc: 'TEST-MASTER', is_provisional: true,
          created_at: new Date(Date.now() - 600000) }).returning('*');
        assert.equal((await generate(await payload(id, 'replacement', 5, 2), 2)).status, 200);
        assert.ok(await db('sscc_labels').where('id', consolidation.id).first());
      });
      await t.test('owner renews or cancels; another employee cannot; cancellation works after lost response', async () => {
        const id = await line(), p = await payload(id, 'cancel'), first = await generate(p);
        const params = { id: first.body.label.id }, body = { pickSessionId: p.pickSessionId };
        assert.equal((await request('/provisional-label/:id/renew', { params, body })).status, 200);
        assert.equal((await request('/provisional-label/:id', { params, query: body, employee: 2 })).status, 403);
        assert.equal((await request('/provisional-pick', { query: body })).status, 200);
        assert.equal((await finalize(p, first.body.label)).status, 410);
        assert.equal((await generate(await payload(id, 'after-cancel', 5, 2), 2)).status, 200);
      });
      await t.test('LOT confirmation is required and the live demand #/PLT cannot silently disappear', async () => {
        const id = await line(), p = await payload(id, 'lot');
        assert.equal((await generate({ ...p, lotConfirmationToken: null })).status, 409);
        assert.equal((await generate({ ...p, lot_number: '3626' })).status, 400);
        await db('aldi_daily_order_lines').where('id', 1).update({ cartons_per_pallet: null });
        assert.equal((await generate(p)).status, 400);
        await db('aldi_daily_order_lines').where('id', 1).update({ cartons_per_pallet: 10 });
      });
    } finally {
      if (db) await db.destroy();
      await admin.raw('DROP SCHEMA IF EXISTS ' + schema + ' CASCADE');
      await admin.destroy();
    }
  });
