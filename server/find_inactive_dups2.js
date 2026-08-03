const knex = require('knex');
const knexfile = require('./knexfile');
const db = knex(knexfile.development);

async function main() {
  const duplicates = await db('partner_identifiers')
    .where('is_inactive', true)
    .groupBy('partner_id', 'id_type', db.raw('UPPER(TRIM(value))'))
    .havingRaw('count(*) > 1')
    .select('partner_id', 'id_type', db.raw('UPPER(TRIM(value)) as val'), db.raw('count(*) as cnt'));
  
  console.log('Duplicates by upper/trim:', duplicates);
  process.exit(0);
}
main();
