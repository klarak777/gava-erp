/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('aldi_price_currency_periods_archive', function(table) {
    table.increments('id').primary();
    
    // Eredeti mezők az aldi_price_currency_periods táblából
    table.integer('original_id').notNullable();
    table.integer('price_line_id').notNullable();
    table.string('currency_code', 10).notNullable();
    table.date('period_start').notNullable();
    table.date('period_end').notNullable();
    table.string('crate_cost', 50);
    table.string('unit_cost', 50);
    table.text('note');
    table.timestamp('original_created_at');
    table.timestamp('original_updated_at');

    // Archív metaadatok
    table.string('deleted_reason').notNullable(); // pl: 'invalid_outside'
    table.timestamp('archived_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('aldi_price_currency_periods_archive');
};
