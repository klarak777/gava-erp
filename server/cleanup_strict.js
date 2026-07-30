const db = require('./src/db/db.js');

async function cleanupStrictEmptyPartners() {
    console.log("Looking for STRICTLY empty partners (only name, no address, no tax, no identifiers)...");
    
    // Find partners where all address/tax fields are empty/null
    const emptyPartners = await db('partners')
        .where(function() {
            this.whereNull('tax_id').orWhere('tax_id', '')
        })
        .andWhere(function() {
            this.whereNull('zip').orWhere('zip', '')
        })
        .andWhere(function() {
            this.whereNull('city').orWhere('city', '')
        })
        .andWhere(function() {
            this.whereNull('street_name').orWhere('street_name', '')
        })
        .andWhere(function() {
            this.whereNull('country').orWhere('country', '')
        });
        
    console.log(`Initial filter found ${emptyPartners.length} partners.`);
    
    let deletedCount = 0;
    let keptDueToData = 0;
    let keptDueToFK = 0;
    
    for (const p of emptyPartners) {
        // Check for any identifiers
        const ids = await db('partner_identifiers').where('partner_id', p.id);
        
        // Check for contacts
        const contacts = await db('partner_contacts').where('partner_id', p.id);
        
        // Check for bank accounts
        const banks = await db('partner_bank_accounts').where('partner_id', p.id);
        
        if (ids.length > 0 || contacts.length > 0 || banks.length > 0) {
            keptDueToData++;
            continue; // Skip, it has some data
        }
        
        // Attempt to delete. If it's used in shipments or loading_events, PostgreSQL FK constraints will block it.
        try {
            await db('partners').where('id', p.id).del();
            deletedCount++;
        } catch(err) {
            // Failed to delete because of foreign key constraint
            keptDueToFK++;
        }
    }
    
    console.log(`Cleanup complete!`);
    console.log(`- Deleted strictly empty partners: ${deletedCount}`);
    console.log(`- Kept (has identifiers/contacts/banks): ${keptDueToData}`);
    console.log(`- Kept (in use by shipments/other tables): ${keptDueToFK}`);
    
    process.exit();
}

cleanupStrictEmptyPartners();
