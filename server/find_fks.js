const knex = require('knex')(require('./knexfile').development);
async function run() {
  const tables = await knex.raw("SELECT table_name FROM information_schema.columns WHERE column_name = 'partner_id' AND table_schema = 'public'");
  console.log(tables.rows.map(r => r.table_name));
  process.exit(0);
}
run();
