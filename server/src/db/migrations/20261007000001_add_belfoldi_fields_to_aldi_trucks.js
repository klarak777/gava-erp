exports.up = async function(knex) {
  await knex.schema.alterTable('aldi_trucks', table => {
    table.decimal('crossdock_pallets', 10, 2).nullable();
    table.string('truck_comment').nullable();
    table.string('invoice_number').nullable();
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('aldi_trucks', table => {
    table.dropColumn('crossdock_pallets');
    table.dropColumn('truck_comment');
    table.dropColumn('invoice_number');
  });
};
