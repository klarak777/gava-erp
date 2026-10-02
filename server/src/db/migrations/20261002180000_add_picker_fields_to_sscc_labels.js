/**
 * Migration: pick_session_id és picker_user_id hozzáadása az sscc_labels táblához
 * + Web emulátoros tesztdolgozó felvétele az employees táblába
 *
 * A zárolás az sscc_labels tábla ideiglenes (is_provisional=true) rekordjain alapul,
 * nem az aldi_truck_lines soron. Ez biztosítja, hogy az első dolgozó jogos komissiója
 * ne ütközzön a második dolgozó zárolásába.
 */
exports.up = async function(knex) {
  // 1. sscc_labels tábla bővítése
  await knex.schema.alterTable('sscc_labels', table => {
    table.string('pick_session_id', 64).nullable().defaultTo(null)
      .comment('A kliens által generált egyedi munkamenet azonosító, ideiglenes cimkét köti a véglegesítéshez');
    table.integer('picker_user_id').unsigned().nullable().defaultTo(null)
      .references('id').inTable('employees').onDelete('SET NULL')
      .comment('A cimkét generáló dolgozó employees.id-ja (zárolás ellenőrzéshez)');
  });

  // 2. Index a pick_session_id gyors kereséshez
  await knex.schema.raw(`
    CREATE INDEX IF NOT EXISTS idx_sscc_labels_pick_session_id
    ON sscc_labels (pick_session_id)
    WHERE pick_session_id IS NOT NULL
  `);

  // 3. Index a picker_user_id + is_provisional kombinációhoz (zárolás keresés)
  await knex.schema.raw(`
    CREATE INDEX IF NOT EXISTS idx_sscc_labels_provisional_picker
    ON sscc_labels (aldi_truck_line_id, picker_user_id, is_provisional, created_at)
    WHERE is_provisional = true
  `);

  // 4. Web emulátoros tesztdolgozó felvétele (ha még nincs)
  const existing = await knex('employees').where('pda_identifier', 'WEB_EMULATOR_TEST').first();
  if (!existing) {
    await knex('employees').insert({
      full_name: 'Web Emulátor Tesztelő',
      pda_identifier: 'WEB_EMULATOR_TEST',
      role: 'pda_tester',
      status: 'Aktív',
      created_at: new Date(),
      updated_at: new Date()
    });
  }
};

exports.down = async function(knex) {
  // Tesztdolgozó törlése
  await knex('employees').where('pda_identifier', 'WEB_EMULATOR_TEST').del();

  // Index törlések
  await knex.schema.raw('DROP INDEX IF EXISTS idx_sscc_labels_provisional_picker');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_sscc_labels_pick_session_id');

  // Oszlop törlések
  await knex.schema.alterTable('sscc_labels', table => {
    table.dropColumn('picker_user_id');
    table.dropColumn('pick_session_id');
  });
};
