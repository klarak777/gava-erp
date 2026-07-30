const db = require('./src/db/db.js');

async function checkValues() {
    try {
        const idTypes = await db('partner_identifiers').distinct('id_type');
        console.log("Identifier types:", idTypes.map(x => x.id_type));
        
        const categories = await db('partner_categories').distinct('category');
        console.log("Categories:", categories.map(x => x.category));
        
    } catch(err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkValues();
