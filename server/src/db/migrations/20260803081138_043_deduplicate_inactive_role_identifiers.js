/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Kikeressük azokat az inaktív azonosítókat, amik EGY PARTNEREN BELÜL duplikálódnak 
  // (ugyanaz a partner_id, ugyanaz az id_type, ugyanaz a value).
  const duplicates = await knex('partner_identifiers')
    .where('is_inactive', true)
    .groupBy('partner_id', 'id_type', knex.raw('UPPER(TRIM(value))'))
    .havingRaw('count(*) > 1')
    .select(
      'partner_id',
      'id_type',
      knex.raw('UPPER(TRIM(value)) as normalized_value'),
      knex.raw('count(*) as cnt')
    );

  let deletedCount = 0;

  for (const dup of duplicates) {
    // Lekérjük az összes azonosítót, ami megfelel a duplikációnak
    const records = await knex('partner_identifiers')
      .where('is_inactive', true)
      .andWhere('partner_id', dup.partner_id)
      .andWhere('id_type', dup.id_type)
      .whereRaw('UPPER(TRIM(value)) = ?', [dup.normalized_value])
      .orderBy('updated_at', 'desc')
      .select('id');
    
    if (records.length > 1) {
      // Megtartjuk az elsőt (a legutóbb frissítettet), a többit töröljük
      const idsToDelete = records.slice(1).map(r => r.id);
      
      await knex('partner_identifiers')
        .whereIn('id', idsToDelete)
        .del();
        
      deletedCount += idsToDelete.length;
    }
  }

  console.log(`[Migration 043] Inaktív duplikációk tisztítva. Törölt rekordok száma: ${deletedCount}`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // A törölt duplikátumokat nem lehet visszaállítani.
};
