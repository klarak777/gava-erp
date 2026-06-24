const db = require('./src/db/db');

const transporters = [
    "ALL FRESH",
    "BILEK",
    "BOGNÁR",
    "BUGYI FERENC",
    "BVT",
    "CRETAN ROOT",
    "DERBY",
    "ESKADA",
    "FARAON",
    "FER TRANS",
    "FRIGOSPED",
    "FRUBALMED",
    "FRUCTUS",
    "FUSTER",
    "GAVA",
    "GAVA POLSKA",
    "HANKA",
    "HILLTOP",
    "HZ",
    "KERMOR",
    "KÓNYA",
    "KUSEK",
    "KV LOG",
    "LIVIU",
    "LOGISTICHOME",
    "MANDERSLOOT",
    "MESAVERDE",
    "MÜLLER",
    "NH CARGO",
    "PAP JÓZSEFNÉ",
    "PET-IMPEX",
    "RAINBOW",
    "RENACRIS",
    "RONI",
    "SHEBA",
    "STI",
    "S-TRANSPORT",
    "SWISS",
    "SZÉKESI",
    "THERMO FRUCHT",
    "TÓTH FRIGO",
    "TRANS-SPED",
    "VERMION"
];

async function importTransporters() {
    console.log('Importing Transport Companies...');
    let inserted = 0;
    for (const company of transporters) {
        const existing = await db('transporters')
            .where('name', company)
            .first();
            
        if (!existing) {
            await db('transporters').insert({
                name: company,
                is_active: true
            });
            inserted++;
        }
    }
    console.log(`Successfully inserted ${inserted} new transport companies.`);
    process.exit(0);
}

importTransporters().catch(err => {
    console.error(err);
    process.exit(1);
});
