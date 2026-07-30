const db = require('./src/db/db.js');

async function listTables() {
    try {
        const tables = await db.select('table_name')
            .from('information_schema.tables')
            .where('table_schema', 'public');
            
        console.log("Tables:");
        tables.forEach(t => console.log(t.table_name));
        
        // Also check columns of partners table
        const cols = await db.select('column_name')
            .from('information_schema.columns')
            .where('table_name', 'partners');
            
        console.log("\nPartners columns:");
        cols.forEach(c => console.log(c.column_name));
        
    } catch(err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

listTables();
