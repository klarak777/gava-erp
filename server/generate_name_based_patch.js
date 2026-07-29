/**
 * generate_name_based_patch.js
 * 
 * Partner_id szinkronizáció NÉV alapján (nem ID alapján).
 * A DO szerver partners táblájában más lehetnek az ID-k,
 * ezért partner NÉV alapján párosítunk.
 * 
 * Kimenet: do_name_patch.sql
 * Ezt a DO szerveren KÖZVETLENÜL a psql-ben futtatjuk.
 */
require('dotenv').config();
const knex = require('knex');
const knexConfig = require('./knexfile');
const fs = require('fs');

const db = knex(knexConfig['development']);

function esc(s) {
  if (s == null) return 'NULL';
  return "'" + String(s).replace(/'/g, "''") + "'";
}

async function main() {
  // Lokálisan: lekérdezzük az order+season+product kombókat ÉS a partner NEVÉT
  const localData = await db('shipment_lines')
    .select(
      'partners.name as partner_name',
      'shipment_lines.product_id',
      'shipments.order_number',
      'seasons.code as season_code'
    )
    .leftJoin('shipments', 'shipment_lines.shipment_id', 'shipments.id')
    .leftJoin('seasons', 'shipments.season_id', 'seasons.id')
    .leftJoin('partners', 'shipment_lines.partner_id', 'partners.id')
    .whereNotNull('shipment_lines.partner_id')
    .whereNotNull('shipments.order_number')
    .whereNotNull('shipment_lines.product_id')
    .whereNotNull('partners.name');

  // Deduplikáljuk: (order, season, product) → partner_name
  const map = new Map();
  for (const row of localData) {
    const key = `${row.order_number.trim()}|${row.season_code || ''}|${row.product_id}`;
    map.set(key, row.partner_name);
  }

  console.log(`Lokális: ${localData.length} sor, ${map.size} egyedi kombináció`);

  const lines = [];
  lines.push('-- Partner_id szinkronizáció NÉV alapján');
  lines.push('-- A DO szerveren a partners tábla ID-i eltérhetnek!');
  lines.push('-- Ezért partner NÉV alapján keressük meg az ID-t.');
  lines.push('-- CSAK WHERE partner_id IS NULL sorokra hat!');
  lines.push(`-- Generálva: ${new Date().toISOString()}`);
  lines.push('');

  let count = 0;
  for (const [key, partnerName] of map) {
    const [orderNo, seasonCode, productId] = key.split('|');
    // A DO szerveren a partner ID-t NÉV alapján keressük meg subquery-vel
    lines.push(
      `UPDATE shipment_lines SET partner_id = (SELECT id FROM partners WHERE UPPER(name) = UPPER(${esc(partnerName)}) LIMIT 1), updated_at = NOW() ` +
      `FROM shipments s INNER JOIN seasons se ON s.season_id = se.id ` +
      `WHERE shipment_lines.shipment_id = s.id ` +
      `AND shipment_lines.product_id = ${productId} ` +
      `AND s.order_number = ${esc(orderNo)} ` +
      `AND se.code = ${esc(seasonCode)} ` +
      `AND shipment_lines.partner_id IS NULL ` +
      `AND EXISTS (SELECT 1 FROM partners WHERE UPPER(name) = UPPER(${esc(partnerName)}));`
    );
    count++;
  }

  lines.push('');
  lines.push(`-- Összesen: ${count} UPDATE (csak NULL sorokra, név alapján)`);

  const content = lines.join('\n');
  fs.writeFileSync('do_name_patch.sql', Buffer.from(content, 'utf8'));

  const sizeMB = (Buffer.byteLength(content, 'utf8') / 1024 / 1024).toFixed(2);
  console.log(`\n✅ do_name_patch.sql (${sizeMB} MB, ${count} UPDATE)`);
  console.log('\nDO szerveren:');
  console.log('  docker cp server/do_name_patch.sql gava_erp_prod_db:/do_name_patch.sql');
  console.log('  docker exec -it gava_erp_prod_db psql -U gava_admin -d gava_erp -f /do_name_patch.sql');

  await db.destroy();
}

main().catch(e => { console.error(e.message); process.exit(1); });
