const knex = require('knex')(require('../../knexfile').development);

async function run() {
  try {
    // 1. Kézi összevonás: AGRPONIENTE (53) -> AGROPONIENTE (27)
    console.log('Kézi összevonás: AGRPONIENTE (53) -> 27');
    const manualDups = [53];
    for (const dupId of manualDups) {
      await knex('shipment_lines').where('partner_id', dupId).update({ partner_id: 27 });
      await knex('product_demands').where('partner_id', dupId).update({ partner_id: 27 });
      await knex('finance_transport_lines').where('partner_id', dupId).update({ partner_id: 27 });
      await knex('partners').where('id', dupId).del();
    }
    console.log('Kézi összevonás kész.');

    // 2. Automatikus összevonás pontos név egyezés alapján
    const dupsQuery = await knex('partners')
      .select('name')
      .count('id as c')
      .groupBy('name')
      .having(knex.raw('count(id) > 1'));

    console.log(`Talált pontos név duplikátumok száma: ${dupsQuery.length} féle név.`);

    for (const row of dupsQuery) {
      const records = await knex('partners').where('name', row.name).orderBy('id', 'asc');
      if (records.length <= 1) continue;

      const mainId = records[0].id;
      const dupIds = records.slice(1).map(r => r.id);

      console.log(`Név: "${row.name}" | Fő ID: ${mainId} | Duplikált ID-k: ${dupIds.join(', ')}`);

      for (const dupId of dupIds) {
        await knex('shipment_lines').where('partner_id', dupId).update({ partner_id: mainId });
        await knex('product_demands').where('partner_id', dupId).update({ partner_id: mainId });
        await knex('finance_transport_lines').where('partner_id', dupId).update({ partner_id: mainId });
      }

      await knex('partners').whereIn('id', dupIds).del();
    }

    console.log('Automatikus név-alapú összevonás kész.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
