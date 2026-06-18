/**
 * Migration 011: Cleanup duplicates and ensure historical shipments are marked loaded
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Duplikátumok (0 tételes) törlése
  const shipments = await knex('shipments').select('id', 'order_number', 'season_id');
  const normalize = str => (str || '').replace(/\s+/g, '').toUpperCase();
  const map = {};
  for (const s of shipments) {
    if (!s.order_number) continue;
    const norm = normalize(s.order_number);
    const key = norm + '_' + s.season_id;
    if (!map[key]) map[key] = [];
    map[key].push(s);
  }
  
  let toDelete = [];
  
  for (const key in map) {
    const group = map[key];
    if (group.length > 1) {
      for (const s of group) {
        const lines = await knex('shipment_lines').where('shipment_id', s.id).count('* as cnt');
        // A count('*') stringként is jöhet vissza, így parseInt-et használunk
        s.lines = parseInt(lines[0].cnt || lines[0].count || 0);
      }
      group.sort((a, b) => b.lines - a.lines); // Csökkenő sorrend a tételek száma szerint
      
      const others = group.slice(1);
      
      let hasConflict = false;
      for (const o of others) {
        if (o.lines > 0) hasConflict = true;
      }
      
      // Csak akkor törlünk, ha a másolatokon 0 tétel van
      if (!hasConflict) {
        others.forEach(o => toDelete.push(o.id));
      }
    }
  }
  
  if (toDelete.length > 0) {
     await knex('shipments').whereIn('id', toDelete).del();
     console.log(`[Migration 011] ${toDelete.length} db üres duplikátum sikeresen törölve.`);
  }

  // 2. Minden régi fuvar rakodva (is_loaded = true) állapotra állítása, KIVÉVE a frissen importált nyitottakat
  const keepUnloaded = ['H200', 'LOG357', 'LOG358', 'LOG359', 'LOG360', 'LOG361', 'LOG362', 'EX023'];
  const affected = await knex('shipments')
    .whereNotIn('order_number', keepUnloaded)
    .where('is_loaded', false)
    .update({ is_loaded: true });
    
  console.log(`[Migration 011] ${affected} db régi fuvar "rakodva" (is_loaded=true) állapotra állítva.`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return Promise.resolve();
};
