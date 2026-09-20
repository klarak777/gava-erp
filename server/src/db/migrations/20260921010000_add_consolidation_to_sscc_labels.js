/**
 * Migration: Add consolidation fields to sscc_labels
 * consolidated_sscc: if this label is a tag, stores the master SSCC
 * is_consolidated_master: true if this label is the consolidation master record
 */
exports.up = async function(knex) {
  const hasMaster = await knex.schema.hasColumn('sscc_labels', 'is_consolidated_master');
  const hasConsolidated = await knex.schema.hasColumn('sscc_labels', 'consolidated_sscc');
  await knex.schema.alterTable('sscc_labels', table => {
    if (!hasMaster) table.boolean('is_consolidated_master').defaultTo(false);
    if (!hasConsolidated) table.string('consolidated_sscc', 30).nullable();
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('sscc_labels', table => {
    table.dropColumn('is_consolidated_master');
    table.dropColumn('consolidated_sscc');
  });
};
