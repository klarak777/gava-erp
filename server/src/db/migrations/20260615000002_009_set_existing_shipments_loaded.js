/**
 * Migration 009: Egyszeri data-migration – az összes MEGLÉVŐ shipment is_loaded = true
 * Az új (jövőbeli) kamionok alapértelmezetten is_loaded = false maradnak.
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex('shipments').update({ is_loaded: true });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // Visszaállítás nem lehetséges (nem tudjuk, melyik volt true és melyik false)
  return Promise.resolve();
};
