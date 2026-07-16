const knex = require('knex')(require('../../knexfile').development);

async function run() {
  try {
    const partners = await knex('partners').select('id', 'name').orderBy('id', 'asc');
    
    const normalize = (name) => {
      if (!name) return '';
      let n = name.toUpperCase()
        .replace(/[\.,\-\/]/g, '') // Remove punctuation
        .replace(/\s+/g, '')       // Remove spaces
        .replace(/KFT$/g, '')      // Remove common suffixes
        .replace(/GMBH$/g, '')
        .replace(/SL$/g, '')
        .replace(/LTD$/g, '')
        .replace(/SPA$/g, '')
        .replace(/SRL$/g, '')
        .replace(/INC$/g, '')
        .replace(/CO$/g, '');
      
      // Simple plural removal for English/Spanish
      if (n.endsWith('S') && !n.endsWith('SS')) {
        n = n.substring(0, n.length - 1);
      }
      return n;
    };

    const groups = {};
    for (const p of partners) {
      const norm = normalize(p.name);
      if (!groups[norm]) groups[norm] = [];
      groups[norm].push(p);
    }

    let mergedCount = 0;
    for (const norm in groups) {
      if (groups[norm].length > 1) {
        const records = groups[norm].sort((a, b) => a.id - b.id);
        const mainId = records[0].id;
        const dupIds = records.slice(1).map(r => r.id);

        console.log(`Fuzzy Merge [${norm}] -> Fő ID: ${mainId} (${records[0].name})`);
        console.log(`  Duplikált ID-k törlése: ${dupIds.join(', ')}`);

        for (const dupId of dupIds) {
          await knex('shipment_lines').where('partner_id', dupId).update({ partner_id: mainId });
          await knex('product_demands').where('partner_id', dupId).update({ partner_id: mainId });
          await knex('finance_transport_lines').where('partner_id', dupId).update({ partner_id: mainId });
        }

        await knex('partners').whereIn('id', dupIds).del();
        mergedCount += dupIds.length;
      }
    }

    console.log(`\nSikeresen összevonva és törölve ${mergedCount} partner.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
