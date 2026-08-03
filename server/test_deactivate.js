const db = require('./src/db/db');

async function test() {
    try {
        const t = await db('transporters').where('name', 'IMANOV / KÓNYA').first();
        console.log("Found transporter:", t);
        
        const activePartnerNames = new Set();
        const pName = 'not_imanov';
        activePartnerNames.add(pName.toUpperCase());
        
        let shouldDeactivate = false;
        const upperName = (t.name || '').toUpperCase().trim();
        if (!activePartnerNames.has(upperName) && t.is_active) {
            shouldDeactivate = true;
        }
        
        console.log("Should deactivate?", shouldDeactivate);
        
        if (shouldDeactivate) {
            const updated = await db('transporters').where('id', t.id).update({ is_active: false });
            console.log("Updated rows:", updated);
        }
        
        const tAfter = await db('transporters').where('name', 'IMANOV / KÓNYA').first();
        console.log("After update:", tAfter);
        
    } catch (e) {
        console.error(e);
    } finally {
        db.destroy();
    }
}
test();
