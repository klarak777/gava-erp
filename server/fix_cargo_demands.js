const db = require('./src/db/db');

async function fixCargoDemandsProducts() {
    try {
        console.log("=== ÁRU IGÉNYEK (CARGO DEMANDS) TERMÉK ID JAVÍTÁSA ===");
        const demands = await db('cargo_demands').select('id', 'product_id', 'product_name');
        let fixedCount = 0;

        for (const demand of demands) {
            if (!demand.product_name) continue;

            const productByName = await db('products')
                .whereRaw('UPPER(name) = ?', [demand.product_name.toUpperCase().trim()])
                .orWhereRaw('UPPER(code) = ?', [demand.product_name.toUpperCase().trim()])
                .select('id')
                .first();

            if (productByName) {
                if (demand.product_id !== productByName.id) {
                    await db('cargo_demands')
                        .where('id', demand.id)
                        .update({ product_id: productByName.id });
                    console.log(`Javítva: Tétel #${demand.id} (${demand.product_name}) ID-ja lecserélve: ${demand.product_id} -> ${productByName.id}`);
                    fixedCount++;
                }
            } else {
                console.log(`Figyelem: A '${demand.product_name}' termék nem található a DO szerver adatbázisában! (Tétel #${demand.id})`);
            }
        }
        console.log(`\nÖsszesen ${fixedCount} áru igény tétel termék ID-ja lett sikeresen kijavítva a DO szerveren.`);
    } catch (e) {
        console.error("Hiba:", e);
    } finally {
        db.destroy();
    }
}

fixCargoDemandsProducts();
