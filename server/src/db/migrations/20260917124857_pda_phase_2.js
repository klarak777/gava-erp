/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Clear duplicate pick_session_ids
  await knex.raw(`
    UPDATE aldi_commission_lines 
    SET pick_session_id = NULL 
    WHERE id NOT IN (
      SELECT MAX(id) 
      FROM aldi_commission_lines 
      WHERE pick_session_id IS NOT NULL 
      GROUP BY pick_session_id
    ) 
    AND pick_session_id IS NOT NULL;
  `);

  // 2. Add UNIQUE constraint to pick_session_id
  await knex.schema.alterTable('aldi_commission_lines', table => {
    table.unique('pick_session_id');
  });

  // 3. Add commission_line_id to aldi_stock_locations
  const hasCol = await knex.schema.hasColumn('aldi_stock_locations', 'commission_line_id');
  if (!hasCol) {
    await knex.schema.alterTable('aldi_stock_locations', table => {
      table.integer('commission_line_id').unsigned().nullable();
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const hasCol = await knex.schema.hasColumn('aldi_stock_locations', 'commission_line_id');
  if (hasCol) {
    await knex.schema.alterTable('aldi_stock_locations', table => {
      table.dropColumn('commission_line_id');
    });
  }

  await knex.schema.alterTable('aldi_commission_lines', table => {
    table.dropUnique('pick_session_id');
  });
};
