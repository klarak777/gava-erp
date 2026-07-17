/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('partners', table => {
    table.string('comm_lang').nullable();
    table.string('excise_num').nullable();
    table.string('delivery_warehouse').nullable();
    table.string('default_transaction').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('partners', table => {
    table.dropColumn('comm_lang');
    table.dropColumn('excise_num');
    table.dropColumn('delivery_warehouse');
    table.dropColumn('default_transaction');
  });
};
