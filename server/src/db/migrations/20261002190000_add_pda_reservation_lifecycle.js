exports.up = async function(knex) {
  await knex.schema.alterTable('sscc_labels', table => {
    table.string('picker_session_id', 64).nullable();
    table.timestamp('reservation_expires_at', { useTz: true }).nullable();
    table.timestamp('reservation_cancelled_at', { useTz: true }).nullable();
    table.jsonb('pick_payload').nullable();
    table.date('lot_checked_date').nullable();
    table.timestamp('lot_confirmed_at', { useTz: true }).nullable();
  });
  // Régi címkéből nem következtetünk új bejelentkezési jogosultságra.
  // Az átállás előtt az aktív komissiókat le kell zárni.
  await knex.raw(`CREATE UNIQUE INDEX idx_sscc_labels_unique_pick_session
    ON sscc_labels (pick_session_id) WHERE pick_session_id IS NOT NULL`);
};

exports.down = async function(knex) {
  await knex.raw('DROP INDEX IF EXISTS idx_sscc_labels_unique_pick_session');
  await knex.schema.alterTable('sscc_labels', table => {
    table.dropColumns('picker_session_id', 'reservation_expires_at', 'reservation_cancelled_at', 'pick_payload', 'lot_checked_date', 'lot_confirmed_at');
  });
};
