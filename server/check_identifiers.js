const db = require('./src/db/db.js');

async function checkIdentifiers() {
    try {
        const idTypes = ['(Customer) Vevők', '(Reference) Szállítók', 'Fuvarozók'];
        
        for (const type of idTypes) {
            console.log(`\n--- ${type} ---`);
            const rows = await db('partner_identifiers')
                .join('partners', 'partner_identifiers.partner_id', 'partners.id')
                .select('partners.name', 'partner_identifiers.value')
                .where('partner_identifiers.id_type', type)
                .limit(5);
            console.log(rows);
        }
        
    } catch(err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkIdentifiers();
