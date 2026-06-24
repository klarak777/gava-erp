const db = require('./src/db/db');

const customers = [
    "ALDI AT",
    "ANTON DÜRBECK",
    "BILEK",
    "CASAS ROYES",
    "CORD",
    "CRETAN ROOT",
    "DG69",
    "EUROGROUP DEUTSCHLAND",
    "EUROGROUP ESPANA",
    "EXOTIC FRESH",
    "FRUBALMED",
    "GAVA",
    "GEMÜSERING",
    "GHU",
    "GLOBAL BERRY",
    "GREENCOOP",
    "GREENYARD",
    "GYÜMÖLCSÉRT",
    "HOFER",
    "IDEAL FRUITS",
    "KÓNYA",
    "KOPFSALAT",
    "KV LOGISTIKA",
    "LEHMANN & TROOST",
    "LEVENTE",
    "MANDERSLOOT",
    "OLYMPIC FRUIT",
    "R&M",
    "ROMÁNIA",
    "SAN NICOLA",
    "SPAR HU",
    "SYLVAN",
    "VILLAFRUT"
];

async function importCustomers() {
    console.log('Importing Customers...');
    let inserted = 0;
    for (const name of customers) {
        const existing = await db('partners')
            .where('name', name)
            .andWhere('type', 'vevő')
            .first();
            
        if (!existing) {
            await db('partners').insert({
                name: name,
                type: 'vevő',
                is_active: true
            });
            inserted++;
        }
    }
    console.log(`Successfully inserted ${inserted} new customers.`);
    process.exit(0);
}

importCustomers().catch(err => {
    console.error(err);
    process.exit(1);
});
