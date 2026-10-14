/**
 * ALDI raklapszám – közvetlenül a "Komissió megtekintése" tábla RAKLAP oszlopából
 * (aldi_commission_lines.pallets) származó érték. Nincs külön kerekítő algoritmus.
 */

function toInt(value) {
  return parseInt(value, 10) || 0;
}

/** Egy kamionsorhoz tartozó komissiós sorok RAKLAP értékeinek összege. */
function truckLinePallets(truckLine, commissionRows) {
  return (commissionRows || [])
    .filter(c =>
      Number(c.aldi_truck_line_id) === Number(truckLine.id) ||
      (c.aldi_truck_line_id == null && c.product_name === truckLine.product_name)
    )
    .reduce((sum, c) => sum + toInt(c.pallets), 0);
}

/** Egy kamion összes komissiós sorának RAKLAP összege (megegyezik a Komissió megtekintése ÖSSZESEN értékével). */
function truckPallets(commissionRows) {
  return (commissionRows || []).reduce((sum, c) => sum + toInt(c.pallets), 0);
}

module.exports = { truckLinePallets, truckPallets };
