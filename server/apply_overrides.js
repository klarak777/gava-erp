const db = require('./src/db/db.js');
const fs = require('fs');
const path = require('path');

async function applyChanges() {
    console.log("Starting DB operations...");
    
    // 1. Rename RONI
    console.log("Renaming RONI (ID 2999)...");
    await db('partners').where('id', 2999).update({ name: 'Roni Cargo Kft.' });
    console.log("RONI renamed.");
    
    // 2. Map of explicit overrides from User
    const manualOverrides = {
        customers: {
            "GAVA": 62,
            "KOPFSALAT": 5
        },
        references: {
            "AGROPONIENTE": 27,
            "BILEK": 11,
            "VEGACANADA": 49,
            "VERMION": 85,
            "TOMATO-AL": 36,
            "SHEBA": 42,
            "R&M": 15,
            "LEVENTE": 73,
            "KUSEK": 2,
            "SMART": 17,
            "MALENO": 52,
            "KOPFSALAT": 5,
            "KÓNYA": 25,
            "GREENYARD": 66,
            "FRANIAL": 9
        },
        transporters: {
            "VERMION": 85,
            "TRANS-SPED": 3456,
            "THERMO FRUCHT": 3372,
            "STI": 3923,
            "KUSEK": 2,
            "SHEBA": 42,
            "RONI": 2999,
            "MÜLLER": 2535 // As requested, map to 2535 instead of 3880
        }
    };
    
    // Load report
    const rootDir = path.resolve(__dirname, '..');
    const reportPath = path.join(rootDir, 'mapping_report.json');
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    
    // Helper to insert/update identifiers
    async function upsertIdentifier(partnerId, idType, value) {
        if (!partnerId) return;
        const existing = await db('partner_identifiers')
            .where({ partner_id: partnerId, id_type: idType })
            .first();
            
        if (existing) {
            await db('partner_identifiers')
                .where('id', existing.id)
                .update({ value: value, updated_at: new Date() });
        } else {
            await db('partner_identifiers').insert({
                partner_id: partnerId,
                id_type: idType,
                value: value,
                is_verified: true,
                created_at: new Date(),
                updated_at: new Date()
            });
        }
    }
    
    // Process Customers
    for (const item of report.customers) {
        const name = item.short_name_from_csv;
        let pid = manualOverrides.customers[name];
        if (!pid && item.matches && item.matches.length === 1) {
            pid = item.matches[0].partner_id;
        }
        if (pid) await upsertIdentifier(pid, '(Customer) Vevők', name);
    }
    
    // Process References
    for (const item of report.references) {
        const name = item.short_name_from_csv;
        let pid = manualOverrides.references[name];
        if (!pid && item.matches && item.matches.length === 1) {
            pid = item.matches[0].partner_id;
        }
        if (pid) await upsertIdentifier(pid, '(Reference) Szállítók', name);
    }
    
    // Process Transporters
    for (const item of report.transporters) {
        const name = item.short_name_from_csv;
        let pid = manualOverrides.transporters[name];
        if (!pid && item.matches && item.matches.length === 1) {
            pid = item.matches[0].partner_id;
        }
        if (pid) await upsertIdentifier(pid, 'Fuvarozók', name);
    }
    
    console.log("Identifiers upserted.");
    
    // 3. Delete MÜLLER (ID 3880)
    console.log("Deleting empty MÜLLER (ID 3880)...");
    try {
        await db('partner_identifiers').where('partner_id', 3880).del();
        await db('partners').where('id', 3880).del();
        console.log("MÜLLER 3880 deleted.");
    } catch(err) {
        console.log("Could not delete 3880 (might be referenced).", err.message);
    }
    
    // 4. Find all "NE HASZNÁLD" partners (excluding 2999)
    console.log("Looking for 'NE HASZNÁLD' partners...");
    const badPartners = await db('partners')
        .where(function() {
            this.where('name', 'ilike', '%NE HASZNÁLD%')
                .orWhere('name', 'ilike', '%NE HASZNALD%')
                .orWhere('name', 'ilike', '%NE HASZN%');
        })
        .andWhere('id', '!=', 2999);
        
    console.log(`Found ${badPartners.length} partners marked as 'NE HASZNÁLD'. Attempting to delete...`);
    
    let deletedBad = 0;
    for (const p of badPartners) {
        try {
            await db('partner_identifiers').where('partner_id', p.id).del();
            await db('partners').where('id', p.id).del();
            deletedBad++;
        } catch(err) {
            // Foreign key constraints will prevent deletion if they are used
        }
    }
    console.log(`Deleted ${deletedBad} 'NE HASZNÁLD' partners.`);
    
    console.log("Done.");
    process.exit();
}

applyChanges();
