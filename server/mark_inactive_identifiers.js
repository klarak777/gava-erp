require('dotenv').config();
const db = require('knex')(require('./knexfile')['development']);

// Ezek az azonosítók szerepelnek a CSV-ben de NEM az Admin aktív listájában
// → inaktív azonosítók (régi alias/elírás/egyéb szerepkör)
const inactiveByValue = [
  // Reference - régi, elírás vagy alias értékek
  'AGRPONIENTE',         // elírás → AGROPONIENTE
  'AXAFRUIT',            // elírás → AXARFRUIT (vagy más)
  'CASI ARIPORT',        // elírás → CASI
  'DELGAFRUIT',          // régi rövidítés (az aktív DELGAFRUITS)
  'EUROGROUP',           // nem specifikus (az aktív EUROGROUP ESPANA / EUROGROUP DE)
  'EUROGROUP DE',        // rövidítés
  'EUROGROUP ES',        // rövidítés  
  'EURORGOUP DEUTSCHLAND', // elírás
  'LEHMANN',             // rövidítés → LEHMANN & TROOST
  'OLYMPIC',             // rövidítés → OLYMPIC FRUIT
  'OLYMPIC FRUITS',      // variáns → OLYMPIC FRUIT

  // Customer - régi/alias értékek
  'ANTON DÜRBECK',       // Customer alias (az aktív teljes)
  'GEMÜSERING',          // ha nem az aktív listán van
  'GYÜMÖLCSÉRT',         // ha nem az aktív listán van
  'KÓNYA',               // ha nem az aktív listán van
  'MANDRESLOOT',         // elírás → MANDERSLOOT
  'ROMÁNIA',             // ha nem az aktív listán van

  // Fuvarozók - régi/alias értékek  
  'HILTOP',              // elírás → HILLTOP
  'FRIGOSPED SK',        // ha nem az aktív listán van
  'HZ LOG',              // rövidítés
  'PAP',                 // ha nem az aktív listán van
  'S TRANSPORT',         // ha nem az aktív listán van
  'SWISS TEMP',          // ha nem az aktív listán van
  'THERMO',              // ha nem az aktív listán van
];

// Ezeket csak AKKOR inaktíváljuk, ha GHU NEM Reference szerepkörben van
// (a GHU partner egyszerre Reference ÉS Customer)
const conditionalInactive = [
  // GHU - csak a Reference szerepkörű inaktív (ha a Customer a helyes)
  // Ezt manuálisan kezeld a UI-ban
];

async function main() {
  console.log('=== Inaktív szerepkör azonosítók jelölése ===\n');
  
  // Lekérdezzük melyiket fogjuk érinteni
  const toMark = await db('partner_identifiers as pi')
    .join('partners as p', 'p.id', 'pi.partner_id')
    .whereIn('pi.value', inactiveByValue)
    .whereIn('pi.id_type', ['(Reference) Szállítók', '(Customer) Vevők', 'Fuvarozók'])
    .select('pi.id', 'p.name as partner_name', 'pi.id_type', 'pi.value', 'pi.is_inactive');

  console.log(`Érintett azonosítók (${toMark.length} db):`);
  toMark.forEach(r => {
    console.log(`  [${r.is_inactive ? '🔴 már inaktív' : '🟡 aktív→inaktív'}] ${r.partner_name} | ${r.id_type} | "${r.value}"`);
  });

  if (toMark.length === 0) {
    console.log('Nincs mit jelölni.');
    await db.destroy();
    return;
  }

  const ids = toMark.filter(r => !r.is_inactive).map(r => r.id);
  if (ids.length === 0) {
    console.log('\nMinden már inaktív volt, nincs változtatás.');
  } else {
    await db('partner_identifiers')
      .whereIn('id', ids)
      .update({ is_inactive: true, updated_at: new Date() });
    console.log(`\n✅ ${ids.length} azonosító inaktívra jelölve.`);
  }

  // Ellenőrzés: listázzuk az inaktív azonosítókat típusonként
  const inactives = await db('partner_identifiers as pi')
    .join('partners as p', 'p.id', 'pi.partner_id')
    .whereIn('pi.id_type', ['(Reference) Szállítók', '(Customer) Vevők', 'Fuvarozók'])
    .where('pi.is_inactive', true)
    .select('p.name as partner_name', 'pi.id_type', 'pi.value')
    .orderBy('pi.id_type');

  console.log(`\n=== Inaktív szerepkör azonosítók listája (${inactives.length} db) ===`);
  let lastType = '';
  inactives.forEach(r => {
    if (r.id_type !== lastType) {
      lastType = r.id_type;
      console.log(`\n  ${r.id_type}:`);
    }
    console.log(`    • "${r.value}" (${r.partner_name})`);
  });

  await db.destroy();
}

main().catch(e => { console.error(e.message); process.exit(1); });
