/**
 * Migration 013: file_date mező hozzáadása a transport_orders és ekaer_records táblákhoz.
 * A dokumentum létrehozásának dátumát tároljuk (Fuvarm_FileDate, EKAER_FileDate a CSV-ből).
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .alterTable('transport_orders', table => {
      table.date('file_date').nullable(); // Dokumentum létrehozás dátuma
    })
    .alterTable('ekaer_records', table => {
      table.date('file_date').nullable(); // Dokumentum létrehozás dátuma
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .alterTable('transport_orders', table => {
      table.dropColumn('file_date');
    })
    .alterTable('ekaer_records', table => {
      table.dropColumn('file_date');
    });
};
