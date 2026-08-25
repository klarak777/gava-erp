const db = require('./src/db/db'); 
async function run() {
  try {
    const cpId = 7;
    const dDate = '2026-08-20';
    const period = await db('aldi_price_currency_periods')
      .join('aldi_weekly_price_lines', 'aldi_price_currency_periods.price_line_id', 'aldi_weekly_price_lines.id')
      .where('aldi_weekly_price_lines.chain_product_id', cpId)
      .where(function() {
          this.where('aldi_price_currency_periods.period_start', '<=', dDate)
              .andWhere('aldi_price_currency_periods.period_end', '>=', dDate);
      })
      .first('aldi_price_currency_periods.currency_code');
      
    console.log("Period for cpId 7:", period);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
