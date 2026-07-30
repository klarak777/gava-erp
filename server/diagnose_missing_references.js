/**
 * diagnose_missing_references.js
 *
 * Diagnosztikai script: megkeresi azokat a fuvarsorokat ahol
 * a Reference (Szállító) azonosító hiányzik a partner_identifiers táblából.
 *
 * Futtatás: node diagnose_missing_references.js
 */

require('dotenv').config();
const knex = require('knex');
const knexConfig = require('./knexfile');

const db = knex(knexConfig['development']);

async function main() {
  console.log('=======================================================');
  console.log('  DIAGNÓZIS: Hiányzó Reference azonosítók');
  console.log('=======================================================\n');

  // 1. Ellenőrizzük a Delgafruits partner(ek)et
  console.log('--- 1. DELGAFRUITS partner rekordok ---');
  const delgaPartners = await db('partners')
    .where('name', 'ilike', '%delga%')
    .select('id', 'name', 'type', 'is_active');
  console.table(delgaPartners);

  // 2. Partner_identifiers a Delgafruits ID-khoz
  if (delgaPartners.length > 0) {
    const delgaIds = delgaPartners.map(p => p.id);
    console.log('--- 2. DELGAFRUITS partner_identifiers rekordok ---');
    const delgaIdents = await db('partner_identifiers')
      .whereIn('partner_id', delgaIds)
      .select('id', 'partner_id', 'id_type', 'value');
    console.table(delgaIdents.length > 0 ? delgaIdents : [{ info: 'Nincs egyetlen identifier sem!' }]);
  }

  // 3. GHU 186 fuvar sorai - konkrét példa ellenőrzés
  console.log('\n--- 3. GHU 186 fuvarsorok (Season 25-26) ---');
  const ghu186 = await db('shipment_lines')
    .select(
      'shipment_lines.id as line_id',
      'shipment_lines.partner_id',
      'partners.name as partner_name',
      db.raw("partner_identifiers.value as ref_identifier"),
      db.raw("COALESCE(partner_identifiers.value, partners.name) as ref_display"),
      'shipments.order_number',
      'seasons.code as season',
      'shipment_lines.customer',
      'shipment_lines.destination'
    )
    .leftJoin('shipments', 'shipment_lines.shipment_id', 'shipments.id')
    .leftJoin('seasons', 'shipments.season_id', 'seasons.id')
    .leftJoin('partners', 'shipment_lines.partner_id', 'partners.id')
    .leftJoin('partner_identifiers', function() {
      this.on('partner_identifiers.partner_id', '=', 'partners.id')
          .andOn('partner_identifiers.id_type', '=', db.raw("?", ['(Reference) Szállítók']));
    })
    .where('shipments.order_number', 'GHU 186')
    .where('seasons.code', '25-26');
  console.table(ghu186.length > 0 ? ghu186 : [{ info: 'GHU 186 nem található a 25-26 szezonban' }]);

  // 4. ÖSSZES fuvar: partner van de Reference identifier HIÁNYZIK
  console.log('\n--- 4. Fuvarsorok ahol partner_id megvan, de Reference identifier HIÁNYZIK ---');
  const missingRefs = await db('shipment_lines')
    .select(
      'partners.id as partner_id',
      'partners.name as partner_name',
      db.raw('COUNT(shipment_lines.id) as erintett_sorok'),
      db.raw("STRING_AGG(DISTINCT shipments.order_number, ', ' ORDER BY shipments.order_number) as fuvarok"),
      db.raw("STRING_AGG(DISTINCT seasons.code, ', ') as szezonok")
    )
    .leftJoin('shipments', 'shipment_lines.shipment_id', 'shipments.id')
    .leftJoin('seasons', 'shipments.season_id', 'seasons.id')
    .leftJoin('partners', 'shipment_lines.partner_id', 'partners.id')
    .leftJoin('partner_identifiers', function() {
      this.on('partner_identifiers.partner_id', '=', 'partners.id')
          .andOn('partner_identifiers.id_type', '=', db.raw("?", ['(Reference) Szállítók']));
    })
    .whereNotNull('shipment_lines.partner_id')          // van partner_id
    .whereNull('partner_identifiers.id')                 // de nincs Reference identifier
    .groupBy('partners.id', 'partners.name')
    .orderBy(db.raw('COUNT(shipment_lines.id)'), 'desc');
  
  if (missingRefs.length === 0) {
    console.log('✅ Minden partner_id-vel rendelkező fuvarsorhoz van Reference identifier!');
  } else {
    console.log(`⚠️  ${missingRefs.length} partner érintett:`);
    // Rövidítjük a fuvarok listát ha túl hosszú
    const display = missingRefs.map(r => ({
      ...r,
      fuvarok: r.fuvarok && r.fuvarok.length > 80 ? r.fuvarok.substring(0, 80) + '...' : r.fuvarok
    }));
    console.table(display);
  }

  // 5. Fuvarsorok ahol partner_id NULL (nincsen beállítva partner)
  console.log('\n--- 5. Fuvarsorok ahol partner_id NULL (nincs reference partner beállítva) ---');
  const nullPartnerLines = await db('shipment_lines')
    .select(
      db.raw('COUNT(*) as sorok_szama'),
      db.raw("STRING_AGG(DISTINCT seasons.code, ', ') as szezonok"),
      db.raw('COUNT(DISTINCT shipments.id) as fuvarok_szama')
    )
    .leftJoin('shipments', 'shipment_lines.shipment_id', 'shipments.id')
    .leftJoin('seasons', 'shipments.season_id', 'seasons.id')
    .whereNull('shipment_lines.partner_id')
    .first();
  console.table([nullPartnerLines]);

  // 6. A partnerek amiknek VAN Reference identifier - összefoglalás
  console.log('\n--- 6. Meglévő Reference identifier-ek (partner_identifiers) ---');
  const existingRefs = await db('partner_identifiers')
    .select(
      'partner_identifiers.partner_id',
      'partners.name as partner_name',
      'partner_identifiers.value as ref_name'
    )
    .leftJoin('partners', 'partner_identifiers.partner_id', 'partners.id')
    .where('partner_identifiers.id_type', '(Reference) Szállítók')
    .orderBy('partner_identifiers.value');
  console.log(`Összesen ${existingRefs.length} Reference identifier:`);
  console.table(existingRefs);

  await db.destroy();
  console.log('\n✅ Diagnózis kész!');
}

main().catch(err => {
  console.error('HIBA:', err.message);
  process.exit(1);
});
