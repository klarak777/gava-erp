exports.up = function(knex) {
  return knex.schema.alterTable('shipment_lines', table => {
    table.boolean('is_received').defaultTo(false).notNullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('shipment_lines', table => {
    table.dropColumn('is_received');
  });
};
