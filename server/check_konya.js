require('dotenv').config();
const db = require('knex')(require('./knexfile')['development']);

async function main() {
  const konya = await db('partner_identifiers as pi')
    .join('partners as p', 'p.id', 'pi.partner_id')
    .whereRaw("UPPER(pi.value) = 'KÓNYA'")
    .select('pi.id_type', 'pi.value', 'p.name', 'p.id as partner_id', 'pi.is_inactive', 'pi.id as pi_id')
    .orderBy('pi.id_type');

  console.log('=== KÓNYA AZONOSÍTÓK A RENDSZERBEN ===');
  konya.forEach(r => {
    console.log(`${r.id_type} | ${r.value} | ${r.name} (ID: ${r.partner_id}) | inaktív: ${r.is_inactive} | pi_id: ${r.pi_id}`);
  });

  await db.destroy();
}

main().catch(e => { console.error(e); process.exit(1); });
