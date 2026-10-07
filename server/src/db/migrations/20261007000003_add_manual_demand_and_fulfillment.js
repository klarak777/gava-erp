exports.up = async function(knex) {
  // 1. Add manual inputs and action days to weekly commitments items
  await knex.schema.alterTable('aldi_weekly_commitment_items', table => {
    table.decimal('manual_action_demand', 10, 2).nullable();
    table.decimal('manual_normal_demand', 10, 2).nullable();
    table.jsonb('action_days_json').nullable(); // Pl. ["mon", "tue"]
  });

  // 2. Add fulfilled cartons to daily order lines
  await knex.schema.alterTable('aldi_daily_order_lines', table => {
    table.decimal('fulfilled_cartons', 10, 2).defaultTo(0);
  });

  // 3. Add locked status to daily orders
  await knex.schema.alterTable('aldi_daily_orders', table => {
    table.boolean('is_locked_for_distribution').defaultTo(false);
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('aldi_daily_orders', table => {
    table.dropColumn('is_locked_for_distribution');
  });

  await knex.schema.alterTable('aldi_daily_order_lines', table => {
    table.dropColumn('fulfilled_cartons');
  });

  await knex.schema.alterTable('aldi_weekly_commitment_items', table => {
    table.dropColumn('manual_action_demand');
    table.dropColumn('manual_normal_demand');
    table.dropColumn('action_days_json');
  });
};
