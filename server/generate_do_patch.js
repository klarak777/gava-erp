/**
 * generate_do_patch.js
 *
 * Generates a UTF-8 safe SQL patch file from the local database
 * for running on the DO server Docker container.
 *
 * Usage: node generate_do_patch.js
 * Output: do_patch.sql
 */

require('dotenv').config();
const knex = require('knex');
const knexConfig = require('./knexfile');
const fs = require('fs');

const db = knex(knexConfig['development']);

// Converts a string to PostgreSQL E-string notation (safe for any encoding)
// e.g. "Szállítók" → E'Sz\u00e1ll\u00edt\u00f3k'
function pgEscapeString(s) {
  let result = '';
  let hasEscape = false;
  for (const ch of s) {
    const code = ch.codePointAt(0);
    if (code > 127) {
      result += `\\u${code.toString(16).padStart(4, '0')}`;
      hasEscape = true;
    } else if (ch === "'") {
      result += "''";
    } else if (ch === '\\') {
      result += '\\\\';
      hasEscape = true;
    } else {
      result += ch;
    }
  }
  return hasEscape ? `E'${result}'` : `'${result}'`;
}

async function main() {
  const lines = [];
  lines.push('-- =====================================================================');
  lines.push('-- DO Server SQL Patch');
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push('-- =====================================================================');
  lines.push('');
  lines.push('BEGIN;');
  lines.push('');

  // === 1. partner_identifiers UPSERT ===
  lines.push('-- -------------------------------------------------------');
  lines.push('-- 1. Partner identifiers (Reference) sync');
  lines.push('-- -------------------------------------------------------');

  const identifiers = await db('partner_identifiers')
    .select('partner_id', 'id_type', 'value')
    .whereRaw("id_type LIKE '%Reference%'")
    .orderBy('partner_id');

  console.log(`  ${identifiers.length} partner_identifier records exported.`);

  for (const ident of identifiers) {
    const val = pgEscapeString(ident.value);
    const idType = pgEscapeString(ident.id_type);
    lines.push(`INSERT INTO partner_identifiers (partner_id, id_type, value, created_at, updated_at)`);
    lines.push(`  VALUES (${ident.partner_id}, ${idType}, ${val}, NOW(), NOW())`);
    lines.push(`  ON CONFLICT (partner_id, id_type) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();`);
  }

  lines.push('');

  // === 2. shipment_lines partner_id UPDATE ===
  lines.push('-- -------------------------------------------------------');
  lines.push('-- 2. Shipment lines partner_id update');
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

  console.log(`  ${shipLines.length} shipment_line records to update.`);

  let updateCount = 0;
  for (const sl of shipLines) {
    const orderNo = sl.order_number.replace(/'/g, "''");
    const seasonCode = sl.season_code || '';
    lines.push(`UPDATE shipment_lines sl2`);
    lines.push(`  SET partner_id = ${sl.partner_id}, updated_at = NOW()`);
    lines.push(`  FROM shipments s`);
    lines.push(`  INNER JOIN seasons se ON s.season_id = se.id`);
    lines.push(`  WHERE sl2.shipment_id = s.id`);
    lines.push(`    AND sl2.product_id = ${sl.product_id}`);
    lines.push(`    AND UPPER(TRIM(s.order_number)) = UPPER('${orderNo}')`);
    lines.push(`    AND se.code = '${seasonCode}'`);
    lines.push(`    AND (sl2.partner_id IS NULL OR sl2.partner_id != ${sl.partner_id});`);
    updateCount++;
  }

  lines.push('');
  lines.push('COMMIT;');
  lines.push('');
  lines.push('-- =====================================================================');
  lines.push(`-- Done. Records: ${identifiers.length} partner_identifiers, ${updateCount} shipment_line updates.`);
  lines.push('-- =====================================================================');

  // Write as UTF-8 using Buffer - guaranteed correct encoding
  const content = lines.join('\n');
  fs.writeFileSync('do_patch.sql', Buffer.from(content, 'utf8'));

  console.log('\n✅ do_patch.sql generated!');
  console.log(`   - ${identifiers.length} partner_identifier INSERT/UPDATE`);
  console.log(`   - ${updateCount} shipment_line partner_id UPDATE`);
  const sizeMB = (Buffer.byteLength(content, 'utf8') / 1024 / 1024).toFixed(2);
  console.log(`   - File size: ${sizeMB} MB`);
  console.log('\nNext steps on DO server:');
  console.log('  # On your LOCAL machine (SCP to DO server):');
  console.log('  scp do_patch.sql root@<DO_IP>:/root/do_patch.sql');
  console.log('');
  console.log('  # On the DO server:');
  console.log('  docker cp /root/do_patch.sql gava_erp_prod_db:/do_patch.sql');
  console.log('  docker exec -it gava_erp_prod_db psql -U gava_admin -d gava_erp -f /do_patch.sql');

  await db.destroy();
}

main().catch(err => {
  console.error('ERROR:', err.message);
  db.destroy();
  process.exit(1);
});
