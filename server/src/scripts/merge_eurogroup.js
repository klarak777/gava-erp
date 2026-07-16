const knex = require('knex')(require('../../knexfile').development);

async function run() {
  try {
    const mainId = 78; // EUROGROUP DE
    const duplicateIds = [10, 58, 72, 296, 339];

    console.log(`Merging Eurogroup Germany duplicates into ID ${mainId} (EUROGROUP DE)...`);

    let updatedShipmentLines = 0;
    let updatedProductDemands = 0;
    let updatedFinanceLines = 0;

    for (const dupId of duplicateIds) {
      updatedShipmentLines += await knex('shipment_lines')
        .where('partner_id', dupId)
        .update({ partner_id: mainId });

      updatedProductDemands += await knex('product_demands')
        .where('partner_id', dupId)
        .update({ partner_id: mainId });

      updatedFinanceLines += await knex('finance_transport_lines')
        .where('partner_id', dupId)
        .update({ partner_id: mainId });
    }

    console.log(`Reassigned: Shipment Lines: ${updatedShipmentLines}, Product Demands: ${updatedProductDemands}, Finance Lines: ${updatedFinanceLines}`);

    // Delete the duplicate partners
    const deletedCount = await knex('partners')
      .whereIn('id', duplicateIds)
      .del();

    console.log(`Deleted ${deletedCount} duplicate Eurogroup partners.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
