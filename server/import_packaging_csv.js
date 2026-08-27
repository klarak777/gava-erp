const fs = require('fs');
const path = require('path');
const db = require('./src/db/db');

async function importCsv() {
  const filePath = path.join(__dirname, '..', 'Göngyöleg típusok .csv');
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Skip header (Fajta ;Név;Tára súly (kg);Széleség (cm);Hossza (cm);Magasság (cm);Betét díjas;Gönygöleg leltár szerepel)
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';');
    if (cols.length < 8) continue;

    const category = cols[0].trim();
    const name = cols[1].trim();
    
    // Convert e.g. "0,84" to 0.84
    const parseNumber = (str) => {
      if (!str || str.trim() === '') return null;
      const num = parseFloat(str.replace(',', '.'));
      return isNaN(num) ? null : num;
    };

    const tare_weight_kg = parseNumber(cols[2]);
    const width_cm = parseNumber(cols[3]);
    const length_cm = parseNumber(cols[4]);
    const height_cm = parseNumber(cols[5]);
    
    const is_deposit_required = cols[6].trim().toLowerCase() === 'igen';
    const is_inventory_tracked = cols[7].trim().toLowerCase() === 'igen';

    if (!name) continue;

    const existing = await db('ref_packaging_types').where({ name }).first();
    if (existing) {
      await db('ref_packaging_types').where({ id: existing.id }).update({
        category,
        tare_weight_kg,
        width_cm,
        length_cm,
        height_cm,
        is_deposit_required,
        is_inventory_tracked,
        updated_at: new Date()
      });
      console.log(`Updated ${name}`);
    } else {
      await db('ref_packaging_types').insert({
        name,
        category,
        tare_weight_kg,
        width_cm,
        length_cm,
        height_cm,
        is_deposit_required,
        is_inventory_tracked,
        is_active: true
      });
      console.log(`Inserted ${name}`);
    }
  }

  console.log('Import done');
  process.exit(0);
}

importCsv().catch(e => {
  console.error(e);
  process.exit(1);
});
