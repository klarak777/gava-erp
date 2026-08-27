exports.up = function(knex) {
  return knex.schema.alterTable('aldi_weekly_price_lines', function(table) {
    table.string('period_status').defaultTo('valid');
    table.date('original_period_start').nullable();
    table.date('original_period_end').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('aldi_weekly_price_lines', function(table) {
    table.dropColumn('period_status');
    table.dropColumn('original_period_start');
    table.dropColumn('original_period_end');
  });
};
