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

async function checkRole(role, csvItems, dbIdTypes) {
    const dbIdentifiers = await db('partner_identifiers')
        .whereIn('id_type', dbIdTypes)
        .select('id', 'partner_id', 'value', 'is_inactive');

    const csvUpper = csvItems.map(i => i.toUpperCase());
    
    const matchedCsv = new Set();
    const missingCsv = [];
    
    // Check which CSV items exist in DB
    for (const item of csvUpper) {
        const match = dbIdentifiers.find(d => (d.value || '').toUpperCase().trim() === item);
        if (match) {
            matchedCsv.add(item);
        } else {
            missingCsv.push(item);
        }
    }

    const toDeactivate = [];
    const toActivate = [];

    // Check DB items to see what needs to be deactivated/activated
    for (const d of dbIdentifiers) {
        const val = (d.value || '').toUpperCase().trim();
        if (csvUpper.includes(val)) {
            if (d.is_inactive === true || d.is_inactive === 1) {
                toActivate.push(d.value);
            }
        } else {
            if (!d.is_inactive) {
                toDeactivate.push(d.value);
            }
        }
    }

    return {
        role,
        totalCsv: csvItems.length,
        matchedCsv: matchedCsv.size,
        missingCsv,
        toActivate,
        toDeactivate
    };
}

async function run() {
    try {
        const refs = await readCsv('Reference partnerek.csv');
        const custs = await readCsv('Customer partnerek.csv');
        const trans = await readCsv('Transport Company partnerek.csv');

        const refRes = await checkRole('Reference', refs, ROLE_MAP['reference']);
        const custRes = await checkRole('Customer', custs, ROLE_MAP['customer']);
        const transRes = await checkRole('Transporter', trans, ROLE_MAP['transporter']);

        const results = { reference: refRes, customer: custRes, transporter: transRes };
        console.log(JSON.stringify(results, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        db.destroy();
    }
}

run();
