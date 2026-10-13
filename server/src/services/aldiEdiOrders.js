const iconv = require('iconv-lite');

function fail(message, code) { const error = new Error(message); error.code = code; throw error; }

// Tokenize in one pass so an escaped separator remains literal at every level.
function segmentsFrom(bytes) {
  const ascii = Buffer.from(bytes).toString('latin1');
  const syntax = /UNB[^A-Z0-9]+(UNOC|UNOD|UNOY)/.exec(ascii)?.[1];
  const encoding = syntax === 'UNOD' ? 'iso-8859-2' : syntax === 'UNOY' ? 'utf8' : 'latin1';
  let text = iconv.decode(Buffer.from(bytes), encoding).replace(/^\uFEFF/, '').trim();
  let component = ':', element = '+', decimal = '.', release = '?', end = "'";
  if (text.startsWith('UNA')) {
    if (text.length < 9) fail('Hiányos UNA szervizkarakterek.');
    [component, element, decimal, release, , end] = text.slice(3, 9);
    if (new Set([component, element, release, end]).size !== 4) fail('Érvénytelen UNA elválasztók.');
    text = text.slice(9);
  }
  const segments = [];
  let parts = [], group = [], token = '', escaped = false;
  const finishComponent = () => { group.push(token); token = ''; };
  const finishElement = () => { finishComponent(); parts.push(group); group = []; };
  for (const char of text) {
    if (escaped) { token += char; escaped = false; }
    else if (char === release) escaped = true;
    else if (char === component) finishComponent();
    else if (char === element) finishElement();
    else if (char === end) { finishElement(); segments.push(parts); parts = []; }
    else if (char !== '\r' && char !== '\n') token += char;
  }
  if (escaped || token.trim() || group.length || parts.length) fail('Hiányos EDIFACT szegmenslezárás.');
  return { segments, decimal, encoding };
}

function readableOriginal(bytes) {
  const syntax = /UNB[^A-Z0-9]+(UNOC|UNOD|UNOY)/.exec(Buffer.from(bytes).toString('latin1'))?.[1];
  return iconv.decode(bytes, syntax === 'UNOD' ? 'iso-8859-2' : syntax === 'UNOY' ? 'utf8' : 'latin1');
}

function parseOrders(bytes, expected = {}) {
  if (!Buffer.from(bytes).toString('latin1').trimStart().startsWith('UNA')) fail('Az ALDI ORDERS üzenetből hiányzik az UNA szervizfejléc.');
  const { segments, decimal, encoding } = segmentsFrom(bytes);
  const at = (s, e, c = 0) => s?.[e]?.[c] || '';
  const unb = segments[0], unz = segments.at(-1);
  if (at(unb, 0) !== 'UNB' || at(unz, 0) !== 'UNZ') fail('Az üzenetnek UNB/UNZ borítékot kell tartalmaznia.');
  if (!['UNOC', 'UNOD'].includes(at(unb, 1))) fail('Nem támogatott karakterkészlet az UNB-ben.');
  if (at(unb, 1, 1) !== '3') fail('A tesztfeldolgozó EANCOM syntax 3 üzenetet vár.');
  const envelope = {
    sender: at(unb, 2), senderQualifier: at(unb, 2, 1), receiver: at(unb, 3), receiverQualifier: at(unb, 3, 1),
    controlReference: at(unb, 5), test: at(unb, 11) === '1', encoding
  };
  if (!envelope.sender || !envelope.receiver || !envelope.controlReference) fail('Hiányzik az UNB küldő, fogadó vagy kontrollazonosító.');
  if (envelope.sender.length > 35 || envelope.receiver.length > 35 || envelope.controlReference.length > 14) fail('Túl hosszú UNB azonosító.');
  if (!envelope.test) fail('Ez a modul kizárólag UNB tesztjelzésű üzenetet fogad (0035=1).');
  for (const key of ['sender', 'receiver', 'senderQualifier', 'receiverQualifier']) {
    if (expected[key] && envelope[key] !== expected[key]) fail(`Az UNB ${key} nem egyezik a tesztprofil adataival.`);
  }
  if (at(unz, 2) !== envelope.controlReference) fail('Az UNZ kontrollazonosító eltér az UNB-től.');
  const messages = [];
  let start = 1;
  while (start < segments.length - 1) {
    if (at(segments[start], 0) !== 'UNH') fail('UNH üzenetfejlécet vártunk.');
    let finish = start + 1;
    while (finish < segments.length && at(segments[finish], 0) !== 'UNT') finish++;
    if (finish >= segments.length - 1) fail('Hiányzik az UNT üzenetlezárás.');
    const unh = segments[start], unt = segments[finish];
    if (at(unh, 2) !== 'ORDERS' || at(unh, 2, 1) !== 'D' || at(unh, 2, 2) !== '01B' || at(unh, 2, 3) !== 'UN' || at(unh, 2, 4) !== 'EAN010') fail('ORDERS:D:01B:UN:EAN010 üzenetet vártunk.');
    if (at(unh, 3) !== '2.0') fail('Az UNH ALDI kiadásszáma 2.0 legyen.');
    if (!at(unh, 1) || at(unh, 1).length > 14 || at(unt, 2) !== at(unh, 1) || Number(at(unt, 1)) !== finish - start + 1) fail('Hibás UNT szegmensszám vagy üzenetazonosító.');
    const message = { messageReference: at(unh, 1), parties: {}, items: [], ...envelope };
    let item = null, bgmSeen = false, summarySeen = false;
    const dateValue = s => {
      const value = at(s, 1, 1);
      if (at(s, 1, 2) !== '102' || !/^\d{8}$/.test(value)) fail('A dátum formátuma CCYYMMDD (102) legyen.');
      const date = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6)}`;
      const parsed = new Date(date + 'T00:00:00Z');
      if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) fail('Érvénytelen naptári dátum.');
      return date;
    };
    for (const s of segments.slice(start + 1, finish)) {
      const tag = at(s, 0);
      if (['UNB', 'UNZ', 'UNH'].includes(tag)) fail('Nem megengedett beágyazott EDIFACT boríték.');
      if (tag === 'UNS') {
        if (summarySeen || at(s, 1) !== 'S' || !item) fail('Hibás UNS összesítő szakasz.');
        summarySeen = true;
        continue;
      }
      if (summarySeen && tag !== 'CNT') fail('Nem megengedett szegmens az összesítő szakaszban.');
      if (tag === 'CNT') {
        if (!summarySeen || message.estimatedPallets !== undefined || at(s, 1) !== '38E' || !/^\d{1,17}$/.test(at(s, 1, 1))) fail('A CNT becsült raklapszám nem helyes.');
        message.estimatedPallets = at(s, 1, 1);
        continue;
      }
      if (tag === 'BGM') {
        if (bgmSeen || !['220', '230'].includes(at(s, 1))) fail('Hibás vagy ismételt BGM rendeléstípus.');
        bgmSeen = true;
        message.kind = at(s, 1) === '220' ? 'original' : 'change';
        if (at(s, 1, 3) === 'DROPSHIP') fail('A Dropship rendeléshez külön integráció szükséges.');
        message.orderNumber = at(s, 2);
        message.externalVersion = at(s, 2, 1) || null;
        if (message.externalVersion && !/^\d{1,9}$/.test(message.externalVersion)) fail('A külső rendelésverzió nem egész szám.');
        if (!['9', '31'].includes(at(s, 3))) fail('Nem támogatott BGM üzenetfunkció.');
      } else if (tag === 'LIN') {
        const lineId = at(s, 1), gtin = at(s, 3), action = at(s, 2);
        if (!/^\d{1,6}$/.test(lineId) || !/^\d{13,14}$/.test(gtin) || at(s, 3, 1) !== 'SRV') fail('Érvénytelen LIN tételszám vagy GTIN/SRV.');
        if (action && !['1', '2', '3', '4'].includes(action)) fail('Nem támogatott LIN műveletkód.');
        if (message.items.some(x => x.lineId === lineId)) fail('Ismételt LIN tételszám.');
        item = { lineId, gtin, action: action || null, quantities: {}, deliveryDate: null };
        message.items.push(item);
      } else if (tag === 'QTY' && item) {
        const qualifier = at(s, 1), raw = at(s, 1, 1).replace(decimal, '.');
        if (!['21', '27', '46'].includes(qualifier)) fail('Nem támogatott QTY mennyiségtípus.');
        if (!/^\d+(\.\d{1,3})?$/.test(raw) || !Number.isFinite(Number(raw)) || Number(raw) > 1e10) fail('Érvénytelen rendelési mennyiség.');
        if (item.quantities[qualifier] !== undefined || at(s, 1, 2)) fail('Ismételt QTY vagy nem egyeztetett mennyiségi egység.');
        item.quantities[qualifier] = Number(raw);
      } else if (tag === 'DTM' && ['137', '2', '64', '200'].includes(at(s, 1))) {
        const qualifier = at(s, 1), value = dateValue(s);
        if (qualifier === '2') { if (item) item.deliveryDate = value; else message.deliveryDate = value; }
        if (qualifier === '64') { if (item) item.earliestDeliveryDate = value; else message.earliestDeliveryDate = value; }
        if (qualifier === '200') { if (item) item.pickupDate = value; else message.pickupDate = value; }
        if (qualifier === '137' && !item) message.orderDate = value;
      } else if (tag === 'NAD' && !item) {
        const role = at(s, 1);
        if (message.parties[role]) fail('Ismételt NAD szereplő.');
        message.parties[role] = { identifier: at(s, 2), qualifier: at(s, 2, 2), name: s[4]?.join(' ') || '' };
      }
    }
    if (!summarySeen) fail('Hiányzik az UNS+S összesítő szakasz.');
    if (!bgmSeen || !message.orderNumber || message.orderNumber.length > 35 || !message.orderDate || !message.items.length) fail('Hiányzó vagy hibás rendelési szám, dátum vagy tételsor.');
    for (const role of ['BY', 'SU', 'DP']) if (!message.parties[role]?.identifier) fail(`Hiányzik a NAD ${role} azonosító.`);
    if (expected.supplier && message.parties.SU.identifier !== expected.supplier) fail('A NAD SU szállító nem egyezik a tesztprofillal.');
    for (const line of message.items) {
      line.deliveryDate ||= message.deliveryDate;
      if (!line.deliveryDate || line.quantities['21'] === undefined) fail('Hiányzó tételszintű szállítási dátum vagy rendelt mennyiség.');
      if (message.kind === 'change' && !line.action) fail('A módosító üzenethez LIN műveletkód szükséges.');
      if (message.kind === 'original' && line.action && line.action !== '1') fail('Eredeti rendelésben csak új tétel szerepelhet.');
      if (line.quantities['27'] !== undefined && (line.quantities['27'] !== 0 || line.action !== '3')) fail('A QTY 27 csak nulla értékkel, módosított sorban használható.');
      if (line.quantities['46'] !== undefined && line.quantities['46'] > line.quantities['21']) fail('A szállított mennyiség meghaladja a rendelt mennyiséget.');
      line.quantity = line.action === '2' ? 0 : line.quantities['21'];
      line.deliveredQuantity = line.quantities['46'] ?? null;
      line.remainderClosed = line.quantities['27'] === 0;
    }
    messages.push(message);
    start = finish + 1;
  }
  if (!messages.length || Number(at(unz, 1)) !== messages.length) fail('Az UNZ üzenetszám nem helyes.');
  if (new Set(messages.map(m => m.messageReference)).size !== messages.length) fail('Ismételt UNH üzenetazonosító.');
  return { envelope, messages };
}

function applyOrderMessage(previous, message, mode) {
  if (!['delta', 'full'].includes(mode)) fail('A módosítás értelmezése delta vagy full legyen.');
  if (message.kind === 'original' && previous) fail('Ehhez a rendeléshez már létezik eredeti üzenet.');
  if (message.kind === 'change' && !previous) fail('A módosításhoz hiányzik az eredeti rendelés.', 'MISSING_PREVIOUS_ORDER');
  if (previous && previous.parties.SU.identifier !== message.parties.SU.identifier) fail('A rendelés szállítója eltér az előző verziótól.');
  if (previous && message.externalVersion && previous.externalVersion && Number(message.externalVersion) <= Number(previous.externalVersion)) fail('Régebbi vagy ismételt külső rendelésverzió.');
  if (mode === 'delta' && previous && message.externalVersion && previous.externalVersion && Number(message.externalVersion) !== Number(previous.externalVersion) + 1) fail('Hiányzó köztes rendelésverzió; a delta módosítás még nem alkalmazható.', 'VERSION_GAP');
  const old = new Map((previous?.items || []).map(x => [x.lineId, x]));
  // A previously deleted zero row need not be resent in every later full message.
  const current = new Map(message.kind === 'change' ? mode === 'delta' ? old : [...old].filter(([, item]) => item.quantity === 0) : []);
  const changes = [];
  for (const item of message.items) {
    const prior = old.get(item.lineId);
    if (message.kind === 'change') {
      if (item.action === '1' && prior && prior.quantity !== 0) fail('A hozzáadott tételszám már létezik.');
      if (['2', '3', '4'].includes(item.action) && !prior) fail('A módosított/törölt tételszám nem található az előző verzióban.');
      if (prior && prior.gtin !== item.gtin) fail('Azonos tételszámon eltérő GTIN; új tételként kell egyeztetni.');
      if (item.action === '4' && (mode !== 'full' || prior.quantity !== item.quantity || prior.deliveryDate !== item.deliveryDate)) fail('A változatlan tétel jelölése nem helyes.');
    }
    const delivered = item.deliveredQuantity ?? prior?.deliveredQuantity ?? 0;
    if (prior && delivered < prior.deliveredQuantity) fail('A már szállított mennyiség csökkenését külön kell egyeztetni.');
    if (item.action === '4' && prior && (delivered !== prior.deliveredQuantity || item.remainderClosed)) fail('Változatlan soron a teljesítés sem módosulhat.');
    if (item.action !== '2' && item.quantity < delivered) fail('A rendelésmódosítás kisebb a már szállított mennyiségnél.');
    const closed = item.remainderClosed || item.action === '2' || Boolean(prior?.remainderClosed && item.action === '4');
    if (prior?.remainderClosed && item.action === '3' && !item.remainderClosed) fail('Lezárt fennmaradó mennyiség újranyitását külön kell egyeztetni.');
    const next = { ...item, deliveredQuantity: delivered, remainderClosed: closed, remainingQuantity: closed ? 0 : item.quantity - delivered };
    current.set(item.lineId, next);
    const previousQuantity = prior?.quantity ?? 0;
    if (!previous || item.quantity !== previousQuantity || item.deliveryDate !== prior?.deliveryDate || delivered !== prior?.deliveredQuantity || item.action === '2' || item.remainderClosed) changes.push({
      lineId: item.lineId, gtin: item.gtin, previousQuantity, quantity: item.quantity, delta: item.quantity - previousQuantity,
      action: item.action, previousDeliveryDate: prior?.deliveryDate || null, deliveryDate: item.deliveryDate, remainderClosed: next.remainderClosed,
      previousDeliveredQuantity: prior?.deliveredQuantity ?? 0, deliveredQuantity: delivered
    });
  }
  if (message.kind === 'change' && mode === 'full' && [...old.keys()].some(key => !current.has(key))) fail('A teljes módosításból hiányzó tételt explicit törléssel kell egyeztetni.');
  return { ...message, items: [...current.values()], changes, internalVersion: (previous?.internalVersion || 0) + 1, mode };
}

module.exports = { parseOrders, applyOrderMessage, segmentsFrom, readableOriginal };
