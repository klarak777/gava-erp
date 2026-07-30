const fs = require('fs');
const knex = require('knex');
const knexConfig = require('./knexfile');

const db = knex(knexConfig['development']);

async function runPatch() {
  console.log('Reading do_patch.sql...');
  const sql = fs.readFileSync('do_patch.sql', 'utf8');
  
  // Split by semicolon, but this might be naive if there are semicolons inside strings.
  // Our generated SQL is very clean, so splitting by `;\n` is mostly safe.
  const statements = sql.split(';\n').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--') && s !== 'BEGIN' && s !== 'COMMIT');
  
  console.log(`Found ${statements.length} statements.`);
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (stmt.startsWith('--')) continue; // Skip comments that were part of a split
    
    try {
      await db.raw(stmt);
    } catch (err) {
      console.error(`\n--- ERROR AT STATEMENT ${i} ---`);
      console.error(stmt);
      console.error('--- ERROR MESSAGE ---');
      console.error(err.message);
      break;
    }
    
    if (i % 1000 === 0) {
      process.stdout.write('.');
    }
  }
  
  console.log('\nFinished testing.');
  await db.destroy();
}

runPatch().catch(console.error);
