/**
 * clean_do_identifiers.js
 * 
 * Ez a szkript megtisztítja a DO szerveren lévő partner_identifiers táblát:
 * 1. Törli az összes duplikált rekordot az id_type és partner_id kombinációkban.
 * 2. Helyreállítja az ékezetes karaktereket (pl. SzAllA-tA3k -> Szállítók), amiket a régi patch rontott el.
 */
require('dotenv').config();
const knex = require('knex');
const knexConfig = require('./knexfile');
const fs = require('fs');

const db = knex(knexConfig['development']);

async function main() {
  const lines = [];
  lines.push('-- 1. Karakterkódolási hibák (rossz id_type) javítása');
  
  // Javítjuk a kódolási hibákat
  lines.push(`UPDATE partner_identifiers SET id_type = '(Reference) Szállítók' WHERE id_type LIKE '%Reference%' AND id_type != '(Reference) Szállítók';`);
  lines.push(`UPDATE partner_identifiers SET id_type = '(Customer) Vevők' WHERE id_type LIKE '%Customer%' AND id_type != '(Customer) Vevők';`);
  lines.push(`UPDATE partner_identifiers SET id_type = 'Fuvarozók' WHERE id_type LIKE '%Fuvaro%' AND id_type != 'Fuvarozók';`);
  
  lines.push('');
  lines.push('-- 2. Duplikátumok törlése az ÖSSZES id_type-ban');
  lines.push(`
  DELETE FROM partner_identifiers
  WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY partner_id, id_type, value ORDER BY id) as rn
      FROM partner_identifiers
    ) t
    WHERE t.rn > 1
  );`);

  const content = lines.join('\n');
  fs.writeFileSync('do_clean_dupes.sql', Buffer.from(content, 'utf8'));

  console.log(`✅ do_clean_dupes.sql generálva`);
  console.log('\nDO szerveren futtasd:');
  console.log('  docker cp server/do_clean_dupes.sql gava_erp_prod_db:/do_clean_dupes.sql');
  console.log('  docker exec -it gava_erp_prod_db psql -U gava_admin -d gava_erp -f /do_clean_dupes.sql');

  await db.destroy();
}

main().catch(e => { console.error(e.message); process.exit(1); });
