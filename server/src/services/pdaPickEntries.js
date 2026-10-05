const { pickingError } = require('./pdaPicking');

// Entries have no quantity until Save creates a label. Both must be visible
// in one SQL snapshot; an entry contributes zero, so labels are counted once.
function activePickingQuery(db) {
  const labels = db('sscc_labels').select('aldi_truck_line_id', 'picker_user_id', 'picked_cartons')
    .where('is_provisional', true).whereNotNull('pick_session_id')
    .whereNull('reservation_cancelled_at').where('reservation_expires_at', '>', db.fn.now());
  const entries = db('pda_pick_entries').select('aldi_truck_line_id', 'picker_user_id', db.raw('0 as picked_cartons'))
    .whereNull('released_at').whereNull('completed_at').where('reservation_expires_at', '>', db.fn.now());
  return db.queryBuilder().from(labels.unionAll([entries]).as('active'))
    .leftJoin('employees as picker', 'active.picker_user_id', 'picker.id');
}

function assertEntryOwner(entry, user, sessionId, lineId) {
  if (!entry || Number(entry.picker_user_id) !== Number(user.id) ||
      entry.picker_session_id !== user.sessionId || entry.pick_session_id !== sessionId ||
      Number(entry.aldi_truck_line_id) !== Number(lineId)) {
    throw pickingError('FORBIDDEN', 'A belépési foglalás nem ehhez a dolgozóhoz, bejelentkezéshez vagy tételhez tartozik.');
  }
}

function assertEntry(entry, user, sessionId, lineId) {
  if (!entry) throw pickingError('ENTRY_REQUIRED', 'A tételt előbb a listából kell megnyitni. Frissítsd a PDA alkalmazást.');
  assertEntryOwner(entry, user, sessionId, lineId);
  if (entry.released_at || entry.completed_at || new Date(entry.reservation_expires_at) <= new Date()) {
    throw pickingError('ENTRY_EXPIRED', 'A belépési foglalás lejárt vagy lezárult. Nyisd meg újra a tételt a listából.');
  }
}

async function cartonsPerPallet(db, line) {
  let plt = Number(line.cartons_per_pallet);
  if (line.aldi_daily_order_line_id) {
    const demand = await db('aldi_daily_order_lines').where('id', line.aldi_daily_order_line_id).forShare().first();
    plt = Number(demand?.cartons_per_pallet);
  }
  if (!Number.isInteger(plt) || plt <= 0) throw pickingError('BAD_REQUEST',
    'Hiányzó vagy hibás #/PLT érték. Javítsd az ALDI Rakodás áruigényében.');
  return plt;
}

module.exports = { activePickingQuery, assertEntryOwner, assertEntry, cartonsPerPallet };
