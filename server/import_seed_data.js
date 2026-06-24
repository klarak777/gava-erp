const fs = require('fs');
const db = require('./src/db/db');
const path = require('path');

async function seed() {
  try {
    const dataPath = path.join(__dirname, 'data_export.json');
    if (!fs.existsSync(dataPath)) {
      console.log('No data_export.json found.');
      return;
    }
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const products = data.products || [];
    const partners = data.partners || [];

    console.log('Deactivating all existing products in database to prepare for seed sync...');
    await db('products').update({ is_active: false });

    console.log(`Seeding ${products.length} products...`);
    for (const p of products) {
      // Upsert product by name
      const existing = await db('products').where('name', p.name).first();
      if (existing) {
        await db('products').where('id', existing.id).update({
          name_hu: p.name_hu,
          category: p.category,
          reference: p.reference,
          is_active: p.is_active
        });
      } else {
        await db('products').insert({
          name: p.name,
          name_hu: p.name_hu,
          category: p.category,
          reference: p.reference,
          is_active: p.is_active
        });
      }
    }

    console.log('Seed completed successfully!');
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exitCode = 1;
  } finally {
    await db.destroy();
  }
}

seed();


