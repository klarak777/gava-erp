require('dotenv').config();
const db = require('knex')(require('./knexfile')['development']);

async function main() {
  const inactives = await db('partner_identifiers as pi')
    .join('partners as p', 'p.id', 'pi.partner_id')
    .where('pi.is_inactive', true)
    .whereIn('pi.id_type', ['(Reference) Szállítók', '(Customer) Vevők', 'Fuvarozók'])
    .select('pi.id_type', 'pi.value', 'p.name', 'p.id as partner_id')
    .orderBy('pi.id_type')
    .orderBy('p.name');

  let md = '# Inaktív (Történelmi) Szerepkör Azonosítók Listája\n\n';
  md += 'Ezek azok az azonosítók, amelyek be vannak állítva a partnerekhez (hogy a régebbi történelmi fuvarokat is össze lehessen kötni a rendszerben), de **inaktívra lettek jelölve**, így nem jelennek meg az Admin modul legördülő listáiban (mert már van újabb, "hivatalos" rövidítésük).\n\n';

  let currentRole = '';
  inactives.forEach(r => {
    if (currentRole !== r.id_type) {
      currentRole = r.id_type;
      md += `\n### ${currentRole}\n\n| Azonosító (Rövidítés) | Partner Neve | Partner ID |\n|---|---|---|\n`;
    }
    md += `| **${r.value}** | ${r.name} | ${r.partner_id} |\n`;
  });

  const fs = require('fs');
  const path = require('path');
  const outPath = path.join('c:\\Users\\klara\\Documents\\Nepelemes ügyek\\Gavá\\ERP Access', 'Inaktiv_Azonositok_Listaja.md');
  fs.writeFileSync(outPath, md, 'utf8');

  console.log(`Kiírva ${inactives.length} inaktív azonosító a fájlba.`);
  await db.destroy();
}

main().catch(e => { console.error(e); process.exit(1); });
