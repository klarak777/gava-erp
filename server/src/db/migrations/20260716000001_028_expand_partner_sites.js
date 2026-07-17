/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('partner_sites', table => {
    table.string('district').nullable();
    table.string('building').nullable();
    table.string('staircase').nullable();
    table.string('floor').nullable();
    table.string('door').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('partner_sites', table => {
    table.dropColumn('district');
    table.dropColumn('building');
    table.dropColumn('staircase');
    table.dropColumn('floor');
    table.dropColumn('door');
  });
};
