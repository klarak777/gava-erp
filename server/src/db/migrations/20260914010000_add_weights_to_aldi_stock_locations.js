exports.up = async function(knex) {
  const hasGross = await knex.schema.hasColumn('aldi_stock_locations', 'gross_weight');
  if (!hasGross) {
    await knex.schema.table('aldi_stock_locations', function(table) {
      table.decimal('gross_weight', 10, 2).nullable();
      table.decimal('net_weight', 10, 2).nullable();
    });
  }
};

exports.down = function(knex) {
  return knex.schema.table('aldi_stock_locations', function(table) {
    table.dropColumn('gross_weight');
    table.dropColumn('net_weight');
  });
};
