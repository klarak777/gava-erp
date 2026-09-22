const db = require('../src/db/db');

async function run() {
    try {
        const sscc = '359900010000000276';
        console.log(`Keresem a ${sscc} SSCC kóddal rendelkező MESTER raklapot...`);
        
        const label = await db('sscc_labels').where({ sscc: sscc, is_consolidated_master: true }).first();
        
        if (!label) {
            console.log('Nem találtam ilyen MESTER raklapot a szerveren.');
        } else {
            console.log('Raklap megtalálva. Törlés folyamatban...');
            const count = await db('sscc_labels').where({ id: label.id }).del();
            console.log(`Sikeresen törölve ${count} db rekord (SSCC: ${sscc}).`);
        }
    } catch (e) {
        console.error('Hiba történt a törlés során:', e);
    } finally {
        await db.destroy();
    }
}

run();
