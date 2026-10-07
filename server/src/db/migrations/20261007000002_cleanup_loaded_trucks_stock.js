exports.up = async function(knex) {
  // 1. Get all loaded trucks
  const loadedTrucks = await knex('aldi_trucks').where('is_loaded', true).select('id');
  if (loadedTrucks.length === 0) return;
  const loadedTruckIds = loadedTrucks.map(t => t.id);

  // 2. Get all commission lines and truck lines for these trucks
  const commissionLines = await knex('aldi_commission_lines').whereIn('aldi_truck_id', loadedTruckIds).select('id');
  const commissionLineIds = commissionLines.map(cl => cl.id);

  const truckLines = await knex('aldi_truck_lines').whereIn('aldi_truck_id', loadedTruckIds).select('id');
  const truckLineIds = truckLines.map(tl => tl.id);

  // 3. Delete stock locations that belong to these loaded trucks
  if (commissionLineIds.length > 0 || truckLineIds.length > 0) {
    const deletedCount = await knex('aldi_stock_locations')
      .where(function() {
        if (commissionLineIds.length > 0) this.orWhereIn('commission_line_id', commissionLineIds);
        if (truckLineIds.length > 0) this.orWhereIn('truck_line_id', truckLineIds);
      })
      .del();
    console.log(`[Migration] Cleared ${deletedCount} stock location records for already loaded trucks.`);
  }
};

exports.down = async function(knex) {
  // Irreversible migration (we cannot know what the deleted stock records were)
};
