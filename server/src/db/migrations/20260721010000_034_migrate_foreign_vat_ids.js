/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Módosítsuk azokat a partner_identifiers bejegyzéseket, ahol az id_type = 'Adószám',
  // de az érték tartalmaz betűket (külföldi / közösségi adószám formátumok)
  const rows = await knex('partner_identifiers')
    .where('id_type', 'Adószám');
  
  const toUpdate = rows.filter(r => /[a-zA-Z]/.test(r.value || '')).map(r => r.id);
  
  if (toUpdate.length > 0) {
    await knex('partner_identifiers')
      .whereIn('id', toUpdate)
      .update({ id_type: 'Közösségi adószám' });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Nem szükséges visszagörgetés
};
