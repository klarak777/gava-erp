/**
 * Migration 008: cargo_demands tábla létrehozása
 * Az "Áru igény" funkcióhoz – független tábla, euro és normál raklap bontással.
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('cargo_demands', table => {
    table.increments('id').primary();

    // Termék adatok (product_id ha az adatbázisban van, egyébként szabad szöveges)
    table.integer('product_id').unsigned().references('id').inTable('products').onDelete('SET NULL').nullable();
    table.string('product_name').notNullable(); // Mindig kitöltve (akár product_id-ből, akár kézzel)

    // Kapcsolódó adatok (opcionális)
    table.string('partner_name').nullable();
    table.string('customer_name').nullable();

    // Raklap bontás (euró és normál külön)
    table.integer('euro_palets').defaultTo(0).notNullable();
    table.integer('normal_palets').defaultTo(0).notNullable();

    // Megjegyzés
    table.string('notes').nullable();

    // Státusz: el lett-e küldve kamionra
    table.boolean('is_fulfilled').defaultTo(false).notNullable();
    table.datetime('fulfilled_at').nullable();
    table.integer('fulfilled_shipment_id').unsigned().references('id').inTable('shipments').onDelete('SET NULL').nullable();

    // Forrás: melyik shipment_line-ból jött (áthelyezés esetén vagy raklap-csökkentéskor)
    table.integer('source_shipment_line_id').nullable(); // nem FK, hogy törlés esetén megmaradjon

    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('cargo_demands');
};
