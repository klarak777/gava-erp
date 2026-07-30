const db = require('./src/db/db');

async function listProducts() {
    try {
        const products = await db('products').select('id', 'name', 'code').orderBy('id', 'asc');
        console.log("--- TERMÉKEK A SZERVEREN ---");
        products.forEach(p => {
            console.log(`ID: ${p.id.toString().padStart(4, ' ')} | Név: ${p.name.padEnd(35, ' ')} | Kód: ${p.code}`);
        });
    } catch (e) {
        console.error("Hiba a lekérdezéskor:", e);
    } finally {
        db.destroy();
    }
}

listProducts();
