exports.up = function(knex) {
  return knex.schema.alterTable('aldi_daily_orders', function(table) {
    table.boolean('sent_to_rakodas').defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('aldi_daily_orders', function(table) {
    table.dropColumn('sent_to_rakodas');
  });
};
