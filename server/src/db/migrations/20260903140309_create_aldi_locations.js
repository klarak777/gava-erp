exports.up = function(knex) {
  return knex.schema.createTable('aldi_locations', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('barcode').notNullable().unique();
    table.string('type_code', 10).notNullable(); // H, CS, R
    table.integer('building_num').notNullable(); // 1, 2, stb. (vagy rámpa száma)
    table.integer('row_num').nullable();
    table.integer('aisle_num').nullable();
    table.integer('location_num').nullable();
    table.string('cooling_type', 50).nullable(); // Hideg, Meleg, Vegyes
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('aldi_locations');
};
