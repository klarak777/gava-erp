exports.up = function(knex) {
  return knex.schema.alterTable('printers', table => {
    table.boolean('is_active').notNullable().defaultTo(true);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('printers', table => {
    table.dropColumn('is_active');
  });
};
