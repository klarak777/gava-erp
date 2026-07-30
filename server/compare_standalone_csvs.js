require('dotenv').config();
const fs = require('fs');
const path = require('path');
const knex = require('knex');
const db = knex(require('./knexfile')['development']);

const basePath = 'c:\\Users\\klara\\Documents\\Nepelemes ügyek\\Gavá\\ERP Access';

function readCsvList(filename) {
  const filePath = path.join(basePath, filename);
  let content = fs.readFileSync(filePath, 'latin1'); // using latin1 for Hungarian chars or UTF-8 if BOM
  // If UTF-8 BOM present
  const buf = fs.readFileSync(filePath);
  if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
    content = buf.toString('utf8').slice(1);
  }
  
  const lines = content.split(/\r?\n/);
  const result = new Set();
  
  for (let i = 1; i < lines.length; i++) {
    const val = lines[i].trim();
    if (val && val !== '-' && val !== '0' && val !== '#N/A') {
      result.add(val);
    }
  }
  return Array.from(result);
}

async function main() {
  const refCsv = readCsvList('Reference partnerek.csv');
  const custCsv = readCsvList('Customer partnerek.csv');
  const transCsv = readCsvList('Transport Company partnerek.csv');

  console.log(`CSV-kből beolvasva:
  - Reference partnerek.csv: ${refCsv.length} db
  - Customer partnerek.csv: ${custCsv.length} db
  - Transport Company partnerek.csv: ${transCsv.length} db`);

  // DB queries
  // 1. Reference in DB
  const dbRefsRaw = await db('partner_identifiers as pi')
    .select('pi.value as short_name', 'p.name as full_name', 'p.id as partner_id', 'p.is_active')
    .leftJoin('partners as p', 'pi.partner_id', 'p.id')
    .whereIn('pi.id_type', ['(Reference) Szállítók', '(Reference) Sz\xC3\xA1ll\xC3\xADt\xC3\xB3k']);

  // 2. Customer in DB
  const dbCustsRaw = await db('partner_identifiers as pi')
    .select('pi.value as short_name', 'p.name as full_name', 'p.id as partner_id', 'p.is_active')
    .leftJoin('partners as p', 'pi.partner_id', 'p.id')
    .whereIn('pi.id_type', ['(Customer) Vevők', '(Customer) Vev\xC5\x91k']);

  // 3. Transporters in DB
  const dbTransportersTable = await db('transporters').select('id', 'name', 'is_active');
  const dbTransIdentifiers = await db('partner_identifiers as pi')
    .select('pi.value as short_name', 'p.name as full_name', 'p.id as partner_id', 'p.is_active')
    .leftJoin('partners as p', 'pi.partner_id', 'p.id')
    .whereIn('pi.id_type', ['Fuvarozók', 'Fuvaroz\xC3\xB3k']);

  const dbRefMap = new Map();
  dbRefsRaw.forEach(r => {
    if (r.short_name) dbRefMap.set(r.short_name.trim().toUpperCase(), r);
  });

  const dbCustMap = new Map();
  dbCustsRaw.forEach(c => {
    if (c.short_name) dbCustMap.set(c.short_name.trim().toUpperCase(), c);
  });

  const dbTransMap = new Map();
  dbTransportersTable.forEach(t => {
    if (t.name) dbTransMap.set(t.name.trim().toUpperCase(), { short_name: t.name, full_name: t.name, is_active: t.is_active });
  });
  dbTransIdentifiers.forEach(t => {
    if (t.short_name && !dbTransMap.has(t.short_name.trim().toUpperCase())) {
      dbTransMap.set(t.short_name.trim().toUpperCase(), t);
    }
  });

  function compare(csvList, dbMap) {
    const present = [];
    const missingInDb = [];

    csvList.forEach(item => {
      const key = item.toUpperCase();
      if (dbMap.has(key)) {
        present.push({ csv: item, db: dbMap.get(key) });
      } else {
        missingInDb.push(item);
      }
    });

    return { present, missingInDb };
  }

  const refComp = compare(refCsv, dbRefMap);
  const custComp = compare(custCsv, dbCustMap);
  const transComp = compare(transCsv, dbTransMap);

  let md = `# Aktív Partnerek Összehasonlító Jelentése (Azonosító CSV-k vs. ADMIN / Adatbázis)\n\n`;
  md += `Ezen elemzés az alábbi 3 célspecifikus azonosító CSV fájlt hasonlítja össze a rendszer (ADMIN modul) adatbázisában szereplő adatokkal:\n`;
  md += `- \`Reference partnerek.csv\`\n`;
  md += `- \`Customer partnerek.csv\`\n`;
  md += `- \`Transport Company partnerek.csv\`\n\n`;

  md += `## 📊 Összegző Statisztika\n\n`;
  md += `| Kategória (CSV fájl) | Aktív CSV elemek száma | Megtalálható az ADMIN adatbázisban | HIÁNYZIK az ADMIN adatbázisból |\n`;
  md += `|---|---|---|---|\n`;
  md += `| **Reference partnerek** | ${refCsv.length} | ${refComp.present.length} | **${refComp.missingInDb.length}** |\n`;
  md += `| **Customer partnerek** | ${custCsv.length} | ${custComp.present.length} | **${custComp.missingInDb.length}** |\n`;
  md += `| **Transport Company partnerek** | ${transCsv.length} | ${transComp.present.length} | **${transComp.missingInDb.length}** |\n\n`;

  // 1. Reference
  md += `---\n\n## 1. Reference Partnerek (\`Reference partnerek.csv\`)\n\n`;
  if (refComp.missingInDb.length > 0) {
    md += `### ⚠️ Adatbázisból (ADMIN) HIÁNYZÓ Reference-ek (${refComp.missingInDb.length} db)\n\n`;
    md += `| # | CSV-ben szereplő név |\n|---|---|\n`;
    refComp.missingInDb.sort((a,b)=>a.localeCompare(b,'hu')).forEach((m, i) => {
      md += `| ${i+1} | ${m} |\n`;
    });
  } else {
    md += `✅ Minden CSV-ben lévő Reference megtalálható az ADMIN adatbázisban!\n\n`;
  }

  md += `\n### ✅ Adatbázisban (ADMIN) MEGLÉVŐ Reference-ek (${refComp.present.length} db)\n\n`;
  md += `| # | CSV Név | DB Rövid Név (Azonosító) | DB Partner Teljes Név | Statusz |\n|---|---|---|---|---|\n`;
  refComp.present.sort((a,b)=>a.csv.localeCompare(b.csv,'hu')).forEach((p, i) => {
    const status = p.db.is_active ? 'Aktív' : 'Inaktív';
    md += `| ${i+1} | ${p.csv} | ${p.db.short_name || '-'} | ${p.db.full_name || '-'} | ${status} |\n`;
  });

  // 2. Customer
  md += `\n---\n\n## 2. Customer Partnerek (\`Customer partnerek.csv\`)\n\n`;
  if (custComp.missingInDb.length > 0) {
    md += `### ⚠️ Adatbázisból (ADMIN) HIÁNYZÓ Customer-ek (${custComp.missingInDb.length} db)\n\n`;
    md += `| # | CSV-ben szereplő név |\n|---|---|\n`;
    custComp.missingInDb.sort((a,b)=>a.localeCompare(b,'hu')).forEach((m, i) => {
      md += `| ${i+1} | ${m} |\n`;
    });
  } else {
    md += `✅ Minden CSV-ben lévő Customer megtalálható az ADMIN adatbázisban!\n\n`;
  }

  md += `\n### ✅ Adatbázisban (ADMIN) MEGLÉVŐ Customer-ek (${custComp.present.length} db)\n\n`;
  md += `| # | CSV Név | DB Rövid Név (Azonosító) | DB Partner Teljes Név | Statusz |\n|---|---|---|---|---|\n`;
  custComp.present.sort((a,b)=>a.csv.localeCompare(b.csv,'hu')).forEach((p, i) => {
    const status = p.db.is_active ? 'Aktív' : 'Inaktív';
    md += `| ${i+1} | ${p.csv} | ${p.db.short_name || '-'} | ${p.db.full_name || '-'} | ${status} |\n`;
  });

  // 3. Transport Company
  md += `\n---\n\n## 3. Transport Company Partnerek (\`Transport Company partnerek.csv\`)\n\n`;
  if (transComp.missingInDb.length > 0) {
    md += `### ⚠️ Adatbázisból (ADMIN) HIÁNYZÓ Fuvarozók (${transComp.missingInDb.length} db)\n\n`;
    md += `| # | CSV-ben szereplő név |\n|---|---|\n`;
    transComp.missingInDb.sort((a,b)=>a.localeCompare(b,'hu')).forEach((m, i) => {
      md += `| ${i+1} | ${m} |\n`;
    });
  } else {
    md += `✅ Minden CSV-ben lévő Fuvarozó megtalálható az ADMIN adatbázisban!\n\n`;
  }

  md += `\n### ✅ Adatbázisban (ADMIN) MEGLÉVŐ Fuvarozók (${transComp.present.length} db)\n\n`;
  md += `| # | CSV Név | DB Cégnév / Azonosító | Statusz |\n|---|---|---|---|\n`;
  transComp.present.sort((a,b)=>a.csv.localeCompare(b.csv,'hu')).forEach((p, i) => {
    const status = p.db.is_active ? 'Aktív' : 'Inaktív';
    md += `| ${i+1} | ${p.csv} | ${p.db.short_name || p.db.full_name || '-'} | ${status} |\n`;
  });

  const outPath = path.join(basePath, 'Aktiv_Partnerek_Osszehasonlitas.md');
  fs.writeFileSync(outPath, md, 'utf8');
  console.log('Saved standalone comparison report to:', outPath);

  await db.destroy();
}

main().catch(e => { console.error(e.message); process.exit(1); });
