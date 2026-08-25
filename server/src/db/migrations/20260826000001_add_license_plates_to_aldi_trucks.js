exports.up = async function(knex) {
  await knex.schema.table('aldi_trucks', table => {
    table.string('license_plate_1').nullable();
    table.string('license_plate_2').nullable();
  });
};

exports.down = async function(knex) {
  await knex.schema.table('aldi_trucks', table => {
    table.dropColumn('license_plate_1');
    table.dropColumn('license_plate_2');
  });
};
