/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Töröljük a rossz idegenkulcsot
  await knex.schema.alterTable('sscc_labels', table => {
    table.dropForeign('commission_line_id');
  });

  // 2. Tisztítsuk meg az adatokat (töröljük azokat, amelyek már nem mutatnak érvényes komissióra)
  await knex.raw(`
    DELETE FROM sscc_labels 
    WHERE commission_line_id IS NOT NULL 
    AND commission_line_id NOT IN (SELECT id FROM aldi_commission_lines)
  `);

  // 3. Adjuk hozzá a helyes idegenkulcsot
  await knex.schema.alterTable('sscc_labels', table => {
    table.foreign('commission_line_id').references('id').inTable('aldi_commission_lines').onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('sscc_labels', table => {
    table.dropForeign('commission_line_id');
  });

  await knex.schema.alterTable('sscc_labels', table => {
    table.foreign('commission_line_id').references('id').inTable('aldi_truck_lines').onDelete('CASCADE');
  });
};
