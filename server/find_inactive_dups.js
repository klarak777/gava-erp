const knex = require('knex');
const knexfile = require('./knexfile');
const db = knex(knexfile.development);

async function main() {
  const duplicates = await db('partner_identifiers')
    .where('is_inactive', true)
    .groupBy('partner_id', 'id_type', 'value')
    .havingRaw('count(*) > 1')
    .select('partner_id', 'id_type', 'value', db.raw('count(*) as cnt'));
  
  console.log('Duplicates:', duplicates);
  process.exit(0);
}
main();
