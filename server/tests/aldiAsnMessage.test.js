const test = require('node:test');
const assert = require('node:assert/strict');
const { analyse, buildMessage } = require('../src/services/aldiAsnMessage');
const { validGs1, generateSscc } = require('../src/utils/gs1');
const { source, profile } = require('./helpers/aldiAsnFixtures.cjs');
function message(data = source(), p = profile) {
  const a = analyse(data, p);
  assert.deepEqual(a.issues, []);
  return buildMessage(a.groups[0], { asnNumber: 'GAVA-1', controlReference: 'GA1', deliveryDate: data.truck.delivery_date }, new Date('2026-10-14T12:34:00Z')).toString('latin1');
}
test('licensed Gava SSCC allocation has a valid digit and detects serial exhaustion', () => {
  assert.equal(generateSscc(1, '5999883976').slice(1, 11), '5999883976');
  assert.equal(validGs1(generateSscc(1, '5999883976'), [18]), true);
  assert.throws(() => generateSscc(1000000, '5999883976'), /betelt/);
  assert.throws(() => generateSscc('bad'), /Érvénytelen/);
});
test('Warehouse 2.4 emits actual partial quantity, one PO header, correct syntax/count and SSCC', () => {
  const text = message();
  assert.match(text, /DESADV:D:01B:UN:EAN008\+2\.0'/);
  assert.match(text, /BGM\+351::9:WAREHOUSE\+GAVA-1\+9'/);
  assert.match(text, /DTM\+191:20261015:102'/);
  assert.match(text, /EANCOM\+1'/);
  assert.match(text, /RFF\+ON:4500012345'/);
  assert.match(text, /QTY\+12:30'/);
  assert.doesNotMatch(text, /QTY\+12:100'/);
  assert.match(text, /CPS\+1'\nCPS\+2\+1'\nPAC\+1'\nPCI\+39'/);
  assert.match(text, /CNT\+38E:1'/);
  assert.match(text, /UNZ\+1\+GA1'/);
  const segments = text.split('\n'), start = segments.findIndex(s => s.startsWith('UNH+')), end = segments.findIndex(s => s.startsWith('UNT+'));
  assert.equal(Number(segments[end].split('+')[1]), end - start + 1);
});
test('multiple purchase orders require original line references; split by target warehouse', () => {
  const data = source();
  data.lines.push({ ...data.lines[0], id: 2, aldi_daily_order_line_id: 2, edi_line_reference: '00090', order: { base_order_number: '4500054321', ordered_cartons: 100 } });
  data.commissions.push({ ...data.commissions[0], id: 2, aldi_truck_line_id: 2 });
  data.labels.push({ ...data.labels[0], id: 2, sscc: generateSscc(2, '5999883976'), commission_line_id: 2, aldi_truck_line_id: 2 });
  const text = message(data);
  assert.match(text, /RFF\+ON:4500012345:00040'/);
  assert.match(text, /RFF\+ON:4500054321:00090'/);
  data.lines[1].edi_line_reference = null;
  assert.ok(analyse(data, profile).issues.some(i => i.code === 'ORDER_LINE'));
  data.lines[1].destination = 'Raktár B';
  assert.equal(analyse(data, profile).groups.length, 2);
  assert.ok(!analyse(data, profile).issues.some(i => i.code === 'ORDER_LINE'));
});
test('consolidated mixed pallet uses master SSCC once and retains both item quantities', () => {
  const data = source();
  data.lines.push({ ...data.lines[0], id: 2, aldi_daily_order_line_id: 2, gtin: '4069365093832', edi_line_reference: '00090' });
  data.commissions.push({ ...data.commissions[0], id: 2, aldi_truck_line_id: 2 });
  data.labels.push({ ...data.labels[0], id: 2, sscc: generateSscc(2, '5999883976'), commission_line_id: 2, aldi_truck_line_id: 2 });
  const master = generateSscc(3, '5999883976');
  data.labels.forEach(l => { l.consolidated_sscc = master; });
  data.labels.push({ id: 3, sscc: master, is_consolidated_master: true, is_provisional: false, picked_cartons: 60, pallets_json: JSON.stringify(data.labels.map(l => l.sscc)) });
  const text = message(data);
  assert.equal((text.match(/GIN\+AW/g) || []).length, 1);
  assert.match(text, new RegExp('GIN\\+AW\\+' + master));
  assert.equal((text.match(/QTY\+12:30/g) || []).length, 2);
  data.lines[1].destination = 'Másik raktár';
  assert.ok(analyse(data, profile).issues.some(i => i.code === 'MIXED_DESTINATION'));
});
test('missing, provisional, ambiguous, wrong-prefix and inconsistent labels block the ASN', () => {
  for (const mutate of [d => { d.labels = []; }, d => { d.labels[0].is_provisional = true; }, d => { d.labels.push({ ...d.labels[0], id: 9 }); }, d => { d.labels[0].sscc = generateSscc(1, '5990001'); }, d => { d.labels[0].picked_cartons = 31; }, d => { d.commissions[0].pallets = 2; }]) {
    const data = source(); mutate(data); assert.equal(analyse(data, profile).ready, false);
  }
});
test('missing routing, invalid GTIN, overdelivery and unsupported variant are blocked', () => {
  const data = source();
  assert.equal(analyse(data, { ...profile, receiver: '' }).ready, false);
  assert.equal(analyse(data, { ...profile, variant: 'variant_level' }).ready, false);
  data.lines[0].gtin = '123'; assert.equal(analyse(data, profile).ready, false);
  data.lines[0].gtin = source().lines[0].gtin;
  data.lines[0].order.fulfilled_cartons = 101;
  assert.ok(analyse(data, profile).issues.some(i => i.code === 'FULFILLED_TOTAL'));
});
test('PDA session with multiple tare supports remains one explicitly identified logistic unit', () => {
  const data = source();
  data.commissions[0].pallets = 2;
  data.commissions[0].pick_session_id = 'one-unit';
  data.labels[0].pick_session_id = 'one-unit';
  assert.match(message(data), /CNT\+38E:1'/);
});
test('batch escaping, BBD/expiry choice and encoding validation follow the MIG', () => {
  const data = source();
  data.commissions[0].lot_number = 'LOT+?:\'';
  data.labels[0].asn_best_before = '2026-10-20';
  const text = message(data, { ...profile, requiredDateType: 'best_before' });
  assert.match(text, /DTM\+361:20261020:102'/);
  assert.ok(text.includes("GIN+BX+LOT?+???:?'"));
  data.labels[0].asn_expiry_date = '2026-10-21'; assert.equal(analyse(data, profile).ready, false);
  data.labels[0].asn_best_before = null;
  assert.match(message(data), /DTM\+36:20261021:102'/);
  data.commissions[0].lot_number = 'ŐR';
  assert.ok(analyse(data, profile).issues.some(i => i.code === 'MESSAGE_FORMAT'));
  assert.equal(analyse(data, { ...profile, syntax: 'UNOD' }).ready, true);
});
test('document and interchange timestamps use the Hungarian calendar at local midnight', () => {
  const data = source(), group = analyse(data, profile).groups[0];
  const text = buildMessage(group, { asnNumber: 'GAVA-DATE', controlReference: 'GADATE', deliveryDate: data.truck.delivery_date }, new Date('2026-10-13T22:30:00Z')).toString();
  assert.match(text, /DTM\+137:20261014:102'/);
  assert.match(text, /\+261014:0030\+GADATE/);
});
