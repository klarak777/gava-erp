exports.up = async function(knex) {
  await knex.schema.alterTable('aldi_truck_lines', table => {
    table.string('komment').nullable();
    table.decimal('fuvar_koltseg', 12, 2).nullable();
    table.decimal('raklap_ar', 12, 2).nullable();
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('aldi_truck_lines', table => {
    table.dropColumn('komment');
    table.dropColumn('fuvar_koltseg');
    table.dropColumn('raklap_ar');
  });
};
