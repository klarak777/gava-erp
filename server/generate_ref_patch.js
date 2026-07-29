/**
 * generate_ref_patch.js
 * 
 * A partner_identifiers (Reference) adatokat NÉV alapján szinkronizálja.
 */
require('dotenv').config();
const knex = require('knex');
const fs = require('fs');
const db = knex(require('./knexfile')['development']);

function esc(s) {
  if (s == null) return 'NULL';
  return "'" + String(s).replace(/'/g, "''") + "'";
}

async function main() {
  const identifiers = await db('partner_identifiers')
    .select('partner_identifiers.value', 'partners.name')
    .leftJoin('partners', 'partner_identifiers.partner_id', 'partners.id')
    .where('partner_identifiers.id_type', '(Reference) Szállítók')
    .whereNotNull('partners.name');

  const lines = [];
  lines.push('-- Reference azonosítók tisztítása és szinkronizálása NÉV alapján');
  lines.push('BEGIN;');
  lines.push('');
  lines.push(`-- 1. Töröljük az eddigi (hibás ID-jű) Reference azonosítókat`);
  lines.push(`DELETE FROM partner_identifiers WHERE id_type = '(Reference) Szállítók';`);
  lines.push('');
  lines.push(`-- 2. Újra beszúrjuk őket a megfelelő partner ID kikeresésével (név alapján)`);
  
  let count = 0;
  for (const ref of identifiers) {
    if (!ref.name) continue;
    
    lines.push(
      `INSERT INTO partner_identifiers (partner_id, id_type, value, created_at, updated_at) ` +
      `SELECT id, '(Reference) Szállítók', ${esc(ref.value)}, NOW(), NOW() ` +
      `FROM partners WHERE UPPER(name) = UPPER(${esc(ref.name)}) LIMIT 1;`
    );
    count++;
  }

  lines.push('');
  lines.push('COMMIT;');
  lines.push(`-- ${count} Reference beillesztve.`);

  const content = lines.join('\n');
  fs.writeFileSync('do_sync_refs.sql', Buffer.from(content, 'utf8'));

  console.log(`✅ do_sync_refs.sql generálva (${count} Reference név alapján)`);
  console.log('\nDO szerveren futtasd:');
  console.log('  docker cp server/do_sync_refs.sql gava_erp_prod_db:/do_sync_refs.sql');
  console.log('  docker exec -it gava_erp_prod_db psql -U gava_admin -d gava_erp -f /do_sync_refs.sql');

  await db.destroy();
}

main().catch(e => { console.error(e.message); process.exit(1); });
