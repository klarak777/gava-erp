const local = require('./node_modules/knex')({ client: 'pg', connection: { host: '127.0.0.1', port: 5432, user: 'gava_admin', password: 'adminpassword123', database: 'gava_erp' } });
const remote = require('./node_modules/knex')({ client: 'pg', connection: { host: '138.68.143.223', port: 5432, user: 'gava_admin', password: 'adminpassword123', database: 'gava_erp' } });

async function check() {
  // Get ALL table names from both DBs
  const localTables = await local('information_schema.tables')
    .where('table_schema', 'public').where('table_type', 'BASE TABLE')
    .select('table_name').orderBy('table_name');
  const remoteTables = await remote('information_schema.tables')
    .where('table_schema', 'public').where('table_type', 'BASE TABLE')
    .select('table_name').orderBy('table_name');

  const remoteSet = new Set(remoteTables.map(t => t.table_name));
  
  console.log('Tabla'.padEnd(45) + 'LOKALIS'.padEnd(12) + 'DO'.padEnd(12) + 'Allapot');
  console.log('-'.repeat(80));

  for (const { table_name } of localTables) {
    if (table_name === 'knex_migrations' || table_name === 'knex_migrations_lock') continue;
    try {
      const [lr] = await local(table_name).count();
      let rCount = 'HIANYZIK';
      let status = '!! TABLA HIANYZIK !!';
      if (remoteSet.has(table_name)) {
        const [rr] = await remote(table_name).count();
        rCount = rr.count;
        status = lr.count === rr.count ? 'OK' : (parseInt(lr.count) > parseInt(rr.count) ? 'LOCAL>DO' : 'DO>LOCAL');
      }
      if (status !== 'OK') {
        console.log(table_name.padEnd(45) + String(lr.count).padEnd(12) + String(rCount).padEnd(12) + status);
      }
    } catch(e) {
      console.log(table_name.padEnd(45) + 'HIBA');
    }
  }
  console.log('\n(OK sorokat kihagyva az attekinthetoseg kedveert)');

  await local.destroy();
  await remote.destroy();
}
check().catch(e => { console.error('HIBA:', e.message); process.exit(1); });
