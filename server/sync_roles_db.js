const fs = require('fs');
const path = require('path');
const db = require('./src/db/db');

async function readCsv(filename) {
    const fullPath = path.join(__dirname, '..', filename);
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('Reference') && !l.startsWith('Costumer') && !l.startsWith('Transport Company'));
    return lines;
}

const ROLE_MAP = {
    'reference': ['(Reference) Szállítók', '(Reference) SzAllA-tA3k', '(Reference) SzAllA-tA3k', '(Reference) Sz\xC3\xA1ll\xC3\xADt\xC3\xB3k'],
    'customer': ['(Customer) Vevők', '(Customer) Vev`k', '(Customer) Vev\xC5\x91k'],
    'transporter': ['Fuvarozók', 'FuvarozA3k', 'Fuvaroz\xC3\xB3k']
};

// Fix character encoding issues from the CSV
function fixEncoding(str) {
    let s = str.toUpperCase();
    s = s.replace(/ANTON DRBECK/g, 'ANTON DÜRBECK');
    s = s.replace(/GEMSERING/g, 'GEMÜSERING');
    s = s.replace(/GYMLCSRT/g, 'GYÜMÖLCSÉRT');
    s = s.replace(/KNYA/g, 'KÓNYA');
    s = s.replace(/ROMNIA/g, 'ROMÁNIA');
    return s;
}

async function updateRole(role, csvItems, dbIdTypes) {
    const dbIdentifiers = await db('partner_identifiers')
        .whereIn('id_type', dbIdTypes)
        .select('id', 'partner_id', 'value', 'is_inactive');

    const csvUpper = csvItems.map(i => fixEncoding(i));
    
    let deactivatedCount = 0;
    let activatedCount = 0;

    for (const d of dbIdentifiers) {
        const val = (d.value || '').toUpperCase().trim();
        // Allow slightly different spellings or variations by checking exact match
        const inCsv = csvUpper.includes(val) || csvUpper.includes(fixEncoding(val));

        if (inCsv) {
            if (d.is_inactive === true || d.is_inactive === 1) {
                // Was inactive, make it active
                await db('partner_identifiers').where('id', d.id).update({ is_inactive: false });
                activatedCount++;
            }
        } else {
            if (!d.is_inactive) {
                // Not in CSV, make it inactive
                await db('partner_identifiers').where('id', d.id).update({ is_inactive: true });
                deactivatedCount++;
            }
        }
    }
    
    console.log(`[${role}] Deactivated (not in CSV): ${deactivatedCount}`);
    console.log(`[${role}] Activated (found in CSV): ${activatedCount}`);
}

async function run() {
    try {
        const refs = await readCsv('Reference partnerek.csv');
        const custs = await readCsv('Customer partnerek.csv');
        const trans = await readCsv('Transport Company partnerek.csv');

        await updateRole('Reference', refs, ROLE_MAP['reference']);
        await updateRole('Customer', custs, ROLE_MAP['customer']);
        await updateRole('Transporter', trans, ROLE_MAP['transporter']);

        console.log("Database update completed.");

    } catch (e) {
        console.error(e);
    } finally {
        db.destroy();
    }
}

run();
