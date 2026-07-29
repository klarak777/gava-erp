/**
 * fix_null_partner_ids.js
 *
 * A shipment_lines táblában lévő NULL partner_id-jű sorok javítása.
 *
 * A probléma: az importáláskor egyes Reference (szállító) nevek nem lettek
 * partner_id-vé fordítva, így a sor partner_id = NULL maradt.
 *
 * Megoldás:
 * 1. Lekérdezi az összes NULL partner_id-jű sort (termékkel és fuvarral együtt)
 * MEGJEGYZÉS: Fájlnév keresés dinamikus (glob) az ékezetes nevek miatt.
 * 2. Az összes szezon CSV-ből megkeresi a megfelelő sort és a Reference nevet
 * 3. A Reference névből megkeresi a partner_id-t a partner_identifiers táblán át
 * 4. Frissíti a shipment_lines.partner_id-t
 *
 * Futtatás: node fix_null_partner_ids.js
 * Dry-run:  node fix_null_partner_ids.js --dry-run
 */

require('dotenv').config();
const knex = require('knex');
const knexConfig = require('./knexfile');
const fs = require('fs');
const path = require('path');

const db = knex(knexConfig['development']);
const isDryRun = process.argv.includes('--dry-run');

const BASE_DIR = 'c:\\Users\\klara\\Documents\\Nepelemes ügyek\\Gavá\\ERP Access';

// Dinamikusan keressük a CSV fájlokat részleges névegyezéssel
// (ékezetes fájlnevekkel való Windows encoding probléma elkerülése)
function findCsvFile(partialName) {
  try {
    const files = fs.readdirSync(BASE_DIR);
    const match = files.find(f => f.toLowerCase().includes(partialName.toLowerCase()) && f.endsWith('.csv'));
    return match ? path.join(BASE_DIR, match) : null;
  } catch { return null; }
}

const SEASON_CSVS = [
  { season: '25-26', partial: '25-26 Fuvarok' },
  { season: '24-25', partial: '24-25 Fuvarok' },
  { season: '23-24', partial: '23-24' },
  { season: '22-23', partial: '22-23' },
  { season: '20-21', partial: '20-21' },
];

// CSV oszlop indexek (0-based, a fejléc alapján)
// "Total Palets;N° Euro Palets;N° Normal Palets;Products;Reference;Customer;Destination;..."
//  0             1              2                3         4          5        6
const COL_PRODUCT   = 3;
const COL_REFERENCE = 4;
const COL_ORDER     = 18; // "Order number"

function normalizeName(s) {
  if (!s) return '';
  return s.trim().toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/[""]/g, '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // ékezet nélkül
}

function parseCSV(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  return lines.map(l => l.split(';').map(c => c.trim().replace(/^"|"$/g, '')));
}

async function main() {
  console.log('=======================================================');
  console.log(`  NULL partner_id JAVÍTÁS - shipment_lines`);
  console.log(`  Mód: ${isDryRun ? 'DRY-RUN' : 'ÉLES'}`);
  console.log('=======================================================\n');

  // 1. Lekérdezzük az összes NULL partner_id-jű sort
  const nullLines = await db('shipment_lines')
    .select(
      'shipment_lines.id as line_id',
      'shipment_lines.shipment_id',
      'shipment_lines.euro_palets',
      'shipment_lines.normal_palets',
      'shipment_lines.customer',
      'shipment_lines.destination',
      'shipment_lines.comment',
      'products.name as product_name',
      'shipments.order_number',
      'seasons.code as season_code'
    )
    .leftJoin('shipments', 'shipment_lines.shipment_id', 'shipments.id')
    .leftJoin('seasons', 'shipments.season_id', 'seasons.id')
    .leftJoin('products', 'shipment_lines.product_id', 'products.id')
    .whereNull('shipment_lines.partner_id');

  console.log(`Összesen ${nullLines.length} NULL partner_id-jű sor.\n`);

  // 2. CSV-k betöltése memóriába (order_number + normProduct → reference)
  const csvRefMap = {}; // key: "ORDER_NUMBER|NORM_PRODUCT" → refName

  for (const { season, partial } of SEASON_CSVS) {
    const filePath = findCsvFile(partial);
    if (!filePath) {
      console.log(`⚠️  CSV nem található (keresett: *${partial}*.csv)`);
      continue;
    }
    const rows = parseCSV(filePath);
    if (rows.length === 0) {
      console.log(`⚠️  CSV üres: ${path.basename(filePath)}`);
      continue;
    }
    let found = 0;
    for (const row of rows.slice(1)) { // fejléc kihagyása
      const orderNo = (row[COL_ORDER] || '').trim();
      const product  = normalizeName(row[COL_PRODUCT] || '');
      const ref      = (row[COL_REFERENCE] || '').trim().toUpperCase();
      if (orderNo && product && ref) {
        const key = `${orderNo.toUpperCase()}|${product}`;
        if (!csvRefMap[key]) csvRefMap[key] = ref;
        found++;
      }
    }
    console.log(`📄 ${path.basename(filePath)}: ${found} sor betöltve (szezon: ${season})`);
  }
  console.log('');

  // 3. Partner_identifiers → partner_id lookup tábla
  const identifiers = await db('partner_identifiers')
    .select('partner_id', 'value')
    .where('id_type', '(Reference) Szállítók');
  
  // Szintén keressük a partners tábla name mezőjét fallback-ként
  const allPartners = await db('partners').select('id', 'name');
  
  const refToPartnerId = {}; // NORM_REF_NAME → partner_id
  for (const ident of identifiers) {
    refToPartnerId[normalizeName(ident.value)] = ident.partner_id;
  }
  // Fallback: direkt partner.name egyezés
  for (const p of allPartners) {
    const norm = normalizeName(p.name);
    if (!refToPartnerId[norm]) refToPartnerId[norm] = p.id;
  }

  // 4. Minden NULL sort megpróbálunk javítani
  let fixed = 0, notFound = 0, noRef = 0;
  const unfixable = [];

  for (const line of nullLines) {
    const orderKey = (line.order_number || '').toUpperCase();
    const productNorm = normalizeName(line.product_name || '');

    // CSV lookup
    const csvKey = `${orderKey}|${productNorm}`;
    let refName = csvRefMap[csvKey];

    if (!refName) {
      // Próbáljuk részleges egyezéssel is (termék neve rövidebb is lehet)
      const partialKey = Object.keys(csvRefMap).find(k => {
        const [kOrder, kProd] = k.split('|');
        return kOrder === orderKey && (
          kProd.startsWith(productNorm.substring(0, 10)) ||
          productNorm.startsWith(kProd.substring(0, 10))
        );
      });
      if (partialKey) refName = csvRefMap[partialKey];
    }

    if (!refName) {
      noRef++;
      unfixable.push({
        line_id: line.line_id,
        order: line.order_number,
        season: line.season_code,
        product: line.product_name,
        reason: 'Nem található a CSV-ben'
      });
      continue;
    }

    // Partner_id keresése
    const partnerId = refToPartnerId[normalizeName(refName)];
    if (!partnerId) {
      notFound++;
      unfixable.push({
        line_id: line.line_id,
        order: line.order_number,
        season: line.season_code,
        product: line.product_name,
        reason: `Reference "${refName}" nem található a partner_identifiers-ben`
      });
      continue;
    }

    // Frissítés
    if (isDryRun) {
      console.log(`  [DRY-RUN] line_id ${line.line_id} | ${line.order_number} | "${line.product_name}" → partner_id ${partnerId} (${refName})`);
    } else {
      await db('shipment_lines').where('id', line.line_id).update({
        partner_id: partnerId,
        updated_at: new Date()
      });
      console.log(`  ✅ line_id ${line.line_id} | ${line.order_number} | "${line.product_name}" → partner_id ${partnerId} (${refName})`);
    }
    fixed++;
  }

  // 5. Eredmény
  console.log('\n=======================================================');
  console.log(`  EREDMÉNY:`);
  console.log(`  ✅ Javított:         ${fixed}`);
  console.log(`  ❌ Nincs CSV-ben:    ${noRef}`);
  console.log(`  ❓ Nincs partner_id: ${notFound}`);
  console.log('=======================================================');

  if (unfixable.length > 0) {
    console.log('\n⚠️  Nem javítható sorok:');
    console.table(unfixable);
  }

  if (isDryRun) {
    console.log('\n[DRY-RUN] - Semmi nem lett mentve. Éles futtatás: node fix_null_partner_ids.js');
  }

  await db.destroy();
}

main().catch(err => {
  console.error('HIBA:', err.message);
  db.destroy();
  process.exit(1);
});
