exports.up = async function(knex) {
  console.log('--- Indul a 028_delete_already_merged_partners migráció ---');

  // Find all duplicates that have "(MERGED TO ID" in their name
  const duplicates = await knex('partners')
    .where('name', 'LIKE', '%(MERGED TO ID%');

  const duplicateIds = duplicates.map(p => p.id);

  if (duplicateIds.length === 0) {
    console.log('Nincs törlendő "(MERGED TO ID" partner.');
    return;
  }

  console.log(`Törlendő duplikátumok száma: ${duplicateIds.length}`);

  let updatedShipmentLines = 0;
  let updatedProductDemands = 0;
  let updatedFinanceLines = 0;

  for (const dup of duplicates) {
    const match = dup.name.match(/\(MERGED TO ID (\d+)\)/);
    if (match) {
      const targetId = parseInt(match[1], 10);
      
      updatedShipmentLines += await knex('shipment_lines')
        .where('partner_id', dup.id)
        .update({ partner_id: targetId });

      updatedProductDemands += await knex('product_demands')
        .where('partner_id', dup.id)
        .update({ partner_id: targetId });

      updatedFinanceLines += await knex('finance_transport_lines')
        .where('partner_id', dup.id)
        .update({ partner_id: targetId });
    }
  }

  console.log(`Átirányítva: Shipment Lines: ${updatedShipmentLines}, Product Demands: ${updatedProductDemands}, Finance Lines: ${updatedFinanceLines}`);

  // Delete the duplicate partners
  const deletedCount = await knex('partners')
    .whereIn('id', duplicateIds)
    .del();

  console.log(`Törölve ${deletedCount} duplikált partner.`);
  console.log('--- 028 migráció befejeződött ---');
};

exports.down = async function(knex) {
  // Irreversible
};
