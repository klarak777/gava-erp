const db = require('./server/src/db/db');
db.raw("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
  .then(r => console.log(r.rows.map(x => x.table_name)))
  .finally(() => process.exit(0));
