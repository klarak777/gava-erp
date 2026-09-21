exports.up = function(knex) {
  return knex.schema.table('sscc_labels', function(table) {
    table.decimal('gross_weight', 10, 2).nullable();
    table.decimal('net_weight', 10, 2).nullable();
    table.string('lot_number').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('sscc_labels', function(table) {
    table.dropColumn('gross_weight');
    table.dropColumn('net_weight');
    table.dropColumn('lot_number');
  });
};
