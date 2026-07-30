require('dotenv').config();
const db = require('knex')(require('./knexfile')['development']);
const fs = require('fs');
const path = require('path');

async function main() {
  const roles = ['(Reference) Szállítók', '(Customer) Vevők', 'Fuvarozók'];

  // Lekérdezzük az összes szerepkör azonosítót a helyi gépből
  const allIdentifiers = await db('partner_identifiers as pi')
    .join('partners as p', 'p.id', 'pi.partner_id')
    .whereIn('pi.id_type', roles)
    .select('pi.id_type', 'pi.value', 'pi.is_inactive', 'p.name');

  let sql = `-- DO Szerver Teljes Szerepkör Szinkronizáló SQL script\n`;
  sql += `-- Generálva a lokális tesztkörnyezetből\n\n`;

  // 0. Beszúrjuk a hiányzó partnereket is a partners táblába
  const allPartners = await db('partners').select('name', 'type', 'is_inactive');
  sql += `-- 0. HIÁNYZÓ PARTNEREK BESZÚRÁSA\n`;
  for (const p of allPartners) {
    const name = p.name.replace(/'/g, "''");
    const pType = (p.type || 'szAllA-tA3').replace(/'/g, "''");
    const isInactive = p.is_inactive ? 'true' : 'false';
    sql += `INSERT INTO partners (name, type, is_inactive, created_at, updated_at)\n`;
    sql += `SELECT '${name}', '${pType}', ${isInactive}, NOW(), NOW()\n`;
    sql += `WHERE NOT EXISTS (SELECT 1 FROM partners WHERE name = '${name}');\n\n`;
  }

  for (const row of allIdentifiers) {
    const val = row.value.replace(/'/g, "''");
    const name = row.name.replace(/'/g, "''");
    const isInactive = row.is_inactive ? 'true' : 'false';

    // 1. Beszúrjuk, ha nem létezik (név alapján megkeresve a partner_id-t a DO szerveren)
    sql += `INSERT INTO partner_identifiers (partner_id, id_type, value, is_inactive, is_verified, checked_by, created_at, updated_at)\n`;
    sql += `SELECT id, '${row.id_type}', '${val}', ${isInactive}, false, '', NOW(), NOW()\n`;
    sql += `FROM partners WHERE name = '${name}'\n`;
    sql += `AND NOT EXISTS (\n`;
    sql += `  SELECT 1 FROM partner_identifiers \n`;
    sql += `  WHERE partner_id = partners.id \n`;
    sql += `  AND id_type = '${row.id_type}' \n`;
    sql += `  AND UPPER(value) = UPPER('${val}')\n`;
    sql += `);\n`;

    // 2. Frissítjük az inaktív státuszt, ha már létezett korábban
    sql += `UPDATE partner_identifiers SET is_inactive = ${isInactive}\n`;
    sql += `WHERE id_type = '${row.id_type}' AND UPPER(value) = UPPER('${val}') \n`;
    sql += `AND partner_id IN (SELECT id FROM partners WHERE name = '${name}');\n\n`;
  }

  const outPath = path.join(__dirname, '..', 'do_server_full_sync.sql');
  fs.writeFileSync(outPath, sql, 'utf8');

  console.log(`Generálva ${allIdentifiers.length} azonosító szinkronizáló parancs a do_server_full_sync.sql fájlba.`);

  await db.destroy();
}

main().catch(e => { console.error(e); process.exit(1); });
