exports.up = function(knex) {
  return knex.schema.createTable('sscc_labels', table => {
    table.increments('id').primary();
    table.string('sscc', 18).notNullable().unique();
    table.integer('commission_line_id').unsigned().references('id').inTable('aldi_truck_lines').onDelete('CASCADE');
    table.integer('picked_cartons').notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('sscc_labels');
};
