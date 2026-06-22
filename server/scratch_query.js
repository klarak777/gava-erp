const db = require('./src/db/db');

async function check() {
  const tOrders = await db('transport_orders').limit(5);
  console.log('Transport Orders:', tOrders.map(t => t.file_path));

  const ekaers = await db('ekaer_records').limit(5);
  console.log('EKAERs:', ekaers.map(e => e.file_path));
  process.exit(0);
}

check();
