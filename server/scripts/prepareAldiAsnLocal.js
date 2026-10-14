const db = require('../src/db/db');
async function main() {
  const c = db.client.config.connection;
  const url = typeof c === 'string' ? new URL(c) : null;
  const host = url ? url.hostname : c.host, database = url ? url.pathname.slice(1) : c.database;
  if (!['localhost', '127.0.0.1'].includes(host) || database !== 'gava_erp') throw new Error('Csak a helyi gava_erp adatbázis készíthető elő ezzel a paranccsal.');
  const result = await db.migrate.up({ name: '20261014000001_create_aldi_asn.js' });
  console.log(JSON.stringify({ host, database, migration: result }));
}
main().catch(e => { console.error(e.message); process.exitCode = 1; }).finally(() => db.destroy());
