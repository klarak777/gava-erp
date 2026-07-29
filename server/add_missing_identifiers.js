require('dotenv').config();
const fs = require('fs');
const knex = require('knex');
const db = knex(require('./knexfile')['development']);

async function main() {
  console.log('--- Lokális partner azonosítók hozzáadása ---');

  // 1. OLASO es WRAPPING partner letrehozasa ha nem letezik
  let olaso = await db('partners').where('name', 'OLASO').first();
  if (!olaso) {
    const [inserted] = await db('partners').insert({ name: 'OLASO', is_active: true }).returning('*');
    olaso = inserted || await db('partners').where('name', 'OLASO').first();
    console.log('Új partner létrehozva: OLASO (ID:', olaso.id, ')');
  }

  let wrapping = await db('partners').where('name', 'WRAPPING').first();
  if (!wrapping) {
    const [inserted] = await db('partners').insert({ name: 'WRAPPING', is_active: true }).returning('*');
    wrapping = inserted || await db('partners').where('name', 'WRAPPING').first();
    console.log('Új partner létrehozva: WRAPPING (ID:', wrapping.id, ')');
  }

  const itemsToInsert = [
    // Customer
    { partner_name: 'BILEK', id_type: '(Customer) Vevők', value: 'BILEK' },
    { partner_name: 'KÓNYA ZOLTÁNNÉ', id_type: '(Customer) Vevők', value: 'KÓNYA' },

    // Reference
    { partner_name: 'GAVA TXEQUIA S.R.O.', id_type: '(Reference) Szállítók', value: 'GAVA' },
    { partner_name: 'Maleno Y Torres Exportación S.L.', id_type: '(Reference) Szállítók', value: 'MALENO Y TORRES' },
    { partner_name: 'KOMPAGRI ESPANA SL', id_type: '(Reference) Szállítók', value: 'COMPAGRI' },
    { partner_name: 'Agroponiente Natural Produce S.L.', id_type: '(Reference) Szállítók', value: 'AGROPONIENTE' },
    { partner_name: 'Agroponiente Natural Produce S.L.', id_type: '(Reference) Szállítók', value: 'AGROPONIENTE NIJAR' },
    { partner_name: 'CASI', id_type: '(Reference) Szállítók', value: 'CASI AEROPORTO' },
    { partner_name: 'CASI', id_type: '(Reference) Szállítók', value: 'CASI AIRPORT' },
    { partner_name: 'OLASO', id_type: '(Reference) Szállítók', value: 'OLASO' },
    { partner_name: 'WRAPPING', id_type: '(Reference) Szállítók', value: 'WRAPPING' },
  ];

  for (const item of itemsToInsert) {
    const partner = await db('partners').where('name', 'ilike', item.partner_name).first();
    if (!partner) {
      console.error(`❌ Nem található partner: ${item.partner_name}`);
      continue;
    }

    const existing = await db('partner_identifiers')
      .where({ partner_id: partner.id, id_type: item.id_type, value: item.value })
      .first();

    if (!existing) {
      await db('partner_identifiers').insert({
        partner_id: partner.id,
        id_type: item.id_type,
        value: item.value,
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      });
      console.log(`✅ Hozzáadva: ${item.id_type} -> "${item.value}" (Partner: ${partner.name}, ID: ${partner.id})`);
    } else {
      console.log(`ℹ️ Már létezik: ${item.id_type} -> "${item.value}"`);
    }
  }

  // DO SQL generálás (név alapú kereséssel)
  const sqlLines = [];
  sqlLines.push('-- HIÁNYZÓ PARTNER AZONOSÍTÓK BEILLESZTÉSE DO SZERVEREN');
  sqlLines.push('BEGIN;');
  sqlLines.push('');
  sqlLines.push('-- 1. OLASO és WRAPPING partnerek biztosítása');
  sqlLines.push(`INSERT INTO partners (name, is_active, created_at, updated_at) SELECT 'OLASO', true, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM partners WHERE UPPER(name) = 'OLASO');`);
  sqlLines.push(`INSERT INTO partners (name, is_active, created_at, updated_at) SELECT 'WRAPPING', true, NOW(), NOW() WHERE NOT EXISTS (SELECT 1 FROM partners WHERE UPPER(name) = 'WRAPPING');`);
  sqlLines.push('');
  sqlLines.push('-- 2. Azonosítók társítása partner név alapján');

  function esc(s) { return "'" + String(s).replace(/'/g, "''") + "'"; }

  for (const item of itemsToInsert) {
    sqlLines.push(
      `INSERT INTO partner_identifiers (partner_id, id_type, value, created_at, updated_at) ` +
      `SELECT id, ${esc(item.id_type)}, ${esc(item.value)}, NOW(), NOW() ` +
      `FROM partners WHERE UPPER(name) = UPPER(${esc(item.partner_name)}) ` +
      `AND NOT EXISTS (SELECT 1 FROM partner_identifiers WHERE partner_id = partners.id AND id_type = ${esc(item.id_type)} AND value = ${esc(item.value)}) LIMIT 1;`
    );
  }

  sqlLines.push('');
  sqlLines.push('COMMIT;');

  const sqlContent = sqlLines.join('\n');
  fs.writeFileSync('do_add_missing_identifiers.sql', Buffer.from(sqlContent, 'utf8'));
  console.log('\n✅ SQL patch generálva: do_add_missing_identifiers.sql');

  await db.destroy();
}

main().catch(e => { console.error(e.message); process.exit(1); });
