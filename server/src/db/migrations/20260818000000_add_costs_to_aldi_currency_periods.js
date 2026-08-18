/**
 * Migration: Add crate_cost and unit_cost to aldi_price_currency_periods table
 */
exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('aldi_price_currency_periods');
  if (hasTable) {
    const hasCrateCost = await knex.schema.hasColumn('aldi_price_currency_periods', 'crate_cost');
    if (!hasCrateCost) {
      await knex.schema.alterTable('aldi_price_currency_periods', table => {
        table.string('crate_cost', 100).nullable();
        table.string('unit_cost', 100).nullable();
      });
    }
  }
};

exports.down = async function(knex) {
  const hasTable = await knex.schema.hasTable('aldi_price_currency_periods');
  if (hasTable) {
    await knex.schema.alterTable('aldi_price_currency_periods', table => {
      table.dropColumn('crate_cost');
      table.dropColumn('unit_cost');
    });
  }
};
