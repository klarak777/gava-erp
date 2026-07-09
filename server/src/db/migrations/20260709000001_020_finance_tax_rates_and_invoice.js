/**
 * Migration: Add finance_tax_rates table and invoice_number_finance to shipment_lines
 */
exports.up = function(knex) {
  return knex.schema.createTable('finance_tax_rates', table => {
    table.increments('id').primary();
    table.decimal('rate_value', 5, 2).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  })
  .then(() => {
    return knex('finance_tax_rates').insert([
      { rate_value: 0.00 },
      { rate_value: 5.00 },
      { rate_value: 12.00 },
      { rate_value: 18.00 },
      { rate_value: 25.00 },
      { rate_value: 27.00 }
    ]);
  })
  .then(() => {
    return knex.schema.alterTable('shipment_lines', table => {
      table.string('invoice_number_finance').nullable();
    });
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('shipment_lines', table => {
    table.dropColumn('invoice_number_finance');
  })
  .then(() => {
    return knex.schema.dropTableIfExists('finance_tax_rates');
  });
};
