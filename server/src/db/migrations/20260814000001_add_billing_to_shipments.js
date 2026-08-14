/**
 * Migration: Számlázunk partner + összeg mezők a shipments táblához
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('shipments', table => {
    table.integer('billing_partner_id').unsigned().references('id').inTable('partners').onDelete('SET NULL').nullable();
    table.decimal('billing_amount', 14, 2).nullable();
    table.string('billing_currency').defaultTo('EUR').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('shipments', table => {
    table.dropColumn('billing_partner_id');
    table.dropColumn('billing_amount');
    table.dropColumn('billing_currency');
  });
};
