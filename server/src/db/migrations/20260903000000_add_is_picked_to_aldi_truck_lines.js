exports.up = async function(knex) {
  await knex.schema.alterTable('aldi_truck_lines', table => {
    table.boolean('is_picked').defaultTo(false);
    table.integer('picked_cartons').nullable();
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('aldi_truck_lines', table => {
    table.dropColumn('is_picked');
    table.dropColumn('picked_cartons');
  });
};
