require('dotenv').config();
const db = require('knex')(require('./knexfile')['development']);

async function main() {
  // Keressük a partnereket, amelyeknek 2+ Reference azonosítójuk van
  const dupes = await db.raw(`
    SELECT pi.partner_id, p.name, 
           COUNT(*) as cnt, 
           STRING_AGG(pi.id::text || ':' || pi.value || ':' || CASE WHEN pi.is_inactive THEN 'INAKTÍV' ELSE 'AKTÍV' END, ' | ' ORDER BY pi.is_inactive, pi.id) as details
    FROM partner_identifiers pi
    JOIN partners p ON p.id = pi.partner_id
    WHERE pi.id_type = '(Reference) Szállítók'
    GROUP BY pi.partner_id, p.name
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC
  `);

  console.log('=== PARTNEREK TÖBB REFERENCE AZONOSÍTÓVAL ===\n');
  dupes.rows.forEach(r => {
    console.log(`partner[${r.partner_id}] "${r.name}" → ${r.cnt} darab:`);
    console.log(`  ${r.details}`);
  });

  // Jelöljük inaktívra a duplikátumokat - megtartjuk az ELSŐ nem-inaktív értéket
  let totalMarked = 0;
  for (const dup of dupes.rows) {
    const refs = await db('partner_identifiers')
      .where('partner_id', dup.partner_id)
      .andWhere('id_type', '(Reference) Szállítók')
      .orderBy('is_inactive', 'asc') // aktív először
      .orderBy('id', 'asc');         // régebbi először

    // Az ELSŐ aktív marad, a többi inaktív lesz
    let keptOne = false;
    for (const ref of refs) {
      if (!ref.is_inactive && !keptOne) {
        keptOne = true;
        console.log(`  ✅ MEGTART: [${ref.id}] "${ref.value}"`);
      } else if (!ref.is_inactive) {
        await db('partner_identifiers')
          .where('id', ref.id)
          .update({ is_inactive: true, updated_at: new Date() });
        console.log(`  🔴 INAKTÍV: [${ref.id}] "${ref.value}"`);
        totalMarked++;
      }
    }
  }

  // Ugyanezt Customer és Fuvarozó típusokra is
  const custDupes = await db.raw(`
    SELECT pi.partner_id, p.name, pi.id_type,
           COUNT(*) as cnt
    FROM partner_identifiers pi
    JOIN partners p ON p.id = pi.partner_id
    WHERE pi.id_type IN ('(Customer) Vevők', 'Fuvarozók')
    GROUP BY pi.partner_id, p.name, pi.id_type
    HAVING COUNT(*) > 1
    ORDER BY pi.id_type, cnt DESC
  `);

  console.log('\n=== Customer/Fuvarozó duplikátumok ===');
  for (const dup of custDupes.rows) {
    const refs = await db('partner_identifiers')
      .where('partner_id', dup.partner_id)
      .andWhere('id_type', dup.id_type)
      .orderBy('is_inactive', 'asc')
      .orderBy('id', 'asc');
    
    let keptOne = false;
    console.log(`\n  partner[${dup.partner_id}] "${dup.name}" | ${dup.id_type} → ${dup.cnt}x`);
    for (const ref of refs) {
      if (!ref.is_inactive && !keptOne) {
        keptOne = true;
        console.log(`    ✅ MEGTART: [${ref.id}] "${ref.value}"`);
      } else if (!ref.is_inactive) {
        await db('partner_identifiers')
          .where('id', ref.id)
          .update({ is_inactive: true, updated_at: new Date() });
        console.log(`    🔴 INAKTÍV: [${ref.id}] "${ref.value}"`);
        totalMarked++;
      }
    }
  }

  console.log(`\n✅ Összesen ${totalMarked} duplikált azonosító inaktívra jelölve.`);

  // Ellenőrzés: maradtak-e még duplikált AKTÍV Reference-ek?
  const remaining = await db.raw(`
    SELECT pi.partner_id, p.name, pi.id_type, COUNT(*) as cnt
    FROM partner_identifiers pi
    JOIN partners p ON p.id = pi.partner_id
    WHERE pi.id_type IN ('(Reference) Szállítók', '(Customer) Vevők', 'Fuvarozók')
      AND (pi.is_inactive = false OR pi.is_inactive IS NULL)
    GROUP BY pi.partner_id, p.name, pi.id_type
    HAVING COUNT(*) > 1
  `);
  if (remaining.rows.length === 0) {
    console.log('\n✅ NINCS TÖBB DUPLIKÁLT AKTÍV AZONOSÍTÓ! Minden rendben.');
  } else {
    console.log('\n⚠️ Még maradt duplikált aktív azonosító:');
    remaining.rows.forEach(r => console.log(`  ${r.name} | ${r.id_type} | ${r.cnt}x`));
  }

  await db.destroy();
}

main().catch(e => { console.error(e); process.exit(1); });
