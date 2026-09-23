const test = require('node:test');
const assert = require('node:assert/strict');
const { consolidationStockIssues, assertConsolidationStock } = require('../src/services/consolidationStock');

function fixture() {
  return {
    labels: [{ id: 1, sscc: '359900010000000252', commission_line_id: 13, picked_cartons: 30 }],
    commissions: [{ id: 13, aldi_truck_line_id: 3, cartons: 30 }],
    stock: [{ id: 8, commission_line_id: 13, truck_line_id: 3, quantity_cartons: 30, location_id: 10 }],
    locations: [{ id: 10, name: '1sor 1 tárhely', location_type: 'Komissió' }]
  };
}
const check = f => consolidationStockIssues(f.labels, f.commissions, f.stock, f.locations);

test('a historical label with a printed location is not proof of existing stock', () => {
  const f = fixture();
  f.labels[0].location_name = '1. sor';
  f.stock = [];
  const issues = check(f);
  assert.match(issues[0].error, /Nincs hozzá lokációs készletsor/);
  assert.throws(() => assertConsolidationStock(issues), /359900010000000252/);
});

test('a valid pallet uses its actual stock location, not the stale label location', () => {
  const f = fixture();
  f.labels[0].location_name = 'Régi hely';
  const issues = check(f);
  assertConsolidationStock(issues);
  assert.equal(issues[0].stock.id, 8);
  assert.equal(issues[0].location.name, '1sor 1 tárhely');
});

test('ambiguous links, missing physical locations and changed quantities block consolidation', () => {
  for (const change of [
    f => f.stock.push({ ...f.stock[0], id: 9 }),
    f => f.labels.push({ ...f.labels[0], id: 2 }),
    f => { f.locations = []; },
    f => { f.locations[0].location_type = 'Szülő'; },
    f => { f.stock[0].truck_line_id = 4; },
    f => { f.stock[0].quantity_cartons = 0; },
    f => { f.labels[0].picked_cartons = 40; },
    f => { f.commissions[0].cartons = 11; },
  ]) {
    const f = fixture();
    change(f);
    assert.throws(() => assertConsolidationStock(check(f)));
  }
});

// Optional real PostgreSQL route regression. Only connection-local temporary tables
// and a temporary SSCC sequence are used; production rows/sequences are untouched.
// Run from server/: $env:PDA_DB_TESTS='1'; node --test tests/pdaConsolidation.test.js
test('PostgreSQL: list, pre-print checks, stock movement and transaction rollback', { skip: process.env.PDA_DB_TESTS !== '1' }, async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const vm = require('node:vm');
  const { createRequire } = require('node:module');
  const db = require('../src/db/db');
  try {
    await db.transaction(async trx => {
      // No public tables are visible after fixture setup. Explicit IDs avoid
      // defaults that would otherwise allocate values from public sequences.
      for (const table of ['aldi_trucks', 'aldi_truck_lines', 'aldi_commission_lines', 'aldi_stock_locations', 'aldi_locations', 'sscc_labels']) {
        await trx.raw(`CREATE TEMP TABLE ${table} (LIKE public.${table} INCLUDING DEFAULTS) ON COMMIT DROP`);
      }
      await trx.raw('CREATE TEMP SEQUENCE sscc_labels_id_seq START 200');
      await trx.raw('SET LOCAL search_path = pg_temp');
      await trx('aldi_trucks').insert({ id: 3, truck_number: 'AL02', delivery_date: '2026-09-21', sent_to_pda: true, is_loaded: false, target_locations: JSON.stringify([{ id: 61, name: '1. sor' }]) });
      await trx('aldi_locations').insert([
        { id: 61, name: '1. sor', barcode: 'ROW1', location_type: 'Szülő', capacity: 10 },
        { id: 100, parent_id: 61, name: '1sor 1 tárhely', barcode: 'S01010000', location_type: 'Komissió', capacity: 10 },
        { id: 101, parent_id: 61, name: '1sor 2 tárhely', barcode: 'S01020000', location_type: 'Komissió', capacity: 3 }
      ].map(row => ({ ...row, type_code: 'S', building_num: 1 })));
      await trx('aldi_truck_lines').insert({ id: 3, aldi_truck_id: 3, product_name: 'Teszt', ordered_cartons: 100, picked_cartons: 90 });
      for (const id of [1, 2, 3, 4]) {
        await trx('aldi_commission_lines').insert({ id, aldi_truck_id: 3, aldi_truck_line_id: 3, cartons: 20, product_name: 'Teszt', gross_weight: 100, net_weight: 70 });
        await trx('sscc_labels').insert({ id, commission_line_id: id, sscc: String(id).padStart(18, '0'), picked_cartons: 20, is_provisional: false, is_consolidated_master: false, location_name: '1. sor' });
        if (id !== 4) await trx('aldi_stock_locations').insert({ id, commission_line_id: id, truck_line_id: 3, location_id: 100, quantity_cartons: 20, gross_weight: 100, net_weight: 70 });
      }
      const routeFile = path.join(__dirname, '../src/routes/pda.js');
      const actualRequire = createRequire(routeFile);
      const mod = { exports: {} };
      vm.runInNewContext(fs.readFileSync(routeFile, 'utf8'), {
        require: name => name === '../db/db' ? trx : actualRequire(name),
        module: mod, exports: mod.exports, process, console: { ...console, error() {} }
      }, { filename: routeFile });
      async function request(routePath, { body = {}, params = {} } = {}) {
        const layer = mod.exports.stack.find(layer => layer.route?.path === routePath);
        const handler = layer.route.stack.at(-1).handle;
        const result = { status: 200 };
        const res = { status(code) { result.status = code; return this; }, json(data) { result.body = data; return this; } };
        await handler({ body, params, query: {} }, res);
        return result;
      }
      let list = await request('/labels-for-truck/:truckId', { params: { truckId: 3 } });
      assert.equal(list.status, 200);
      assert.equal(list.body.find(row => row.id === 4).can_consolidate, false);
      assert.equal(list.body.find(row => row.id === 1).can_consolidate, true);
      assert.equal(list.body.find(row => row.id === 1).location_name, '1sor 1 tárhely');
      const validateLocation = (labelIds = [1, 2]) => request('/consolidation-validate-location', {
        body: { truckId: 3, locationInput: 'S01020000', labelIds }
      });
      assert.equal((await validateLocation([])).status, 400);
      assert.equal((await validateLocation([1, 1])).status, 400);
      const invalidStock = await validateLocation([1, 4]);
      assert.equal(invalidStock.status, 400);
      assert.match(invalidStock.body.error, /készletsor/);
      const stockBeforeValidation = await trx('aldi_stock_locations').orderBy('id');
      await trx('aldi_locations').where('id', 101).update({ capacity: 1 });
      const fullAtLocation = await validateLocation();
      assert.equal(fullAtLocation.status, 400);
      assert.match(fullAtLocation.body.error, /céllokáció megtelt.*Kapacitás: 1.*érkező raklapok: 2/);
      assert.deepEqual(await trx('aldi_stock_locations').orderBy('id'), stockBeforeValidation);
      await trx('aldi_locations').where('id', 101).update({ capacity: 2 });
      assert.equal((await validateLocation()).status, 200); // Exactly enough capacity.
      await trx('aldi_stock_locations').where('id', 2).update({ location_id: 101 });
      assert.equal((await validateLocation()).status, 200); // Selected stock already here counts once.
      await trx('aldi_stock_locations').where('id', 3).update({ location_id: 101 });
      assert.equal((await validateLocation()).status, 400); // Unselected stock still occupies space.
      await trx('aldi_locations').where('id', 101).update({ capacity: 0 });
      assert.equal((await validateLocation()).status, 200); // No configured capacity limit.
      await trx('aldi_stock_locations').whereIn('id', [2, 3]).update({ location_id: 100 });
      await trx('aldi_locations').where('id', 101).update({ capacity: 3 });
      assert.equal((await validateLocation()).status, 200);
      const preview = ids => request('/consolidation-preview', { body: { labelIds: ids } });
      const missing = await preview([1, 4]);
      assert.equal(missing.status, 400);
      assert.match(missing.body.error, /000000000000000004.*készletsor/);
      assert.equal((await trx.raw('SELECT is_called FROM sscc_labels_id_seq')).rows[0].is_called, false);
      assert.equal((await trx('sscc_labels')).length, 4);

      const prepared = await preview([1, 2]);
      assert.equal(prepared.status, 200, prepared.body.error);
      const master = prepared.body.label;
      const finalBody = { labelIds: [1, 2], truckId: 3, locationId: 101, scannedSscc: master.sscc, masterLabel: master };
      // Stock can disappear after printing: the final check must remain mandatory.
      const removed = await trx('aldi_stock_locations').where('id', 2).first();
      await trx('aldi_stock_locations').where('id', 2).del();
      const rejected = await request('/consolidation', { body: finalBody });
      assert.equal(rejected.status, 400);
      assert.equal((await trx('sscc_labels').where('id', master.id).first()).is_provisional, true);
      assert.equal((await trx('aldi_stock_locations').where('id', 1).first()).location_id, 100);
      await trx('aldi_stock_locations').insert(removed);
      await trx('aldi_locations').where('id', 101).update({ capacity: 1 });
      const full = await request('/consolidation', { body: finalBody });
      assert.equal(full.status, 400);
      assert.match(full.body.error, /megtelt/);
      assert.equal((await trx('sscc_labels').where('id', master.id).first()).is_provisional, true);
      await trx('aldi_locations').where('id', 101).update({ capacity: 3 });
      // A wrong final SSCC cannot move any inventory either.
      assert.equal((await request('/consolidation', { body: { ...finalBody, scannedSscc: '0' } })).status, 400);
      const before = await trx('aldi_stock_locations').orderBy('id');
      const saved = await request('/consolidation', { body: finalBody });
      assert.equal(saved.status, 200, saved.body.error);
      const after = await trx('aldi_stock_locations').orderBy('id');
      assert.equal(after.length, before.length);
      assert.deepEqual(after.map(row => row.quantity_cartons), before.map(row => row.quantity_cartons));
      assert.deepEqual(after.map(row => row.net_weight), before.map(row => row.net_weight));
      assert.deepEqual(after.map(row => row.location_id), [101, 101, 100]);
      assert.equal((await trx('aldi_truck_lines').where('id', 3).first()).picked_cartons, 90);
      const members = await trx('sscc_labels').whereIn('id', [1, 2]).orderBy('id');
      assert.deepEqual(members.map(row => row.sscc), ['000000000000000001', '000000000000000002']);
      assert.ok(members.every(row => row.consolidated_sscc === master.sscc && row.location_name === '1sor 2 tárhely'));
      assert.equal((await trx('sscc_labels').where('id', master.id).first()).picked_cartons, 40);
      assert.equal((await request('/consolidation', { body: finalBody })).status, 400);
      assert.equal((await trx('sscc_labels')).length, 5);
    });
  } finally { await db.destroy(); }
});
