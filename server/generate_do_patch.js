/**
 * generate_do_patch.js
 *
 * Generates a SQL patch from the local (correct) database
 * for running on the DO server Docker container.
 *
 * Key design: NO transaction wrapping (BEGIN/COMMIT) so individual
 * statement failures don't cascade and block everything else.
 *
 * Usage: node generate_do_patch.js
 * Output: do_patch.sql
 */

require('dotenv').config();
const knex = require('knex');
const knexConfig = require('./knexfile');
const fs = require('fs');

const db = knex(knexConfig['development']);

function escapeSQL(s) {
  if (s == null) return 'NULL';
  return "'" + String(s).replace(/'/g, "''") + "'";
}

async function main() {
  const lines = [];
  lines.push('-- =====================================================================');
  lines.push('-- DO Server SQL Patch (no transaction - error-tolerant)');
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push('-- =====================================================================');
  lines.push('');

  // === 1. partner_identifiers ===
  lines.push('-- -------------------------------------------------------');
  lines.push('-- 1. Partner identifiers (Reference) sync');
  lines.push('--    DELETE existing, then re-INSERT from local DB');
  lines.push('-- -------------------------------------------------------');

  const identifiers = await db('partner_identifiers')
    .select('partner_id', 'id_type', 'value')
    .whereRaw("id_type LIKE '%Reference%'")
    .orderBy('partner_id');

  console.log(`  ${identifiers.length} partner_identifier records exported.`);

  // Use LIKE for robust matching regardless of encoding
  lines.push("DELETE FROM partner_identifiers WHERE id_type LIKE '%(Reference)%';");
  lines.push('');

  for (const ident of identifiers) {
    const val = escapeSQL(ident.value);
    const idType = escapeSQL(ident.id_type);
    lines.push(`INSERT INTO partner_identifiers (partner_id, id_type, value, created_at, updated_at) VALUES (${ident.partner_id}, ${idType}, ${val}, NOW(), NOW());`);
  }

  lines.push('');

  // === 2. shipment_lines partner_id UPDATE ===
  lines.push('-- -------------------------------------------------------');
  lines.push('-- 2. Shipment lines partner_id update');
  lines.push('--    Sets partner_id based on order_number + season + product_id');
  lines.push('-- -------------------------------------------------------');

  const shipLines = await db('shipment_lines')
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
    .whereNotNull('shipment_lines.product_id')
    .orderBy('shipment_lines.partner_id');

  console.log(`  ${shipLines.length} shipment_line records to process.`);

  // Deduplicate: group by (order_number, season_code, product_id) → partner_id
  // This massively reduces the number of UPDATE statements
  const updateMap = new Map();
  for (const sl of shipLines) {
    if (!sl.order_number || !sl.partner_id || !sl.product_id) continue;
    const key = `${sl.order_number}|${sl.season_code || ''}|${sl.product_id}`;
    updateMap.set(key, sl.partner_id);
  }

  console.log(`  ${updateMap.size} unique (order+season+product) combinations.`);

  let updateCount = 0;
  for (const [key, partnerId] of updateMap) {
    const [orderNo, seasonCode, productId] = key.split('|');
    const safeOrder = orderNo.replace(/'/g, "''");
    const safeSeason = seasonCode.replace(/'/g, "''");
    lines.push(`UPDATE shipment_lines SET partner_id = ${partnerId}, updated_at = NOW() FROM shipments s INNER JOIN seasons se ON s.season_id = se.id WHERE shipment_lines.shipment_id = s.id AND shipment_lines.product_id = ${productId} AND s.order_number = '${safeOrder}' AND se.code = '${safeSeason}' AND (shipment_lines.partner_id IS NULL OR shipment_lines.partner_id != ${partnerId});`);
    updateCount++;
  }

  lines.push('');
  lines.push(`-- Done. ${identifiers.length} identifiers + ${updateCount} line updates.`);

  const content = lines.join('\n');
  fs.writeFileSync('do_patch.sql', Buffer.from(content, 'utf8'));

  const sizeMB = (Buffer.byteLength(content, 'utf8') / 1024 / 1024).toFixed(2);
  console.log(`\n✅ do_patch.sql generated! (${sizeMB} MB)`);
  console.log(`   - ${identifiers.length} partner_identifier DELETE+INSERT`);
  console.log(`   - ${updateCount} shipment_line UPDATE`);
  console.log('\nDO server commands:');
  console.log('  git pull origin master');
  console.log('  docker cp server/do_patch.sql gava_erp_prod_db:/do_patch.sql');
  console.log('  docker exec -it gava_erp_prod_db psql -U gava_admin -d gava_erp -f /do_patch.sql');

  await db.destroy();
}

main().catch(err => {
  console.error('ERROR:', err.message);
  db.destroy();
  process.exit(1);
});
