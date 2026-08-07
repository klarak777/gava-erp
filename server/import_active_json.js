const fs = require('fs');
const knex = require('knex');
const db = knex(require('./knexfile')['development']);

async function run() {
  try {
    const data = JSON.parse(fs.readFileSync('active_identifiers_export.json', 'utf8'));
    console.log('Feldolgozando rekordok szama:', data.length);
    
    const partners = await db('partners').select('id', 'name');
    const partnerMap = {};
    partners.forEach(p => {
      partnerMap[p.name.toUpperCase()] = p.id;
    });

    let inserted = 0;
    let notFound = 0;
    let skipped = 0;

    for (const item of data) {
      const pid = partnerMap[(item.partner_name || '').toUpperCase()];
      if (!pid) {
        notFound++;
        continue;
      }
      
      const existing = await db('partner_identifiers')
        .where({ partner_id: pid, id_type: item.id_type, value: item.value })
        .first();
        
      if (!existing) {
        await db('partner_identifiers').insert({
          partner_id: pid,
          id_type: item.id_type,
          value: item.value,
          is_inactive: false,
          created_at: db.fn.now(),
          updated_at: db.fn.now()
        });
        inserted++;
      } else {
        if (existing.is_inactive) {
           await db('partner_identifiers').where('id', existing.id).update({ is_inactive: false });
           inserted++;
        } else {
           skipped++;
        }
      }
    }
    
    console.log('Kesz! Uj/frissitett: ' + inserted + ', mar letezik: ' + skipped + ', nem talalhato partner: ' + notFound);
  } catch(e) {
    console.error(e);
  } finally {
    db.destroy();
  }
}
run();
