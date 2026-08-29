const db = require('../src/db/db');

async function fixHistoricalVersioning() {
  console.log('--- Histórikus adatok változás-számításának elindítása ---');
  
  // Lekérdezzük az összes rendeléscsaládot
  const families = await db('aldi_order_families').select('id');
  
  for (const family of families) {
    // Lekérdezzük a családhoz tartozó rendeléseket verziószám szerint sorba rendezve
    const orders = await db('aldi_daily_orders')
      .where({ order_family_id: family.id })
      .orderBy('version_number', 'asc');
      
    if (orders.length <= 1) {
      // Csak egy verzió van (V1), nincs mivel összehasonlítani, alapértelmezett marad ('added', delta:0)
      continue;
    }
    
    // Végigmegyünk a verziókon a 2. verziótól (V2, V3...)
    for (let i = 1; i < orders.length; i++) {
      const prevOrder = orders[i - 1];
      const currOrder = orders[i];
      
      const prevLines = await db('aldi_daily_order_lines').where({ daily_order_id: prevOrder.id });
      const currLines = await db('aldi_daily_order_lines').where({ daily_order_id: currOrder.id });
      
      const prevMap = new Map();
      prevLines.forEach(l => {
        if (!l.is_virtual_removed) prevMap.set(l.gtin, Number(l.ordered_cartons));
      });
      
      const currMap = new Map();
      
      // 1. Meglévő és új tételek (currOrder-ben lévők)
      for (const currLine of currLines) {
        if (currLine.is_virtual_removed) continue;
        
        currMap.set(currLine.gtin, Number(currLine.ordered_cartons));
        const prevQty = prevMap.has(currLine.gtin) ? prevMap.get(currLine.gtin) : 0;
        const currQty = Number(currLine.ordered_cartons);
        const delta = currQty - prevQty;
        
        let changeType = 'added';
        if (prevMap.has(currLine.gtin)) {
          if (delta > 0) changeType = 'increased';
          else if (delta < 0) changeType = 'decreased';
          else changeType = 'unchanged';
        }
        
        await db('aldi_daily_order_lines').where({ id: currLine.id }).update({
          previous_ordered_cartons: prevQty,
          quantity_delta: delta,
          change_type: changeType
        });
      }
      
      // 2. Törölt tételek (amelyek prevOrder-ben benne voltak, de currOrder-ben nincsenek)
      // Ehhez virtuális sorokat kell létrehoznunk currOrder-hez
      for (const prevLine of prevLines) {
        if (prevLine.is_virtual_removed) continue;
        
        if (!currMap.has(prevLine.gtin)) {
          // Ellenőrizzük, hogy nincs-e már virtuális sor
          const existingVirtual = await db('aldi_daily_order_lines')
            .where({ daily_order_id: currOrder.id, gtin: prevLine.gtin, is_virtual_removed: true })
            .first();
            
          if (!existingVirtual) {
            const prevQty = Number(prevLine.ordered_cartons);
            await db('aldi_daily_order_lines').insert({
              daily_order_id: currOrder.id,
              order_item_state_id: prevLine.order_item_state_id,
              product_name: prevLine.product_name,
              gtin: prevLine.gtin,
              ordered_cartons: 0, // A tétel törölve lett
              previous_ordered_cartons: prevQty,
              quantity_delta: -prevQty,
              change_type: 'removed',
              is_virtual_removed: true
            });
          }
        }
      }
    }
    
    console.log(`Család feldolgozva: ${family.id}, Verziók száma: ${orders.length}`);
  }
  
  console.log('--- Sikeresen befejeződött a histórikus adatok frissítése! ---');
}

fixHistoricalVersioning()
  .catch(err => console.error(err))
  .finally(() => db.destroy());
