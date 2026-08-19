exports.up = function(knex) {
  return knex.schema.alterTable('aldi_daily_order_lines', function(table) {
    // Change integer to decimal for fractional quantities (e.g. 4.371)
    table.decimal('ordered_cartons', 10, 3).notNullable().alter();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('aldi_daily_order_lines', function(table) {
    // Note: Reverting to integer might cause data loss for decimal quantities
    table.integer('ordered_cartons').notNullable().alter();
  });
};
