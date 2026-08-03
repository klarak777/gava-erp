const knex = require('knex');
const knexfile = require('./knexfile');
const db = knex(knexfile.development);

async function main() {
  const p = await db('partners').where('name', 'AGESCO S.L.').first();
  if(!p) {
    console.log('Not found');
    process.exit(0);
  }
  const i = await db('partner_identifiers').where('partner_id', p.id);
  console.log('Partner:', p);
  console.log('Identifiers:', i);
  process.exit(0);
}
main();
