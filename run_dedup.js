const knex = require('./server/node_modules/knex')(require('./server/knexfile').development);

async function run() {
  console.log('Running 042 deduplicate_active...');
  const m42 = require('./server/src/db/migrations/20260802000000_042_deduplicate_active_role_identifiers.js');
  await m42.up(knex);
  
  console.log('Running 043 deduplicate_inactive...');
  const m43 = require('./server/src/db/migrations/20260803081138_043_deduplicate_inactive_role_identifiers.js');
  await m43.up(knex);
  
  console.log('Running penny seed...');
  const penny = require('./server/src/db/migrations/20260814020000_seed_penny_partner_characteristics.js');
  await penny.up(knex);

  console.log('Done!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
