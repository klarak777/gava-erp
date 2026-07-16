const knex = require('knex')(require('../../knexfile').development);

async function run() {
  try {
    // 1. Find the main AGROPONIENTE partner (ID 27)
    const mainId = 27;

    // 2. Find all duplicates that have "(MERGED TO ID" in their name
    const duplicates = await knex('partners')
      .where('name', 'LIKE', '%(MERGED TO ID%');

    const duplicateIds = duplicates.map(p => p.id);

    if (duplicateIds.length === 0) {
      console.log('Nincs törlendő duplikált partner.');
      process.exit(0);
    }

    console.log(`Törlendő duplikátumok száma: ${duplicateIds.length}`);

    // 3. Update any remaining foreign keys to point to the main ID
    // Note: We use a regex match in JS, but here we just update ALL found duplicates to ID 27
    // In a real scenario with multiple targets we would parse the ID, but the user specifically asked for AGROPONIENTE which is 27.
    // Wait, the user said "az összes ilyen". Let's parse the target ID from the name!
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

    // 4. Delete the duplicate partners
    // This will cascade delete any partner_sites, partner_contacts, etc.
    const deletedCount = await knex('partners')
      .whereIn('id', duplicateIds)
      .del();

    console.log(`Törölve ${deletedCount} duplikált partner.`);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
