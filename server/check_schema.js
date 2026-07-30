const db = require('./src/db/db.js');

async function checkSchema() {
    try {
        console.log('--- partners ---');
        const partners = await db.raw('PRAGMA table_info(partners)');
        console.log(partners);
        
        console.log('--- partner_other_data ---');
        const otherData = await db.raw('PRAGMA table_info(partner_other_data)');
        console.log(otherData);

        console.log('--- partner_roles ---');
        const roles = await db.raw('PRAGMA table_info(partner_roles)');
        console.log(roles);
    } catch(err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkSchema();
