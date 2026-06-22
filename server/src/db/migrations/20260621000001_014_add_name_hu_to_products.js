/**
 * Migration 014: name_hu mező hozzáadása a products táblához.
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('products', table => {
    table.string('name_hu').nullable(); // Magyar fordítás
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('products', table => {
    table.dropColumn('name_hu');
  });
};
