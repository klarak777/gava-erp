require('dotenv').config();
const db = require('knex')(require('./knexfile')['development']);
const fs = require('fs');
const path = require('path');

async function main() {
  const roles = ['(Reference) Szállítók', '(Customer) Vevők', 'Fuvarozók'];

  // 1. Lekérdezzük az összes inaktív szerepkört
  const inactives = await db('partner_identifiers as pi')
    .join('partners as p', 'p.id', 'pi.partner_id')
    .whereIn('pi.id_type', roles)
    .where('pi.is_inactive', true)
    .select('pi.id_type', 'pi.value', 'p.name');

  // 2. Lekérdezzük az összes aktív szerepkört
  const actives = await db('partner_identifiers as pi')
    .join('partners as p', 'p.id', 'pi.partner_id')
    .whereIn('pi.id_type', roles)
    .where(function() {
      this.where('pi.is_inactive', false).orWhereNull('pi.is_inactive');
    })
    .select('pi.id_type', 'pi.value', 'p.name');

  let sql = `-- DO Szerver Partner Azonosítók Szinkronizáló SQL script\n`;
  sql += `-- Generálva a lokális tesztkörnyezetből\n\n`;

  // Aktívak beállítása (ha eddig inaktív volt)
  sql += `-- 1. AKTÍV AZONOSÍTÓK BEÁLLÍTÁSA\n`;
  for (const a of actives) {
    const val = a.value.replace(/'/g, "''");
    const name = a.name.replace(/'/g, "''");
    sql += `UPDATE partner_identifiers SET is_inactive = false WHERE id_type = '${a.id_type}' AND UPPER(value) = UPPER('${val}') AND partner_id IN (SELECT id FROM partners WHERE name = '${name}');\n`;
  }

  // Inaktívak beállítása
  sql += `\n-- 2. INAKTÍV (TÖRTÉNELMI / DUPLIKÁLT) AZONOSÍTÓK BEÁLLÍTÁSA\n`;
  for (const i of inactives) {
    const val = i.value.replace(/'/g, "''");
    const name = i.name.replace(/'/g, "''");
    sql += `UPDATE partner_identifiers SET is_inactive = true WHERE id_type = '${i.id_type}' AND UPPER(value) = UPPER('${val}') AND partner_id IN (SELECT id FROM partners WHERE name = '${name}');\n`;
  }

  const outPath = path.join('c:\\Users\\klara\\Documents\\Nepelemes ügyek\\Gavá\\ERP Access', 'do_server_sync.sql');
  fs.writeFileSync(outPath, sql, 'utf8');

  console.log(`Generálva ${actives.length} aktív és ${inactives.length} inaktív szinkronizáló sor a do_server_sync.sql fájlba.`);

  await db.destroy();
}

main().catch(e => { console.error(e); process.exit(1); });
