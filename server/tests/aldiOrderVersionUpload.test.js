const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

// Regression: a modified ALDI daily order (same order number, different items) must become a
// new version, carry the "Rakodva" fulfilment over and keep the truck-line links working.
// Runs against a throw-away PostgreSQL schema cloned from the migrated database.
const DB_URL = process.env.ALDI_TEST_DATABASE_URL;
const TABLES = [
  'aldi_daily_orders', 'aldi_daily_order_lines', 'aldi_order_families', 'aldi_order_item_states',
  'aldi_trucks', 'aldi_truck_lines', 'aldi_commission_lines', 'aldi_stock_locations', 'sscc_labels',
  'aldi_asn_settings', 'aldi_asn_shipments', 'aldi_asn_messages', 'aldi_asn_jobs', 'aldi_asn_events'
];

function pdfText(orderNumber, date, items) {
  const lines = items.map((item, index) => `${item.deleted ? '2-Deleted ' : ''}${String((index + 1) * 10).padStart(5, '0')} ${item.gtin} ${item.qty} ${date} DDP`);
  return `Purchase Order Number: ${orderNumber}\nTotal Number of Pallets (Estimated): 5\nAction Code LI GTIN Quantity Delivery Date\n${lines.join('\n')}\n`;
}

test('PostgreSQL: modified order creates a new version, keeps Rakodva fulfilment and truck links',
  { skip: !DB_URL }, async t => {
    const factory = require('knex');
    const pg = require('pg');
    pg.types.setTypeParser(1082, val => val);
    const schema = 'aldi_version_' + process.pid + '_' + Date.now();
    assert.match(schema, /^aldi_version_\d+_\d+$/);
    const admin = factory({ client: 'pg', connection: DB_URL });
    let db, server;
    const realFs = { existsSync: fs.existsSync, mkdirSync: fs.mkdirSync, writeFileSync: fs.writeFileSync };
    const isNetwork = p => typeof p === 'string' && p.startsWith('\\\\');
    t.after(async () => {
      fs.existsSync = realFs.existsSync; fs.mkdirSync = realFs.mkdirSync; fs.writeFileSync = realFs.writeFileSync;
      if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
      if (db) await db.destroy();
      await admin.raw('DROP SCHEMA IF EXISTS ' + schema + ' CASCADE');
      await admin.destroy();
    });
    await admin.raw('CREATE SCHEMA ' + schema);
    db = factory({ client: 'pg', connection: DB_URL,
      pool: { min: 0, max: 6, afterCreate(conn, done) { conn.query('SET search_path TO ' + schema, err => done(err, conn)); } } });
    for (const table of TABLES) await db.raw(`CREATE TABLE ${schema}.${table} (LIKE public.${table} INCLUDING ALL)`);
    await db('aldi_asn_settings').insert({ id: 1, profile: JSON.stringify({ sender: '5990696117005', supplier: '5990696117005', receiver: '', buyer: '', syntax: 'UNOC', variant: 'lpn_item', mode: 'test', requiredDateType: 'none', destinations: [] }) });

    // The upload route must not touch the real network share from a test.
    fs.existsSync = p => isNetwork(p) ? true : realFs.existsSync(p);
    fs.mkdirSync = (p, ...rest) => isNetwork(p) ? undefined : realFs.mkdirSync(p, ...rest);
    fs.writeFileSync = (p, ...rest) => isNetwork(p) ? undefined : realFs.writeFileSync(p, ...rest);

    const stub = (request, exports) => {
      const resolved = require.resolve(request, { paths: [path.join(__dirname, '../src/routes')] });
      require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
    };
    stub('../db/db', db);
    stub('pdf-parse', async buffer => ({ text: buffer.toString('utf8') }));
    const express = require('express');
    const app = express();
    app.use(express.json());
    app.use('/orders', require('../src/routes/aldi_daily_orders'));
    app.use('/cross', require('../src/routes/aldi_cross_docking'));
    await new Promise(resolve => { server = http.createServer(app).listen(0, '127.0.0.1', resolve); });
    const base = `http://127.0.0.1:${server.address().port}`;

    const upload = async (name, text) => {
      const form = new FormData();
      form.append('file', new Blob([text], { type: 'application/pdf' }), name);
      const response = await fetch(base + '/orders/upload', { method: 'POST', body: form });
      return { status: response.status, body: await response.json() };
    };
    const setLoaded = async (truckId, loaded, expectedStatus = 200) => {
      const response = await fetch(`${base}/cross/trucks/${truckId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_loaded: loaded })
      });
      assert.equal(response.status, expectedStatus);
      return response.json();
    };

    const orderNumber = '45399' + String(Date.now()).slice(-6);
    const date = '20271231';
    const [A, B, C, D] = ['4000000000011', '4000000000028', '4000000000035', '4000000000042'];

    // Version 1
    const first = await upload('feltoltesi hiba 1.pdf', pdfText(orderNumber, date, [
      { gtin: A, qty: 100 }, { gtin: B, qty: 50 }, { gtin: C, qty: 30 }]));
    assert.equal(first.status, 200, JSON.stringify(first.body));
    assert.equal(first.body.versionNumber, 1);
    const v1Line = await db('aldi_daily_order_lines').where({ daily_order_id: first.body.orderId, gtin: A }).first();

    // A truck carrying 40 cartons of item A, with commission line and stock location
    const [truck] = await db('aldi_trucks').insert({ truck_number: 'TEST-1', delivery_date: '2027-12-31' }).returning('*');
    const [truckLine] = await db('aldi_truck_lines').insert({
      aldi_truck_id: truck.id, product_name: 'A termék', ordered_cartons: 40,
      aldi_daily_order_line_id: v1Line.id, order_item_state_id: v1Line.order_item_state_id
    }).returning('*');
    const [commission] = await db('aldi_commission_lines').insert({
      aldi_truck_id: truck.id, product_name: 'A termék', cartons: 40, aldi_truck_line_id: truckLine.id
    }).returning('*');
    await db('aldi_stock_locations').insert({ location_id: 1, quantity_cartons: 40, commission_line_id: commission.id });

    await setLoaded(truck.id, true);
    assert.equal(Number((await db('aldi_daily_order_lines').where({ id: v1Line.id }).first()).fulfilled_cartons), 40);
    assert.equal((await db('aldi_stock_locations').where({ commission_line_id: commission.id })).length, 0,
      'Rakodva removes the stock location');

    // Version 2: same order number, A increased, B decreased, C deleted, D added
    const second = await upload('feltoltesi hiba 2.pdf', pdfText(orderNumber, date, [
      { gtin: A, qty: 120 }, { gtin: B, qty: 20 }, { gtin: C, qty: 0, deleted: true }, { gtin: D, qty: 10 }]));
    assert.equal(second.status, 200, JSON.stringify(second.body));
    assert.equal(second.body.versionNumber, 2);
    assert.equal(second.body.orderNumber, `${orderNumber}-1`);
    assert.equal(second.body.loadedWarnings.length, 1, 'Increase of a loaded item warns that the surplus needs another truck');
    assert.match(second.body.loadedWarnings[0], new RegExp(A));

    const orders = await db('aldi_daily_orders').orderBy('version_number');
    assert.deepEqual(orders.map(o => o.version_status), ['superseded', 'current']);
    assert.equal(orders[0].superseded_by_order_id, orders[1].id);

    const lines = Object.fromEntries((await db('aldi_daily_order_lines').where({ daily_order_id: orders[1].id }))
      .map(line => [line.gtin, line]));
    assert.equal(lines[A].change_type, 'increased');
    assert.equal(lines[B].change_type, 'decreased');
    assert.equal(lines[C].change_type, 'removed');
    assert.equal(lines[D].change_type, 'added');
    assert.equal(Number(lines[A].quantity_delta), 20);
    assert.equal(Number(lines[B].quantity_delta), -30);
    assert.equal(Number(lines[A].fulfilled_cartons), 40, 'Rakodva fulfilment is carried to the new version');
    assert.equal((await db('aldi_truck_lines').where({ id: truckLine.id }).first()).aldi_daily_order_line_id,
      lines[A].id, 'Truck line points to the current version');

    // Rakodva cannot be revoked
    const locked = await setLoaded(truck.id, false, 409);
    assert.equal(locked.code, 'LOADED_LOCKED');
    assert.equal(Number((await db('aldi_daily_order_lines').where({ id: lines[A].id }).first()).fulfilled_cartons), 40);
    assert.equal((await db('aldi_trucks').where({ id: truck.id }).first()).is_loaded, true);
    await setLoaded(truck.id, true); // re-sending the loaded state is harmless
    assert.equal(Number((await db('aldi_daily_order_lines').where({ id: lines[A].id }).first()).fulfilled_cartons), 40);

    // A modified order cannot reduce an already loaded item: rejected, nothing is stored
    const reduced = await upload('feltoltesi hiba 4.pdf', pdfText(orderNumber, date, [
      { gtin: A, qty: 30 }, { gtin: B, qty: 20 }, { gtin: C, qty: 0, deleted: true }, { gtin: D, qty: 10 }]));
    assert.equal(reduced.status, 409);
    assert.equal(reduced.body.code, 'LOADED_REDUCTION');
    assert.deepEqual(reduced.body.violations, [{ gtin: A, loaded: 40, requested: 30 }]);
    assert.equal((await db('aldi_daily_orders')).length, 2, 'Rejected upload creates no version');

    // Deleting a loaded item is a reduction as well
    const deleted = await upload('feltoltesi hiba 5.pdf', pdfText(orderNumber, date, [
      { gtin: A, qty: 0, deleted: true }, { gtin: B, qty: 20 }, { gtin: C, qty: 0, deleted: true }, { gtin: D, qty: 10 }]));
    assert.equal(deleted.status, 409);
    assert.equal(deleted.body.code, 'LOADED_REDUCTION');
    assert.equal((await db('aldi_truck_lines').where({ id: truckLine.id })).length, 1, 'Loaded truck line survives');

    // Same content again is rejected, not a server error
    const duplicate = await upload('feltoltesi hiba 3.pdf', pdfText(orderNumber, date, [
      { gtin: A, qty: 120 }, { gtin: B, qty: 20 }, { gtin: C, qty: 0, deleted: true }, { gtin: D, qty: 10 }]));
    assert.equal(duplicate.status, 409);
  });
