require('dotenv').config();
const db = require('knex')(require('./knexfile')['development']);

async function fix() {
  // 1. Duplikátumok törlése - megtartjuk a legkisebb ID-jű sort
  const result = await db.raw(`
    DELETE FROM partner_identifiers
    WHERE id IN (
      SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY partner_id, id_type ORDER BY id) as rn
        FROM partner_identifiers
      ) t
      WHERE t.rn > 1
    )
  `);
  console.log('Törölve:', result.rowCount, 'duplikált sor');

  // 2. Ellenőrzés
  const after = await db.raw("SELECT COUNT(*) as cnt FROM partner_identifiers WHERE id_type = '(Reference) Szállítók'");
  console.log('Maradék Reference:', after.rows[0].cnt);

  // 3. Duplikátum ellenőrzés
  const dupes = await db.raw("SELECT partner_id, COUNT(*) as cnt FROM partner_identifiers WHERE id_type = '(Reference) Szállítók' GROUP BY partner_id HAVING COUNT(*) > 1");
  console.log('Maradék duplikátumok:', dupes.rows.length === 0 ? 'NINCS ✅' : dupes.rows);

  // 4. JOIN méret ellenőrzés
  const joinSize = await db.raw(`
    SELECT COUNT(*) as cnt FROM shipment_lines
    LEFT JOIN shipments ON shipment_lines.shipment_id = shipments.id
    LEFT JOIN partners ON shipment_lines.partner_id = partners.id
    LEFT JOIN partner_identifiers ON partner_identifiers.partner_id = partners.id
      AND partner_identifiers.id_type = '(Reference) Szállítók'
    WHERE shipments.is_loaded = true
  `);
  console.log('JOIN méret javítás után:', joinSize.rows[0].cnt, 'sor');

  await db.destroy();
}

fix().catch(e => { console.error(e.message); process.exit(1); });
