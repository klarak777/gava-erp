exports.up = async function(knex) {
  await knex.schema.alterTable('sscc_labels', table => {
    table.integer('aldi_truck_line_id').unsigned().references('id').inTable('aldi_truck_lines').onDelete('CASCADE');
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('sscc_labels', table => {
    table.dropColumn('aldi_truck_line_id');
  });
};
