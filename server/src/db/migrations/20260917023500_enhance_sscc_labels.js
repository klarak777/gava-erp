exports.up = function(knex) {
  return knex.schema.alterTable('sscc_labels', table => {
    table.string('truck_number', 100);
    table.string('product_name', 255);
    table.string('delivery_date', 50);
    table.string('supplier', 255);
    table.string('destination', 255);
    table.string('origin_country', 100);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('sscc_labels', table => {
    table.dropColumn('truck_number');
    table.dropColumn('product_name');
    table.dropColumn('delivery_date');
    table.dropColumn('supplier');
    table.dropColumn('destination');
    table.dropColumn('origin_country');
  });
};
