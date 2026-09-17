/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // A biztonság kedvéért explicit alteráljuk a típust a DB-specifikus megoldással
  return knex.raw('ALTER TABLE aldi_commission_lines ALTER COLUMN pallets TYPE integer USING (ROUND(pallets))');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  return knex.schema.alterTable('aldi_commission_lines', function(table) {
    table.decimal('pallets', 10, 2).alter();
  });
};
