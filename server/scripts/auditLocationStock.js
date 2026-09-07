// Read-only production audit. Reuses connection settings without running sync code.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../sync_local_to_do.js'), 'utf8');
const remoteLine = source.split('\n').find(line => line.startsWith('const remote ='));
const connection = {};
for (const key of ['host', 'user', 'password', 'database']) {
  connection[key] = remoteLine.match(new RegExp(key + ": '([^']+)'"))[1];
}
connection.port = 5432;
connection.connectionTimeoutMillis = 10000;
const db = require('knex')({ client: 'pg', connection, pool: { min: 0, max: 1 } });
const gtins = ['4061463554338', '4061462848056'];
async function main() {
  await db.transaction(async trx => {
    await trx.raw('SET TRANSACTION READ ONLY');
    await trx.raw("SET LOCAL statement_timeout = '15s'");
    if (process.argv.includes('--weights')) {
      console.log('PACKAGING', JSON.stringify(await trx('ref_packaging_types').select('id', 'name', 'category', 'tare_weight_kg', 'is_active')));
      console.log('WEIGHTS', JSON.stringify(await trx('aldi_truck_lines').where('picked_cartons', '>', 0).select('id', 'product_name', 'picked_cartons', 'gross_weight', 'net_weight', 'tare_weight', 'pallet_type')));
      return;
    }
    const rows = await trx('aldi_stock_locations as s')
      .join('aldi_daily_order_lines as l', 'l.id', 's.order_line_id')
      .join('aldi_locations as loc', 'loc.id', 's.location_id')
      .whereIn('l.gtin', gtins)
      .select('s.*', 'l.gtin', 'l.cartons_per_pallet', 'loc.name', 'loc.barcode');
    console.log('RAW_STOCK', JSON.stringify(rows));
    console.log('PICKED', JSON.stringify(await trx('aldi_truck_lines')
      .whereIn('aldi_daily_order_line_id', [...new Set(rows.map(r => r.order_line_id))])
      .select('id', 'aldi_daily_order_line_id', 'ordered_cartons', 'picked_cartons')));
    for (const table of ['chain_products', 'aldi_weekly_price_lines']) {
      console.log(table, JSON.stringify(await trx(table).whereIn('gtin', gtins).groupBy('gtin').select('gtin').count('* as matches')));
    }
    // Run the actual local GET handler with the read-only transaction as its DB.
    const dbPath = require.resolve('../src/db/db');
    require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: trx };
    const router = require('../src/routes/locations');
    const handler = router.stack.find(layer => layer.route?.path === '/:id/stock').route.stack[0].handle;
    for (const locationId of [...new Set(rows.map(r => r.location_id))]) {
      const old = await trx('aldi_stock_locations as s')
        .join('aldi_daily_order_lines as l', 'l.id', 's.order_line_id')
        .leftJoin('chain_products as cp', 'cp.gtin', 'l.gtin')
        .leftJoin('aldi_weekly_price_lines as wp', 'wp.gtin', 'l.gtin')
        .where('s.location_id', locationId)
        .groupBy('l.gtin', 'cp.product_name', 'wp.xlsx_product_name', 'l.cartons_per_pallet')
        .select('l.gtin', trx.raw('SUM(s.quantity_cartons)::integer as total_cartons'));
      let actual;
      await handler({ params: { id: locationId } }, {
        json(value) { actual = value; },
        status(code) { throw new Error('Handler status ' + code); }
      });
      const raw = await trx('aldi_stock_locations').where('location_id', locationId).sum('quantity_cartons as total').first();
      assert.equal(actual.reduce((sum, item) => sum + item.total_cartons, 0), Number(raw.total));
      console.log('LOCATION', JSON.stringify({ locationId, old, corrected: actual, rawTotal: Number(raw.total), test: 'PASS' }));
    }
  });
}
main().catch(err => { console.error(err.code || err.message); process.exitCode = 1; }).finally(() => db.destroy());
