const local = require('./node_modules/knex')({ client: 'pg', connection: { host: '127.0.0.1', port: 5432, user: 'gava_admin', password: 'adminpassword123', database: 'gava_erp' } });
const remote = require('./node_modules/knex')({ client: 'pg', connection: { host: '138.68.143.223', port: 5432, user: 'gava_admin', password: 'adminpassword123', database: 'gava_erp' } });

async function check() {
  const aldiTables = [
    'aldi_daily_orders',
    'aldi_daily_order_lines',
    'aldi_order_item_states',
    'aldi_weekly_prices',
    'aldi_weekly_price_lines',
    'aldi_price_currency_periods',
    'aldi_order_families',
    'aldi_truck_lines',
    'aldi_locations',
  ];

  console.log('Tabla'.padEnd(38) + 'LOKALIS'.padEnd(12) + 'DO SZERVER'.padEnd(12) + 'OK?');
  console.log('-'.repeat(70));

  for (const t of aldiTables) {
    try {
      const [lr] = await local(t).count();
      const [rr] = await remote(t).count();
      const ok = lr.count === rr.count ? 'OK' : '!! ELTERES !!';
      console.log(t.padEnd(38) + String(lr.count).padEnd(12) + String(rr.count).padEnd(12) + ok);
    } catch(e) {
      console.log(t.padEnd(38) + 'HIBA: ' + e.message.slice(0,30));
    }
  }

  await local.destroy();
  await remote.destroy();
}
check().catch(e => { console.error('HIBA:', e.message); process.exit(1); });
