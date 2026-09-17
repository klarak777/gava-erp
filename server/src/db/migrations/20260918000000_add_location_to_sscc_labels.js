exports.up = function(knex) {
  return knex.schema.alterTable('sscc_labels', table => {
    table.string('location_name', 255);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('sscc_labels', table => {
    table.dropColumn('location_name');
  });
};
