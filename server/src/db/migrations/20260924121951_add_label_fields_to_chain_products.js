/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('chain_products', table => {
    table.string('label_class', 100);
    table.string('label_size', 100);
    table.string('label_origin', 255);
    table.string('label_lot', 100);
    table.string('label_gln', 100);
    table.string('label_net_weight_carton', 100);
    table.string('label_net_weight_unit', 100);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('chain_products', table => {
    table.dropColumns('label_class', 'label_size', 'label_origin', 'label_lot', 'label_gln', 'label_net_weight_carton', 'label_net_weight_unit');
  });
};
