const db = require('./src/db/db');
async function run() {
  const transporters = await db('transporters').select('id', 'name', 'code', 'is_active').orderBy('id', 'asc').limit(50);
  console.log('--- First 50 Transporters ---');
  console.log(JSON.stringify(transporters, null, 2));
  process.exit(0);
}
run().catch(err => { console.error(err); process.exit(1); });
