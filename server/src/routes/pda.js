/**
 * pda.js – PDA specifikus API végpontok
 * 
 * POST /api/v1/pda/login       → Egyszerű bejelentkezés (egyelőre bármilyen névvel)
 * GET  /api/v1/pda/commission-tasks → PDA-ra jelölt ALDI kamionok listája
 */

const express = require('express');
const router = express.Router();
const knex = require('../db/db');
const jwt = require('jsonwebtoken');
const { consolidationStockIssues, assertConsolidationStock, consolidationCapacityError } = require('../services/consolidationStock');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_gava';

// Az SSCC numerikus azonosító. A kézi bevitel és a vonalkódolvasó azonban
// gyakran szóközt, sortörést vagy GS1-előtagot is küld, ezért összehasonlítás
// előtt csak a számjegyeket tartjuk meg.
function normalizeSscc(value) {
  let raw = String(value ?? '').trim().replace(/^\]C1/i, '').replace(/^\(00\)/, '');
  const digits = raw.replace(/\D/g, '');
  // GS1-128 olvasóknál az alkalmazási/szimbólumazonosító számként is
  // érkezhet. Az SSCC mindig a 18 számjegyes azonosító a bemenet végén.
  return digits.length > 18 ? digits.slice(-18) : digits;
}

function targetLocationIds(value) {
  let parsed = value;
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed); } catch { parsed = []; }
  }
  if (!Array.isArray(parsed)) return [];

  return [...new Set(parsed
    .map(item => (item && typeof item === 'object' ? item.id : item))
    .map(Number)
    .filter(Number.isInteger))];
}

function validSscc(value) {
  const sscc = normalizeSscc(value);
  if (!/^\d{18}$/.test(sscc)) return false;
  const body = sscc.slice(0, 17);
  let sum = 0;
  for (let i = body.length - 1, position = 0; i >= 0; i--, position++) {
    sum += Number(body[i]) * (position % 2 === 0 ? 3 : 1);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === Number(sscc[17]);
}

function isParentLocation(location) {
  const type = String(location?.location_type || '');
  return type === 'Szülő' || type === 'SzÃ¼lÅ‘';
}

/**
 * findAldiLocation: Megkeresi a lokációt vonalkód, név vagy sorszám alapján.
 * Támogatja a vonalkódos beolvasást (pl. S01010000), a manuálisan beírt sornév-változatokat
 * (pl. '1. sor', '1.sor', '1sor', '2sor 1 tárhely') és a puszta sorszámot is (pl. '1').
 */
async function findAldiLocation(input, trx = knex) {
  const raw = String(input || '').trim();
  if (!raw) return null;
  const upper = raw.toUpperCase();

  // 1. Pontos egyezés vonalkódra (kis/nagybetű független)
  let loc = await trx('aldi_locations').whereRaw('UPPER(TRIM(barcode)) = ?', [upper]).first();
  if (loc) return loc;

  // 2. Pontos egyezés névre (kis/nagybetű független)
  loc = await trx('aldi_locations').whereRaw('UPPER(TRIM(name)) = ?', [upper]).first();
  if (loc) return loc;

  // 3. Normalizált sornév egyezés (pontok és szóközök nélkül: '1.sor' -> '1. sor')
  const cleanInput = upper.replace(/[\.\s]/g, '');
  loc = await trx('aldi_locations')
    .whereRaw("REPLACE(REPLACE(UPPER(name), '.', ''), ' ', '') = ?", [cleanInput])
    .first();
  if (loc) return loc;

  // 4. Puszta sorszám bevitele: pl. '1' -> 1. sor szülő tárhely
  if (/^\d+$/.test(raw)) {
    const num = parseInt(raw, 10);
    loc = await trx('aldi_locations')
      .where('row_num', num)
      .whereNull('parent_id')
      .first();
    if (loc) return loc;
  }

  return null;
}

// ── POST /login ────────────────────────────────
// Egyelőre bármilyen azonosítóval be lehet lépni (fejlesztési fázis).
// Visszaad egy JWT tokent és a felhasználó nevét.
router.post('/login', (req, res) => {
  const { username } = req.body;
  if (!username || !String(username).trim()) {
    return res.status(400).json({ error: 'Az azonosító megadása kötelező.' });
  }

  const name = String(username).trim();
  const payload = { name, role: 'pda_user', sub: name };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });

  res.json({
    token,
    user: { name, role: 'pda_user' },
  });
});

// ── Middleware: JWT ellenőrzés ────────────────
function verifyToken(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  // Teszt mód / emulátor / hiányzó vagy mock token esetén automatikus engedélyezés
  if (!token || token.startsWith('pda-mock-token') || token === 'null' || token === 'undefined') {
    req.user = { name: 'Teszt Felhasználó', role: 'pda_user' };
    return next();
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (e) {
    // Lejárt vagy eltérő secret esetén sem blokkoljuk az emulátort / tesztet
    req.user = { name: 'Teszt Felhasználó', role: 'pda_user' };
    return next();
  }
}

// ── GET /commission-tasks ─────────────────────
// Visszaadja az ALDI kamionokat, amelyeket PDA-ra jelöltek (sent_to_pda = true)
router.get('/commission-tasks', verifyToken, async (req, res) => {
  try {
    const trucks = await knex('aldi_trucks')
      .select(
        'id',
        'truck_number',
        'delivery_date',
        'transporter',
        'license_plate_1',
        'preparation_status',
        'is_loaded',
        'sent_to_pda',
      )
      .where('sent_to_pda', true)
      .orderBy('delivery_date', 'asc')
      .orderBy('id', 'asc');

    res.json(trucks);
  } catch (err) {
    console.error('[PDA] /commission-tasks hiba:', err);
    res.status(500).json({ error: 'Szerverhiba a feladatok betöltésekor.' });
  }
});

// ── GET /commission-lines ──────────────────────
// Visszaadja a PDA-ra küldött kamionok tételeit (Termék, Kamionszám, Kartonszám, Típus, Partner, Cél raktár)
router.get('/commission-lines', verifyToken, async (req, res) => {
  try {
    const { truck_id } = req.query;

    let query = knex('aldi_truck_lines')
      .join('aldi_trucks', 'aldi_truck_lines.aldi_truck_id', 'aldi_trucks.id')
      .select(
        'aldi_truck_lines.id',
        'aldi_truck_lines.aldi_truck_id',
        'aldi_trucks.truck_number as kamionszam',
        'aldi_trucks.target_locations',
        'aldi_truck_lines.product_name as termek',
        'aldi_truck_lines.ordered_cartons as kartonszam',
        knex.raw('COALESCE(aldi_truck_lines.picked_cartons, 0) as komissziozott_kartonszam'),
        'aldi_truck_lines.pallet_type as tipus',
        'aldi_truck_lines.cartons_per_pallet as plt',
        'aldi_truck_lines.partner',
        'aldi_truck_lines.destination as celraktar',
        'aldi_truck_lines.is_picked'
      )
      .where('aldi_trucks.sent_to_pda', true)
      .orderBy('aldi_trucks.delivery_date', 'asc')
      .orderBy('aldi_trucks.id', 'asc')
      .orderBy('aldi_truck_lines.row_order', 'asc')
      .orderBy('aldi_truck_lines.id', 'asc');

    if (truck_id) {
      query = query.where('aldi_trucks.id', truck_id);
    }

    const lines = await query;

    // Engedélyezett célsorok vonalkódjainak hozzácsatolása (PDA tesztelés és megjelenítés megkönnyítésére)
    try {
      const parentRows = await knex('aldi_locations')
        .where('location_type', 'Szülő')
        .select('id', 'name', 'barcode');
      const barcodeMap = new Map();
      parentRows.forEach(r => {
        barcodeMap.set(Number(r.id), r.barcode);
        barcodeMap.set(String(r.name).toUpperCase(), r.barcode);
      });

      lines.forEach(line => {
        let tl = line.target_locations;
        if (typeof tl === 'string') {
          try { tl = JSON.parse(tl); } catch { tl = []; }
        }
        if (Array.isArray(tl)) {
          line.target_locations = tl.map(item => {
            if (item && typeof item === 'object') {
              const barcode = barcodeMap.get(Number(item.id)) || barcodeMap.get(String(item.name || '').toUpperCase()) || item.barcode || '';
              return { ...item, barcode };
            }
            return item;
          });
        }
      });
    } catch (enrichErr) {
      console.warn('[PDA] Nem sikerült a target_locations vonalkódok dúsítása:', enrichErr.message);
    }

    res.json(lines);
  } catch (err) {
    console.error('[PDA] /commission-lines hiba:', err);
    res.status(500).json({ error: 'Hiba a komissió tételek betöltésekor.' });
  }
});

// ── GET /packaging-types ───────────────────────
router.get('/packaging-types', verifyToken, async (req, res) => {
  try {
    const data = await knex('ref_packaging_types').select('id', 'name', 'category', 'tare_weight_kg').where('is_active', true).orderBy('name');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Hiba a göngyöleg típusok betöltésekor.' });
  }
});

// ── GET /origin-countries ──────────────────────
router.get('/origin-countries', verifyToken, async (req, res) => {
  try {
    const data = await knex('ref_origin_countries').select('id', 'name').where('is_active', true).orderBy('name');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Hiba a származási országok betöltésekor.' });
  }
});

// ── GET /pallet-types ──────────────────────────
router.get('/pallet-types', verifyToken, async (req, res) => {
  try {
    const data = await knex('ref_pallet_types').select('id', 'name').where('is_active', true).orderBy('name');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Hiba a raklap típusok betöltésekor.' });
  }
});

// ── PUT /commission-lines/:id/pick ─────────────
// Komissió rögzítése (kumulatív):
//   - picked_cartons nő a megadott mennyiséggel
//   - ordered_cartons NINCS módosítva (az eredeti rendeltet tükrözi)
//   - is_picked = true ha picked_cartons >= ordered_cartons
//   - Ha qty > remaining: 409 hiba
// Közös segédfüggvény a komissiózás feldolgozásához
async function processPick(trx, id, reqData, locationId = null) {
  const { picked_cartons, gross_weight, packaging_type, tare_weight, origin_country, lot_number, pallet_type, pallet_types, pickSessionId } = reqData;
  const qty = parseInt(picked_cartons);
  if (!Number.isInteger(qty) || qty <= 0) {
    const err = new Error('A komissiózott kartonszám megadása kötelező (pozitív egész szám).'); err.code = 'BAD_REQUEST'; throw err;
  }

  // 1. Tétel lekérése zárolással
  const line = await trx('aldi_truck_lines').where('id', id).forUpdate().first();
  if (!line) {
    const err = new Error('not_found'); err.code = 'NOT_FOUND'; throw err;
  }

  // Idempotencia ellenőrzés
  if (!pickSessionId) {
    const err = new Error('Hiányzó munkamenet-azonosító (pickSessionId). Kérjük, frissítsd a PDA alkalmazást.'); err.code = 'BAD_REQUEST'; throw err;
  }
  const existingPick = await trx('aldi_commission_lines').where('pick_session_id', pickSessionId).first();
  if (existingPick) {
    if (existingPick.aldi_truck_line_id !== parseInt(id)) {
      const err = new Error('Ez a munkamenet egy másik tételhez tartozik.'); err.code = 'BAD_REQUEST'; throw err;
    }
    const existingLabel = await trx('sscc_labels').where('commission_line_id', existingPick.id).orderBy('id', 'desc').first();
    return {
      isAlreadyProcessed: true,
      orderedCartons: line.ordered_cartons,
      newPicked: line.picked_cartons,
      newRemaining: Math.max(0, line.ordered_cartons - line.picked_cartons),
      isFullyPicked: line.picked_cartons >= line.ordered_cartons,
      label: existingLabel
    };
  }

  const orderedCartons = parseInt(line.ordered_cartons) || 0;
  const alreadyPicked = parseInt(line.picked_cartons) || 0;
  const remaining = Math.max(0, orderedCartons - alreadyPicked);

  if (qty > remaining) {
    const err = new Error(`A megadott kartonszám (${qty} db) több mint a hátralévő rendelt mennyiség (${remaining} db).`); err.code = 'OVER_QTY'; throw err;
  }

  // 2. Kapacitás ellenőrzése (ha van lokáció) – FOR UPDATE zárolással a race condition ellen
  if (locationId && qty > 0) {
    const loc = await trx('aldi_locations').where('id', locationId).forUpdate().first();

    if (!loc) {
      const err = new Error('A megadott lokáció nem található.'); err.code = 'NOT_FOUND'; throw err;
    }

    const capacity = parseInt(loc.capacity) || 0;

    // Ha a kapacitás 0, az azt jelenti, hogy nincs meghatározva – ne blokkoljuk
    if (capacity > 0) {
      const currentLocStock = await trx('aldi_stock_locations as s')
        .leftJoin('sscc_labels as sl', 'sl.commission_line_id', 's.commission_line_id')
        .where('s.location_id', locationId)
        .select(trx.raw('COUNT(DISTINCT COALESCE(sl.consolidated_sscc, s.id::text)) as occupied_pallets'))
        .first();

      const existingPallets = parseInt(currentLocStock?.occupied_pallets) || 0;
      const incomingPallets = 1; // Minden PDA megadás 1 raklap

      if (existingPallets + incomingPallets > capacity) {
        const err = new Error(
          `A lokáció megtelt! Kapacitás: ${capacity} raklap.\n` +
          `Foglalt: ${existingPallets} raklap\n` +
          `Már nincs szabad hely ezen a tárhelyen!\n\n` +
          `A tétel NEM lett rögzítve – válassz másik lokációt!`
        );
        err.code = 'CAPACITY_EXCEEDED';
        throw err;
      }
    }
  }

  // 3. Súly és raklap kalkuláció – több raklap támogatással
  // A frontend pallet_types tömbben küldi az összes raklap ID-ját.
  // Ha csak régi pallet_type érkezik (backward compat), azt tömbként kezeljük.
  const palletIds = Array.isArray(pallet_types) && pallet_types.length > 0
    ? pallet_types
    : (pallet_type ? [pallet_type] : []);

  if (palletIds.length === 0) {
    const err = new Error('Válassz legalább egy raklaptípust a nettó súly számításához.'); err.code = 'BAD_REQUEST'; throw err;
  }

  let totalPalletTareKg = 0;
  let primaryPalletTypeName = null;
  const palletsJsonData = [];

  for (const pid of palletIds) {
    const palInfo = await trx('ref_packaging_types').where('id', pid).first();
    if (!palInfo || !palInfo.is_active || ![palInfo.name, palInfo.category].some(v => String(v || '').toLowerCase().includes('raklap'))) {
      const err = new Error('Érvénytelen vagy inaktív raklaptípus a listában. Kérlek válassz érvényes raklapot.'); err.code = 'BAD_REQUEST'; throw err;
    }
    if (palInfo.tare_weight_kg == null || !Number.isFinite(Number(palInfo.tare_weight_kg)) || Number(palInfo.tare_weight_kg) <= 0) {
      const err = new Error(`A(z) "${palInfo.name}" raklaptípushoz nincs érvényes tára súly megadva a törzsadatban. Kérlek pótold az Admin felületen!`); err.code = 'INVALID_WEIGHT'; throw err;
    }
    const tare = parseFloat(palInfo.tare_weight_kg);
    totalPalletTareKg += tare;
    palletsJsonData.push({
      id: palInfo.id,
      name: palInfo.name,
      category: palInfo.category,
      tare_weight_kg: tare
    });
    if (!primaryPalletTypeName) primaryPalletTypeName = palInfo.name;
  }
  const reqGross = Number(gross_weight);
  const reqTare = Number(tare_weight);
  if (!Number.isFinite(reqGross) || reqGross <= 0 || tare_weight == null || tare_weight === '' || !Number.isFinite(reqTare) || reqTare < 0) {
    const err = new Error('Adj meg pozitív bruttó súlyt és nem negatív göngyölegtárát.'); err.code = 'INVALID_WEIGHT'; throw err;
  }
  if (alreadyPicked > 0 && (line.gross_weight == null || line.net_weight == null)) {
    const err = new Error('A korábbi komissió súlyadatai hiányosak. Folytatás előtt rendezni kell a korábbi bruttó és nettó súlyt.'); err.code = 'INVALID_WEIGHT'; throw err;
  }

  if (!isNaN(reqGross) && reqGross > 0) {
    const totalTare = (reqTare * qty) + totalPalletTareKg;
    if (reqGross < totalTare) {
      const palletTareStr = palletsJsonData.map(p => `${p.name} (${p.tare_weight_kg.toFixed(1)} kg)`).join(' + ');
      const err = new Error(`A bruttó súly (${reqGross} kg) kisebb, mint a göngyöleg (${reqTare} kg x ${qty} db) és a raklapok (${palletTareStr}) tára összege!`);
      err.code = 'INVALID_WEIGHT'; throw err;
    }
  } else if (gross_weight !== undefined && gross_weight !== null && gross_weight !== '') {
    const err = new Error('A bruttó súlynak pozitívnak kell lennie!');
    err.code = 'INVALID_WEIGHT'; throw err;
  }

  let currentPickNet = null;
  if (!isNaN(reqGross) && reqGross > 0) {
    currentPickNet = reqGross - (reqTare * qty) - totalPalletTareKg;
    if (currentPickNet < 0) {
      const err = new Error('Számítási hiba: a nettó súly negatív!'); err.code = 'INVALID_WEIGHT'; throw err;
    }
  }

  // 4. Komissiózás rögzítése
  const [createdCommLine] = await trx('aldi_commission_lines').insert({
    aldi_truck_id: line.aldi_truck_id,
    aldi_truck_line_id: id,
    product_name: line.product_name,
    cartons: qty,
    pallets: palletsJsonData.length,
    gross_weight: !isNaN(reqGross) ? reqGross : null,
    net_weight: currentPickNet,
    pallet_type: primaryPalletTypeName,
    pallets_json: JSON.stringify(palletsJsonData),
    tare_weight: reqTare || null,
    carton_type: packaging_type || null,
    lot_number: lot_number || null,
    origin_country: origin_country || null,
    pick_session_id: pickSessionId
  }).returning('id');

  const commissionId = createdCommLine.id || createdCommLine;

  // 5. Lokáció mentése
  if (locationId && qty > 0) {
    await trx('aldi_stock_locations').insert({
      location_id: locationId,
      order_line_id: line.aldi_daily_order_line_id || null,
      truck_line_id: line.id,
      commission_line_id: commissionId,
      quantity_cartons: qty,
      gross_weight: !isNaN(reqGross) && reqGross > 0 ? reqGross : null,
      net_weight: currentPickNet !== null ? currentPickNet : null
    });
  }

  // 5. Kumulatív frissítés
  const newPicked = alreadyPicked + qty;
  const newRemaining = Math.max(0, orderedCartons - newPicked);
  const isFullyPicked = newRemaining <= 0;

  const oldGross = parseFloat(line.gross_weight) || 0;
  const oldNet = parseFloat(line.net_weight) || 0;

  const newGross = !isNaN(reqGross) && reqGross > 0 ? oldGross + reqGross : line.gross_weight;
  const newNet = currentPickNet !== null ? oldNet + currentPickNet : line.net_weight;

  await trx('aldi_truck_lines')
    .where('id', id)
    .update({
      is_picked: isFullyPicked,
      picked_cartons: newPicked,
      gross_weight: newGross,
      net_weight: newNet,
      packaging_type: packaging_type || null,
      pallet_type: primaryPalletTypeName || null,
      tare_weight: reqTare || null,
      origin_country: origin_country || null,
      lot_number: lot_number || null
    });

  // SSCC címke frissítése vagy generálása
  let label = null;
  if (reqData.labelId) {
    const labelRecord = await trx('sscc_labels').where('id', reqData.labelId).first();
    if (!labelRecord) {
      const err = new Error('A megadott címke nem található.'); err.code = 'BAD_REQUEST'; throw err;
    }
    if (!labelRecord.is_provisional && labelRecord.commission_line_id !== commissionId) {
      const err = new Error('Ez a címke már véglegesítve lett egy másik komissióhoz.'); err.code = 'BAD_REQUEST'; throw err;
    }

    const [updated] = await trx('sscc_labels')
      .where('id', reqData.labelId)
      .update({
        commission_line_id: commissionId,
        is_provisional: false,
        pallets_json: JSON.stringify(palletsJsonData)
      })
      .returning('*');
    label = updated;
  }
  if (!label) {
    label = await createSsccLabel(trx, id, commissionId, qty, origin_country, palletsJsonData);
  }

  return {
    orderedCartons,
    newPicked,
    newRemaining,
    isFullyPicked,
    label,
    commissionLineId: commissionId
  };
}

// ── SSCC és ZPL segédfüggvények ─────────────────────────────
async function createSsccLabel(dbClient, lineId, commissionLineId, pickedCartons, originCountryOverride, palletsJsonData = null) {
  const line = await dbClient('aldi_truck_lines').where('id', lineId).first();
  if (!line) throw new Error('A komissiózott tétel nem található.');

  const truck = await dbClient('aldi_trucks').where('id', line.aldi_truck_id).first();
  const licensePlate = truck ? (truck.truck_number || truck.license_plate_1 || 'GHU 070/1') : 'GHU 070/1';
  const productName = line.product_name || 'Paradicsom I M';
  const printCartons = pickedCartons || line.cartons_per_pallet || 0;
  const deliveryDate = (line.delivery_date || truck?.delivery_date) ? new Date(line.delivery_date || truck.delivery_date).toISOString().split('T')[0] : '';
  const originCountry = originCountryOverride || line.origin_country || '';
  const supplier = line.partner || '';
  const destination = line.destination || '';

  // SSCC generálása
  const seqRes = await dbClient.raw("SELECT nextval('sscc_labels_id_seq') as next_id");
  const nextId = seqRes.rows[0].next_id;

  const extDigit = '3';
  const companyPrefix = process.env.GS1_COMPANY_PREFIX || '5990001';
  const serialNum = String(nextId).padStart(17 - companyPrefix.length - extDigit.length, '0');
  const baseSSCC = extDigit + companyPrefix + serialNum;

  let sum = 0;
  for (let i = baseSSCC.length - 1; i >= 0; i--) {
    const digit = parseInt(baseSSCC[i], 10);
    const posFromRight = baseSSCC.length - 1 - i;
    const multiplier = posFromRight % 2 === 0 ? 3 : 1;
    sum += digit * multiplier;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  const finalSSCC = baseSSCC + checkDigit;

  const isProvisional = commissionLineId ? false : true;

  const [createdLabel] = await dbClient('sscc_labels').insert({
    id: nextId,
    sscc: finalSSCC,
    commission_line_id: commissionLineId,
    picked_cartons: printCartons,
    truck_number: licensePlate,
    product_name: productName,
    delivery_date: deliveryDate,
    supplier: supplier,
    destination: destination,
    origin_country: originCountry,
    is_provisional: isProvisional,
    pallets_json: palletsJsonData ? JSON.stringify(palletsJsonData) : null
  }).returning('*');

  return createdLabel;
}

function generateZpl(label) {
  return `^XA
^PW1180
^LL2480
^CI28
^FO0,80^A0N,200,200^FB1180,1,0,C^FD${label.truck_number || ''}^FS
^FO0,300^A0N,55,55^FB1180,1,0,C^FDKamionszám^FS
^FO40,380^GB1150,5,5^FS
^FO0,440^A0N,130,130^FB1180,1,0,C^FD${label.product_name || ''}^FS
^FO0,600^A0N,50,50^FB1180,1,0,C^FDTermék megnevezése^FS
^FO40,680^GB1150,5,5^FS
^FO40,750^A0N,60,60^FDÉrkezés dátuma: ${label.delivery_date || ''}^FS
^FO40,850^A0N,60,60^FDKarton szám: ${label.picked_cartons || ''} db^FS
^FO40,950^A0N,60,60^FDBeszállító: ${label.supplier || ''}^FS
^FO40,1050^A0N,60,60^FDÜgyfél: ${label.destination || ''}^FS
^FO40,1150^A0N,60,60^FDSzármazási ország: ${label.origin_country || ''}^FS
^FO40,1800^GB1150,5,5^FS
^FO150,1880^BY4
^BCN,350,N,N,N
^FD${label.sscc}^FS
^FO0,2260^A0N,65,65^FB1180,1,0,C^FD${label.sscc}^FS
^FO0,2340^A0N,55,55^FB1180,1,0,C^FDSSCC^FS
^XZ`;
}

// ── POST /commission-lines/:id/validate-location ──────────────────────────────
router.post('/commission-lines/:id/validate-location', verifyToken, async (req, res) => {
  try {
    if (!req.body.barcode) {
      return res.status(400).json({ error: 'Vonalkód vagy lokáció megadása kötelező.' });
    }

    const location = await findAldiLocation(req.body.barcode);
    if (!location) {
      return res.status(404).json({ error: 'Érvénytelen vonalkód: ez a lokáció nem található a rendszerben, vagy nem engedélyezett ehhez a tételhez.' });
    }

    if (location.location_type === 'Szülő') {
      return res.status(400).json({ error: `A kiválasztott lokáció (${location.name}) egy SOR (szülő), ami önmagában nem tárhely. Kérlek, olvass le egy konkrét pozíciót ezen a soron belül!` });
    }

    // Validate location belongs to an allowed row
    const commLine = await knex('aldi_truck_lines').where('id', req.params.id).first();
    if (commLine) {
      const truck = await knex('aldi_trucks').where('id', commLine.aldi_truck_id).first();
      if (!truck) {
        return res.status(400).json({ error: 'A komissiós tételhez tartozó kamion nem található.' });
      }
      const allowedIds = targetLocationIds(truck.target_locations);
      const locationRowId = location.parent_id ? Number(location.parent_id) : Number(location.id);
      if (allowedIds.length === 0 || (!allowedIds.includes(locationRowId) && !allowedIds.includes(Number(location.id)))) {
        let targetLocations = truck.target_locations;
        if (typeof targetLocations === 'string') {
          try { targetLocations = JSON.parse(targetLocations); } catch { targetLocations = []; }
        }
        const allowedNames = Array.isArray(targetLocations)
          ? targetLocations.map(t => t && typeof t === 'object' ? t.name : t).filter(Boolean).join(', ')
          : '';
        return res.status(400).json({
          error: allowedNames
            ? `Ez a lokáció (${location.name}) nem engedélyezett ennél a kamionfejlécnél!\n\nEngedélyezett cél sorok: ${allowedNames}`
            : 'Ehhez a kamionhoz nincs engedélyezett célsor beállítva. A PDA-komissiózás nem folytatható.'
        });
      }
    }

    // Check capacity
    const capacity = parseInt(location.capacity) || 0;
    if (capacity > 0) {
      const currentLocStock = await knex('aldi_stock_locations as s')
        .leftJoin('sscc_labels as sl', 'sl.commission_line_id', 's.commission_line_id')
        .where('s.location_id', location.id)
        .select(knex.raw('COUNT(DISTINCT COALESCE(sl.consolidated_sscc, s.id::text)) as occupied_pallets'))
        .first();
      const existingPallets = parseInt(currentLocStock?.occupied_pallets) || 0;
      
      const incomingPallets = 1; // Minden PDA megadás 1 raklap
      if (existingPallets + incomingPallets > capacity) {
        return res.status(400).json({
          error: `A lokáció megtelt! Kapacitás: ${capacity} raklap.\nFoglalt: ${existingPallets} raklap\nMár nincs szabad hely ezen a tárhelyen!\n\nVálassz másik lokációt!`
        });
      }
    }

    return res.json({
      success: true,
      location_name: location.name,
      resolved_barcode: location.barcode
    });
  } catch (err) {
    console.error('[PDA] /commission-lines/:id/validate-location hiba:', err);
    return res.status(500).json({ error: 'Belső szerverhiba a lokáció ellenőrzésekor.' });
  }
});

// ── PUT /commission-lines/:id/pick-and-assign ──────────────────────────────
router.put('/commission-lines/:id/pick-and-assign', verifyToken, async (req, res) => {
  try {
    if (!req.body.barcode) {
      return res.status(400).json({ error: 'Vonalkód megadása kötelező.' });
    }
    if (!req.body.scannedSscc) {
      return res.status(400).json({ error: 'SSCC vonalkód megadása kötelező a lezáráshoz.' });
    }
    if (!req.body.labelId) {
      return res.status(400).json({ error: 'Címke azonosító (labelId) hiányzik a kérésből.' });
    }

    const label = await knex('sscc_labels').where('id', req.body.labelId).first();
    const scannedSscc = normalizeSscc(req.body.scannedSscc);
    if (!label || !scannedSscc || normalizeSscc(label.sscc) !== scannedSscc) {
      return res.status(400).json({ error: 'A beszkennelt SSCC nem egyezik a rendszerben lévő címkével!' });
    }

    const location = await findAldiLocation(req.body.barcode);
    if (!location) {
      return res.status(404).json({ error: 'Érvénytelen vonalkód: ez a lokáció nem található a rendszerben, vagy nem engedélyezett ehhez a tételhez.' });
    }

    if (location.location_type === 'Szülő') {
      return res.status(400).json({ error: `A kiválasztott lokáció (${location.name}) egy SOR (szülő), ami önmagában nem tárhely. Kérlek, olvass le egy konkrét pozíciót ezen a soron belül!` });
    }

    // Validate location belongs to an allowed row in this truck's target_locations.
    // A PDA-ra küldött kamionnak mindig kell engedélyezett célsor; üres lista
    // esetén biztonsági okból egyetlen lokáció sem fogadható el.
    const commLine = await knex('aldi_truck_lines').where('id', req.params.id).first();
    if (commLine) {
      const truck = await knex('aldi_trucks').where('id', commLine.aldi_truck_id).first();
      if (!truck) {
        return res.status(400).json({ error: 'A komissiós tételhez tartozó kamion nem található.' });
      }
      const allowedIds = targetLocationIds(truck.target_locations);
      // Accept if the location itself is a row OR its parent is a row.
      const locationRowId = location.parent_id ? Number(location.parent_id) : Number(location.id);
      if (allowedIds.length === 0 || (!allowedIds.includes(locationRowId) && !allowedIds.includes(Number(location.id)))) {
        let targetLocations = truck.target_locations;
        if (typeof targetLocations === 'string') {
          try { targetLocations = JSON.parse(targetLocations); } catch { targetLocations = []; }
        }
        const allowedNames = Array.isArray(targetLocations)
          ? targetLocations.map(t => t && typeof t === 'object' ? t.name : t).filter(Boolean).join(', ')
          : '';
        return res.status(400).json({
          error: allowedNames
            ? `Ez a lokáció (${location.name}) nem engedélyezett ennél a kamionfejlécnél!\n\nEngedélyezett cél sorok: ${allowedNames}`
            : 'Ehhez a kamionhoz nincs engedélyezett célsor beállítva. A PDA-komissiózás nem folytatható.'
        });
      }
    }

    let result = {};
    await knex.transaction(async (trx) => {
      result = await processPick(trx, req.params.id, { ...req.body, scannedSscc }, location.id);
      if (result.label && !result.isAlreadyProcessed) {
        await trx('sscc_labels').where('id', result.label.id).update({ location_name: location.name });
        // Also update the line's destination field with the actual location name
        await trx('aldi_truck_lines').where('id', req.params.id).update({ destination: location.name });
      }
    });

    res.json({
      success: true,
      location_name: location.name,
      ordered_cartons: result.orderedCartons,
      picked_cartons: result.newPicked,
      remaining: result.newRemaining,
      is_picked: result.isFullyPicked,
      label: result.label,
      message: result.isAlreadyProcessed
        ? 'A művelet már korábban rögzítve lett (ismétlésvédett).'
        : (result.isFullyPicked
          ? 'Tétel teljesen komissiózva.'
          : `Részleges komissió rögzítve. Maradék: ${result.newRemaining} karton.`)
    });
  } catch (err) {
    if (err.code === 'BAD_REQUEST') return res.status(400).json({ error: err.message });
    if (err.code === 'NOT_FOUND') return res.status(404).json({ error: 'A tétel nem található.' });
    if (err.code === 'OVER_QTY') return res.status(409).json({ error: err.message });
    if (err.code === 'CAPACITY_EXCEEDED') return res.status(400).json({ error: err.message });
    if (err.code === 'INVALID_WEIGHT') return res.status(400).json({ error: err.message });
    console.error('[PDA] /commission-lines/:id/pick-and-assign hiba:', err);
    res.status(500).json({ error: 'Hiba a mentéskor.' });
  }
});

// ── POST /generate-pallet-label ──────────────────────────────
router.post('/generate-pallet-label', verifyToken, async (req, res) => {
  try {
    const { lineId, pickedCartons, originCountry } = req.body;
    if (!lineId) return res.status(400).json({ error: 'A tételsor azonosítója kötelező.' });

    try {
      await knex('sscc_labels')
        .where('is_provisional', true)
        .andWhere('created_at', '<', knex.raw("NOW() - INTERVAL '2 hours'"))
        .del();
    } catch (e) {
      console.error('[PDA] Ideiglenes címkék törlése sikertelen:', e);
    }

    const label = await createSsccLabel(knex, lineId, null, pickedCartons, originCountry);
    res.json({ success: true, label });
  } catch (err) {
    console.error('[PDA] /generate-pallet-label hiba:', err);
    res.status(500).json({ error: 'Hiba a címke generálásakor.' });
  }
});

// ── POST /print-pallet-label ──────────────────────────────
router.post('/print-pallet-label', verifyToken, async (req, res) => {
  try {
    const { labelId, commissionLineId, printerBarcode, pickedCartons } = req.body;
    if (!printerBarcode) {
      return res.status(400).json({ error: 'Nyomtató vonalkód megadása kötelező.' });
    }

    // 1. Nyomtató megkeresése az adatbázisban
    const printer = await knex('printers').where('barcode', printerBarcode).andWhere('is_active', true).first();
    if (!printer) {
      return res.status(404).json({ error: 'A megadott vonalkódhoz nem tartozik aktív nyomtató.' });
    }

    // 2. Címke előkeresése vagy generálása
    let label = null;
    if (req.body.labelData) {
      label = req.body.labelData;
    } else if (labelId) {
      label = await knex('sscc_labels').where('id', labelId).first();
    }
    if (!label && commissionLineId) {
      label = await knex('sscc_labels').where('commission_line_id', commissionLineId).orderBy('id', 'desc').first();
      if (!label) {
        const commLine = await knex('aldi_commission_lines').where('id', commissionLineId).first();
        if (commLine) {
          label = await createSsccLabel(knex, commLine.aldi_truck_line_id, commissionLineId, pickedCartons);
        } else {
          return res.status(404).json({ error: 'A komissió sor nem található a címkegeneráláshoz.' });
        }
      }
    }

    if (!label) {
      return res.status(404).json({ error: 'A nyomtatandó raklapcímke nem található.' });
    }

    console.log(`[PDA] Nyomtatás kérése a(z) ${printer.name} nyomtatóra. SSCC: ${label.sscc}, tétel: ${label.product_name}, kamion: ${label.truck_number}, karton: ${label.picked_cartons}`);

    const zpl = generateZpl(label);

    // Hálózati TCP kapcsolat a nyomtatóhoz
    const net = require('net');
    const client = new net.Socket();

    client.on('error', (e) => {
      console.error('[PDA] TCP hiba a nyomtatóhoz kapcsolódáskor:', e.message);
    });

    client.connect(printer.port, printer.ip_address, function () {
      client.write(zpl);
      client.destroy();
    });

    res.json({ success: true, message: 'Nyomtatási feladat sikeresen elküldve a címkenyomtatóra.', label });
  } catch (err) {
    console.error('[PDA] /print-pallet-label hiba:', err);
    res.status(500).json({ error: 'Hiba a nyomtatás elindításakor.' });
  }
});

// ── DELETE /provisional-label/:id ────────────────────────────
router.delete('/provisional-label/:id', verifyToken, async (req, res) => {
  try {
    const deleted = await knex('sscc_labels')
      .where('id', req.params.id)
      .andWhere('is_provisional', true)
      .del();
    if (deleted) {
      res.json({ success: true, message: 'Ideiglenes címke törölve.' });
    } else {
      res.status(404).json({ error: 'Címke nem található vagy már végleges.' });
    }
  } catch (err) {
    console.error('[PDA] /provisional-label törlés hiba:', err);
    res.status(500).json({ error: 'Hiba a törlés során.' });
  }
});

// ── GET /pallet-label/:sscc ──────────────────────────────
router.get('/pallet-label/:sscc', verifyToken, async (req, res) => {
  try {
    const { sscc } = req.params;
    const label = await knex('sscc_labels').where('sscc', sscc).first();
    if (!label) {
      return res.status(404).json({ error: 'A megadott vonalkód nem található a rendszerben.' });
    }
    res.json(label);
  } catch (err) {
    console.error('[PDA] /pallet-label/:sscc hiba:', err);
    res.status(500).json({ error: 'Hiba a raklapcímke betöltésekor.' });
  }
});

// ── GET /trucks-for-consolidation ────────────────────────────────
// Visszaadja azokat a kamionokat, amelyek PDA-ra küldve vannak de még nem rakodtak be.
// Csak ezek jelennek meg az összeemelés kamion-legördülőjében.
router.get('/trucks-for-consolidation', verifyToken, async (req, res) => {
  try {
    const trucks = await knex('aldi_trucks')
      .where('sent_to_pda', true)
      .where('is_loaded', false)
      .select('id', 'truck_number', 'delivery_date', 'transporter', 'target_locations')
      .orderBy('delivery_date', 'desc')
      .orderBy('id', 'desc');
    res.json(trucks);
  } catch (err) {
    console.error('[PDA] /trucks-for-consolidation hiba:', err);
    res.status(500).json({ error: 'Hiba a kamionok betöltésekor.' });
  }
});

// ── GET /labels-for-truck/:truckId ────────────────────────────────
// Az adott kamionhoz tartozó, lezárt (nem provisional), még nem összeemelő
// raklapcímkéket adja vissza jelölőnégyzetes listához.
router.get('/labels-for-truck/:truckId', verifyToken, async (req, res) => {
  try {
    const { truckId } = req.params;
    const labels = await knex('sscc_labels as s')
      .join('aldi_commission_lines as acl', 'acl.id', 's.commission_line_id')
      .join('aldi_truck_lines as atl', 'atl.id', 'acl.aldi_truck_line_id')
      .where('atl.aldi_truck_id', truckId)
      .where('s.is_provisional', false)
      .where(function() {
        this.where('s.is_consolidated_master', false).orWhereNull('s.is_consolidated_master');
      })
      .whereNull('s.consolidated_sscc')
      .select(
        's.id', 's.sscc', 's.commission_line_id', 's.product_name', 's.picked_cartons',
        's.pallets_json', 's.location_name', 's.truck_number',
        's.supplier', 's.destination', 's.origin_country', 's.created_at'
      )
      .orderBy('s.id', 'asc');
    const commissionIds = labels.map(label => label.commission_line_id);
    const commissionRows = await knex('aldi_commission_lines').whereIn('id', commissionIds);
    const stockRows = await knex('aldi_stock_locations').whereIn('commission_line_id', commissionIds);
    const locations = await knex('aldi_locations').whereIn('id', stockRows.map(stock => stock.location_id));
    const issues = consolidationStockIssues(labels, commissionRows, stockRows, locations);
    const byLabel = new Map(issues.map(issue => [issue.labelId, issue]));
    res.json(labels.map(label => {
      const issue = byLabel.get(Number(label.id));
      return {
        ...label,
        can_consolidate: !issue.error,
        consolidation_error: issue.error,
        location_name: issue.location?.name || label.location_name
      };
    }));
  } catch (err) {
    console.error('[PDA] /labels-for-truck hiba:', err);
    res.status(500).json({ error: 'Hiba a raklapcímkék betöltésekor.' });
  }
});

// ── GET /consolidation-member ──────────────────────────────────────────────
router.get('/consolidation-member', verifyToken, async (req, res) => {
  try {
    const { sscc } = req.query;
    if (!sscc) return res.status(400).json({ error: 'SSCC paraméter kötelező.' });
    const val = normalizeSscc(sscc);
    if (!val) return res.status(400).json({ error: 'Érvénytelen SSCC vonalkód.' });

    const label = await knex('sscc_labels')
      .where('sscc', val)
      .where('is_provisional', false)
      .where(function() {
        this.where('is_consolidated_master', false).orWhereNull('is_consolidated_master');
      })
      .whereNull('consolidated_sscc')
      .first();

    if (!label) return res.status(404).json({ error: 'A raklap nem található, már összeemelték, vagy még nem véglegesítették.' });

    const commissionId = Number(label.commission_line_id);
    if (!Number.isInteger(commissionId)) return res.status(400).json({ error: 'A raklaphoz nem tartozik komissiózási rekord.' });

    const commissionRow = await knex('aldi_commission_lines').where('id', commissionId).first();
    if (!commissionRow) return res.status(400).json({ error: 'A komissiózási rekord nem található.' });

    const truckId = Number(commissionRow.aldi_truck_id);
    const truck = await knex('aldi_trucks').where('id', truckId).first();
    if (!truck || !truck.sent_to_pda || truck.is_loaded) {
      return res.status(400).json({ error: 'A kamion nem szerepel aktív PDA-feladatként, vagy már rakodva van.' });
    }

    const stockRows = await knex('aldi_stock_locations').where('commission_line_id', commissionId);
    const locationIds = [...new Set(stockRows.map(s => s.location_id))];
    const locations = locationIds.length > 0 ? await knex('aldi_locations').whereIn('id', locationIds) : [];

    const issues = consolidationStockIssues([label], [commissionRow], stockRows, locations);
    if (issues.length > 0 && issues[0].error) {
      return res.status(400).json({ error: issues[0].error });
    }

    res.json({
      success: true,
      label: {
        id: label.id,
        sscc: label.sscc,
        product_name: label.product_name,
        truck_id: truck.id,
        truck_number: truck.truck_number,
        target_locations: truck.target_locations
      }
    });
  } catch (err) {
    console.error('[PDA] /consolidation-member hiba:', err);
    res.status(500).json({ error: 'Hiba a raklap adatainak lekérdezésekor.' });
  }
});

// ── POST /consolidation-preview, /consolidation-validate-location, /consolidation ──
// Előnézet, céllokáció-ellenőrzés, majd a visszaszkennelt mester SSCC utáni véglegesítés.
router.post('/consolidation-preview', verifyToken, async (req, res) => {
  try {
    const { labelIds } = req.body;
    if (!Array.isArray(labelIds) || labelIds.length < 2) {
      return res.status(400).json({ error: 'Legalább 2 raklapot meg kell adni az összeemeléshez.' });
    }
    const ids = labelIds.map(Number);
    const uniqueIds = [...new Set(ids)];
    if (ids.some(id => !Number.isInteger(id) || id <= 0) || uniqueIds.length !== ids.length) {
      return res.status(400).json({ error: 'Érvénytelen vagy ismétlődő raklapazonosító.' });
    }

    let previewLabel = null;
    await knex.transaction(async (trx) => {
      const labels = await trx('sscc_labels')
        .whereIn('id', uniqueIds)
        .where('is_provisional', false)
        .where(function() {
          this.where('is_consolidated_master', false).orWhereNull('is_consolidated_master');
        })
        .whereNull('consolidated_sscc');
      if (labels.length !== uniqueIds.length) {
        throw new Error('Egy vagy több raklap érvénytelen, már összeemelve, vagy nem található.');
      }
      const commissionIds = [...new Set(labels.map(label => Number(label.commission_line_id)).filter(Number.isInteger))];
      const commissionRows = await trx('aldi_commission_lines').whereIn('id', commissionIds);
      const truckIds = [...new Set(commissionRows.map(row => Number(row.aldi_truck_id)))];
      if (commissionIds.length !== labels.length || commissionRows.length !== commissionIds.length || truckIds.length !== 1) {
        throw new Error('A kijelölt raklapok nem ugyanahhoz a kamionhoz tartoznak.');
      }
      const labelsById = new Map(labels.map(label => [Number(label.id), label]));
      const orderedLabels = uniqueIds.map(id => labelsById.get(id));
      const truck = await trx('aldi_trucks').where('id', truckIds[0]).first();
      if (!truck || !truck.sent_to_pda || truck.is_loaded) {
        throw new Error('A kamion nem szerepel aktív PDA-feladatként, vagy már rakodva van.');
      }

      // A hibás történeti címkék még nyomtatás előtt megállítják a folyamatot.
      const stockRows = await trx('aldi_stock_locations').whereIn('commission_line_id', commissionIds);
      const locations = await trx('aldi_locations').whereIn('id', stockRows.map(stock => stock.location_id));
      assertConsolidationStock(consolidationStockIssues(labels, commissionRows, stockRows, locations));

      let totalCartons = 0;
      const productNames = new Set();
      const suppliers = new Set();
      const destinations = new Set();
      const origins = new Set();
      for (const label of orderedLabels) {
        totalCartons += parseInt(label.picked_cartons, 10) || 0;
        if (label.product_name) productNames.add(label.product_name);
        if (label.supplier) suppliers.add(label.supplier);
        if (label.destination) destinations.add(label.destination);
        if (label.origin_country) origins.add(label.origin_country);
      }
      const seqRes = await trx.raw("SELECT nextval('sscc_labels_id_seq') as next_id");
      const nextId = Number(seqRes.rows[0].next_id);
      const extDigit = '3';
      const companyPrefix = process.env.GS1_COMPANY_PREFIX || '5990001';
      const serialNum = String(nextId).padStart(17 - companyPrefix.length - extDigit.length, '0');
      const baseSSCC = extDigit + companyPrefix + serialNum;
      let sum = 0;
      for (let i = baseSSCC.length - 1; i >= 0; i--) {
        const digit = parseInt(baseSSCC[i], 10);
        const posFromRight = baseSSCC.length - 1 - i;
        sum += digit * (posFromRight % 2 === 0 ? 3 : 1);
      }
      const finalSSCC = baseSSCC + ((10 - (sum % 10)) % 10);
      previewLabel = {
        id: nextId,
        sscc: finalSSCC,
        commission_line_id: null,
        picked_cartons: totalCartons,
        truck_number: truck.truck_number,
        product_name: productNames.size > 1 ? 'Vegyes raklap' : (Array.from(productNames)[0] || 'Vegyes'),
        delivery_date: new Date().toISOString().split('T')[0],
        supplier: Array.from(suppliers).join(', ').substring(0, 255),
        destination: Array.from(destinations).join(', ').substring(0, 255),
        origin_country: Array.from(origins).join(', ').substring(0, 255),
        location_name: null,
        is_provisional: false,
        is_consolidated_master: true,
        pallets_json: JSON.stringify(orderedLabels.map(label => label.sscc))
      };
    });
    res.json({ success: true, label: previewLabel });
  } catch (err) {
    console.error('[PDA] /consolidation-preview hiba:', err);
    res.status(400).json({ error: err.message || 'Hiba történt a címke generálása során.' });
  }
});

router.post('/consolidation-validate-location', verifyToken, async (req, res) => {
  try {
    const { truckId, locationInput, labelIds } = req.body;
    if (!truckId || !locationInput) return res.status(400).json({ error: 'Kamionazonosító és lokáció megadása kötelező.' });
    if (!Array.isArray(labelIds) || labelIds.length < 2) return res.status(400).json({ error: 'A kapacitás ellenőrzéséhez legalább 2 kijelölt raklap szükséges. Frissítsd a PDA alkalmazást.' });
    const ids = labelIds.map(Number);
    if (ids.some(id => !Number.isInteger(id) || id <= 0) || new Set(ids).size !== ids.length) {
      return res.status(400).json({ error: 'Érvénytelen vagy ismétlődő raklapazonosító.' });
    }
    const truck = await knex('aldi_trucks').where('id', truckId).first();
    if (!truck) return res.status(404).json({ error: 'A kamion nem található.' });
    if (!truck.sent_to_pda || truck.is_loaded) return res.status(400).json({ error: 'A kamion nem szerepel aktív PDA-feladatként, vagy már rakodva van.' });
    const loc = await findAldiLocation(locationInput, knex);
    if (!loc) return res.status(404).json({ error: 'Érvénytelen lokáció.' });
    if (isParentLocation(loc)) return res.status(400).json({ error: 'Szülő lokáció nem használható céltárhelyként.' });
    const allowedIds = targetLocationIds(truck.target_locations);
    const locationRowId = loc.parent_id ? Number(loc.parent_id) : Number(loc.id);
    if (allowedIds.length === 0 || (!allowedIds.includes(locationRowId) && !allowedIds.includes(Number(loc.id)))) {
      return res.status(400).json({ error: 'A megadott lokáció nem szerepel a kamion cél lokációi között.' });
    }
    const labels = await knex('sscc_labels').whereIn('id', ids).where('is_provisional', false)
      .where(function() { this.where('is_consolidated_master', false).orWhereNull('is_consolidated_master'); })
      .whereNull('consolidated_sscc');
    if (labels.length !== ids.length) return res.status(400).json({ error: 'Egy vagy több raklap érvénytelen, már összeemelve, vagy nem található.' });
    const commissionIds = labels.map(label => label.commission_line_id);
    const commissionRows = await knex('aldi_commission_lines').whereIn('id', commissionIds);
    if (commissionRows.length !== labels.length || commissionRows.some(row => Number(row.aldi_truck_id) !== Number(truck.id))) {
      return res.status(400).json({ error: 'A kijelölt raklapok nem ehhez a kamionhoz tartoznak.' });
    }
    const stockRows = await knex('aldi_stock_locations').whereIn('commission_line_id', commissionIds);
    const locations = await knex('aldi_locations').whereIn('id', stockRows.map(stock => stock.location_id));
    assertConsolidationStock(consolidationStockIssues(labels, commissionRows, stockRows, locations));
    const capacityError = await consolidationCapacityError(knex, loc, stockRows);
    if (capacityError) return res.status(400).json({ error: capacityError });
    return res.json({ success: true, locationId: loc.id, locationName: loc.name });
  } catch (err) {
    if (err.code === 'INVALID_CONSOLIDATION_STOCK') return res.status(400).json({ error: err.message });
    console.error('[PDA] /consolidation-validate-location hiba:', err);
    res.status(500).json({ error: 'Hiba a lokáció validálása során.' });
  }
});

router.post('/consolidation', verifyToken, async (req, res) => {
  try {
    const { labelIds, truckId, locationId, locationName, scannedSscc, masterLabel } = req.body;
    if (!Array.isArray(labelIds) || labelIds.length < 2) return res.status(400).json({ error: 'Legalább 2 raklapot meg kell adni az összeemeléshez.' });
    const ids = labelIds.map(Number);
    const uniqueIds = [...new Set(ids)];
    if (ids.some(id => !Number.isInteger(id) || id <= 0) || uniqueIds.length !== ids.length) return res.status(400).json({ error: 'Érvénytelen vagy ismétlődő raklapazonosító.' });
    if (!masterLabel?.id || !masterLabel?.sscc || !scannedSscc) return res.status(400).json({ error: 'Hiányzó összeemelt címke vagy visszaszkennelt SSCC.' });
    const expectedSscc = normalizeSscc(masterLabel.sscc);
    if (normalizeSscc(scannedSscc) !== expectedSscc || !validSscc(expectedSscc)) return res.status(400).json({ error: 'A visszaszkennelt SSCC nem egyezik az érvényes összeemelt címkével.' });
    const masterId = Number(masterLabel.id);
    if (!Number.isInteger(masterId) || masterId <= 0) return res.status(400).json({ error: 'Érvénytelen összeemelt címke azonosító.' });

    let resultLabel = null;
    await knex.transaction(async (trx) => {
      const labels = await trx('sscc_labels').whereIn('id', uniqueIds).where('is_provisional', false)
        .where(function() { this.where('is_consolidated_master', false).orWhereNull('is_consolidated_master'); })
        .whereNull('consolidated_sscc').forUpdate();
      if (labels.length !== uniqueIds.length) throw new Error('Egy vagy több raklap érvénytelen, már összeemelve, vagy nem található.');
      const commissionIds = [...new Set(labels.map(label => Number(label.commission_line_id)).filter(Number.isInteger))];
      if (commissionIds.length !== labels.length || commissionIds.some(id => id <= 0)) throw new Error('A kijelölt raklaphoz nem tartozik érvényes komissiózási rekord.');
      const commissionRows = await trx('aldi_commission_lines').whereIn('id', commissionIds);
      const truckIds = [...new Set(commissionRows.map(row => Number(row.aldi_truck_id)))];
      if (commissionRows.length !== commissionIds.length || truckIds.length !== 1 || (truckId && Number(truckId) !== truckIds[0])) throw new Error('A kijelölt raklapok nem ugyanahhoz a kamionhoz tartoznak.');
      const truck = await trx('aldi_trucks').where('id', truckIds[0]).forUpdate().first();
      if (!truck || !truck.sent_to_pda || truck.is_loaded) throw new Error('A kamion nem szerepel aktív PDA-feladatként, vagy már rakodva van.');

      let loc = locationId ? await trx('aldi_locations').where('id', Number(locationId)).first() : await findAldiLocation(locationName, trx);
      if (!loc) throw new Error('A megadott céllokáció nem található.');
      loc = await trx('aldi_locations').where('id', loc.id).forUpdate().first();
      if (!loc) throw new Error('A megadott céllokáció nem található.');
      if (isParentLocation(loc)) throw new Error('Szülő lokáció nem használható céltárhelyként.');
      const allowedIds = targetLocationIds(truck.target_locations);
      const locationRowId = loc.parent_id ? Number(loc.parent_id) : Number(loc.id);
      if (allowedIds.length === 0 || (!allowedIds.includes(locationRowId) && !allowedIds.includes(Number(loc.id)))) throw new Error('A megadott lokáció nem szerepel a kamion cél lokációi között.');

      const stockRows = await trx('aldi_stock_locations').whereIn('commission_line_id', commissionIds).forUpdate();
      const locations = await trx('aldi_locations').whereIn('id', stockRows.map(stock => stock.location_id));
      assertConsolidationStock(consolidationStockIssues(labels, commissionRows, stockRows, locations));
      const stockIds = stockRows.map(stock => stock.id);
      const capacityError = await consolidationCapacityError(trx, loc, stockRows);
      if (capacityError) throw new Error(capacityError);

      const byId = new Map(labels.map(label => [Number(label.id), label]));
      const orderedLabels = uniqueIds.map(id => byId.get(id));
      const memberSsccs = orderedLabels.map(label => label.sscc);
      let suppliedMembers = null;
      try { suppliedMembers = JSON.parse(masterLabel.pallets_json || 'null'); } catch (_) {}
      if (Array.isArray(suppliedMembers) && JSON.stringify(suppliedMembers) !== JSON.stringify(memberSsccs)) throw new Error('Az összeemelt címke tagraklap-listája nem egyezik a kijelöléssel.');
      const totalCartons = orderedLabels.reduce((sum, label) => sum + (parseInt(label.picked_cartons, 10) || 0), 0);
      const products = [...new Set(orderedLabels.map(label => label.product_name).filter(Boolean))];
      const suppliers = [...new Set(orderedLabels.map(label => label.supplier).filter(Boolean))];
      const destinations = [...new Set(orderedLabels.map(label => label.destination).filter(Boolean))];
      const origins = [...new Set(orderedLabels.map(label => label.origin_country).filter(Boolean))];
      const existing = await trx('sscc_labels').where(function() { this.where('id', masterId).orWhere('sscc', expectedSscc); }).first();
      if (existing) throw new Error('Ez az összeemelt SSCC már szerepel a rendszerben.');
      const masterData = {
        id: masterId, sscc: expectedSscc, commission_line_id: null, picked_cartons: totalCartons,
        truck_number: truck.truck_number, product_name: products.length > 1 ? 'Vegyes raklap' : (products[0] || 'Vegyes'),
        delivery_date: masterLabel.delivery_date || new Date().toISOString().split('T')[0],
        supplier: suppliers.join(', ').substring(0, 255), destination: destinations.join(', ').substring(0, 255),
        origin_country: origins.join(', ').substring(0, 255), location_name: loc.name,
        is_provisional: false, is_consolidated_master: true, pallets_json: JSON.stringify(memberSsccs)
      };
      await trx('sscc_labels').insert(masterData);
      await trx('sscc_labels').whereIn('id', uniqueIds).update({ consolidated_sscc: expectedSscc, location_name: loc.name });
      await trx('aldi_stock_locations').whereIn('id', stockIds).update({ location_id: loc.id });
      resultLabel = masterData;
    });
    res.json({ success: true, label: resultLabel });
  } catch (err) {
    console.error('[PDA] /consolidation hiba:', err);
    res.status(400).json({ error: err.message || 'Hiba történt az összeemelés véglegesítése során.' });
  }
});

module.exports = router;
