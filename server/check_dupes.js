require('dotenv').config();
const db = require('knex')(require('./knexfile')['development']);

async function main() {
  const dupes = await db.raw(`
    SELECT pi.id_type, pi.value, 
           p.id as partner_id, p.name, p.is_active, pi.id as pi_id
    FROM partner_identifiers pi
    JOIN partners p ON p.id = pi.partner_id
    WHERE pi.id_type IN ('(Reference) Szállítók', '(Customer) Vevők', 'Fuvarozók')
      AND (pi.is_inactive = false OR pi.is_inactive IS NULL)
      AND pi.value IN ('DG69', 'EUROGROUP ESPANA', 'SMART', 'GAVA', 'BOGNÁR', 'RONI')
    ORDER BY pi.id_type, pi.value, p.id
  `);

  console.log('=== DUPLIKÁLT AZONOSÍTÓK PARTNER RÉSZLETEI ===\n');
  let currentVal = '';
  for (const r of dupes.rows) {
    const key = `${r.id_type} | ${r.value}`;
    if (key !== currentVal) {
      console.log(`\n--- ${key} ---`);
      currentVal = key;
    }
    console.log(`  Partner ID: ${String(r.partner_id).padEnd(4)} | Név: ${r.name.padEnd(45)} | Partner is_active: ${r.is_active} | pi_id: ${r.pi_id}`);
  }

  await db.destroy();
}

main().catch(e => { console.error(e); process.exit(1); });
