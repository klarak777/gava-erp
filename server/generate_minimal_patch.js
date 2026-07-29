/**
 * generate_minimal_patch.js
 * 
 * Csak a hiányzó partner_id értékeket szinkronizálja.
 * NEM nyúl a partner_identifiers táblához!
 * Csak WHERE partner_id IS NULL sorokra hat.
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
  // Lokálisan lekérdezzük: melyik order+season+product kombinációhoz melyik partner_id tartozik
  const localData = await db('shipment_lines')
    .select(
      'shipment_lines.partner_id',
      'shipment_lines.product_id',
      'shipments.order_number',
      'seasons.code as season_code'
    )
    .leftJoin('shipments', 'shipment_lines.shipment_id', 'shipments.id')
    .leftJoin('seasons', 'shipments.season_id', 'seasons.id')
    .whereNotNull('shipment_lines.partner_id')
    .whereNotNull('shipments.order_number')
    .whereNotNull('shipment_lines.product_id');

  // Deduplikáljuk: (order, season, product) → partner_id
  const map = new Map();
  for (const row of localData) {
    const key = `${row.order_number.trim()}|${row.season_code || ''}|${row.product_id}`;
    map.set(key, row.partner_id);
  }

  console.log(`Lokális: ${localData.length} sor, ${map.size} egyedi kombináció`);

  const lines = [];
  lines.push('-- Minimális partner_id szinkronizáció');
  lines.push('-- CSAK WHERE partner_id IS NULL sorokra hat!');
  lines.push(`-- Generálva: ${new Date().toISOString()}`);
  lines.push('');

  let count = 0;
  for (const [key, partnerId] of map) {
    const [orderNo, seasonCode, productId] = key.split('|');
    lines.push(
      `UPDATE shipment_lines SET partner_id = ${partnerId}, updated_at = NOW() ` +
      `FROM shipments s INNER JOIN seasons se ON s.season_id = se.id ` +
      `WHERE shipment_lines.shipment_id = s.id ` +
      `AND shipment_lines.product_id = ${productId} ` +
      `AND s.order_number = ${esc(orderNo)} ` +
      `AND se.code = ${esc(seasonCode)} ` +
      `AND shipment_lines.partner_id IS NULL;`
    );
    count++;
  }

  lines.push('');
  lines.push(`-- Összesen: ${count} UPDATE (csak NULL sorokra)`);

  const content = lines.join('\n');
  fs.writeFileSync('do_sync_partner_ids.sql', Buffer.from(content, 'utf8'));

  const sizeMB = (Buffer.byteLength(content, 'utf8') / 1024 / 1024).toFixed(2);
  console.log(`\n✅ do_sync_partner_ids.sql (${sizeMB} MB, ${count} UPDATE)`);
  console.log('   Csak WHERE partner_id IS NULL sorokra hat!');
  console.log('\nDO szerveren:');
  console.log('  docker cp server/do_sync_partner_ids.sql gava_erp_prod_db:/do_sync_partner_ids.sql');
  console.log('  docker exec -it gava_erp_prod_db psql -U gava_admin -d gava_erp -f /do_sync_partner_ids.sql');

  await db.destroy();
}

main().catch(e => { console.error(e.message); process.exit(1); });
