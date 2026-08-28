const db = require('../src/db/db');

async function main() {
  const report = {};
  report.missingGtins = await db('aldi_daily_order_lines').whereNull('gtin').orWhere('gtin', '').select('id', 'daily_order_id');
  report.loadedOverOrdered = await db('aldi_daily_order_lines as l')
    .leftJoin('aldi_truck_lines as t', 't.aldi_daily_order_line_id', 'l.id')
    .select('l.id', 'l.daily_order_id', 'l.gtin', 'l.ordered_cartons')
    .sum('t.ordered_cartons as loaded_cartons')
    .groupBy('l.id')
    .havingRaw('COALESCE(SUM(t.ordered_cartons), 0) > l.ordered_cartons');
  report.orphanTruckLines = await db('aldi_truck_lines as t')
    .leftJoin('aldi_daily_order_lines as l', 'l.id', 't.aldi_daily_order_line_id')
    .whereNotNull('t.aldi_daily_order_line_id').whereNull('l.id')
    .select('t.id', 't.aldi_truck_id', 't.aldi_daily_order_line_id');
  report.duplicateGtins = await db('aldi_daily_order_lines as l')
    .join('aldi_daily_orders as o', 'o.id', 'l.daily_order_id')
    .select('o.id as order_id', 'o.order_number', 'l.gtin').count('* as count')
    .groupBy('o.id', 'o.order_number', 'l.gtin').havingRaw('COUNT(*) > 1');

  console.log(JSON.stringify(report, null, 2));
  const blocking = report.missingGtins.length + report.loadedOverOrdered.length + report.orphanTruckLines.length;
  if (blocking) {
    console.error(`Az audit ${blocking} blokkoló hibát talált. A migráció előtt kézi egyeztetés szükséges.`);
    process.exitCode = 1;
  } else {
    console.log('Az audit nem talált blokkoló adathibát.');
  }
}

main().catch(error => {
  console.error('Az ALDI verzió-audit sikertelen:', error);
  process.exitCode = 1;
}).finally(() => db.destroy());
