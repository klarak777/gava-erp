exports.up = async function(knex) {
  await knex.schema.table('aldi_weekly_commitment_items', table => {
    table.jsonb('daily_values').nullable();
    // xlsx_product_name már létezhet, ha nem, adjuk hozzá
  });
};

exports.down = async function(knex) {
  await knex.schema.table('aldi_weekly_commitment_items', table => {
    table.dropColumn('daily_values');
  });
};
