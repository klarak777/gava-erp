require('dotenv').config();
const fs = require('fs');
const knex = require('knex');
const db = knex(require('./knexfile')['development']);

const csvPath = 'c:\\Users\\klara\\Documents\\Nepelemes ügyek\\Gavá\\ERP Access\\25-26 Fuvarok összesítö V2 260617.csv';

const isValidPartner = (val) => {
  if (!val) return false;
  const v = val.trim();
  if (v === '' || v === '-' || v === '0' || v === '0,00' || v === '#N/A') return false;
  return true;
};

async function main() {
  // 1. Read CSV partners
  let content = fs.readFileSync(csvPath, 'utf8');
  if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
  const lines = content.split(/\r?\n/);
  const header = lines[0].split(';');

  const refIdx = header.indexOf('Reference');
  const custIdx = header.indexOf('Customer');
  const transIdx = header.indexOf('Transport company');

  const csvRefs = new Set();
  const csvCusts = new Set();
  const csvTrans = new Set();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(';');
    if (refIdx !== -1 && isValidPartner(cols[refIdx])) csvRefs.add(cols[refIdx].trim());
    if (custIdx !== -1 && isValidPartner(cols[custIdx])) csvCusts.add(cols[custIdx].trim());
    if (transIdx !== -1 && isValidPartner(cols[transIdx])) csvTrans.add(cols[transIdx].trim());
  }

  // 2. Fetch DB partners
  // DB References
  const dbRefsRaw = await db('partner_identifiers')
    .select('partner_identifiers.value as short_name', 'partners.name as full_name')
    .leftJoin('partners', 'partner_identifiers.partner_id', 'partners.id')
    .whereIn('partner_identifiers.id_type', ['(Reference) Szállítók', '(Reference) Sz\xC3\xA1ll\xC3\xADt\xC3\xB3k']);
  
  // DB Customers
  const dbCustsRaw = await db('partner_identifiers')
    .select('partner_identifiers.value as short_name', 'partners.name as full_name')
    .leftJoin('partners', 'partner_identifiers.partner_id', 'partners.id')
    .whereIn('partner_identifiers.id_type', ['(Customer) Vevők', '(Customer) Vev\xC5\x91k']);

  // DB Transporters
  const dbTransportersTable = await db('transporters').select('name', 'code');
  const dbTransIdentifiers = await db('partner_identifiers')
    .select('partner_identifiers.value as short_name', 'partners.name as full_name')
    .leftJoin('partners', 'partner_identifiers.partner_id', 'partners.id')
    .whereIn('partner_identifiers.id_type', ['Fuvarozók', 'Fuvaroz\xC3\xB3k']);

  const dbRefMap = new Map(); // upper -> original
  dbRefsRaw.forEach(r => {
    if (r.short_name) dbRefMap.set(r.short_name.trim().toUpperCase(), r);
  });

  const dbCustMap = new Map();
  dbCustsRaw.forEach(c => {
    if (c.short_name) dbCustMap.set(c.short_name.trim().toUpperCase(), c);
  });

  const dbTransMap = new Map();
  dbTransportersTable.forEach(t => {
    if (t.name) dbTransMap.set(t.name.trim().toUpperCase(), { short_name: t.name, full_name: t.name });
  });
  dbTransIdentifiers.forEach(t => {
    if (t.short_name && !dbTransMap.has(t.short_name.trim().toUpperCase())) {
      dbTransMap.set(t.short_name.trim().toUpperCase(), t);
    }
  });

  // 3. Perform comparison
  function compare(csvSet, dbMap) {
    const present = [];
    const missingInDb = [];

    csvSet.forEach(item => {
      const key = item.toUpperCase();
      if (dbMap.has(key)) {
        present.push({ csv: item, db: dbMap.get(key) });
      } else {
        missingInDb.push(item);
      }
    });

    return { present, missingInDb };
  }

  const refComp = compare(csvRefs, dbRefMap);
  const custComp = compare(csvCusts, dbCustMap);
  const transComp = compare(csvTrans, dbTransMap);

  // 4. Generate Report
  let md = `# Partner Összehasonlító Jelentés (CSV vs. Adatbázis/ADMIN)\n\n`;
  md += `**Forrás CSV:** \`25-26 Fuvarok összesítö V2 260617.csv\`\n`;
  md += `**Adatbázis (ADMIN):** Lokális PostgreSQL \`partners\`, \`partner_identifiers\`, \`transporters\` táblák\n\n`;

  md += `## Összegző Statisztika\n\n`;
  md += `| Kategória | CSV-ben szerepel | Adatbázisban megtalálható | Adatbázisból HIÁNYZIK |\n`;
  md += `|---|---|---|---|\n`;
  md += `| **Reference (Szállítók)** | ${csvRefs.size} | ${refComp.present.length} | **${refComp.missingInDb.length}** |\n`;
  md += `| **Customer (Vevők)** | ${csvCusts.size} | ${custComp.present.length} | **${custComp.missingInDb.length}** |\n`;
  md += `| **Transport Company (Fuvarozók)** | ${csvTrans.size} | ${transComp.present.length} | **${transComp.missingInDb.length}** |\n\n`;

  // Section 1: Reference
  md += `## 1. Reference (Szállítók) részletezés\n\n`;
  if (refComp.missingInDb.length > 0) {
    md += `### ⚠️ Adatbázisból HIÁNYZÓ Reference-ek (${refComp.missingInDb.length} db)\n\n`;
    md += `| # | CSV-ben szereplő név |\n|---|---|\n`;
    refComp.missingInDb.sort((a,b)=>a.localeCompare(b,'hu')).forEach((m, i) => {
      md += `| ${i+1} | ${m} |\n`;
    });
  } else {
    md += `✅ Minden CSV Reference létezik az adatbázisban!\n\n`;
  }

  md += `\n### ✅ Adatbázisban MEGLÉVŐ Reference-ek (${refComp.present.length} db)\n\n`;
  md += `| # | CSV Név | DB Azonosító (Rövid név) | DB Partner Teljes Név |\n|---|---|---|---|\n`;
  refComp.present.sort((a,b)=>a.csv.localeCompare(b.csv,'hu')).forEach((p, i) => {
    md += `| ${i+1} | ${p.csv} | ${p.db.short_name || '-'} | ${p.db.full_name || '-'} |\n`;
  });

  // Section 2: Customer
  md += `\n---\n\n## 2. Customer (Vevők) részletezés\n\n`;
  if (custComp.missingInDb.length > 0) {
    md += `### ⚠️ Adatbázisból HIÁNYZÓ Customer-ek (${custComp.missingInDb.length} db)\n\n`;
    md += `| # | CSV-ben szereplő név |\n|---|---|\n`;
    custComp.missingInDb.sort((a,b)=>a.localeCompare(b,'hu')).forEach((m, i) => {
      md += `| ${i+1} | ${m} |\n`;
    });
  } else {
    md += `✅ Minden CSV Customer létezik az adatbázisban!\n\n`;
  }

  md += `\n### ✅ Adatbázisban MEGLÉVŐ Customer-ek (${custComp.present.length} db)\n\n`;
  md += `| # | CSV Név | DB Azonosító (Rövid név) | DB Partner Teljes Név |\n|---|---|---|---|\n`;
  custComp.present.sort((a,b)=>a.csv.localeCompare(b.csv,'hu')).forEach((p, i) => {
    md += `| ${i+1} | ${p.csv} | ${p.db.short_name || '-'} | ${p.db.full_name || '-'} |\n`;
  });

  // Section 3: Transport Company
  md += `\n---\n\n## 3. Transport Company (Fuvarozók) részletezés\n\n`;
  if (transComp.missingInDb.length > 0) {
    md += `### ⚠️ Adatbázisból HIÁNYZÓ Fuvarozók (${transComp.missingInDb.length} db)\n\n`;
    md += `| # | CSV-ben szereplő név |\n|---|---|\n`;
    transComp.missingInDb.sort((a,b)=>a.localeCompare(b,'hu')).forEach((m, i) => {
      md += `| ${i+1} | ${m} |\n`;
    });
  } else {
    md += `✅ Minden CSV Fuvarozó létezik az adatbázisban!\n\n`;
  }

  md += `\n### ✅ Adatbázisban MEGLÉVŐ Fuvarozók (${transComp.present.length} db)\n\n`;
  md += `| # | CSV Név | DB Azonosító / Cégnév |\n|---|---|---|\n`;
  transComp.present.sort((a,b)=>a.csv.localeCompare(b.csv,'hu')).forEach((p, i) => {
    md += `| ${i+1} | ${p.csv} | ${p.db.short_name || p.db.full_name || '-'} |\n`;
  });

  const outPath = 'c:\\Users\\klara\\Documents\\Nepelemes ügyek\\Gavá\\ERP Access\\Partner_Osszehasonlitas.md';
  fs.writeFileSync(outPath, md, 'utf8');
  console.log('Saved comparison report to:', outPath);

  await db.destroy();
}

main().catch(e => { console.error(e.message); process.exit(1); });
