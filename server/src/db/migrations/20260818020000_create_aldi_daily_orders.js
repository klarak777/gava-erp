exports.up = function(knex) {
  return knex.schema
    .createTable('aldi_daily_orders', function(table) {
      table.increments('id').primary();
      table.string('order_number', 100).notNullable();
      table.date('delivery_date').notNullable();
      table.decimal('pallet_count', 10, 2).notNullable();
      table.text('pdf_file_path');
      table.text('network_folder_path');
      table.timestamps(true, true);
    })
    .createTable('aldi_daily_order_lines', function(table) {
      table.increments('id').primary();
      table.integer('daily_order_id').unsigned().references('id').inTable('aldi_daily_orders').onDelete('CASCADE');
      table.string('gtin', 50).notNullable();
      table.integer('ordered_cartons').notNullable();
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('aldi_daily_order_lines')
    .dropTableIfExists('aldi_daily_orders');
};
