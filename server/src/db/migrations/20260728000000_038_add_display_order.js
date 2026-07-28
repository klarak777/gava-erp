exports.up = function(knex) {
  return knex.schema.alterTable('shipment_lines', table => {
    table.integer('display_order').defaultTo(0);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('shipment_lines', table => {
    table.dropColumn('display_order');
  });
};
