const db = require('./src/db/db.js');

async function fixBrokenEncoding() {
    try {
        // Find identifiers containing the replacement character
        const brokenIdentifiers = await db('partner_identifiers')
            .where('value', 'like', '%\uFFFD%')
            .select('id', 'value', 'partner_id');
            
        console.log(`Found ${brokenIdentifiers.length} broken identifiers.`);
        
        for (const row of brokenIdentifiers) {
            // Fetch the partner's actual name to try and fix it
            const partner = await db('partners').where('id', row.partner_id).first();
            if (!partner) continue;
            
            // We know the broken characters are usually Ü, Ö, É, Á, Ó, Ú, Í
            // Let's create a map for specific known broken ones from the user's report
            let fixed = row.value;
            if (row.value === 'ANTON D\uFFFDBECK') fixed = 'ANTON DÜRBECK';
            else if (row.value === 'GY\uFFFD\uFFFDLCS\uFFFDRT') fixed = 'GYÜMÖLCSÉRT';
            else if (row.value === 'GEM\uFFFDSESERING' || row.value === 'GEM\uFFFDSESRING' || row.value === 'GEM\uFFFDSESERING' || row.value === 'GEM\uFFFDSERING') fixed = 'GEMÜSERING';
            else if (row.value === 'K\uFFFDDNYA' || row.value === 'K\uFFFDNYA') fixed = 'KÓNYA';
            else if (row.value === 'ROM\uFFFDDNIA' || row.value === 'ROM\uFFFDNIA') fixed = 'ROMÁNIA';
            else if (row.value === 'SZ\uFFFDKESI') fixed = 'SZÉKESI';
            else if (row.value === 'T\uFFFDT FRIGO' || row.value === 'T\uFFFDDTH FRIGO' || row.value === 'T\uFFFDTH FRIGO') fixed = 'TÓTH FRIGO';
            else if (row.value === 'M\uFFFDLER' || row.value === 'M\uFFFDDLLER' || row.value === 'M\uFFFDLLER') fixed = 'MÜLLER';
            
            console.log(`Fixing: ${row.value} -> ${fixed}`);
            
            if (fixed !== row.value) {
                await db('partner_identifiers')
                    .where('id', row.id)
                    .update({ value: fixed, updated_at: new Date() });
            }
        }
        
        console.log("Fixes applied.");
        
    } catch(err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

fixBrokenEncoding();
