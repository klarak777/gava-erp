const fs = require('fs');
const db = require('./src/db/db');

async function exportData() {
  try {
    const products = await db('products').select('*');
    const partners = await db('partners').select('*');
    
    fs.writeFileSync('./data_export.json', JSON.stringify({ products, partners }, null, 2));
    console.log('Exported data to data_export.json');
  } catch (err) {
    console.error(err);
  } finally {
    await db.destroy();
  }
}
exportData();
