const knex = require('../src/db/db');

async function main() {
  console.log('🔄 Szellem komissiózások keresése és javítása...');
  
  const lines = await knex('aldi_truck_lines');
  let fixedCount = 0;

  for (const line of lines) {
    if (!line.aldi_daily_order_line_id) continue;
    
    // Kiszámoljuk a ténylegesen a lokációkon lévő kartonok összegét az adott tételhez
    const stock = await knex('aldi_stock_locations')
      .where('order_line_id', line.aldi_daily_order_line_id)
      .sum('quantity_cartons as total')
      .first();
      
    const total = parseInt(stock.total) || 0;
    
    // Ha a PDA-n levont (picked_cartons) eltér a valóságtól, korrigáljuk
    if (total !== parseInt(line.picked_cartons)) {
      console.log(`⚠️  Hiba találva a tétel sornál (ID: ${line.id}): PDA-n levonva = ${line.picked_cartons}, Valóságos lokáció készlet = ${total}`);
      
      await knex('aldi_truck_lines').where('id', line.id).update({ 
        picked_cartons: total, 
        is_picked: total >= line.ordered_cartons 
      });
      
      console.log(`✅ Tétel (ID: ${line.id}) sikeresen javítva ${total} kartonra.`);
      fixedCount++;
    }
  }
  
  if (fixedCount === 0) {
    console.log('✅ Nem volt eltérés az adatbázisban, minden készlet szinkronban van.');
  } else {
    console.log(`🎉 Kész! Összesen ${fixedCount} db "szellem" tételt javítottunk.`);
  }
  
  knex.destroy();
}

main().catch(e => {
  console.error('❌ Hiba történt:', e);
  knex.destroy();
});
