const test = require('node:test');
const assert = require('node:assert/strict');
const { parseLineItems, buildOrderContentHash } = require('../src/utils/aldiOrderPdf');
const { removeDeletedItemFromOperations } = require('../src/services/aldiOrderDeletion');

test('ALDI PDF parser reads ordinary items and converts 2-Deleted actions to zero', () => {
  const text = `
Purchase Order Number: 4531000000
Action Code LI GTIN Quantity Delivery Date
00010 4061462848544 70 20260918 DDP
2-Deleted 00020 4061462848704 92 20260918 DDP
00030 4061462848056 118 20260918 DDP 2-Deleted
2-Deleted
00040 4061462848049 297 20260918 DDP
`;
  assert.deepEqual(parseLineItems(text), [
    { lineItem:'00010',gtin:'4061462848544',quantity:70,deliveryDate:'2026-09-18',actionCode:null },
    { lineItem:'00020',gtin:'4061462848704',quantity:0,deliveryDate:'2026-09-18',actionCode:'2-Deleted' },
    { lineItem:'00030',gtin:'4061462848056',quantity:0,deliveryDate:'2026-09-18',actionCode:'2-Deleted' },
    { lineItem:'00040',gtin:'4061462848049',quantity:0,deliveryDate:'2026-09-18',actionCode:'2-Deleted' }
  ]);
});

test('content duplicate hash is independent of PDF bytes, filename and item order', () => {
  const a = [
    {gtin:'4061462848544',quantity:70},
    {gtin:'4061462848704',quantity:0}
  ];
  const b = [...a].reverse();
  const hash = buildOrderContentHash('2026-09-18', a);
  assert.equal(buildOrderContentHash('2026-09-18', b), hash);
  assert.equal(buildOrderContentHash('2026-09-18', [{gtin:a[0].gtin,quantity:20},{gtin:a[0].gtin,quantity:50},a[1]]), hash);
  assert.notEqual(buildOrderContentHash('2026-09-18', [{...a[0],quantity:71}, a[1]]), hash);
  assert.notEqual(buildOrderContentHash('2026-09-19', a), hash);
});

test('deleted item cleanup removes commission and truck rows then resets demand state', async () => {
  const calls = [];
  const trx = table => {
    const query = {
      where(value){calls.push([table,'where',value]);return this;},
      orWhereIn(column,values){calls.push([table,'orWhereIn',column,values]);return this;},
      whereIn(column,values){calls.push([table,'whereIn',column,values]);return this;},
      async delete(){calls.push([table,'delete']);return table === 'aldi_commission_lines' ? 2 : 1;},
      async update(value){calls.push([table,'update',value]);return 1;}
    };
    return query;
  };
  trx.fn = {now:()=>'now'};
  const result = await removeDeletedItemFromOperations(trx,{id:9,sent_cartons:'20'},[
    {id:4,ordered_cartons:'8'}, {id:5,ordered_cartons:'7'}
  ]);
  assert.deepEqual(result,{removedFromDemand:20,removedFromTrucks:15,removedCommissionLines:2});
  assert.deepEqual(calls.map(call=>call.slice(0,2)),[
    ['aldi_commission_lines','where'],['aldi_commission_lines','orWhereIn'],['aldi_commission_lines','delete'],
    ['aldi_truck_lines','whereIn'],['aldi_truck_lines','delete'],
    ['aldi_order_item_states','where'],['aldi_order_item_states','update']
  ]);
  assert.equal(calls.at(-1)[2].sent_cartons,0);
});
