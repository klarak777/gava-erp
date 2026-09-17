exports.up = async knex => {
  await knex.schema.alterTable('aldi_daily_orders', table => {
    table.string('content_hash', 64).nullable().unique();
  });
  await knex.schema.alterTable('aldi_daily_order_lines', table => {
    table.string('action_code', 30).nullable();
  });
};

exports.down = async knex => {
  await knex.schema.alterTable('aldi_daily_order_lines', table => {
    table.dropColumn('action_code');
  });
  await knex.schema.alterTable('aldi_daily_orders', table => {
    table.dropColumn('content_hash');
  });
};
