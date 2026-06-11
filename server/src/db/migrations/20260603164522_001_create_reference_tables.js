/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('seasons', table => {
      table.increments('id').primary();
      table.string('code').notNullable().unique(); // e.g. "25-26"
      table.date('start_date');
      table.date('end_date');
      table.timestamps(true, true);
    })
    .createTable('transporters', table => {
      table.increments('id').primary();
      table.string('name').notNullable(); // e.g. "KÓNYA"
      table.string('code');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('products', table => {
      table.increments('id').primary();
      table.string('name').notNullable(); // e.g. "PEACH 7KG"
      table.string('category');
      table.string('reference'); // e.g. "VERMION FRESH"
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('partners', table => {
      table.increments('id').primary();
      table.string('name').notNullable(); // e.g. "ALDI"
      table.string('type'); // "vevő", "szállító", "felrakó"
      table.string('address');
      table.string('contact');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('users', table => {
      table.increments('id').primary();
      table.string('username').notNullable().unique();
      table.string('password_hash').notNullable();
      table.string('full_name');
      table.string('role'); // e.g. "Admin", "Iroda1"
      table.string('computer_name'); // For legacy compatibility if needed
      table.boolean('is_active').defaultTo(true);
      table.datetime('last_login');
      table.timestamps(true, true);
    })
    .createTable('pallet_conversion', table => {
      table.integer('normal_count').primary(); // 1, 2, 3...
      table.integer('euro_equivalent').notNullable(); // 1, 3, 4...
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('pallet_conversion')
    .dropTableIfExists('users')
    .dropTableIfExists('partners')
    .dropTableIfExists('products')
    .dropTableIfExists('transporters')
    .dropTableIfExists('seasons');
};
