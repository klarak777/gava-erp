exports.up = function(knex) {
  return knex.schema.alterTable('ref_packaging_types', table => {
    table.string('category').nullable();
    table.decimal('tare_weight_kg', 10, 3).nullable();
    table.decimal('width_cm', 10, 2).nullable();
    table.decimal('length_cm', 10, 2).nullable();
    table.decimal('height_cm', 10, 2).nullable();
    table.boolean('is_deposit_required').defaultTo(false);
    table.boolean('is_inventory_tracked').defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('ref_packaging_types', table => {
    table.dropColumn('category');
    table.dropColumn('tare_weight_kg');
    table.dropColumn('width_cm');
    table.dropColumn('length_cm');
    table.dropColumn('height_cm');
    table.dropColumn('is_deposit_required');
    table.dropColumn('is_inventory_tracked');
  });
};
