exports.up = async function(knex) {
  // aldi_trucks table
  await knex.schema.createTable('aldi_trucks', table => {
    table.increments('id').primary();
    table.string('truck_number').notNullable();
    table.date('delivery_date').notNullable();
    table.string('transporter').nullable();
    table.boolean('sent_to_pda').defaultTo(false);
    table.integer('preparation_status').defaultTo(0);
    table.boolean('is_loaded').defaultTo(false);
    table.timestamps(true, true);
  });

  // aldi_truck_lines table
  await knex.schema.createTable('aldi_truck_lines', table => {
    table.increments('id').primary();
    table.integer('aldi_truck_id').unsigned().notNullable()
      .references('id').inTable('aldi_trucks').onDelete('CASCADE');
    
    // Link to the daily order line if it comes from an order
    table.integer('aldi_daily_order_line_id').unsigned().nullable()
      .references('id').inTable('aldi_daily_order_lines').onDelete('SET NULL');
    
    table.string('product_name').notNullable();
    table.integer('ordered_cartons').notNullable();
    table.integer('cartons_per_pallet').nullable();
    table.decimal('pallets', 10, 2).nullable();
    table.date('delivery_date').nullable();
    table.string('order_number').nullable();
    table.string('order_type').nullable();
    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('aldi_truck_lines');
  await knex.schema.dropTableIfExists('aldi_trucks');
};
