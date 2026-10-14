const iconv = require('iconv-lite');
const { validGs1, GAVA_COMPANY_PREFIX } = require('../utils/gs1');
const num = v => Number(v);
const text = v => String(v ?? '').trim();
const json = v => typeof v === 'string' ? JSON.parse(v) : v;
function profileValue(input = {}) {
  const p = Object.fromEntries(['sender', 'receiver', 'buyer', 'supplier', 'syntax', 'variant', 'mode'].map(k => [k, text(input[k])]));
  return { ...p, confirmed: input.confirmed === true, quantityConfirmed: input.quantityConfirmed === true, requireLot: input.requireLot === true, requiredDateType: input.requiredDateType || 'none',
    destinations: Array.isArray(input.destinations) ? input.destinations.slice(0, 50).map(d => ({ name: text(d.name), buyer: text(d.buyer), receiver: text(d.receiver) })) : [] };
}
function dateValue(v) {
  const s = v instanceof Date ? v.toISOString().slice(0, 10) : text(v).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s ? s : null;
}
function analyse(source, rawProfile) {
  const profile = profileValue(rawProfile), issues = [], pallets = new Map(), groups = new Map();
  const add = (code, message, lineId = null) => issues.push({ code, message, lineId });
  if (profile.variant !== 'lpn_item') add('MIG_VARIANT', 'Az elvárt Warehouse MIG még nincs LPN and Item Level profilra beállítva. Variant Level feldolgozó nincs implementálva.');
  if (!['test', 'live'].includes(profile.mode)) add('MODE', 'Válassz teszt vagy éles üzenetprofilt.');
  if (!['UNOC', 'UNOD'].includes(profile.syntax)) add('SYNTAX', 'UNOC vagy UNOD karakterkészlet szükséges.');
  if (!['none', 'best_before', 'expiry'].includes(profile.requiredDateType)) add('DATE_PROFILE', 'Hibás eltarthatósági profil.');
  for (const key of ['sender', 'supplier']) if (!validGs1(profile[key], [13])) add('PROFILE_' + key, `Hiányzó vagy hibás Gava ${key === 'sender' ? 'küldő' : 'szállító'} GLN.`);
  if (!dateValue(source.truck.delivery_date)) add('DELIVERY_DATE', 'Hiányzó vagy hibás várható érkezési dátum.');
  if (!source.lines.length) add('EMPTY', 'A kamionnak nincs rendeléstétele.');
  const commissions = source.commissions.filter(c => num(c.cartons) > 0);
  if (source.commissions.some(c => !Number.isInteger(num(c.cartons)) || num(c.cartons) < 0)) add('COMMISSION_QUANTITY', 'Hibás komissiózási kartonmennyiség.');
  if (!commissions.length) add('NO_PICK', 'Nincs ténylegesen komissiózott, felrakodható áru.');
  const eligible = source.labels.filter(l => l.is_provisional === false && !l.reservation_cancelled_at);
  const masters = new Map(source.labels.filter(l => l.is_consolidated_master && l.is_provisional === false).map(l => [l.sscc, l]));
  const qtyByLine = new Map();
  for (const c of commissions) {
    const line = source.lines.find(l => num(l.id) === num(c.aldi_truck_line_id));
    if (!line) { add('COMMISSION_LINK', `A ${c.id}. komissióhoz nincs egyértelmű rendelési kamionsor.`); continue; }
    const lineId = line.id, order = line.order || {}, ref = text(line.asn_order_line_reference || line.edi_line_reference);
    const destination = text(line.destination);
    const routing = profile.destinations.find(d => d.name === destination) || profile;
    const key = destination;
    if (!destination) add('DESTINATION', 'Hiányzik a célraktár a kamionsorból.', lineId);
    if (!validGs1(routing.buyer, [13])) add('BUYER', 'Hiányzó vagy hibás ALDI beszerző GLN.', lineId);
    if (!validGs1(routing.receiver, [13])) add('RECEIVER', 'Hiányzó vagy hibás ALDI UNB fogadó GLN.', lineId);
    if (!validGs1(line.gtin, [13, 14])) add('GTIN', 'Hiányzó vagy hibás rendelési GTIN.', lineId);
    if (ref && (!/^\d{1,6}$/.test(ref) || !/[1-9]/.test(ref))) add('ORDER_LINE', 'Hibás eredeti ALDI rendeléstétel sorszám.', lineId);
    if (!text(order.base_order_number) || text(order.base_order_number).length > 35) add('ORDER_NUMBER', 'Hiányzó vagy túl hosszú eredeti rendelési szám.', lineId);
    if (!Number.isInteger(num(c.cartons)) || num(c.cartons) <= 0) add('QUANTITY', 'Érvénytelen tényleges kartonmennyiség.', lineId);
    const labels = eligible.filter(l => !l.is_consolidated_master && num(l.commission_line_id) === num(c.id));
    if (labels.length !== 1) { add('PALLET_LABEL', `A ${c.id}. komissióhoz ${labels.length} végleges címke tartozik; egyértelmű raklapazonosító szükséges.`, lineId); continue; }
    const label = labels[0];
    // A PDA pick session creates one labelled logistic unit. Its pallet-type list
    // may contain multiple tare supports, rather than multiple independent units.
    const singlePdaUnit = c.pick_session_id && label.pick_session_id === c.pick_session_id;
    if (num(c.pallets) > 1 && !singlePdaUnit) add('MULTI_PALLET', `A ${c.id}. komissió több raklapot jelez; egyértelmű fizikai egységenkénti SSCC és mennyiség szükséges.`, lineId);
    if (num(label.picked_cartons) !== num(c.cartons)) add('LABEL_QUANTITY', `A ${c.id}. komissió és címke kartonszáma eltér.`, lineId);
    if (label.aldi_truck_line_id && num(label.aldi_truck_line_id) !== num(line.id)) add('LABEL_LINK', 'A címke másik kamionsorhoz tartozik.', lineId);
    const physicalSscc = text(label.consolidated_sscc || label.sscc), master = label.consolidated_sscc ? masters.get(physicalSscc) : null;
    if (label.consolidated_sscc && !master) add('MASTER_MISSING', 'Az összeemelt raklap végleges mestercímkéje hiányzik.', lineId);
    if (!validGs1(physicalSscc, [18])) add('SSCC', 'A fizikai raklap SSCC-je hibás.', lineId);
    if (physicalSscc.slice(1, 11) !== GAVA_COMPANY_PREFIX) add('SSCC_PREFIX', 'A Gava által képzett raklapcímke nem a 5999883976 licencelt prefixet használja.', lineId);
    if (pallets.has(physicalSscc) && pallets.get(physicalSscc).destination !== destination) add('MIXED_DESTINATION', 'Egy összeemelt raklap különböző célraktárak áruit tartalmazza.', lineId);
    if (!pallets.has(physicalSscc)) pallets.set(physicalSscc, { sscc: physicalSscc, destination, members: [], items: [] });
    const pallet = pallets.get(physicalSscc);
    pallet.members.push(label.sscc);
    const lot = text(label.lot_number || c.lot_number || line.lot_number);
    if (profile.requireLot && !lot) add('LOT', 'A partnerprofil szerint kötelező a gyártási tétel.', lineId);
    if (lot.length > 20) add('LOT_LENGTH', 'A gyártási tétel a MIG szerint legfeljebb 20 karakter lehet.', lineId);
    const bestBefore = label.asn_best_before ? dateValue(label.asn_best_before) : null;
    const expiryDate = label.asn_expiry_date ? dateValue(label.asn_expiry_date) : null;
    if ((label.asn_best_before && !bestBefore) || (label.asn_expiry_date && !expiryDate) || (bestBefore && expiryDate)) add('PALLET_DATE', 'Egy tételhez egyetlen, érvényes minőségmegőrzési vagy lejárati dátum adható meg.', lineId);
    if ((profile.requiredDateType === 'best_before' && !bestBefore) || (profile.requiredDateType === 'expiry' && !expiryDate)) add('DATE_MISSING', 'Hiányzik a partnerprofil szerinti kötelező eltarthatósági dátum.', lineId);
    pallet.items.push({ truckLineId: lineId, gtin: line.gtin, orderNumber: text(order.base_order_number), orderLineReference: ref, quantity: num(c.cartons), lot, bestBefore, expiryDate, labelId: label.id });
    qtyByLine.set(lineId, (qtyByLine.get(lineId) || 0) + num(c.cartons));
    if (!groups.has(key)) groups.set(key, { destination, profile: { ...profile, buyer: routing.buyer, receiver: routing.receiver }, pallets: [] });
  }
  for (const line of source.lines) {
    const actual = qtyByLine.get(line.id) || 0;
    const commissioned = commissions.filter(c => num(c.aldi_truck_line_id) === num(line.id)).reduce((n, c) => n + num(c.cartons), 0);
    if (!Number.isFinite(num(line.picked_cartons)) || commissioned !== num(line.picked_cartons)) add('PICK_TOTAL', 'A komissiók és a kamionsor tényleges kartonszáma eltér.', line.id);
    if (actual > num(line.ordered_cartons) || actual > num(line.order?.ordered_cartons)) add('OVER_DELIVERY', 'A felrakott mennyiség meghaladja a kamionra/rendelésre megadott mennyiséget.', line.id);
    const totalFulfilled = num(line.order?.fulfilled_cartons || 0) + (source.truck.is_loaded ? 0 : commissioned);
    if (totalFulfilled > num(line.order?.ordered_cartons)) add('FULFILLED_TOTAL', 'A korábbi és a mostani teljesítés együttes mennyisége meghaladja a rendelést.', line.id);
  }
  const byOrderItem = new Map();
  for (const line of source.lines) {
    const key = `${line.order?.base_order_number}|${line.aldi_daily_order_line_id || line.edi_line_reference || line.gtin}`;
    const item = byOrderItem.get(key) || { quantity: 0, limit: num(line.order?.ordered_cartons) };
    item.quantity += commissions.filter(c => num(c.aldi_truck_line_id) === num(line.id)).reduce((n, c) => n + num(c.cartons), 0);
    item.limit = Math.min(item.limit, num(line.order?.ordered_cartons));
    byOrderItem.set(key, item);
  }
  if ([...byOrderItem.values()].some(i => i.quantity > i.limit)) add('ORDER_TOTAL', 'Az ugyanazon rendeléstételhez tartozó kamionsorok együttes mennyisége meghaladja a rendelést.');
  for (const [sscc, pallet] of pallets) {
    const master = masters.get(sscc);
    if (master) {
      let members = [];
      try {
        const parsed = json(master.pallets_json);
        if (!Array.isArray(parsed) || parsed.some(s => typeof s !== 'string')) throw new Error('members');
        members = parsed;
      } catch (_) { add('MASTER_MEMBERS', 'Hibás összeemelt raklaplista.'); }
      if (members.length !== pallet.members.length || members.some(s => !pallet.members.includes(s))) add('MASTER_MEMBERS', 'Az összeemelt raklap valamely tagja hiányzik a szállítmányból.');
      if (num(master.picked_cartons) !== pallet.items.reduce((n, i) => n + i.quantity, 0)) add('MASTER_TOTAL', 'Az összeemelt raklap összes mennyisége eltér.');
    }
    groups.get(pallet.destination)?.pallets.push(pallet);
  }
  for (const group of groups.values()) {
    const items = group.pallets.flatMap(p => p.items);
    if (new Set(items.map(i => i.orderNumber)).size > 1) for (const i of items) if (!i.orderLineReference) add('ORDER_LINE', 'Több rendelést tartalmazó ASN-hez hiányzik az eredeti ALDI tételsorszám.', i.truckLineId);
  }
  if (!issues.length) for (const group of groups.values()) {
    try { buildMessage(group, { asnNumber: 'PREVIEW', controlReference: 'PREVIEW', deliveryDate: source.truck.delivery_date }); }
    catch (error) { add('MESSAGE_FORMAT', error.message); }
  }
  return { ready: issues.length === 0, issues, groups: [...groups.values()], profile };
}
const escape = v => text(v).replace(/[?+:']/g, c => '?' + c);
function buildMessage(group, identity, now = new Date()) {
  const p = group.profile, date = dateValue(identity.deliveryDate);
  const compact = v => v.replace(/-/g, '');
  if (!date || !/^\w[\w-]{0,34}$/.test(identity.asnNumber) || !/^[A-Za-z0-9]{1,14}$/.test(identity.controlReference)) throw new Error('Hibás ASN azonosító vagy dátum.');
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Budapest', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const part = key => parts.find(p => p.type === key).value;
  const localDate = part('year') + part('month') + part('day'), localTime = part('hour') + part('minute');
  const body = [`UNH+1+DESADV:D:01B:UN:EAN008+2.0`, `BGM+351::9:WAREHOUSE+${escape(identity.asnNumber)}+9`, `DTM+137:${localDate}:102`, `DTM+191:${compact(date)}:102`];
  const orders = [...new Set(group.pallets.flatMap(p => p.items.map(i => i.orderNumber)))];
  if (orders.length === 1) body.push(`RFF+ON:${escape(orders[0])}`);
  body.push(`NAD+BY+${p.buyer}::9`, `NAD+SU+${p.supplier}::9`, 'CPS+1');
  // Single PO: header ON. Multiple POs: item-level ON with original line reference.
  let lineNumber = 0, cps = 1;
  for (const pallet of group.pallets) {
    body.push(`CPS+${++cps}+1`, 'PAC+1', 'PCI+39', `GIN+AW+${pallet.sscc}`);
    for (const i of pallet.items) {
      body.push(`LIN+${++lineNumber}++${i.gtin}:SRV`, `QTY+12:${i.quantity}`);
      if (orders.length > 1) body.push(`RFF+ON:${escape(i.orderNumber)}:${escape(i.orderLineReference)}`);
      if (i.lot || i.bestBefore || i.expiryDate) {
        body.push(i.lot ? 'PCI+41' : i.bestBefore ? 'PCI+44' : 'PCI+43');
        if (i.bestBefore) body.push(`DTM+361:${compact(i.bestBefore)}:102`);
        if (i.expiryDate) body.push(`DTM+36:${compact(i.expiryDate)}:102`);
        if (i.lot) body.push(`GIN+BX+${escape(i.lot)}`);
      }
    }
  }
  if (!group.pallets.length || lineNumber > 9999 || group.pallets.length > 99999) throw new Error('A szállítmány mérete nem felel meg a MIG-nek.');
  body.push(`CNT+38E:${group.pallets.length}`);
  body.push(`UNT+${body.length + 1}+1`);
  const message = ["UNA:+.? '", `UNB+${p.syntax}:3+${p.sender}:14+${p.receiver}:14+${localDate.slice(2)}:${localTime}+${identity.controlReference}+++++EANCOM${p.mode === 'test' ? '+1' : ''}'`, ...body.map(s => s + "'"), `UNZ+1+${identity.controlReference}'`].join('\n');
  const encoding = p.syntax === 'UNOD' ? 'iso-8859-2' : 'latin1';
  const bytes = iconv.encode(message, encoding);
  if (iconv.decode(bytes, encoding) !== message) throw new Error('Az ASN szövege nem ábrázolható a partner karakterkészletével.');
  return bytes;
}
module.exports = { analyse, buildMessage, profileValue, dateValue };
