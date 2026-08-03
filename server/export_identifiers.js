const knex = require('knex');
const knexfile = require('./knexfile');
const fs = require('fs');
const db = knex(knexfile.development);

async function main() {
  try {
    const data = await db('partner_identifiers')
      .join('partners', 'partner_identifiers.partner_id', 'partners.id')
      .where('partner_identifiers.is_inactive', false)
      .select('partners.name as partner_name', 'partner_identifiers.id_type', 'partner_identifiers.value')
      .orderBy('partners.name', 'asc');
    
    fs.writeFileSync('active_identifiers_export.json', JSON.stringify(data, null, 2));
    console.log('Sikeresen kimentve az active_identifiers_export.json fájlba!');
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
main();
