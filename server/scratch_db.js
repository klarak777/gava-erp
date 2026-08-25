const db = require('./src/db/db'); 
async function run() {
  try {
    const res = await db.raw("SELECT * FROM aldi_daily_orders WHERE order_number = '4531658036'");
    console.log("Order:", res.rows);
    const orderLines = await db.raw("SELECT * FROM aldi_daily_order_lines WHERE daily_order_id = " + res.rows[0].id);
    console.log("Lines:", orderLines.rows);

    const cp = await db('chain_products').where('gtin', orderLines.rows[0].gtin).first('id');
    console.log("Chain product ID:", cp ? cp.id : 'not found');

    const period = await db('aldi_price_currency_periods')
                    .join('aldi_weekly_price_lines', 'aldi_price_currency_periods.price_line_id', 'aldi_weekly_price_lines.id')
                    .where('aldi_weekly_price_lines.chain_product_id', cp.id)
                    .first('aldi_price_currency_periods.currency_code', 'aldi_price_currency_periods.period_start', 'aldi_price_currency_periods.period_end');
    console.log("Period:", period);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
