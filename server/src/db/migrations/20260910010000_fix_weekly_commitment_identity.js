exports.up = async function(knex) {
  await knex.schema.alterTable('aldi_weekly_commitment_items', table => {
    table.string('xlsx_product_name').nullable();
  });
  // Article number is the canonical identity; never store chain_products IDs in a products FK.
  await knex('aldi_weekly_commitment_items').update({ product_id: null });
  await knex.raw(`UPDATE aldi_weekly_stock_inputs s
    SET article_number = p.code
    FROM products p
    WHERE s.product_id = p.id AND s.article_number IS NULL
      AND NOT EXISTS (SELECT 1 FROM aldi_weekly_stock_inputs other
        WHERE other.year = s.year AND other.week_number = s.week_number AND other.article_number = p.code)`);
};
exports.down = async function(knex) {
  await knex.schema.alterTable('aldi_weekly_commitment_items', table => table.dropColumn('xlsx_product_name'));
};
