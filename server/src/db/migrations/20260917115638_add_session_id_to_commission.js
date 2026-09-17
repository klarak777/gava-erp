/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('aldi_commission_lines', 'pick_session_id');
  if (!hasColumn) {
    await knex.schema.alterTable('aldi_commission_lines', table => {
      table.string('pick_session_id', 100).nullable().index();
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('aldi_commission_lines', 'pick_session_id');
  if (hasColumn) {
    await knex.schema.alterTable('aldi_commission_lines', table => {
      table.dropColumn('pick_session_id');
    });
  }
};
