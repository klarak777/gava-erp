exports.up = async knex => {
  await knex.schema.alterTable('aldi_weekly_commitments', table => {
    table.jsonb('distribution_rates').nullable();
    table.integer('rates_version').notNullable().defaultTo(0);
  });
};
exports.down = async knex => {
  await knex.schema.alterTable('aldi_weekly_commitments', table => {
    table.dropColumn('distribution_rates');
    table.dropColumn('rates_version');
  });
};
