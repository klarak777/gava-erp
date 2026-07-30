require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('knex')(require('./knexfile')['development']);

const basePath = 'c:\\Users\\klara\\Documents\\Nepelemes ügyek\\Gavá\\ERP Access';

async function main() {
  // ═══ 1. Customer CSV kódolási probléma ellenőrzése ═══
  const custPath = path.join(basePath, 'Customer partnerek.csv');
  const rawBuf = fs.readFileSync(custPath);
  console.log('=== Customer CSV kódolás ellenőrzés ===');
  console.log('Első 3 bájt (BOM?):', rawBuf[0]?.toString(16), rawBuf[1]?.toString(16), rawBuf[2]?.toString(16));
  
  // Próbáljuk latin1/windows-1252 kódolással is
  const contentUtf8 = rawBuf.toString('utf8');
  const contentLatin1 = rawBuf.toString('latin1');
  
  const utf8Lines = contentUtf8.split(/\r?\n/).slice(1).filter(l => l.trim());
  const latin1Lines = contentLatin1.split(/\r?\n/).slice(1).filter(l => l.trim());
  
  console.log('\nUTF-8 olvasat:');
  utf8Lines.forEach(l => { if (l.includes('�') || l.includes('Ã')) console.log(`  ❌ "${l}"`); });
  
  console.log('\nLatin1 olvasat:');
  latin1Lines.forEach(l => { if (/[ÁÉÍÓÖŐÚÜŰ]/.test(l) || l.includes('DÜRBECK') || l.includes('ROMÁNIA')) console.log(`  ✅ "${l}"`); });
  
  // ═══ 2. Duplikált aktív azonosítók javítása (DG69, SMART, BOGNÁR, RONI, GAVA, EUROGROUP ESPANA) ═══
  console.log('\n=== Duplikált aktív azonosítók ===');
  const dupes = await db.raw(`
    SELECT pi.id_type, pi.value, COUNT(*) as cnt,
           STRING_AGG(pi.partner_id::text || ':' || p.name, ' | ' ORDER BY pi.id) as partners
    FROM partner_identifiers pi
    JOIN partners p ON p.id = pi.partner_id
    WHERE pi.id_type IN ('(Reference) Szállítók', '(Customer) Vevők', 'Fuvarozók')
      AND (pi.is_inactive = false OR pi.is_inactive IS NULL)
    GROUP BY pi.id_type, UPPER(pi.value), pi.value
    HAVING COUNT(*) > 1
    ORDER BY pi.id_type, pi.value
  `);
  dupes.rows.forEach(r => {
    console.log(`\n  ${r.id_type} | "${r.value}" → ${r.cnt}x: [${r.partners}]`);
  });

  // ═══ 3. Admin aktív listán szereplő, de tévesen inaktívra jelölt azonosítók visszaaktiválása ═══
  console.log('\n\n=== Tévesen inaktívra jelölt Admin-aktív azonosítók visszaaktiválása ===');
  
  // Reference: ANTON DÜRBECK, GEMÜSERING, GYÜMÖLCSÉRT, KÓNYA, MALENO Y TORRES, ROMÁNIA
  // Ezek az Admin CSV-ben aktívak → ha inaktívra jelöltük, visszaállítjuk
  const toReactivateRef = ['ANTON DÜRBECK', 'GEMÜSERING', 'GYÜMÖLCSÉRT', 'KÓNYA', 'MALENO Y TORRES', 'ROMÁNIA'];
  for (const val of toReactivateRef) {
    const rows = await db('partner_identifiers')
      .where('id_type', '(Reference) Szállítók')
      .andWhereRaw('UPPER(value) = ?', [val.toUpperCase()])
      .andWhere('is_inactive', true)
      .select('id', 'value', 'partner_id');
    
    if (rows.length > 0) {
      // Csak az elsőt aktiváljuk vissza
      await db('partner_identifiers').where('id', rows[0].id).update({ is_inactive: false, updated_at: new Date() });
      console.log(`  ✅ Visszaaktiválva (Reference): "${val}" (pi_id: ${rows[0].id})`);
    }
  }

  // Transport: BILEK, KÓNYA
  const toReactivateTrans = ['BILEK', 'KÓNYA'];
  for (const val of toReactivateTrans) {
    const rows = await db('partner_identifiers')
      .where('id_type', 'Fuvarozók')
      .andWhereRaw('UPPER(value) = ?', [val.toUpperCase()])
      .andWhere('is_inactive', true)
      .select('id', 'value', 'partner_id');
    
    if (rows.length > 0) {
      await db('partner_identifiers').where('id', rows[0].id).update({ is_inactive: false, updated_at: new Date() });
      console.log(`  ✅ Visszaaktiválva (Fuvarozók): "${val}" (pi_id: ${rows[0].id})`);
    }
  }

  // ═══ 4. Customer CSV újraolvasása helyes kódolással és hiányzók pótlása ═══
  console.log('\n=== Customer CSV hiányzó ékezetes azonosítók pótlása ===');
  // A Customer CSV fájl kódolási problémája miatt az ékezetes neveket manuálisan kezelni kell
  const customerFixes = [
    { csvCorrupt: 'ANTON D', correct: 'ANTON DÜRBECK' },
    { csvCorrupt: 'GEM', correct: 'GEMÜSERING' },
    { csvCorrupt: 'GY', correct: 'GYÜMÖLCSÉRT' },
    { csvCorrupt: 'K', correct: 'KÓNYA' },
    { csvCorrupt: 'ROM', correct: 'ROMÁNIA' },
  ];

  for (const fix of customerFixes) {
    // Ellenőrizzük van-e már aktív Customer azonosító ezzel a névvel
    const existing = await db('partner_identifiers')
      .where('id_type', '(Customer) Vevők')
      .andWhereRaw('UPPER(value) = ?', [fix.correct.toUpperCase()])
      .andWhere(function() {
        this.where('is_inactive', false).orWhereNull('is_inactive');
      })
      .first();
    
    if (existing) {
      console.log(`  ✅ Már létezik aktív Customer: "${fix.correct}"`);
      continue;
    }

    // Van-e inaktív?
    const inactive = await db('partner_identifiers')
      .where('id_type', '(Customer) Vevők')
      .andWhereRaw('UPPER(value) = ?', [fix.correct.toUpperCase()])
      .andWhere('is_inactive', true)
      .first();
    
    if (inactive) {
      await db('partner_identifiers').where('id', inactive.id).update({ is_inactive: false, updated_at: new Date() });
      console.log(`  ✅ Visszaaktiválva (Customer): "${fix.correct}" (pi_id: ${inactive.id})`);
    } else {
      console.log(`  ❌ NEM LÉTEZIK Customer azonosító: "${fix.correct}" – manuálisan kell felvenni!`);
    }
  }

  // ═══ 5. Végső ellenőrzés ═══
  console.log('\n=== VÉGSŐ DUPLIKÁLT AKTÍV ELLENŐRZÉS ===');
  const finalDupes = await db.raw(`
    SELECT pi.id_type, UPPER(pi.value) as val, COUNT(*) as cnt,
           STRING_AGG(pi.partner_id::text || '(' || p.name || ')', ' | ' ORDER BY pi.id) as partners
    FROM partner_identifiers pi
    JOIN partners p ON p.id = pi.partner_id
    WHERE pi.id_type IN ('(Reference) Szállítók', '(Customer) Vevők', 'Fuvarozók')
      AND (pi.is_inactive = false OR pi.is_inactive IS NULL)
    GROUP BY pi.id_type, UPPER(pi.value)
    HAVING COUNT(*) > 1
    ORDER BY pi.id_type, val
  `);
  if (finalDupes.rows.length === 0) {
    console.log('  ✅ Nincs duplikált aktív azonosító!');
  } else {
    console.log(`  ⚠️ ${finalDupes.rows.length} duplikált maradt:`);
    finalDupes.rows.forEach(r => console.log(`    ${r.id_type} | "${r.val}" → ${r.cnt}x: [${r.partners}]`));
  }

  await db.destroy();
}

main().catch(e => { console.error(e); process.exit(1); });
