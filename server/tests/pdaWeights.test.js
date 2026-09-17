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
    async first() { return table === 'aldi_truck_lines' ? { ...line } : pallet; },
    insert(row) { 
      logs.push(row); 
      return { returning: async () => [row] };
    },
    async update(row) { Object.assign(line, row); }
  });
  trx.raw = async () => ({ rows: [{ next_id: 999 }] });
  return { trx, line, logs, pallet };
}
const data = (qty, gross, tare) => ({ picked_cartons: qty, gross_weight: gross, tare_weight: tare, pallet_type: 25 });

test('8 then 7 cartons uses two then one pallets and accumulates net weight', async () => {
  const f = fixture();
  await processPick(f.trx, 1, data(8, 200, 8)); // increased gross weight
  assert.equal(f.line.net_weight, 92); // 200 - 108 = 92
  await processPick(f.trx, 1, data(7, 300, 7)); // increased gross weight
  assert.equal(f.line.gross_weight, 500);
  assert.equal(f.line.net_weight, 321); // 92 + (300 - (7*7 + 1*22)) = 92 + (300 - 71) = 92 + 229 = 321
  assert.deepEqual(f.logs.filter(r => 'pallets' in r).map(row => row.pallets), [2, 1]);
  assert.ok(f.logs.filter(r => 'pallets' in r).every(row => row.aldi_truck_id && row.product_name));
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
  await processPick(a.trx, 1, data(8, 108, 8)); // 108 equals 64 + 44 exactly
  await processPick(b.trx, 2, data(7, 200, 7));
  assert.equal(a.line.net_weight, 0); // 108 - 108 = 0
  assert.equal(b.logs[0].pallets, 2);
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
