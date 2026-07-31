const db = require('./src/db/db');

async function run() {
  try {
    const deletedCount = await db('cargo_demands')
      .where('notes', 'like', '%Automatikus: raklap csö%')
      .del();
    
    console.log(`Sikeresen törölve ${deletedCount} darab automatikusan visszakerült tétel az Áru igények közül.`);
  } catch (err) {
    console.error('Hiba történt a törlés során:', err);
  } finally {
    db.destroy();
  }
}

run();
