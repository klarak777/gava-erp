exports.up = async function(knex) {
  await knex.schema.alterTable('employees', function(table) {
    table.string('address_country');
    table.string('address_zip');
    table.string('address_city');
    table.string('address_street');
    table.string('address_type');
    table.string('address_number');
    table.string('address_building');
  });

  // Migráljuk át a régi address értéket a közterület nevébe, nehogy elvesszen
  await knex.raw('UPDATE employees SET address_street = address WHERE address IS NOT NULL');

  return knex.schema.alterTable('employees', function(table) {
    table.dropColumn('address');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('employees', function(table) {
    table.string('address');
    table.dropColumn('address_country');
    table.dropColumn('address_zip');
    table.dropColumn('address_city');
    table.dropColumn('address_street');
    table.dropColumn('address_type');
    table.dropColumn('address_number');
    table.dropColumn('address_building');
  });
};
