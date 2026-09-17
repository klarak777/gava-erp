exports.up = function(knex) {
  return knex.schema.createTable('printers', table => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('ip_address').notNullable();
    table.integer('port').notNullable().defaultTo(9100);
    table.string('barcode').unique(); // Azonosító vagy vonalkód a PDA beolvasáshoz
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('printers');
};
