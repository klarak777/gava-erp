const db = require('./src/db/db');

const references = [
    "AGRONERVION",
    "AGROPONIENTE",
    "AGROPONIENTE NATURAL",
    "AGROPONIENTE NIJAR",
    "ANTON DÜRBECK",
    "AXARFRUIT",
    "BERTIPACK",
    "BILEK",
    "CASAS ROYES",
    "CASI",
    "CASI AEROPORTO",
    "CASI AIRPORT",
    "CASI PARTIDORES",
    "CLARA",
    "COMPAGRI",
    "CORD",
    "CRETAN ROOT",
    "DELGAFRUITS",
    "DG69",
    "ECOINVER BIO",
    "ESCOBAR",
    "ESCOFRESH",
    "ESMAR",
    "EUROGROUP DEUTSCHLAND",
    "EUROGROUP ESPANA",
    "EXOTIC FRESH",
    "EXPOALMA",
    "FA. DE JONG",
    "FARAON",
    "FRANIAL",
    "FRESSAN",
    "FRUBALMED",
    "FRUTAS GAVA",
    "GALLARDO",
    "GAVA",
    "GAVA POLSKA",
    "GEMÜSERING",
    "GLOBAL BERRY",
    "GREEN QUALITY",
    "GREENCOOP",
    "GREENYARD",
    "GYÜMÖLCSÉRT",
    "IDEAL FRUITS",
    "KOMPAGRI",
    "KÓNYA",
    "KOPALMERIA",
    "KOPFSALAT",
    "KUSEK",
    "LA CALIFORNIA",
    "LEHMANN & TROOST",
    "LEVENTE",
    "MALENO",
    "MALENO Y TORRES",
    "MANDERSLOOT",
    "NATURINDA",
    "NATURNAR",
    "OLASO",
    "OLYMPIC FRUIT",
    "R&M",
    "ROMÁNIA",
    "SAN NICOLA",
    "SENOR TOMATE",
    "SHEBA",
    "SMART",
    "SOLHERBS",
    "SPAR HU",
    "SYLVAN",
    "TOMATO-AL",
    "VEGACANADA",
    "VERMION",
    "WRAPPING"
];

async function importReferences() {
    console.log('Importing References...');
    let inserted = 0;
    for (const refName of references) {
        // Ellenőrizzük, hogy létezik-e már
        const existing = await db('partners')
            .where('name', refName)
            .andWhere('type', 'szállító')
            .first();
            
        if (!existing) {
            await db('partners').insert({
                name: refName,
                type: 'szállító',
                is_active: true
            });
            inserted++;
        }
    }
    console.log(`Successfully inserted ${inserted} new references.`);
    process.exit(0);
}

importReferences().catch(err => {
    console.error(err);
    process.exit(1);
});
