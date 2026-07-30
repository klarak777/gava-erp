const db = require('./src/db/db.js');

async function checkBrokenEncoding() {
    try {
        const brokenIdentifiers = await db('partner_identifiers')
            .join('partners', 'partner_identifiers.partner_id', 'partners.id')
            .select('partner_identifiers.id', 'partner_identifiers.value', 'partners.name')
            .where('partner_identifiers.value', 'like', '%%');
            
        console.log(`Found ${brokenIdentifiers.length} broken identifiers.`);
        for (const row of brokenIdentifiers) {
            console.log(`ID: ${row.id} | Broken: ${row.value} | Partner: ${row.name}`);
        }
        
    } catch(err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkBrokenEncoding();
