async function removeDeletedItemFromOperations(trx, state, truckLines) {
  const truckLineIds = truckLines.map(line => line.id);
  const commissionQuery = trx('aldi_commission_lines').where({ order_item_state_id: state.id });
  if (truckLineIds.length) commissionQuery.orWhereIn('aldi_truck_line_id', truckLineIds);
  const removedCommissionLines = Number(await commissionQuery.delete()) || 0;

  if (truckLineIds.length) await trx('aldi_truck_lines').whereIn('id', truckLineIds).delete();
  await trx('aldi_order_item_states').where({ id: state.id }).update({
    sent_cartons: 0,
    requires_reconciliation: false,
    reconciliation_reason: null,
    updated_at: trx.fn.now()
  });

  return {
    removedFromDemand: Number(state.sent_cartons) || 0,
    removedFromTrucks: truckLines.reduce((sum, line) => sum + (Number(line.ordered_cartons) || 0), 0),
    removedCommissionLines
  };
}

module.exports = { removeDeletedItemFromOperations };
