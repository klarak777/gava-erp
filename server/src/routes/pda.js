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

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_for_gava';

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
  const { picked_cartons, gross_weight, packaging_type, tare_weight, origin_country, lot_number, pallet_type, pickSessionId } = reqData;
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
      const currentLocStock = await trx('aldi_stock_locations')
        .where('location_id', locationId)
        .count('id as occupied_pallets')
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

  // 3. Súly és raklap kalkuláció
  let newPallets = 1; // Minden PDA megadás pontosan 1 raklapot jelent


  let palletTareKg = 0;
  let palletTypeName = null;

  if (pallet_type) {
    // pallet_type a ref_packaging_types ID-ja a frontend módosítás óta
    const palInfo = await trx('ref_packaging_types').where('id', pallet_type).first();
    if (!palInfo || !palInfo.is_active || ![palInfo.name, palInfo.category].some(value => String(value || '').toLowerCase().includes('raklap'))) {
      const err = new Error('Válassz érvényes, aktív raklaptípust.'); err.code = 'BAD_REQUEST'; throw err;
    }
    if (palInfo.tare_weight_kg == null || !Number.isFinite(Number(palInfo.tare_weight_kg)) || Number(palInfo.tare_weight_kg) <= 0) {
      const err = new Error('A nettó számításához érvényes raklaptára szükséges.'); err.code = 'INVALID_WEIGHT'; throw err;
    }
    if (alreadyPicked > 0 && line.pallet_type && line.pallet_type !== palInfo.name) {
      const err = new Error('A megkezdett tételt ugyanazzal a raklaptípussal folytasd.'); err.code = 'BAD_REQUEST'; throw err;
    }
    if (palInfo) {
      palletTypeName = palInfo.name;
      if (newPallets > 0) {
        palletTareKg = parseFloat(palInfo.tare_weight_kg) || 0;
      }
    }
  }

  if (!pallet_type) {
    const err = new Error('Válassz raklaptípust a nettó súly számításához.'); err.code = 'BAD_REQUEST'; throw err;
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
    const totalTare = (reqTare * qty) + (newPallets * palletTareKg);
    if (reqGross < totalTare) {
      const err = new Error(`A bruttó súly (${reqGross} kg) kisebb, mint a göngyöleg (${reqTare} kg x ${qty} db) és az új raklapok (${newPallets} db x ${palletTareKg} kg) tára összege!`);
      err.code = 'INVALID_WEIGHT'; throw err;
    }
  } else if (gross_weight !== undefined && gross_weight !== null && gross_weight !== '') {
    const err = new Error('A bruttó súlynak pozitívnak kell lennie!');
    err.code = 'INVALID_WEIGHT'; throw err;
  }

  let currentPickNet = null;
  if (!isNaN(reqGross) && reqGross > 0) {
    currentPickNet = reqGross - (reqTare * qty) - (newPallets * palletTareKg);
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
    pallets: newPallets,
    gross_weight: !isNaN(reqGross) ? reqGross : null,
    net_weight: currentPickNet,
    pallet_type: palletTypeName,
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
      pallet_type: palletTypeName || null,
      tare_weight: reqTare || null,
      origin_country: origin_country || null,
      lot_number: lot_number || null
    });

  // SSCC címke frissítése vagy generálása
  let label = null;
  if (reqData.labelId) {
    const [updated] = await trx('sscc_labels')
      .where('id', reqData.labelId)
      .update({ commission_line_id: commissionId })
      .returning('*');
    label = updated;
  }
  if (!label) {
    label = await createSsccLabel(trx, id, commissionId, qty, origin_country);
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
async function createSsccLabel(dbClient, lineId, commissionLineId, pickedCartons, originCountryOverride) {
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
    origin_country: originCountry
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
^FO40,380^GB1100,5,5^FS
^FO0,440^A0N,130,130^FB1180,1,0,C^FD${label.product_name || ''}^FS
^FO0,600^A0N,50,50^FB1180,1,0,C^FDTermék megnevezése^FS
^FO40,680^GB1100,5,5^FS
^FO40,750^A0N,60,60^FDÉrkezés dátuma: ${label.delivery_date || ''}^FS
^FO40,850^A0N,60,60^FDKarton szám: ${label.picked_cartons || ''} db^FS
^FO40,950^A0N,60,60^FDBeszállító: ${label.supplier || ''}^FS
^FO40,1050^A0N,60,60^FDÜgyfél: ${label.destination || ''}^FS
^FO40,1150^A0N,60,60^FDSzármazási ország: ${label.origin_country || ''}^FS
^FO40,1800^GB1100,5,5^FS
^FO100,1880^BY6
^BCN,350,Y,N,N
^FD${label.sscc}^FS
^FO0,2300^A0N,60,60^FB1180,1,0,C^FDSSCC^FS
^XZ`;
}

// ── PUT /commission-lines/:id/pick-and-assign ──────────────────────────────
router.put('/commission-lines/:id/pick-and-assign', verifyToken, async (req, res) => {
  try {
    if (!req.body.barcode) {
      return res.status(400).json({ error: 'Vonalkód megadása kötelező.' });
    }

    const location = await knex('aldi_locations').where('barcode', req.body.barcode).first();
    if (!location) {
      return res.status(404).json({ error: 'Érvénytelen vonalkód: a lokáció nem található.' });
    }

    let result = {};
    await knex.transaction(async (trx) => {
      result = await processPick(trx, req.params.id, req.body, location.id);
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
    if (labelId) {
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

    client.connect(printer.port, printer.ip_address, function() {
      client.write(zpl);
      client.destroy();
    });

    res.json({ success: true, message: 'Nyomtatási feladat sikeresen elküldve a címkenyomtatóra.', label });
  } catch (err) {
    console.error('[PDA] /print-pallet-label hiba:', err);
    res.status(500).json({ error: 'Hiba a nyomtatás elindításakor.' });
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

// ── POST /consolidation ──────────────────────────────
router.post('/consolidation', verifyToken, async (req, res) => {
  try {
    const { pallets } = req.body;
    if (!pallets || !Array.isArray(pallets) || pallets.length === 0) {
      return res.status(400).json({ error: 'Nincsenek megadva raklapok az összeemeléshez.' });
    }

    let newLabel = null;
    await knex.transaction(async (trx) => {
      const labels = await trx('sscc_labels').whereIn('sscc', pallets);
      if (labels.length !== pallets.length) {
        throw new Error('Egy vagy több vonalkód érvénytelen vagy nem található.');
      }

      let totalCartons = 0;
      let totalGrossWeight = 0;
      let productNames = new Set();
      let suppliers = new Set();
      let destinations = new Set();
      let origins = new Set();
      let truckNumbers = new Set();

      for (const lbl of labels) {
        totalCartons += parseInt(lbl.picked_cartons) || 0;
        // Ha lenne bruttó súly a táblában (most nincs) hozzáadnánk.
        if (lbl.product_name) productNames.add(lbl.product_name);
        if (lbl.supplier) suppliers.add(lbl.supplier);
        if (lbl.destination) destinations.add(lbl.destination);
        if (lbl.origin_country) origins.add(lbl.origin_country);
        if (lbl.truck_number) truckNumbers.add(lbl.truck_number);
      }

      const seqRes = await trx.raw("SELECT nextval('sscc_labels_id_seq') as next_id");
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

      const productName = productNames.size > 1 ? 'Vegyes raklap' : (Array.from(productNames)[0] || 'Vegyes');
      const supplier = Array.from(suppliers).join(', ').substring(0, 255);
      const destination = Array.from(destinations).join(', ').substring(0, 255);
      const originCountry = Array.from(origins).join(', ').substring(0, 255);
      const truckNumber = Array.from(truckNumbers).join(', ').substring(0, 255);
      const deliveryDate = new Date().toISOString().split('T')[0]; // Mai dátum

      [newLabel] = await trx('sscc_labels').insert({
        id: nextId,
        sscc: finalSSCC,
        commission_line_id: null,
        picked_cartons: totalCartons,
        truck_number: truckNumber,
        product_name: productName,
        delivery_date: deliveryDate,
        supplier: supplier,
        destination: destination,
        origin_country: originCountry
      }).returning('*');
    });

    res.json({ success: true, label: newLabel });
  } catch (err) {
    console.error('[PDA] /consolidation hiba:', err);
    res.status(400).json({ error: err.message || 'Hiba történt az összeemelés során.' });
  }
});

module.exports = router;
