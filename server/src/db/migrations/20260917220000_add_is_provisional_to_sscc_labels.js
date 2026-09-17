exports.up = function(knex) {
  return knex.schema.alterTable('sscc_labels', table => {
    table.boolean('is_provisional').defaultTo(false).notNullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('sscc_labels', table => {
    table.dropColumn('is_provisional');
  });
};
