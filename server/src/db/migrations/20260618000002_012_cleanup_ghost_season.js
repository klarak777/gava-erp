/**
 * Migration 012: Szezon hibák javítása (99-00 szezon törlése és fuvarok áthelyezése)
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Keressük meg a 99-00 (hibás jövőbeli) szezont
  const badSeason = await knex('seasons').where('code', '99-00').first();
  if (!badSeason) {
    console.log('[Migration 012] Nem található 99-00 szezon, nincs teendő.');
    return;
  }

  // 2. Keressük meg az aktuális 25-26 szezont
  const goodSeason = await knex('seasons').where('code', '25-26').first();
  if (!goodSeason) {
    console.log('[Migration 012] Hiba: A 25-26 szezon nem található.');
    return;
  }

  // 3. Helyezzük át a fuvarokat a hibás szezonból a jóba
  const updatedCount = await knex('shipments')
    .where('season_id', badSeason.id)
    .update({ season_id: goodSeason.id });

  console.log(`[Migration 012] ${updatedCount} db fuvar áthelyezve a 99-00 szezonból a 25-26 szezonba.`);

  // 4. Töröljük a hibás szezont
  await knex('seasons').where('id', badSeason.id).del();
  console.log('[Migration 012] A 99-00 hibás szezon sikeresen törölve.');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return Promise.resolve();
};
