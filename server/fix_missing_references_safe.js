/**
 * fix_missing_references_safe.js
 *
 * BIZTONSÁGOS javítóscript a hiányzó partner_identifiers bejegyzésekhez.
 *
 * SZABÁLYOK:
 * 1. Csak INSERT - meglévő rekordokat NEM írunk felül (upsert = skip if exists)
 * 2. A Reference partnerek.csv, Customer partnerek.csv és Transport Company
 *    partnerek.csv alapján kerültek meghatározásra a szerepek.
 * 3. Partnerek akik egyszerre több szerepben is vannak, MINDKÉT identifier-t megkapják.
 * 4. Csak azok a partnerek kapnak Reference azonosítót, akik a Reference partnerek.csv-ben
 *    szerepelnek, VAGY biztosan szállítóként (Reference) jelennek meg a fuvarsorokban.
 *
 * Futtatás: node fix_missing_references_safe.js
 * Dry-run:  node fix_missing_references_safe.js --dry-run
 *
 * @param { import("knex").Knex } knex
 */

require('dotenv').config();
const knex = require('knex');
const knexConfig = require('./knexfile');

const db = knex(knexConfig['development']);
const isDryRun = process.argv.includes('--dry-run');

// =============================================================================
// FORRÁSADATOK a CSV-k alapján:
//
// Reference partnerek.csv:  az eredeti rendszer Reference (szállító) nevei
// Customer partnerek.csv:   az eredeti rendszer Customer (vevő) nevei
// Transport Company partnerek.csv: az eredeti rendszer Fuvarozó nevei
// merged_partners_review_v2.csv: partner → DB ID leképezés és szerep
// Transportistas 260605.csv: fuvar adatok az eredeti rendszerből
// =============================================================================

// =============================================================================
// CSAK REFERENCIA azonosítók - akiknél hiányzik és a CSV-k alapján szállítók
// Ezek a partnerek szerepelnek fuvarsorokban (partner_id beállítva),
// de nincs (Reference) Szállítók bejegyzésük a partner_identifiers-ben.
// =============================================================================
const REFERENCE_FIXES = [
  // --- merged_partners_review_v2: "fuvarozó" típusú, de a Transportistas-ban
  //     szállítóként (Reference) is megjelenik ---
  // AGESCO: fuvarozó + szállító is volt (86 sor Transportistas-ban)
  { pid: 243, name: 'AGESCO' },

  // MK FRESH: fuvarozó + szállítóként is megjelenik
  { pid: 257, name: 'MK FRESH' },

  // GRUPO NATURAL: fuvarozó + szállítóként (16 sor)
  { pid: 244, name: 'GRUPO NATURAL' },

  // Ezek csak szállítók (Reference), nem fuvarozók:
  { pid: 272,  name: 'HISPA GROUP' },       // merged: nincs típus, nincs a Transportistas fuvarozói közt
  { pid: 275,  name: 'INDASOL' },           // merged: nincs típus
  { pid: 256,  name: 'COCO FRUITS' },       // merged: nincs típus
  { pid: 254,  name: 'FAUS DURA' },         // merged: nincs típus, francia cég
  { pid: 281,  name: 'VICASOL' },           // merged: nincs típus, spanyol szövetkezet
  { pid: 273,  name: 'AZAFAMA' },           // merged: nincs típus, portugál cég
  { pid: 292,  name: 'CHERY TIM' },         // merged: nincs típus, román cég
  { pid: 250,  name: 'ESCOBI' },            // merged: nincs típus, spanyol cég
  { pid: 329,  name: 'RELAX FRUITS' },      // merged: nincs típus
  { pid: 333,  name: 'KARKAVITSAS' },       // merged: nincs típus, görög cég
  { pid: 300,  name: 'VITAFRUIT' },         // merged: nincs típus
  { pid: 261,  name: 'LIVIU' },             // merged: nincs típus (Transportistas-ban fuvarozó is volt!)
  { pid: 302,  name: 'VELASGRO' },          // merged: nincs típus, spanyol
  { pid: 287,  name: 'LA PIRUJITA' },       // merged: nincs típus, spanyol
  { pid: 315,  name: 'AGRICOLA NEJITE' },   // merged: nincs típus, spanyol
  { pid: 290,  name: 'BALCANIC FOOD' },     // merged: nincs típus, görög
  { pid: 291,  name: 'TOLEDANO HORTICOLA' },// merged: nincs típus, spanyol

  // VERMIO (310) és VERMION FRESH (317): külön greek cégek
  // A Reference partnerek.csv-ben "VERMION" szerepel → de ez a pid:85 (VERMION)
  // A "VERMIO" (310) és "VERMION FRESH" (317) KÜLÖNBÖZŐ cégek, fuvarozók is.
  // merged: Vermion Fresh = "fuvarozó" → Fuvarozók identifier-t kap (lentebb)
  // VERMIO (Vermio Fruta S.A., pid:310) – szállítóként is → adjuk meg
  { pid: 310,  name: 'VERMIO' },

  // ECOINVER EXPORT (282) – különböző az ECOINVER BIO-tól (pid:84)
  { pid: 282,  name: 'ECOINVER EXPORT' },
];

// =============================================================================
// FUVAROZÓ azonosítók - akiknél hiányzik
// merged_partners_review_v2: "fuvarozó" típusú
// Transport Company partnerek.csv-ben szerepelnek
// =============================================================================
const TRANSPORTER_FIXES = [
  // Vermion Fresh (pid:317): merged = "fuvarozó", Transportistas-ban is szerepel
  { pid: 317,  name: 'VERMION FRESH' },

  // GAVA TXEQUIA (pid:62): merged = "fuvarozó", kód: GTX
  { pid: 62,   name: 'GAVA TXEQUIA' },

  // HYBRID FRUIT (pid:323): merged = "fuvarozó"
  { pid: 323,  name: 'HYBRID FRUIT' },

  // LIVIU (pid:261): Transportistas-ban fuvarozóként is szerepel
  // (már kap Reference-t fentebb, itt Fuvarozó is)
  { pid: 261,  name: 'LIVIU' },

  // AGESCO (pid:243): Transportistas-ban fuvarozóként is szerepel
  { pid: 243,  name: 'AGESCO' },

  // MK FRESH (pid:257): Transportistas-ban fuvarozóként is
  { pid: 257,  name: 'MK FRESH' },

  // GRUPO NATURAL (pid:244): Transportistas-ban fuvarozóként is
  { pid: 244,  name: 'GRUPO NATURAL' },

  // VITAFRUIT (pid:300): Transportistas-ban fuvarozóként is
  { pid: 300,  name: 'VITAFRUIT' },

  // VERMIO (pid:310): Transportistas-ban fuvarozóként is
  { pid: 310,  name: 'VERMIO' },

  // CHERY TIM (pid:292): Transportistas-ban fuvarozóként is
  { pid: 292,  name: 'CHERY TIM' },

  // ENGELAN (pid:334): Transportistas-ban fuvarozóként is szerepel
  // (pid:335 = Masa Műhely Kft. - az nem ENGELAN!)
  { pid: 334,  name: 'ENGELAN' },
];

// =============================================================================
// EZEKET NEM JAVÍTJUK - magyarázat:
// - GHU (pid:8): Customer (vevő), nem szállító - de partner_id-ként szerepel mert
//   GHU fuvarokon a sorok egy része a saját céghez van rendelve.
//   → Customer identifier már megvan, Reference NEM kell.
// - EUROGROUP ESPANA (pid:31): már van '(Reference) Szállítók' identifier → skip
//   (pid:23 = EUROGROUP ESPANA S.A.U., pid:31 = másik Eurogroup)
//   → ellenőrizzük lentebb
// - PADRON TAPAS (pid:283): "NE EZT HASZNÁLD!" jelzett partner
// - MASA MŰHELY (pid:335): egyetlen sor, valószínűleg hibás hozzárendelés
// - QUEENS LOGISTICS (pid:307): szállítási cég, de nincs Reference szerepe
// - BONDÁR ATTILA (pid:313): valószínűleg hibás import
// =============================================================================

async function insertIfMissing(partnerId, idType, value, partnerMap) {
  const partnerName = partnerMap[partnerId];
  if (!partnerName) {
    console.log(`  ⚠️  SKIP: partner_id ${partnerId} nem létezik az adatbázisban!`);
    return false;
  }

  const existing = await db('partner_identifiers')
    .where({ partner_id: partnerId, id_type: idType })
    .first();

  if (existing) {
    console.log(`  ⏭️  MÁR MEGVAN: #${partnerId} "${partnerName}" → ${idType}: "${existing.value}" (NEM írjuk felül)`);
    return false;
  }

  if (isDryRun) {
    console.log(`  [DRY-RUN] INSERT #${partnerId} "${partnerName}" → ${idType}: "${value}"`);
  } else {
    await db('partner_identifiers').insert({
      partner_id: partnerId,
      id_type: idType,
      value: value,
      is_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    });
    console.log(`  ✅ INSERT #${partnerId} "${partnerName}" → ${idType}: "${value}"`);
  }
  return true;
}

async function main() {
  console.log('=======================================================');
  console.log(`  BIZTONSÁGOS JAVÍTÁS: Hiányzó Partner azonosítók`);
  console.log(`  Mód: ${isDryRun ? 'DRY-RUN (nem ír az adatbázisba)' : 'ÉLES'}`);
  console.log('=======================================================\n');

  const allPartners = await db('partners').select('id', 'name');
  const partnerMap = {};
  allPartners.forEach(p => { partnerMap[p.id] = p.name; });

  let inserted = 0, skipped = 0, missing = 0;

  // 1. Reference azonosítók
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  REFERENCIA (szállító) azonosítók:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  for (const fix of REFERENCE_FIXES) {
    if (!partnerMap[fix.pid]) { missing++; continue; }
    const result = await insertIfMissing(fix.pid, '(Reference) Szállítók', fix.name, partnerMap);
    if (result) inserted++;
    else skipped++;
  }

  // 2. Fuvarozó azonosítók
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  FUVAROZÓ azonosítók:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  for (const fix of TRANSPORTER_FIXES) {
    if (!partnerMap[fix.pid]) { missing++; continue; }
    const result = await insertIfMissing(fix.pid, 'Fuvarozók', fix.name, partnerMap);
    if (result) inserted++;
    else skipped++;
  }

  // 3. Összefoglaló
  console.log('\n=======================================================');
  console.log(`  EREDMÉNY:`);
  console.log(`  ✅ Beszúrt:      ${inserted}`);
  console.log(`  ⏭️  Már megvolt:  ${skipped} (nem írtuk felül)`);
  console.log(`  ⚠️  Nem találva:  ${missing} partner_id`);
  if (isDryRun) {
    console.log('\n  [DRY-RUN] - Semmi nem lett írva az adatbázisba!');
    console.log('  Éles futtatás: node fix_missing_references_safe.js');
  }
  console.log('=======================================================');

  await db.destroy();
}

main().catch(err => {
  console.error('HIBA:', err.message);
  db.destroy();
  process.exit(1);
});
