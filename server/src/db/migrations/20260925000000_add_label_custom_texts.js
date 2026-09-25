/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('chain_products', table => {
    table.jsonb('label_custom_texts').defaultTo('{}');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('chain_products', table => {
    table.dropColumn('label_custom_texts');
  });
};
