require('dotenv').config();
const db = require('knex')(require('./knexfile')['development']);

async function check() {
  const dupes = await db.raw("SELECT id_type, COUNT(*) as cnt FROM (SELECT partner_id, id_type, COUNT(*) as cnt FROM partner_identifiers GROUP BY partner_id, id_type HAVING COUNT(*) > 1) t GROUP BY id_type");
  console.log('Lokális duplikátumok:');
  console.log(dupes.rows);
  
  const delga = await db('partners').where('name', 'ilike', '%delga%');
  console.log('Lokális Delga partner:', delga);
  db.destroy();
}
check();
