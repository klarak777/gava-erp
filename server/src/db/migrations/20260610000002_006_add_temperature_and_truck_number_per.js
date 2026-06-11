/**
 * Migration: Add temperature to shipments, truck_number_per to shipment_lines
 * @param { import("knex").Knex } knex
 */
exports.up = function(knex) {
  return knex.schema
    .table('shipments', table => {
      // Szállítási hőmérséklet (pl. "2-8°C", "-18°C", "ambient")
      table.string('temperature').nullable();
    })
    .table('shipment_lines', table => {
      // Kamionszám per – egy termékhez/szezonhoz/kamionhoz kapcsolódó szám
      table.decimal('truck_number_per', 10, 4).nullable().defaultTo(0);
    });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function(knex) {
  return knex.schema
    .table('shipments', table => {
      table.dropColumn('temperature');
    })
    .table('shipment_lines', table => {
      table.dropColumn('truck_number_per');
    });
};
