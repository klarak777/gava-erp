exports.up = knex => knex.schema.createTable('pda_pick_entries', table => {
  table.string('pick_session_id', 64).primary();
  table.integer('aldi_truck_line_id').notNullable().references('id').inTable('aldi_truck_lines').onDelete('CASCADE');
  table.integer('picker_user_id').notNullable().references('id').inTable('employees');
  table.string('picker_session_id', 64).notNullable();
  table.timestamp('reservation_expires_at', { useTz: true }).notNullable();
  table.timestamp('released_at', { useTz: true }).nullable();
  table.timestamp('completed_at', { useTz: true }).nullable();
  table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  table.index(['aldi_truck_line_id', 'reservation_expires_at']);
});

exports.down = knex => knex.schema.dropTableIfExists('pda_pick_entries');
