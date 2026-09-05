exports.up = function(knex) {
  return knex.schema
    .table('aldi_locations', function(table) {
      table.string('status', 50).notNullable().defaultTo('Aktív'); // Aktív, Zárolt
      table.string('location_type', 50).nullable(); // Raklap, Komissió, stb.
      table.integer('capacity').notNullable().defaultTo(1);
      table.text('notes').nullable();
    })
    .createTable('aldi_stock_locations', function(table) {
      table.increments('id').primary();
      table.integer('location_id').unsigned().notNullable()
        .references('id').inTable('aldi_locations').onDelete('CASCADE');
      table.integer('order_line_id').unsigned().notNullable()
        .references('id').inTable('aldi_daily_order_lines').onDelete('CASCADE');
      table.integer('quantity_cartons').notNullable();
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('aldi_stock_locations')
    .table('aldi_locations', function(table) {
      table.dropColumn('status');
      table.dropColumn('location_type');
      table.dropColumn('capacity');
      table.dropColumn('notes');
    });
};
