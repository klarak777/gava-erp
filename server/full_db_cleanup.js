const db = require('./src/db/db');

async function fullDatabaseCleanup() {
    try {
        console.log("=================================================");
        console.log("      TELJES ADATBÁZIS TISZTÍTÁS ÉS RENDBETÉTEL   ");
        console.log("=================================================\n");

        // 1. CARGO DEMANDS (Áru igények) termék és partner ID javítása
        console.log("--- 1. Áru igények (cargo_demands) ID-k igazítása ---");
        const demands = await db('cargo_demands').select('*');
        let demandProdFixed = 0;
        let demandPartnerFixed = 0;

        for (const d of demands) {
            let updates = {};

            // Product ID javítás
            if (d.product_name) {
                const prod = await db('products')
                    .whereRaw('UPPER(name) = ?', [d.product_name.toUpperCase().trim()])
                    .orWhereRaw('UPPER(code) = ?', [d.product_name.toUpperCase().trim()])
                    .first();
                if (prod && d.product_id !== prod.id) {
                    updates.product_id = prod.id;
                    demandProdFixed++;
                }
            }

            // Partner ID javítás (Reference partner name alapján)
            if (d.partner_name) {
                const partner = await db('partners as p')
                    .leftJoin('partner_identifiers as pi', 'p.id', 'pi.partner_id')
                    .whereRaw('UPPER(p.name) = ?', [d.partner_name.toUpperCase().trim()])
                    .orWhereRaw('UPPER(pi.value) = ?', [d.partner_name.toUpperCase().trim()])
                    .select('p.id')
                    .first();
                if (partner && d.partner_id !== partner.id) {
                    updates.partner_id = partner.id;
                    demandPartnerFixed++;
                }
            }

            if (Object.keys(updates).length > 0) {
                await db('cargo_demands').where('id', d.id).update(updates);
            }
        }
        console.log(`✓ Áru igények: ${demandProdFixed} termék ID és ${demandPartnerFixed} partner ID javítva.\n`);

        // 2. SHIPMENT LINES (Kamion tételek) érvénytelen product_id és partner_id ellenőrzése
        console.log("--- 2. Kamion tételek (shipment_lines) hivatkozások ellenőrzése ---");
        const lines = await db('shipment_lines').select('id', 'product_id', 'partner_id');
        let invalidProductLines = 0;
        let invalidPartnerLines = 0;

        const validProductIds = new Set((await db('products').select('id')).map(p => p.id));
        const validPartnerIds = new Set((await db('partners').select('id')).map(p => p.id));

        for (const l of lines) {
            let updates = {};
            if (l.product_id && !validProductIds.has(l.product_id)) {
                updates.product_id = null;
                invalidProductLines++;
            }
            if (l.partner_id && !validPartnerIds.has(l.partner_id)) {
                updates.partner_id = null;
                invalidPartnerLines++;
            }
            if (Object.keys(updates).length > 0) {
                await db('shipment_lines').where('id', l.id).update(updates);
            }
        }
        console.log(`✓ Kamion tételek: ${invalidProductLines} hibás termék hivatkozás és ${invalidPartnerLines} hibás partner hivatkozás tisztítva.\n`);

        console.log("=================================================");
        console.log("      ADATBÁZIS TISZTÍTÁS SIKERESEN LEFUTOTT     ");
        console.log("=================================================");

    } catch (e) {
        console.error("Hiba a tisztítás során:", e);
    } finally {
        db.destroy();
    }
}

fullDatabaseCleanup();
