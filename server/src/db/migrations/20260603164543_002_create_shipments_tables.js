/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('shipments', table => {
      table.increments('id').primary();
      table.string('order_number').notNullable(); // e.g. "GHU 240"
      table.string('truck_type'); // "BEL", "EX", "GHU", "H", "LOG"
      table.integer('truck_seq_number'); // e.g. 240
      table.integer('season_id').unsigned().references('id').inTable('seasons').onDelete('CASCADE');
      table.integer('transporter_id').unsigned().references('id').inTable('transporters').onDelete('SET NULL');
      
      table.string('plate_number');
      table.string('loading_place');
      table.date('loading_date');
      table.date('unloading_date');
      table.date('arrival_date');
      
      table.decimal('transport_price', 14, 2);
      table.string('transport_currency').defaultTo('EUR');
      
      table.decimal('invoice_amount_eur', 14, 2);
      table.decimal('invoice_amount_huf', 14, 2);
      table.string('invoice_number');
      table.date('payment_date');
      table.string('comment');
      
      table.string('file_path'); // Path to .xlsm
      table.boolean('is_receipted').defaultTo(false); // Bevételezve
      
      table.decimal('kb', 14, 2);
      table.decimal('b', 14, 2);
      table.decimal('t', 14, 2);
      
      table.timestamps(true, true);

      // Composite unique constraint
      table.unique(['order_number', 'season_id']);
    })
    .createTable('shipment_lines', table => {
      table.increments('id').primary();
      table.integer('shipment_id').unsigned().references('id').inTable('shipments').onDelete('CASCADE');
      table.integer('product_id').unsigned().references('id').inTable('products').onDelete('SET NULL');
      table.integer('partner_id').unsigned().references('id').inTable('partners').onDelete('SET NULL');
      
      table.string('customer');
      table.string('destination');
      
      table.integer('euro_palets').defaultTo(0);
      table.integer('normal_palets').defaultTo(0);
      table.decimal('total_palets', 10, 2); // Calculated or stored snapshot
      
      table.decimal('gross_weight_kg', 10, 2);
      table.decimal('price_eur', 10, 2);
      table.decimal('price_bcn_eur', 10, 2);
      table.string('unit');
      table.decimal('reloading_per_plt', 10, 2);
      table.decimal('transport_bcn_per_plt', 10, 2);
      table.string('albaran_number');
      
      table.decimal('transport_cost', 10, 2); // Calculated or stored snapshot
      table.decimal('transport_cost_product', 10, 2); // Calculated or stored snapshot
      table.string('comment');
      
      table.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('shipment_lines')
    .dropTableIfExists('shipments');
};
