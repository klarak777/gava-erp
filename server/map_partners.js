const db = require('./src/db/db.js');
const fs = require('fs');
const path = require('path');

async function createMapping() {
    try {
        const rootDir = path.resolve(__dirname, '..');
        
        const readCsv = (filename) => {
            const content = fs.readFileSync(path.join(rootDir, filename), 'utf8');
            return content.split('\n')
                .map(line => line.trim())
                .filter((line, i) => line.length > 0 && i > 0); 
        };

        const customerNames = readCsv('Customer partnerek.csv');
        const referenceNames = readCsv('Reference partnerek.csv');
        const transportNames = readCsv('Transport Company partnerek.csv');
        
        const allPartners = await db('partners')
            .select('id', 'name');
            
        const allIdentifiers = await db('partner_identifiers')
            .select('partner_id', 'id_type', 'value');
            
        // Create lookup functions
        const findMatches = (shortName) => {
            const matches = [];
            const upName = shortName.toUpperCase();
            const normalizedName = upName.replace(/[^A-Z0-9]/g, '');
            
            // Check identifiers first (exact or contains)
            for (const id of allIdentifiers) {
                if (id.value && id.value.toUpperCase() === upName) {
                    const p = allPartners.find(p => p.id === id.partner_id);
                    if (p) matches.push({ type: 'identifier_exact', partner: p.name, partner_id: p.id, id_type: id.id_type, matched_value: id.value });
                }
            }
            
            // Check partner names
            for (const p of allPartners) {
                if (p.name.toUpperCase().includes(upName)) {
                    matches.push({ type: 'name_contains', partner: p.name, partner_id: p.id });
                } else if (normalizedName.length > 3 && p.name.toUpperCase().replace(/[^A-Z0-9]/g, '').includes(normalizedName)) {
                    matches.push({ type: 'name_similar', partner: p.name, partner_id: p.id });
                }
            }
            
            // Deduplicate matches
            const uniqueMatches = [];
            const seen = new Set();
            for (const m of matches) {
                if (!seen.has(m.partner_id)) {
                    seen.add(m.partner_id);
                    uniqueMatches.push(m);
                }
            }
            
            return uniqueMatches;
        };
        
        const mapList = (list) => {
            return list.map(name => {
                return {
                    short_name_from_csv: name,
                    matches: findMatches(name)
                };
            });
        };

        const report = {
            customers: mapList(customerNames),
            references: mapList(referenceNames),
            transporters: mapList(transportNames)
        };
        
        fs.writeFileSync(path.join(rootDir, 'mapping_report.json'), JSON.stringify(report, null, 2));
        console.log('Saved mapping_report.json to project root.');

    } catch(err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

createMapping();
