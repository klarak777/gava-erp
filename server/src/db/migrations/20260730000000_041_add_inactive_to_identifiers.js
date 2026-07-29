/**
 * Migration 041: Add is_inactive column to partner_identifiers
 * Inactive identifiers are shown in partner editor but excluded from Admin module dropdowns.
 */
exports.up = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('partner_identifiers', 'is_inactive');
  if (!hasColumn) {
    await knex.schema.alterTable('partner_identifiers', table => {
      table.boolean('is_inactive').defaultTo(false).notNullable();
    });
  }
};

exports.down = async function(knex) {
  await knex.schema.alterTable('partner_identifiers', table => {
    table.dropColumn('is_inactive');
  });
};
