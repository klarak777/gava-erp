/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('cargo_demands', table => {
    table.string('albaran_number').nullable();
    table.string('destination').nullable();
    table.decimal('gross_weight_kg', 10, 2).defaultTo(0);
    table.decimal('price_eur', 10, 2).defaultTo(0);
    table.decimal('price_bcn_eur', 10, 2).defaultTo(0);
    table.string('unit').nullable();
    table.decimal('reloading_per_plt', 10, 2).defaultTo(0);
    table.decimal('transport_bcn_per_plt', 10, 2).defaultTo(0);
    table.string('customer_order_no').nullable();
    table.string('comment').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('cargo_demands', table => {
    table.dropColumn('albaran_number');
    table.dropColumn('destination');
    table.dropColumn('gross_weight_kg');
    table.dropColumn('price_eur');
    table.dropColumn('price_bcn_eur');
    table.dropColumn('unit');
    table.dropColumn('reloading_per_plt');
    table.dropColumn('transport_bcn_per_plt');
    table.dropColumn('customer_order_no');
    table.dropColumn('comment');
  });
};
