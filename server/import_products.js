const fs = require('fs');
const path = require('path');
const knex = require('knex');
const { parse } = require('csv-parse/sync');
const knexfile = require('./knexfile');

const db = knex(knexfile.development);

// Normalizációs függvény az ékezetek, kis/nagybetűk és szóközök kiküszöbölésére
function normalizeStr(str) {
  if (!str) return '';
  return str.trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

async function run() {
  try {
    const csvPath = path.join(__dirname, '../Termékek angol és magyar megnevezése.csv');
    console.log(`📋 Termékek betöltése (UTF-8) innen: ${csvPath}`);

    if (!fs.existsSync(csvPath)) {
      console.error('❌ Hiba: A termék CSV fájl nem található!');
      process.exit(1);
    }

    const content = fs.readFileSync(csvPath, 'utf8');
    const records = parse(content, {
      delimiter: ';',
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true
    });

    console.log(`📊 CSV sorok száma: ${records.length}`);

    // Meglévő termékek lekérése és indexelése
    const existingProducts = await db('products').select('*');
    console.log(`📦 Jelenlegi termékek száma a DB-ben: ${existingProducts.length}`);

    const existingMap = {};
    for (const p of existingProducts) {
      const norm = normalizeStr(p.name);
      existingMap[norm] = p;
    }

    const matchedIds = new Set();
    let updatedCount = 0;
    let insertedCount = 0;

    // Feldolgozás
    for (let i = 1; i < records.length; i++) {
      const row = records[i];
      if (!row || row.length < 2) continue;

      const englishName = row[0] ? row[0].trim() : '';
      const hungarianTranslation = row[1] ? row[1].trim() : '';

      // Ha az angol név üres, vagy a fejléc ismétlődése, kihagyjuk
      if (!englishName || englishName.toUpperCase() === 'PRODUCTS:') continue;

      const normEng = normalizeStr(englishName);
      const existing = existingMap[normEng];

      if (existing) {
        // Frissítjük a fordítást és beállítjuk aktívra
        await db('products')
          .where('id', existing.id)
          .update({
            name_hu: hungarianTranslation || null,
            is_active: true,
            updated_at: new Date()
          });
        matchedIds.add(existing.id);
        updatedCount++;
      } else {
        // Új termék beszúrása
        const [newProd] = await db('products')
          .insert({
            name: englishName,
            name_hu: hungarianTranslation || null,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          })
          .returning('*');

        const newId = typeof newProd === 'object' ? newProd.id : newProd;
        matchedIds.add(newId);
        insertedCount++;
      }
    }

    console.log(`✅ CSV feldolgozás kész. Frissítve: ${updatedCount}, Hozzáadva: ${insertedCount}.`);

    // Inaktiváljuk azokat a termékeket a DB-ben, amelyek nem szerepelnek a CSV-ben
    const inactiveProducts = existingProducts.filter(p => !matchedIds.has(p.id));
    console.log(`⚠️ CSV-ben nem szereplő termékek inaktiválása (${inactiveProducts.length} db)...`);

    if (inactiveProducts.length > 0) {
      const inactiveIds = inactiveProducts.map(p => p.id);
      await db('products')
        .whereIn('id', inactiveIds)
        .update({
          is_active: false,
          updated_at: new Date()
        });

      console.log('🚫 Inaktivált termékek listája (példák):');
      inactiveProducts.slice(0, 30).forEach(p => {
        console.log(`  - ID: ${p.id}, Név: "${p.name}"`);
      });
      if (inactiveProducts.length > 30) {
        console.log(`  ... és további ${inactiveProducts.length - 30} termék.`);
      }
    }

    console.log('🎉 SIKER! A termékadatbázis tisztítása és frissítése befejeződött.');
  } catch (err) {
    console.error('❌ Hiba történt:', err);
  } finally {
    await db.destroy();
  }
}

run();
