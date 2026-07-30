const db = require('./src/db/db.js');

async function cleanupEmptyPartners() {
    console.log("Looking for partners with no address, tax ID, or other data...");
    
    // Find partners where tax_id, zip, city, street_name are empty/null
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
        });
        
    console.log(`Found ${emptyPartners.length} potentially empty partners.`);
    
    let deletedCount = 0;
    let keepCount = 0;
    
    for (const p of emptyPartners) {
        // Also check if they have identifiers (if they do, we might want to keep them because they are mapped to our CSVs)
        const ids = await db('partner_identifiers').where('partner_id', p.id);
        
        if (ids.length > 0) {
            // It has an identifier (like short name), keep it
            keepCount++;
            continue;
        }
        
        try {
            await db('partners').where('id', p.id).del();
            deletedCount++;
        } catch(err) {
            // Failed to delete because of foreign key
            // console.log(`Cannot delete ${p.name} (ID: ${p.id}): ${err.message}`);
        }
    }
    
    console.log(`Deleted ${deletedCount} empty partners. Kept ${keepCount} because they have identifiers (CSV mappings).`);
    process.exit();
}

cleanupEmptyPartners();
