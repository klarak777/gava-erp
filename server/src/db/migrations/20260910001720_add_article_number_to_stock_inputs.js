/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('aldi_weekly_stock_inputs', table => {
    table.string('article_number').nullable();
    table.dropUnique(['product_id', 'year', 'week_number']);
    table.unique(['article_number', 'year', 'week_number']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('aldi_weekly_stock_inputs', table => {
    table.dropUnique(['article_number', 'year', 'week_number']);
    table.dropColumn('article_number');
    table.unique(['product_id', 'year', 'week_number']);
  });
};
