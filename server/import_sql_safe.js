const fs = require('fs');
const knex = require('knex');
const db = knex(require('./knexfile')['development']);

async function run() {
  console.log('Kezdés: do_server_full_sync.sql futtatása... ez eltarthat 1-2 percig.');
  try {
    const sqlContent = fs.readFileSync('../do_server_full_sync.sql', 'utf8');
    // Split by semicolon and execute each statement independently
    const statements = sqlContent.split(';');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt || stmt.startsWith('--')) continue; // Skip empty statements and pure comments
      
      try {
        await db.raw(stmt + ';');
        successCount++;
        if (successCount % 1000 === 0) {
            console.log(`Folyamatban... eddig sikeresen lefuttatva: ${successCount} parancs.`);
        }
      } catch (err) {
        errorCount++;
        // Csak az első pár hibát írjuk ki, ne árasszuk el a konzolt
        if (errorCount <= 3) {
            console.log(`\nHiba a következő parancsnál:`);
            console.log(stmt.substring(0, 100) + '...');
            console.log(`Ok: ${err.message}\n`);
        }
      }
    }
    
    console.log(`\nKÉSZ! Összesített eredmény:`);
    console.log(`- Sikeresen lefutott parancsok: ${successCount}`);
    console.log(`- Hibás (pl. már létező / duplikált) parancsok: ${errorCount}`);
    
  } catch(e) {
    console.error('Fatális hiba a fájl olvasásakor:', e);
  } finally {
    db.destroy();
  }
}

run();
