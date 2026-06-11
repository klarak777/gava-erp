/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('loading_events', table => {
      table.increments('id').primary();
      table.integer('shipment_id').unsigned().references('id').inTable('shipments').onDelete('CASCADE');
      table.date('loading_date');
      table.string('loading_place');
      table.boolean('is_loaded').defaultTo(false);
      table.datetime('loaded_at');
      table.integer('created_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
      table.timestamps(true, true);
    })
    .createTable('transport_orders', table => {
      table.increments('id').primary();
      table.integer('shipment_id').unsigned().references('id').inTable('shipments').onDelete('CASCADE');
      table.integer('season_id').unsigned().references('id').inTable('seasons').onDelete('SET NULL');
      table.integer('transporter_id').unsigned().references('id').inTable('transporters').onDelete('SET NULL');
      table.string('document_name');
      table.string('file_path');
      table.date('loading_date');
      table.boolean('is_sent').defaultTo(false);
      table.timestamps(true, true);
    })
    .createTable('ekaer_records', table => {
      table.increments('id').primary();
      table.integer('shipment_id').unsigned().references('id').inTable('shipments').onDelete('CASCADE');
      table.integer('season_id').unsigned().references('id').inTable('seasons').onDelete('SET NULL');
      table.integer('transporter_id').unsigned().references('id').inTable('transporters').onDelete('SET NULL');
      table.string('ekaer_file_name');
      table.string('file_path');
      table.date('load_date');
      table.boolean('is_sent').defaultTo(false);
      table.timestamps(true, true);
    })
    .createTable('product_demands', table => {
      table.increments('id').primary();
      table.integer('loading_event_id').unsigned().references('id').inTable('loading_events').onDelete('CASCADE');
      table.integer('product_id').unsigned().references('id').inTable('products').onDelete('SET NULL');
      table.integer('partner_id').unsigned().references('id').inTable('partners').onDelete('SET NULL');
      table.string('customer_name');
      table.integer('pallet_count');
      table.boolean('is_sent_to_truck').defaultTo(false);
      table.datetime('sent_at');
      table.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('product_demands')
    .dropTableIfExists('ekaer_records')
    .dropTableIfExists('transport_orders')
    .dropTableIfExists('loading_events');
};
