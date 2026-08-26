exports.up = function(knex) {
  return knex.schema.alterTable('aldi_daily_order_lines', function(table) {
    table.integer('cartons_per_pallet').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('aldi_daily_order_lines', function(table) {
    table.dropColumn('cartons_per_pallet');
  });
};
