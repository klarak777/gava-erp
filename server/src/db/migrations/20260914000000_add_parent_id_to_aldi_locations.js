exports.up = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('aldi_locations', 'parent_id');
  if (!hasColumn) {
    await knex.schema.table('aldi_locations', function(table) {
      table.integer('parent_id').unsigned().nullable()
        .references('id').inTable('aldi_locations').onDelete('CASCADE');
    });
  }
};

exports.down = function(knex) {
  return knex.schema.table('aldi_locations', function(table) {
    table.dropColumn('parent_id');
  });
};
