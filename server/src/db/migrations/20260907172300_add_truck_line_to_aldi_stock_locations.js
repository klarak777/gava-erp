exports.up = function(knex) {
  return knex.schema.alterTable('aldi_stock_locations', function(table) {
    table.integer('order_line_id').nullable().alter();
    table.integer('truck_line_id').unsigned().nullable().references('id').inTable('aldi_truck_lines').onDelete('CASCADE');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('aldi_stock_locations', function(table) {
    table.integer('order_line_id').notNullable().alter();
    table.dropColumn('truck_line_id');
  });
};
