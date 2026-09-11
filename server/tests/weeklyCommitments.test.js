const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../../Access UI/src/utils/weeklyCommitments.js'), 'utf8');
const helpers = import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const dates = ['2026-09-02','2026-09-03','2026-09-04','2026-09-05','2026-09-06','2026-09-07','2026-09-08'];

test('Pear four-day promotion follows Thursday to Sunday, overriding normal only there', async () => {
  const { estimatedDistribution } = await helpers;
  const { result, actionDays } = estimatedDistribution(2686, 1000, '03.09.-06.09.', dates);
  assert.deepEqual(actionDays, ['thu','fri','sat','sun']);
  assert.deepEqual(result, { wed:170, thu:806, fri:806, sat:591, sun:483, mon:110, tue:110 });
});
test('2 and 3 day promotions, zero action, outside week, and year boundary', async () => {
  const { estimatedDistribution: f } = await helpers;
  assert.equal(f(1000,0,'04.09.-05.09.',dates).result.fri,700);
  assert.equal(f(1000,0,'06.09.-08.09.',dates).result.tue,200);
  assert.equal(f(0,1000,'03.09.-06.09.',dates).result.thu,0);
  assert.equal(f(2686,1000,'13.08.-16.08.',dates).result.thu,170);
  const yearDates = ['2026-12-30','2026-12-31','2027-01-01','2027-01-02','2027-01-03','2027-01-04','2027-01-05'];
  assert.equal(f(1000,0,'31.12.-03.01.',yearDates).result.sun,180);
});
test('Friday opening deducts Wednesday and Thursday, arrival replenishes; actual zero wins', async () => {
  const { dailyBalance: f } = await helpers;
  let stock = 100;
  stock = f(stock,0,null,60).closing;
  stock = f(stock,0,null,50).closing;
  assert.equal(f(stock,0,null,40).shortage,50);
  assert.equal(f(stock,30,null,40).available,20);
  assert.equal(f(stock,30,null,40).closing,-20);
  assert.equal(f(100,0,0,60).closing,100);
  assert.equal(f(f(100,0,20,60).closing,0,null,50).closing,30);
});
test('Budapest date changes at local midnight, not UTC midnight', async () => {
  const { budapestToday } = await helpers;
  assert.equal(budapestToday(new Date('2026-09-09T22:00:00Z')), '2026-09-10');
});
test('filename parser accepts HLK/HLA, permits undated plans and maps sample to KW36', () => {
  const backend=fs.readFileSync(path.join(__dirname,'../src/routes/aldi_weekly_commitments.js'),'utf8');
  const functions=backend.slice(backend.indexOf('function getISOWeekOfWednesday'),backend.indexOf("router.post('/upload'"));
  const parse=vm.runInNewContext(functions+'\nparseDatesAndWeek');
  assert.equal(parse('KW36 HLK.xlsx').type,'normal');
  assert.equal(parse('KW36 HLA.xlsx').type,'action');
  assert.equal(parse('Rendelési terv Gava Hungria Kft.xlsx').week_number,null);
  assert.equal(parse('Keresleti 03.09.2026-09.09.2026.xlsx').week_number,36);
});

test('invalid workbook rolls back without overwriting an archived file', async () => {
  const backend = fs.readFileSync(path.join(__dirname,'../src/routes/aldi_weekly_commitments.js'),'utf8');
  const routes = {};
  let writes = 0, rolledBack = false, status;
  const trx = () => ({ where() { return this; }, first() { return this; },
    forUpdate: async () => ({ id: 1, year: 2026, week_number: 36 }) });
  trx.raw = async () => {};
  trx.rollback = async () => { rolledBack = true; };
  const multer = () => ({ single: () => (req,res,next) => next() });
  multer.memoryStorage = () => ({});
  const mocks = {
    express: { Router: () => ({ post: (url,...handlers) => { routes[url] = handlers.at(-1); }, get() {} }) },
    multer, fs: { existsSync: () => true, writeFileSync: () => { writes++; } },
    '../db/db': { transaction: async () => trx }
  };
  vm.runInNewContext(backend, { require: name => mocks[name] || require(name.startsWith('../') ? path.join(__dirname,'../src/routes',name) : name), process, module: {}, console: { error() {} } });
  const xlsx = require('xlsx');
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, xlsx.utils.aoa_to_sheet([['Wrong header'],[12]]), 'Sheet1');
  await routes['/upload']({ file: { originalname: 'KW36 HLK.xlsx', buffer: xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' }) }, body: {} }, { status(code) { status=code; return this; }, json() {} });
  assert.equal(status,400);
  assert.equal(writes,0);
  assert.equal(rolledBack,true);
});
