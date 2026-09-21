const db = require('../src/db/db');

async function migrateExistingLabels() {
  console.log('Fetching existing normal sscc_labels...');
  
  // 1. Update normal labels
  const normalLabels = await db('sscc_labels')
    .where('is_consolidated_master', false)
    .whereNotNull('commission_line_id');
    
  let normalCount = 0;
  for (const label of normalLabels) {
    const commissionLine = await db('aldi_commission_lines').where('id', label.commission_line_id).first();
    if (commissionLine && commissionLine.aldi_truck_line_id) {
      const truckLine = await db('aldi_truck_lines').where('id', commissionLine.aldi_truck_line_id).first();
      if (truckLine) {
        await db('sscc_labels').where('id', label.id).update({
          gross_weight: truckLine.gross_weight || null,
          net_weight: truckLine.net_weight || null,
          lot_number: truckLine.lot_number || null,
        });
        normalCount++;
      }
    }
  }
  console.log(`Updated ${normalCount} normal sscc_labels.`);

  // 2. Update consolidated master labels
  console.log('Fetching existing consolidated master labels...');
  const masterLabels = await db('sscc_labels').where('is_consolidated_master', true);
  
  let masterCount = 0;
  for (const master of masterLabels) {
    if (master.pallets_json) {
      let memberSsccs = [];
      try { 
        memberSsccs = JSON.parse(master.pallets_json); 
      } catch(e) {}
      
      if (memberSsccs.length > 0) {
        const members = await db('sscc_labels').whereIn('sscc', memberSsccs);
        const totalGrossWeight = members.reduce((sum, m) => sum + (parseFloat(m.gross_weight) || 0), 0);
        const totalNetWeight = members.reduce((sum, m) => sum + (parseFloat(m.net_weight) || 0), 0);
        
        const deliveryDates = [...new Set(members.map(label => label.delivery_date).filter(Boolean))];
        const finalDeliveryDate = deliveryDates.length > 0 ? deliveryDates[0] : master.delivery_date;

        await db('sscc_labels').where('id', master.id).update({
          gross_weight: totalGrossWeight > 0 ? totalGrossWeight : null,
          net_weight: totalNetWeight > 0 ? totalNetWeight : null,
          delivery_date: finalDeliveryDate,
          product_name: 'Vegyes raklap'
        });
        masterCount++;
      }
    }
  }
  console.log(`Updated ${masterCount} master sscc_labels.`);
  process.exit(0);
}

migrateExistingLabels().catch(console.error);
