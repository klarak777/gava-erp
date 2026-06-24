const fs = require('fs');
const path = require('path');
const db = require('./src/db/db');

async function importProducts() {
  const csvPath = path.resolve(__dirname, '../Termékek angol és magyar megnevezése.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  
  const lines = csvContent.split(/\r?\n/);
  const recordsToInsert = [];

  for (let i = 1; i < lines.length; i++) { // Skip header line 0
    const line = lines[i].trim();
    if (!line) continue;
    
    const cols = line.split(';');
    const nameEn = cols[0] ? cols[0].trim() : '';
    const nameHu = cols[1] ? cols[1].trim() : '';
    
    if (nameEn) {
      recordsToInsert.push({
        name: nameEn,
        name_hu: nameHu || null,
        is_active: true
      });
    }
  }

  try {
    console.log(`Processing ${recordsToInsert.length} products...`);
    let inserted = 0;
    let updated = 0;
    
    for (const record of recordsToInsert) {
      const existing = await db('products').where('name', record.name).first();
      if (existing) {
        await db('products').where('id', existing.id).update({
          name_hu: record.name_hu,
          is_active: true
        });
        updated++;
      } else {
        await db('products').insert(record);
        inserted++;
      }
    }
    
    console.log(`Products imported successfully. Inserted: ${inserted}, Updated: ${updated}.`);
  } catch (err) {
    console.error('Error importing products:', err);
  } finally {
    await db.destroy();
  }
}

importProducts();
