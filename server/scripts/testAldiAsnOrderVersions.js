// Copies column definitions (no business rows) into a dedicated local test DB.
// All sequences used by the regression live in that DB, never in the ERP DB.
const knex = require('knex');
const { execFileSync } = require('node:child_process');
const source = require('../src/db/db');
const migration = require('../src/db/migrations/20261014000001_create_aldi_asn');
const tables = ['aldi_daily_orders', 'aldi_daily_order_lines', 'aldi_order_families', 'aldi_order_item_states', 'aldi_trucks', 'aldi_truck_lines', 'aldi_commission_lines', 'aldi_stock_locations', 'sscc_labels'];
const targetUrl = process.env.ALDI_EDI_TEST_DATABASE_URL;
let target;
async function main() {
  const url = new URL(targetUrl), c = source.client.config.connection;
  const sourceHost = typeof c === 'string' ? new URL(c).hostname : c.host;
  if (!['localhost', '127.0.0.1'].includes(sourceHost) || !['localhost', '127.0.0.1'].includes(url.hostname) || url.pathname !== '/edi_test') throw new Error('Kizárólag helyi ERP séma és külön edi_test adatbázis használható.');
  target = knex({ client: 'pg', connection: targetUrl });
  for (const table of tables) if (await target.schema.hasTable(table)) throw new Error('A tesztadatbázisban már vannak üzleti táblák; nem írjuk felül.');
  for (const table of tables) {
    const columns = await source('information_schema.columns').where({ table_schema: 'public', table_name: table }).orderBy('ordinal_position');
    // New ASN columns are created by the migration below, not duplicated here.
    const excluded = { aldi_daily_order_lines: ['edi_line_reference'], aldi_truck_lines: ['asn_order_line_reference'], aldi_trucks: ['asn_loaded_at'], sscc_labels: ['asn_best_before', 'asn_expiry_date'] };
    const ddl = columns.filter(col => !(excluded[table] || []).includes(col.column_name)).map(col => {
      const id = '"' + col.column_name.replace(/"/g, '""') + '"';
      if (col.column_name === 'id') return id + ' SERIAL PRIMARY KEY';
      const defaultSql = col.column_default ? ' DEFAULT ' + col.column_default : '';
      return id + ' ' + col.udt_name + defaultSql + (col.is_nullable === 'NO' ? ' NOT NULL' : '');
    }).join(',');
    await target.raw('CREATE TABLE ?? (' + ddl + ')', [table]);
  }
  await target.schema.alterTable('aldi_order_families', b => b.unique('base_order_number'));
  await target.schema.alterTable('aldi_order_item_states', b => b.unique(['order_family_id', 'gtin']));
  await migration.up(target);
  execFileSync(process.execPath, ['--test', 'tests/aldiOrderVersionUpload.test.js'], { cwd: require('node:path').resolve(__dirname, '..'), env: { ...process.env, ALDI_TEST_DATABASE_URL: targetUrl }, stdio: 'inherit' });
  await migration.down(target);
  for (const table of [...tables].reverse()) await target.schema.dropTable(table);
}
main().catch(e => { console.error(e.message); process.exitCode = 1; }).finally(async () => { await source.destroy(); await target?.destroy(); });
