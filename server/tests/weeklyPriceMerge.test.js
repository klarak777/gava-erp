const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyWeeklyPriceUpload } = require('../src/utils/weeklyPriceMerge');

const row = (gtin, start, unit, extra = {}) => ({
  gtin, xlsx_product_name:`Termék ${gtin}`, carton_content:10, origin:'HU', packaging:'IFCO',
  crate_cost:'Ft1000', unit_cost:unit, original_period_start:start, original_period_end:'2026-09-22', ...extra
});

test('weekly price merge skips existing rows and identifies only new products or periods', () => {
  const existing = [row('1111111111111','2026-09-16','Ft100'), row('1111111111111','2026-09-20','Ft120')];
  const incoming = [
    row('1111111111111','2026-09-16','Ft100'),
    row('2222222222222','2026-09-16','Ft200'),
    row('1111111111111','2026-09-18','Ft110')
  ];
  assert.deepEqual(classifyWeeklyPriceUpload(existing,incoming),{
    newIndexes:[1,2],changedIndexes:[],duplicateIndexes:[0]
  });
});

test('same GTIN and period with changed price is a conflict, not a new row', () => {
  const existing = [row('1111111111111','2026-09-16','Ft100')];
  const incoming = [row('1111111111111','2026-09-16','Ft150')];
  assert.deepEqual(classifyWeeklyPriceUpload(existing,incoming),{
    newIndexes:[],changedIndexes:[0],duplicateIndexes:[]
  });
});

test('duplicate rows inside the newly uploaded workbook are inserted only once', () => {
  const incoming = [row('3333333333333','2026-09-16','Ft300'),row('3333333333333','2026-09-16','Ft300')];
  assert.deepEqual(classifyWeeklyPriceUpload([],incoming),{
    newIndexes:[0],changedIndexes:[],duplicateIndexes:[1]
  });
});
