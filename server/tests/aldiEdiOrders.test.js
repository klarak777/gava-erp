const test = require('node:test');
const assert = require('node:assert/strict');
const { parseOrders, applyOrderMessage, segmentsFrom, readableOriginal } = require('../src/services/aldiEdiOrders');
const { order, interchange } = require('./helpers/aldiEdiFixtures.cjs');
const message = options => parseOrders(interchange([order(options)])).messages[0];

test('ORDERS original, delta change, explicit deletion and whole cancellation preserve version history', () => {
  const first = applyOrderMessage(null, message({}), 'delta');
  assert.deepEqual(first.items.map(i => [i.quantity, i.remainingQuantity]), [[20, 20], [44, 44]]);
  const changed = applyOrderMessage(first, message({ kind: '230', version: 2, items: [['3', 40], ['3', 52]] }), 'delta');
  assert.deepEqual(changed.changes.map(c => c.delta), [20, 8]);
  const deleted = applyOrderMessage(changed, message({ kind: '230', version: 3, items: [['2', 40]] }), 'delta');
  assert.deepEqual(deleted.items.map(i => i.quantity), [0, 52]);
  assert.equal(deleted.changes[0].delta, -40);
  const cancelled = applyOrderMessage(deleted, message({ kind: '230', version: 4, items: [['2', 40], ['2', 52]] }), 'delta');
  assert.deepEqual(cancelled.items.map(i => i.remainingQuantity), [0, 0]);
  assert.equal(cancelled.internalVersion, 4);
  assert.deepEqual(first.items.map(i => i.quantity), [20, 44], 'Previous snapshot stays unchanged');
});

test('delta retains omitted rows; full requires explicit rows and unchanged action 4', () => {
  const first = applyOrderMessage(null, message({}), 'delta');
  const delta = message({ kind: '230', version: 2, items: [['3', 30]] });
  assert.deepEqual(applyOrderMessage(first, delta, 'delta').items.map(i => i.quantity), [30, 44]);
  assert.throws(() => applyOrderMessage(first, delta, 'full'), /explicit/);
  const full = message({ kind: '230', version: 2, items: [['3', 30], ['4', 44]] });
  assert.equal(applyOrderMessage(first, full, 'full').changes.length, 1);
  assert.throws(() => applyOrderMessage(first, full, 'delta'), /változatlan/i);
  const deleted = applyOrderMessage(first, message({ kind: '230', version: 2, items: [['2', 20], ['4', 44]] }), 'full');
  const later = applyOrderMessage(deleted, message({ kind: '230', version: 3, items: [['3', 50, { lineId: '00090', gtin: '4069365093832' }]] }), 'full');
  assert.deepEqual(later.items.map(i => i.quantity), [0, 50], 'Previously deleted row stays zero without being resent');
});

test('partial delivery and QTY 27 close only outstanding quantity and retain ordered amount', () => {
  const first = applyOrderMessage(null, message({}), 'delta');
  const partial = applyOrderMessage(first, message({ kind: '230', version: 2, items: [['3', 20, { delivered: 8 }]] }), 'delta');
  assert.equal(partial.items[0].remainingQuantity, 12);
  const closed = applyOrderMessage(partial, message({ kind: '230', version: 3, items: [['3', 20, { delivered: 8, close: true }]] }), 'delta');
  assert.equal(closed.items[0].quantity, 20);
  assert.equal(closed.items[0].deliveredQuantity, 8);
  assert.equal(closed.items[0].remainingQuantity, 0);
  assert.equal(closed.changes[0].delta, 0);
  assert.throws(() => applyOrderMessage(partial, message({ kind: '230', version: 3, items: [['3', 7]] }), 'delta'), /szállított/);
  assert.throws(() => applyOrderMessage(partial, message({ kind: '230', version: 3, items: [['3', 20, { delivered: 7 }]] }), 'delta'), /csökkenés/);
  assert.throws(() => applyOrderMessage(closed, message({ kind: '230', version: 4, items: [['3', 20]] }), 'delta'), /újranyitás/);
});

test('new lines and delivery date changes are tracked; unknown and stale changes are rejected', () => {
  const first = applyOrderMessage(null, message({}), 'delta');
  const added = applyOrderMessage(first, message({ kind: '230', version: 2, items: [['1', 10, { lineId: '00100' }]] }), 'delta');
  assert.equal(added.items.length, 3);
  assert.equal(added.changes[0].delta, 10);
  const dated = applyOrderMessage(first, message({ kind: '230', version: 2, date: '20261015', items: [['3', 20]] }), 'delta');
  assert.equal(dated.changes[0].delta, 0);
  assert.equal(dated.changes[0].previousDeliveryDate, '2026-10-14');
  assert.throws(() => applyOrderMessage(null, message({ kind: '230', version: 2, items: [['3', 20]] }), 'delta'), /eredeti/);
  assert.throws(() => applyOrderMessage(added, message({ kind: '230', version: 2, items: [['3', 20]] }), 'delta'), /Régebbi/);
  assert.throws(() => applyOrderMessage(first, message({ kind: '230', version: 3, items: [['3', 20]] }), 'delta'), error => error.code === 'VERSION_GAP');
  assert.throws(() => applyOrderMessage(first, message({ kind: '230', version: 2, items: [['2', 10, { lineId: '00100' }]] }), 'delta'), /nem található/);
});

test('UNB test identity, message counts, GTINs, dates and action codes are validated', () => {
  const valid = interchange();
  assert.equal(parseOrders(valid, { sender: '4012345000009', receiver: '4012345000016', supplier: '5013546350114' }).messages.length, 1);
  assert.throws(() => parseOrders(valid, { receiver: 'WRONG' }), /UNB receiver/);
  assert.throws(() => parseOrders(interchange([order()], { test: false })), /tesztjelzés/);
  assert.throws(() => parseOrders(Buffer.from(valid.toString('latin1').replace(/UNT\+\d+/, 'UNT+1'))), /UNT/);
  assert.throws(() => parseOrders(Buffer.from(valid.toString('latin1').replace('UNZ+1', 'UNZ+2'))), /UNZ/);
  assert.throws(() => message({ date: '20260230' }), /naptári/);
  assert.throws(() => message({ items: [[null, 20, { gtin: '123' }]] }), /GTIN/);
  assert.throws(() => message({ items: [['2', 20]] }), /Eredeti/);
  assert.throws(() => message({ kind: '230' }), /műveletkód/);
  assert.throws(() => parseOrders(valid.subarray(0, valid.length - 1)), /szegmenslezárás/);
});

test('escaped service characters and UNOD Hungarian names survive decoding', () => {
  const bytes = interchange([order({ name: "Árvíztűrő ?+ Kft?. ?' próba?:" })], { charset: 'UNOD' });
  assert.equal(parseOrders(bytes).messages[0].parties.SU.name, "Árvíztűrő + Kft. ' próba:");
  assert.match(readableOriginal(bytes), /Árvíztűrő/);
  const custom = Buffer.from("UNA;,!~ ^UNB,UNOC;3,Sender~,,Receiver,261013;1200,1,,,,,EANCOM,1^UNZ,0,1^", 'latin1');
  assert.equal(segmentsFrom(custom).segments[0][2][0], 'Sender,');
});

test('multiple messages in an interchange retain references and versions', () => {
  const bytes = interchange([order(), order({ kind: '230', version: 2, items: [['3', 40]] })]);
  const parsed = parseOrders(bytes);
  assert.equal(parsed.messages.length, 2);
  assert.equal(applyOrderMessage(applyOrderMessage(null, parsed.messages[0], 'delta'), parsed.messages[1], 'delta').items[0].quantity, 40);
});

test('MIG CNT 38E is an estimated pallet count, separate from item count', () => {
  const body = order();
  body.splice(body.length - 1, 0, 'CNT+38E:10');
  body[body.length - 1] = `UNT+${body.length}+1`;
  assert.equal(parseOrders(interchange([body])).messages[0].estimatedPallets, '10');
  body[body.length - 2] = 'CNT+38E:invalid';
  assert.throws(() => parseOrders(interchange([body])), /raklapszám/);
});
