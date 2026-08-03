const db = require('./src/db/db');

async function test() {
    try {
        const transporters = await db('transporters').where('name', 'like', '%IMANOV%').select('id', 'name', 'is_active');
        console.log("Transporters:", transporters);
        
        const partnerIdentifiers = await db('partner_identifiers').where('value', 'like', '%IMANOV%').select('id', 'partner_id', 'value', 'is_inactive', 'id_type');
        console.log("Partner Identifiers:", partnerIdentifiers);
    } catch (e) {
        console.error(e);
    } finally {
        db.destroy();
    }
}
test();
