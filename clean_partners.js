const db = require('./server/src/db/db');
async function run() {
  try {
    const kopfsalat = await db('partners').whereRaw("name ILIKE '%Kopfsalat%'").select('id', 'name', 'tax_id', 'street_name');
    console.log('Kopfsalat partners:', kopfsalat);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
