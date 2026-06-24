const db = require('./src/db/db');

async function updateTransporters() {
    const list = [
        "ALL FRESH", "BILEK", "BOGNÁR", "BUGYI FERENC", "BVT", "CRETAN ROOT", "DERBY", 
        "ESKADA", "FARAON", "FER TRANS", "FRIGOSPED", "FRUBALMED", "FRUCTUS", "FUSTER", 
        "GAVA", "GAVA POLSKA", "HANKA", "HILLTOP", "HZ", "KERMOR", "KÓNYA", "KUSEK", 
        "KV LOG", "LIVIU", "LOGISTICHOME", "MANDERSLOOT", "MESAVERDE", "MÜLLER", 
        "NH CARGO", "PAP JÓZSEFNÉ", "PET-IMPEX", "RAINBOW", "RENACRIS", "RONI", 
        "SHEBA", "STI", "S-TRANSPORT", "SWISS", "SZÉKESI", "THERMO FRUCHT", "TÓTH FRIGO", 
        "TRANS-SPED", "VERMION"
    ];

    try {
        console.log("Deactivating all transporters...");
        await db('transporters').update({ is_active: false });

        console.log("Updating/Inserting new transporters...");
        for (let name of list) {
            // Trim and uppercase just to be safe
            name = name.trim().toUpperCase();
            
            const existing = await db('transporters').where({ name }).first();
            if (existing) {
                await db('transporters').where({ id: existing.id }).update({ is_active: true });
                console.log(`Activated existing: ${name}`);
            } else {
                await db('transporters').insert({ name, is_active: true });
                console.log(`Inserted new: ${name}`);
            }
        }
        
        console.log("Done!");
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await db.destroy();
    }
}

updateTransporters();
