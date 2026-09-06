const knex = require('../src/db/db');

async function main() {
  console.log('🧹 Duplikált (többszörös kattintásból eredő) lokáció bejegyzések keresése...');
  
  // Lekérdezzük az összes lokáció tételt
  const stocks = await knex('aldi_stock_locations').orderBy('id', 'asc');
  
  let deletedCount = 0;
  const seen = new Set();
  
  for (const stock of stocks) {
    // Egyedi azonosító: rendelés sor + lokáció + mennyiség + létrehozás ideje (másodperc pontossággal)
    const timeKey = new Date(stock.created_at).getTime();
    // Kerekítjük 2 másodpercre, hogy a gyors egymás utáni kéréseket egynek vegye
    const timeWindow = Math.floor(timeKey / 2000); 
    const key = `${stock.order_line_id}_${stock.location_id}_${stock.quantity_cartons}_${timeWindow}`;
    
    if (seen.has(key)) {
      console.log(`🗑️ Törlés: Duplikált tétel (ID: ${stock.id}, Karton: ${stock.quantity_cartons})`);
      await knex('aldi_stock_locations').where('id', stock.id).del();
      deletedCount++;
    } else {
      seen.add(key);
    }
  }
  
  if (deletedCount > 0) {
    console.log(`\n✅ Összesen ${deletedCount} db hibás duplikációt töröltem a lokációkról.`);
    console.log('Kérlek most futtasd le a `node scripts/fix_ghost_picks.js` parancsot is, hogy a PDA szinkronba kerüljön!');
  } else {
    console.log('\n✅ Nem találtam duplikált rekordokat.');
  }
  
  knex.destroy();
}

main().catch(e => {
  console.error('❌ Hiba:', e);
  knex.destroy();
});
