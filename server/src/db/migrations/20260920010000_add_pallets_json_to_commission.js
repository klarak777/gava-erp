/**
 * Migration: Add pallets_json to sscc_labels and aldi_commission_lines
 * Supports multiple pallet types per commission pick.
 * pallets_json stores a JSON array of {id, name, category, tare_weight_kg} objects.
 */
exports.up = async function(knex) {
  const hasColSscc = await knex.schema.hasColumn('sscc_labels', 'pallets_json');
  if (!hasColSscc) {
    await knex.schema.alterTable('sscc_labels', table => {
      table.text('pallets_json').nullable();
    });
  }

  const hasColComm = await knex.schema.hasColumn('aldi_commission_lines', 'pallets_json');
  if (!hasColComm) {
    await knex.schema.alterTable('aldi_commission_lines', table => {
      table.text('pallets_json').nullable();
    });
  }
};

exports.down = async function(knex) {
  const hasColSscc = await knex.schema.hasColumn('sscc_labels', 'pallets_json');
  if (hasColSscc) {
    await knex.schema.alterTable('sscc_labels', table => {
      table.dropColumn('pallets_json');
    });
  }

  const hasColComm = await knex.schema.hasColumn('aldi_commission_lines', 'pallets_json');
  if (hasColComm) {
    await knex.schema.alterTable('aldi_commission_lines', table => {
      table.dropColumn('pallets_json');
    });
  }
};
