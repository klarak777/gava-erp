const local = require('./node_modules/knex')({ client: 'pg', connection: { host: '127.0.0.1', port: 5432, user: 'gava_admin', password: 'adminpassword123', database: 'gava_erp' } });
const remote = require('./node_modules/knex')({ client: 'pg', connection: { host: '138.68.143.223', port: 5432, user: 'gava_admin', password: 'adminpassword123', database: 'gava_erp' } });

async function sync() {
  console.log('=== LOKALIS -> DO SZINKRONIZACIO ===\n');

  const localPartners = await local('partners').select('id', 'is_inactive');
  const remotePartners = await remote('partners').select('id');
  const remoteIds = new Set(remotePartners.map(p => p.id));
  const missingIds = localPartners.map(p => p.id).filter(id => !remoteIds.has(id));
  
  console.log('Hianyzó partnerek:', missingIds.length);

  if (missingIds.length > 0) {
    await remote.raw("SET session_replication_role = 'replica';");
    let inserted = 0;
    for (let i = 0; i < missingIds.length; i += 100) {
      const batch = missingIds.slice(i, i + 100);
      const rows = await local('partners').whereIn('id', batch);
      await remote('partners').insert(rows).onConflict('id').ignore();
      inserted += rows.length;
      process.stdout.write('\r  ' + inserted + '/' + missingIds.length + ' partner');
    }
    console.log('\n  OK: ' + inserted + ' partner atmasolva');

    const localIdens = await local('partner_identifiers').whereIn('partner_id', missingIds);
    const remoteIdens = await remote('partner_identifiers').select('id');
    const remoteIdenIds = new Set(remoteIdens.map(i => i.id));
    const missingIdens = localIdens.filter(i => !remoteIdenIds.has(i.id));
    console.log('Hianyzó azonositók:', missingIdens.length);
    for (let i = 0; i < missingIdens.length; i += 200) {
      const batch = missingIdens.slice(i, i + 200);
      await remote('partner_identifiers').insert(batch).onConflict('id').ignore();
      process.stdout.write('\r  ' + Math.min(i+200, missingIdens.length) + '/' + missingIdens.length + ' azonosito');
    }
    console.log('\n  OK: ' + missingIdens.length + ' azonosito atmasolva');
    await remote.raw("SET session_replication_role = 'origin';");
    await remote.raw("SELECT setval('partners_id_seq', (SELECT MAX(id) FROM partners));");
    await remote.raw("SELECT setval('partner_identifiers_id_seq', (SELECT MAX(id) FROM partner_identifiers));");
  }

  console.log('\nIs_inactive frissitese...');
  let updated = 0;
  for (const p of localPartners) {
    if (p.is_inactive) {
      await remote('partners').where('id', p.id).update({ is_inactive: true });
      updated++;
    }
  }
  console.log('  ' + updated + ' partner inaktivra allitva');

  const [fp] = await remote('partners').count();
  const [fi] = await remote('partner_identifiers').count();
  const [fip] = await remote('partners').where('is_inactive', true).count();
  console.log('\n=== VEGEREDMENY DO ===');
  console.log('  partners: ' + fp.count + ' (inactive: ' + fip.count + ')');
  console.log('  identifiers: ' + fi.count);

  await local.destroy();
  await remote.destroy();
}
sync().catch(e => { console.error('HIBA:', e.message); process.exit(1); });
