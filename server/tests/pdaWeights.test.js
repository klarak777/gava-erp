const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../src/routes/pda.js'), 'utf8');
const start = source.indexOf('async function processPick(');
const end = source.indexOf("router.put('/commission-lines/:id/pick-and-assign'", start);
const processPick = vm.runInNewContext(source.slice(start, end) + '\nprocessPick', { process });

function fixture() {
  const line = { id: 1, aldi_truck_id: 1, product_name: 'Nektarin', ordered_cartons: 50, picked_cartons: 0, cartons_per_pallet: 5 };
  const logs = [];
  const pallet = { id: 25, name: 'EU', category: 'Raklap', is_active: true, tare_weight_kg: 22 };
  const trx = table => ({
    where() { return this; }, 
    forUpdate() { return this; },
    orderBy() { return this; },
    count() { return this; },
    async first() { 
      if (table === 'aldi_truck_lines') return { ...line };
      if (table === 'ref_packaging_types') return pallet;
      if (table === 'aldi_locations') return { id: 5, capacity: 10 };
      return null;
    },
    insert(row) { 
      // Add table name to row for easier filtering
      row._table = table;
      logs.push(row); 
      return { returning: async () => [{ id: logs.length, ...row }] };
    },
    async update(row) { Object.assign(line, row); }
  });
  trx.raw = async () => ({ rows: [{ next_id: 999 }] });
  return { trx, line, logs, pallet };
}
const data = (qty, gross, tare, sid) => ({ picked_cartons: qty, gross_weight: gross, tare_weight: tare, pallet_type: 25, pickSessionId: sid || Math.random().toString() });

test('each pick is a single pallet, with matching location and commission rows', async () => {
  const f = fixture();
  // Location ID = 5 passed as fourth argument
  await processPick(f.trx, 1, data(8, 200, 8, 'session-1'), 5); 
  assert.equal(f.line.net_weight, 114); // 200 - (64 + 22) = 114
  await processPick(f.trx, 1, data(7, 300, 7, 'session-2'), 5); 
  assert.equal(f.line.gross_weight, 500);
  assert.equal(f.line.net_weight, 343); // 114 + (300 - (49 + 22)) = 114 + 229 = 343
  
  const comms = f.logs.filter(r => r._table === 'aldi_commission_lines');
  const locs = f.logs.filter(r => r._table === 'aldi_stock_locations');
  
  assert.deepEqual(comms.map(row => row.pallets), [1, 1]);
  assert.equal(comms.length, 2);
  assert.equal(locs.length, 2);
  assert.ok(locs[0].commission_line_id);
  assert.ok(locs[1].commission_line_id);
  assert.notEqual(locs[0].commission_line_id, locs[1].commission_line_id);
});

test('rejects impossible weights, missing pallet tare, and incomplete historical totals', async () => {
  let f = fixture();
  await assert.rejects(processPick(f.trx, 1, data(8, 10, 20)), { code: 'INVALID_WEIGHT' });
  assert.equal(f.logs.length, 0);
  f.pallet.tare_weight_kg = null;
  await assert.rejects(processPick(f.trx, 1, data(8, 100, 8)), { code: 'INVALID_WEIGHT' });
  f = fixture();
  f.line.picked_cartons = 8;
  await assert.rejects(processPick(f.trx, 1, data(7, 100, 7)), { code: 'INVALID_WEIGHT' });
});

test('zero net is saved and a different item starts its own pallets', async () => {
  const a = fixture(), b = fixture();
  await processPick(a.trx, 1, data(8, 86, 8, 'session-a')); // 86 = 64 (tare) + 22 (pallet)
  await processPick(b.trx, 2, data(7, 200, 7, 'session-b'));
  assert.equal(a.line.net_weight, 0); // 86 - 86 = 0
  assert.equal(b.logs.filter(r => r._table === 'aldi_commission_lines')[0].pallets, 1);
});

test('weight cell puts kg in bar and percent below; missing and zero differ', () => {
  const ui = fs.readFileSync(path.join(__dirname, '../../Access UI/src/modules/aldi_rakodas.js'), 'utf8');
  const body = ui.slice(ui.indexOf('const weightCell ='), ui.indexOf('\n              return `', ui.indexOf('const weightCell =')));
  const render = vm.runInNewContext(body + '\nweightCell', { isReadOnly: true, pct: 30, picked: 15, ordered: 50, bgGradient: 'green', l: { id: 1 } });
  const html = render(119, 'net');
  assert.match(html, /119 kg<\/div>/);
  assert.match(html, /font-size:10px[^]*>30%<\/div>/);
  assert.match(render(0, 'net'), /0 kg/);
  assert.match(render(null, 'net'), /Nincs adat/);
});
