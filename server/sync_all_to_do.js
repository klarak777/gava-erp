const local = require('./node_modules/knex')({ client: 'pg', connection: { host: '127.0.0.1', port: 5432, user: 'gava_admin', password: 'adminpassword123', database: 'gava_erp' } });
const remote = require('./node_modules/knex')({ client: 'pg', connection: { host: '138.68.143.223', port: 5432, user: 'gava_admin', password: 'adminpassword123', database: 'gava_erp' } });

async function syncTable(tableName, batchSize = 500) {
  const [lr] = await local(tableName).count();
  const [rr] = await remote(tableName).count();
  const localCount = parseInt(lr.count);
  const remoteCount = parseInt(rr.count);
  
  if (localCount === remoteCount) {
    console.log(tableName + ': mar szinkron (' + localCount + ' sor)');
    return;
  }
  
  console.log(tableName + ': ' + localCount + ' -> ' + remoteCount + ' (hianyzik: ' + (localCount - remoteCount) + ')');
  
  const remoteIds = remoteCount > 0 
    ? new Set((await remote(tableName).select('id')).map(r => r.id))
    : new Set();
  
  const allRows = await local(tableName).select('*');
  const missing = allRows.filter(r => !remoteIds.has(r.id));
  
  let inserted = 0;
  for (let i = 0; i < missing.length; i += batchSize) {
    const batch = missing.slice(i, i + batchSize);
    try {
      await remote(tableName).insert(batch).onConflict('id').ignore();
      inserted += batch.length;
      process.stdout.write('\r  ' + Math.min(inserted, missing.length) + '/' + missing.length);
    } catch(e) {
      console.log('\n  batch hiba: ' + e.message.slice(0, 80));
      // try one by one
      for (const row of batch) {
        try {
          await remote(tableName).insert(row).onConflict('id').ignore();
          inserted++;
        } catch(e2) { /* skip */ }
      }
    }
  }
  console.log('\n  Kesz: ' + inserted + ' sor betöltve');
}

async function main() {
  console.log('=== LOKALIS -> DO TELJES SZINKRONIZACIO ===\n');
  
  await remote.raw("SET session_replication_role = 'replica';");
  
  try {
    // Simple tables first (no FK dependencies)
    await syncTable('seasons', 100);
    await syncTable('currencies', 100);
    await syncTable('products', 500);
    await syncTable('transporters', 200);
    
    // Tables with FK to partners
    await syncTable('partner_sites', 500);
    await syncTable('partner_characteristics', 200);
    await syncTable('partner_credit_settings', 200);
    
    // Shipments (FK to seasons, transporters, partners)
    await syncTable('shipments', 200);
    await syncTable('shipment_lines', 500);
    
    // Transport orders
    await syncTable('transport_orders', 200);
    
    // EKAER
    await syncTable('ekaer_records', 500);
    
  } finally {
    await remote.raw("SET session_replication_role = 'origin';");
  }

  // Update sequences for all tables
  const seqTables = ['seasons','currencies','products','transporters','partner_sites',
    'partner_characteristics','partner_credit_settings','shipments','shipment_lines',
    'transport_orders','ekaer_records'];
  console.log('\nSzekvenciak frissitese...');
  for (const t of seqTables) {
    try {
      await remote.raw("SELECT setval('" + t + "_id_seq', COALESCE((SELECT MAX(id) FROM " + t + "), 1));");
    } catch(e) { /* some tables may not have id_seq */ }
  }

  console.log('\n=== VEGSO ELLENORZES ===');
  for (const t of seqTables) {
    const [lr] = await local(t).count();
    const [rr] = await remote(t).count();
    const ok = lr.count === rr.count ? 'OK' : '!! ' + lr.count + ' vs ' + rr.count;
    console.log(t.padEnd(35) + ok);
  }

  await local.destroy();
  await remote.destroy();
  console.log('\nKesz!');
}
main().catch(e => { console.error('HIBA:', e.message); process.exit(1); });
