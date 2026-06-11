/**
 * Migration: Add is_loaded boolean field to shipments
 * @param { import("knex").Knex } knex
 */
exports.up = function(knex) {
  return knex.schema.table('shipments', table => {
    table.boolean('is_loaded').notNullable().defaultTo(false);
  });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function(knex) {
  return knex.schema.table('shipments', table => {
    table.dropColumn('is_loaded');
  });
};
