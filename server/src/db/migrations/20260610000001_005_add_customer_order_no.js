/**
 * Migration: Add customer_order_no column to shipment_lines
 * @param { import("knex").Knex } knex
 */
exports.up = function(knex) {
  return knex.schema.table('shipment_lines', table => {
    table.string('customer_order_no').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function(knex) {
  return knex.schema.table('shipment_lines', table => {
    table.dropColumn('customer_order_no');
  });
};
