exports.up = function(knex) {
  return knex.schema.alterTable('shipment_lines', table => {
    table.string('loading_place').nullable();
    table.string('unload_place').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('shipment_lines', table => {
    table.dropColumn('loading_place');
    table.dropColumn('unload_place');
  });
};
