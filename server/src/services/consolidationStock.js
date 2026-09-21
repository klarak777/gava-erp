// A címke önmagában nem készlet. Összeemeléskor csak az egyértelműen
// hozzárendelt, még tárhelyen lévő raklapokat lehet átmozgatni.
function consolidationStockIssues(labels, commissionRows, stockRows, locations) {
  const commissions = new Map(commissionRows.map(row => [Number(row.id), row]));
  const locationMap = new Map(locations.map(row => [Number(row.id), row]));
  const stocksByCommission = new Map();
  for (const stock of stockRows) {
    const id = Number(stock.commission_line_id);
    if (!stocksByCommission.has(id)) stocksByCommission.set(id, []);
    stocksByCommission.get(id).push(stock);
  }
  const labelCounts = new Map();
  for (const label of labels) {
    const id = Number(label.commission_line_id);
    labelCounts.set(id, (labelCounts.get(id) || 0) + 1);
  }
  return labels.map(label => {
    const commissionId = Number(label.commission_line_id);
    const commission = commissions.get(commissionId);
    const stocks = stocksByCommission.get(commissionId) || [];
    let error = null;
    if (!commission) error = 'A raklap komissiózási rekordja hiányzik.';
    else if (labelCounts.get(commissionId) !== 1) error = 'Több címke tartozik ugyanahhoz a komissiózáshoz.';
    else if (!stocks.length) error = 'Nincs hozzá lokációs készletsor. A raklap készletadatait rendezni kell az összeemelés előtt.';
    else if (stocks.length !== 1) error = 'Több készletsor tartozik a raklaphoz; a készletkapcsolat nem egyértelmű.';
    else {
      const stock = stocks[0];
      const location = locationMap.get(Number(stock.location_id));
      if (!location || location.location_type === 'Szülő' || location.location_type === 'SzÃ¼lÅ‘') {
        error = 'A raklap nincs érvényes, konkrét tárhelyhez rendelve.';
      } else if (Number(stock.truck_line_id) !== Number(commission.aldi_truck_line_id)) {
        error = 'A készletsor más kamiontételhez tartozik.';
      } else if (!Number.isInteger(Number(stock.quantity_cartons)) || Number(stock.quantity_cartons) <= 0 ||
        Number(stock.quantity_cartons) !== Number(commission.cartons) ||
        Number(stock.quantity_cartons) !== Number(label.picked_cartons)) {
        error = 'A címke, a komissiózás és a készletsor kartonszáma nem egyezik.';
      }
    }
    return {
      labelId: Number(label.id),
      sscc: label.sscc,
      error,
      stock: error ? null : stocks[0],
      location: error ? null : locationMap.get(Number(stocks[0].location_id))
    };
  });
}

function assertConsolidationStock(issues) {
  const invalid = issues.filter(issue => issue.error);
  if (invalid.length) {
    const error = new Error(invalid.map(issue => `Raklap ${issue.sscc}: ${issue.error}`).join('\n'));
    error.code = 'INVALID_CONSOLIDATION_STOCK';
    throw error;
  }
}

async function consolidationCapacityError(db, location, stockRows) {
  const capacity = parseInt(location.capacity, 10) || 0;
  if (capacity <= 0) return null;
  // A már itt lévő kijelölt raklapot nem szabad kétszer beleszámítani.
  const occupied = await db('aldi_stock_locations')
    .where('location_id', location.id)
    .whereNotIn('id', stockRows.map(stock => stock.id))
    .count('id as count').first();
  const occupiedCount = Number(occupied?.count || 0);
  if (occupiedCount + stockRows.length > capacity) {
    return `A céllokáció megtelt. Kapacitás: ${capacity}, foglalt: ${occupiedCount}, érkező raklapok: ${stockRows.length}.`;
  }
  return null;
}

module.exports = { consolidationStockIssues, assertConsolidationStock, consolidationCapacityError };
