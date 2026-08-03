const knex = require('knex');
const knexfile = require('./knexfile');
const db = knex(knexfile.development);

async function main() {
    try {
        console.log('--- Indul a 4 lokális eltérés javítása ---');

        // 1. KÓNYA: Átkötni Kónya Trans Korlátolt Felelősségű Társaság (ha van ilyen, keressük meg az ID-ját)
        let konyaKft = await db('partners').where('name', 'Kónya Trans Korlátolt Felelősségű Társaság').first();
        if (!konyaKft) {
            console.log('Nincs Kónya Trans... partner, létrehozzuk.');
            const [id] = await db('partners').insert({ name: 'Kónya Trans Korlátolt Felelősségű Társaság', is_active: true, type: 'Szállító/Fuvarozó/Vevő' }).returning('id');
            konyaKft = { id: id?.id || id };
        }
        
        const konyaUpdates = await db('partner_identifiers')
            .where('value', 'KÓNYA')
            .whereIn('id_type', ['Fuvarozók', '(Reference) Szállítók'])
            .update({ partner_id: konyaKft.id });
        console.log(`1. KÓNYA átkötve a Kónya Trans Kft-hez (${konyaUpdates} sor frissítve).`);

        // 2. OLYMPIC FRUIT -> OLYMPIC FRUITS
        const olympicUpdate = await db('partner_identifiers')
            .where('value', 'OLYMPIC FRUIT')
            .where('id_type', '(Reference) Szállítók')
            .update({ value: 'OLYMPIC FRUITS' });
        console.log(`2. OLYMPIC FRUIT átnevezve OLYMPIC FRUITS-re (${olympicUpdate} sor frissítve).`);

        // 3. SPAR HU partner nevének módosítása -> SPAR Magyarország Kereskedelmi Kft.
        const sparUpdate = await db('partners')
            .where('name', 'SPAR HU')
            .update({ name: 'SPAR Magyarország Kereskedelmi Kft.' });
        console.log(`3. SPAR HU partner átnevezve SPAR Magyarország...-ra (${sparUpdate} sor frissítve).`);

        // 4. EUROGROUP ITALY hozzáadása EUROGROUP ITALIA S.R.L.-hez (partner id: 23)
        const eurogroupPartner = await db('partners').where('name', 'EUROGROUP ITALIA S.R.L.').first();
        if (eurogroupPartner) {
            // Ellenőrizzük, van-e már
            const exists = await db('partner_identifiers')
                .where('partner_id', eurogroupPartner.id)
                .where('id_type', '(Reference) Szállítók')
                .where('value', 'EUROGROUP ITALY')
                .first();
            
            if (!exists) {
                await db('partner_identifiers').insert({
                    partner_id: eurogroupPartner.id,
                    id_type: '(Reference) Szállítók',
                    value: 'EUROGROUP ITALY',
                    is_inactive: false
                });
                console.log('4. EUROGROUP ITALY azonosító hozzáadva az EUROGROUP ITALIA S.R.L.-hez.');
            } else if (exists.is_inactive) {
                await db('partner_identifiers').where('id', exists.id).update({ is_inactive: false });
                console.log('4. EUROGROUP ITALY azonosító aktiválva.');
            } else {
                console.log('4. EUROGROUP ITALY azonosító már aktívan létezik.');
            }
        } else {
            console.log('Hiba: Nem található EUROGROUP ITALIA S.R.L. partner.');
        }

        console.log('KÉSZ!');
    } catch(e) {
        console.error('Hiba:', e);
    } finally {
        process.exit(0);
    }
}

main();
