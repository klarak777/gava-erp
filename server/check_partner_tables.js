const db = require('./src/db/db.js');

async function checkPartnerTables() {
    const tables = [
        'partner_sites',
        'partner_communications',
        'partner_contacts',
        'partner_agents',
        'partner_identifiers',
        'partner_characteristics',
        'partner_categories',
        'partner_bank_accounts',
        'partner_discounts',
        'partner_credit_settings',
        'partner_events',
        'partner_attachments'
    ];

    try {
        for (const table of tables) {
            console.log(`\n--- ${table} ---`);
            const cols = await db.select('column_name')
                .from('information_schema.columns')
                .where('table_name', table);
            console.log(cols.map(c => c.column_name).join(', '));
        }
    } catch(err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkPartnerTables();
