require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function main() {
    try {
        const res = await pool.query(`
            SELECT id, order_number, season_id, loading_date, is_loaded 
            FROM shipments 
            WHERE order_number IN ('LOG355', 'LOG356', 'LOG 355', 'LOG 356')
            ORDER BY id DESC
        `);
        console.log("Found shipments:");
        console.table(res.rows);

        for (const r of res.rows) {
            const linesRes = await pool.query(`SELECT COUNT(*) as c FROM shipment_lines WHERE shipment_id = $1`, [r.id]);
            console.log(`Shipment ID ${r.id} (${r.order_number}): line count = ${linesRes.rows[0].c}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
main();
