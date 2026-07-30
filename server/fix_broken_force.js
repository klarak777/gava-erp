const db = require('./src/db/db.js');

async function forceFixBroken() {
    try {
        await db('partner_identifiers').where('value', 'like', 'ANTON D%RBECK').update({ value: 'ANTON DÜRBECK', updated_at: new Date() });
        await db('partner_identifiers').where('value', 'like', 'GY%M%LCS%RT').update({ value: 'GYÜMÖLCSÉRT', updated_at: new Date() });
        await db('partner_identifiers').where('value', 'like', 'K%NYA').update({ value: 'KÓNYA', updated_at: new Date() });
        await db('partner_identifiers').where('value', 'like', 'SZ%KESI').update({ value: 'SZÉKESI', updated_at: new Date() });
        await db('partner_identifiers').where('value', 'like', 'T%TH FRIGO').update({ value: 'TÓTH FRIGO', updated_at: new Date() });
        await db('partner_identifiers').where('value', 'like', 'M%LLER').update({ value: 'MÜLLER', updated_at: new Date() });
        
        console.log("Forced fixes applied.");
        
    } catch(err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

forceFixBroken();
