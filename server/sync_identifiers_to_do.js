const local = require('./node_modules/knex')({ client: 'pg', connection: { host: '127.0.0.1', port: 5432, user: 'gava_admin', password: 'adminpassword123', database: 'gava_erp' } });
const remote = require('./node_modules/knex')({ client: 'pg', connection: { host: '138.68.143.223', port: 5432, user: 'gava_admin', password: 'adminpassword123', database: 'gava_erp' } });

async function sync() {
  console.log('=== AZONOSITOK SZINKRONIZACIO (DO) ===\n');

  // Drop the unique index temporarily
  await remote.raw("DROP INDEX IF EXISTS ux_partner_identifiers_active_role_value;");
  await remote.raw("SET session_replication_role = 'replica';");

  const localIdens = await local('partner_identifiers').select('*');
  const remoteIdens = await remote('partner_identifiers').select('id');
  const remoteIds = new Set(remoteIdens.map(i => i.id));
  const missing = localIdens.filter(i => !remoteIds.has(i.id));
  
  console.log('Hianyzó azonositók száma:', missing.length);

  let inserted = 0;
  let skipped = 0;
  for (let i = 0; i < missing.length; i += 50) {
    const batch = missing.slice(i, i + 50);
    try {
      await remote('partner_identifiers').insert(batch).onConflict('id').ignore();
      inserted += batch.length;
    } catch(e) {
      skipped += batch.length;
      console.log('  batch hiba: ' + e.message.slice(0, 60));
    }
    process.stdout.write('\r  ' + (i+batch.length) + '/' + missing.length);
  }
  console.log('\n  Betöltve: ' + inserted + ', kihagyva: ' + skipped);

  // Recreate the unique index
  await remote.raw("SET session_replication_role = 'origin';");
  await remote.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS ux_partner_identifiers_active_role_value
    ON partner_identifiers (id_type, UPPER(TRIM(value)))
    WHERE is_inactive = false
      AND id_type IN ('(Reference) Szallitok', '(Customer) Vevok', 'Fuvarozok');
  `);

  // Update sequences
  await remote.raw("SELECT setval('partners_id_seq', (SELECT MAX(id) FROM partners));");
  await remote.raw("SELECT setval('partner_identifiers_id_seq', (SELECT MAX(id) FROM partner_identifiers));");

  const [fp] = await remote('partners').count();
  const [fi] = await remote('partner_identifiers').count();
  const [fip] = await remote('partners').where('is_inactive', true).count();
  console.log('\n=== VEGEREDMENY DO ===');
  console.log('  partners: ' + fp.count + ' (inactive: ' + fip.count + ')');
  console.log('  identifiers: ' + fi.count);

  await local.destroy();
  await remote.destroy();
  console.log('Kesz!');
}
sync().catch(e => { console.error('HIBA:', e.message); process.exit(1); });
