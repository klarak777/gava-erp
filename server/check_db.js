require('dotenv').config();
const db = require('./src/db/db');

async function check() {
  try {
    // Seasons - ez van, többi üres
    const seasons = await db('seasons').select('*');
    console.log('Seasons:', JSON.stringify(seasons, null, 2));

    // PostgreSQL - melyik adatbázisban vagyunk?
    const dbInfo = await db.raw("SELECT current_database(), current_user, pg_postmaster_start_time()");
    console.log('\nAdatbázis neve:', dbInfo.rows[0].current_database);
    console.log('Felhasználó:', dbInfo.rows[0].current_user);
    console.log('PostgreSQL indítva:', dbInfo.rows[0].pg_postmaster_start_time);

    // DB lista - van-e más adatbázis?
    const dbs = await db.raw("SELECT datname FROM pg_database WHERE datistemplate=false ORDER BY datname");
    console.log('\nElerhető adatbázisok:');
    dbs.rows.forEach(r => console.log(' ', r.datname));

    // Mikor volt utoljára migráció?
    const migs = await db('knex_migrations').orderBy('batch', 'desc').limit(5);
    console.log('\nUtóbbi 5 migráció:');
    migs.forEach(m => console.log(` ${m.batch}. ${m.name} - ${m.migration_time}`));

    // Shipments tábla létezik és üres, vagy nincs is?
    const shipCols = await db.raw("SELECT column_name FROM information_schema.columns WHERE table_name='shipments' ORDER BY ordinal_position");
    console.log('\nshipments oszlopai:', shipCols.rows.map(r => r.column_name).join(', '));

  } catch (e) {
    console.error('HIBA:', e.message);
  }
  process.exit(0);
}

check();
