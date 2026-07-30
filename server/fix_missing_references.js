/**
 * fix_missing_references.js
 *
 * Javítóscript: felveszi a hiányzó partner_identifiers (Reference) bejegyzéseket
 * azon partnerekhez amelyek szerepelnek fuvarsorokban de nincs Reference azonosítójuk.
 *
 * ⚠️  FONTOS: Futtatás előtt ellenőrizd a PENDING_FIXES listát!
 *     Csak azokat vedd fel, amelyeknek valóban van Reference (szállítói) szerepük.
 *
 * Futtatás: node fix_missing_references.js
 * Dry-run (csak listázás, nem ír): node fix_missing_references.js --dry-run
 */

require('dotenv').config();
const knex = require('knex');
const knexConfig = require('./knexfile');

const db = knex(knexConfig['development']);
const isDryRun = process.argv.includes('--dry-run');

// =============================================================================
// JAVÍTANDÓ PARTNEREK LISTÁJA
// Format: { pid: <partner_id>, name: '<reference azonosító neve>' }
// Csak azokat add hozzá amiket biztosan tudod hogy Reference szállítók!
// =============================================================================
const PENDING_FIXES = [
  // --- Delgafruits: a migration 040 a pid:20-ra tette, de ellenőrizni kell ---
  // { pid: 1027, name: 'DELGAFRUITS' },  // ← csak ha 1027 is külön partner

  // --- Nagyobb régi szállítók (ellenőrizd ezeket!) ---
  { pid: 243,  name: 'AGESCO' },
  { pid: 272,  name: 'HISPA GROUP' },
  { pid: 257,  name: 'MK FRESH' },
  { pid: 244,  name: 'GRUPO NATURAL' },
  { pid: 275,  name: 'INDASOL' },
  { pid: 256,  name: 'COCO FRUITS' },
  { pid: 254,  name: 'FAUS DURA' },
  { pid: 281,  name: 'VICASOL' },
  { pid: 310,  name: 'VERMIO' },
  { pid: 317,  name: 'VERMION FRESH' },
  { pid: 273,  name: 'AZAFAMA' },
  { pid: 292,  name: 'CHERY TIM' },
  { pid: 250,  name: 'ESCOBI' },
  { pid: 329,  name: 'RELAX FRUITS' },
  { pid: 333,  name: 'KARKAVITSAS' },
  { pid: 300,  name: 'VITAFRUIT' },
  { pid: 261,  name: 'LIVIU' },
  { pid: 302,  name: 'VELASGRO' },
  { pid: 287,  name: 'LA PIRUJITA' },
  { pid: 315,  name: 'AGRICOLA NEJITE' },
  { pid: 290,  name: 'BALCANIC FOOD' },
  { pid: 291,  name: 'TOLEDANO HORTICOLA' },

  // Ezeket NE add hozzá automatikusan - más szerepük van:
  // { pid: 8,    name: 'GHU' },        // ← ez ügyfél (customer), nem szállító
  // { pid: 31,   name: 'EUROGROUP ESPANA' }, // ← már van Customer szerepe
  // { pid: 62,   name: 'GAVA TXEQUIA' },     // ← GAVA cégcsoport
  // { pid: 323,  name: 'HYBRID FRUIT' },     // ← ellenőrizd
  // { pid: 282,  name: 'ECOINVER EXPORT' },  // ← ellenőrizd (vs ECOINVER BIO pid:84)
  // { pid: 283,  name: 'PADRON TAPAS' },     // ← "NE EZT HASZNÁLD!" jelzett
];

async function upsertIdentifier(partnerId, refName) {
  const existing = await db('partner_identifiers')
    .where({ partner_id: partnerId, id_type: '(Reference) Szállítók' })
    .first();

  if (existing) {
    if (isDryRun) {
      console.log(`  [DRY-RUN] UPDATE partner ${partnerId}: "${existing.value}" → "${refName}"`);
    } else {
      await db('partner_identifiers')
        .where('id', existing.id)
        .update({ value: refName, updated_at: new Date() });
      console.log(`  ✅ UPDATE partner ${partnerId}: "${existing.value}" → "${refName}"`);
    }
  } else {
    if (isDryRun) {
      console.log(`  [DRY-RUN] INSERT partner ${partnerId}: "${refName}"`);
    } else {
      await db('partner_identifiers').insert({
        partner_id: partnerId,
        id_type: '(Reference) Szállítók',
        value: refName,
        is_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      });
      console.log(`  ✅ INSERT partner ${partnerId}: "${refName}"`);
    }
  }
}

async function main() {
  console.log('=======================================================');
  console.log(`  JAVÍTÁS: Hiányzó Reference azonosítók${isDryRun ? ' [DRY-RUN]' : ''}`);
  console.log('=======================================================\n');

  // Ellenőrizzük hogy minden partner_id létezik
  const allPartners = await db('partners').select('id', 'name');
  const partnerMap = {};
  allPartners.forEach(p => { partnerMap[p.id] = p.name; });

  let ok = 0, skip = 0;

  for (const fix of PENDING_FIXES) {
    const partnerName = partnerMap[fix.pid];
    if (!partnerName) {
      console.log(`  ⚠️  SKIP: partner_id ${fix.pid} nem létezik az adatbázisban!`);
      skip++;
      continue;
    }
    console.log(`\nPartner #${fix.pid} "${partnerName}" → Reference: "${fix.name}"`);
    await upsertIdentifier(fix.pid, fix.name);
    ok++;
  }

  console.log('\n=======================================================');
  console.log(`  Eredmény: ${ok} partner feldolgozva, ${skip} kihagyva`);
  if (isDryRun) {
    console.log('  [DRY-RUN] - Semmi nem lett írva az adatbázisba!');
    console.log('  Futtatás tényleges írással: node fix_missing_references.js');
  }
  console.log('=======================================================');

  await db.destroy();
}

main().catch(err => {
  console.error('HIBA:', err.message);
  db.destroy();
  process.exit(1);
});
