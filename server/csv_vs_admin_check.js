require('dotenv').config();
const fs = require('fs');
const path = require('path');
const knex = require('knex');
const db = knex(require('./knexfile')['development']);

const basePath = 'c:\\Users\\klara\\Documents\\Nepelemes ügyek\\Gavá\\ERP Access';

const isValid = (val) => {
  if (!val) return false;
  const v = val.trim();
  if (v === '' || v === '-' || v === '0' || v === '0,00' || v === '#N/A') return false;
  return true;
};

function readActiveList(filename) {
  const filePath = path.join(basePath, filename);
  const buf = fs.readFileSync(filePath);
  let content = (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF)
    ? buf.toString('utf8').slice(1) : buf.toString('utf8');
  const lines = content.split(/\r?\n/);
  const set = new Set();
  for (let i = 1; i < lines.length; i++) {
    const val = lines[i].trim();
    if (val && val !== '-' && val !== '0') set.add(val.toUpperCase());
  }
  return set;
}

async function main() {
  // 1. Active sets from Admin CSVs (upper-cased for comparison)
  const activeRefs = readActiveList('Reference partnerek.csv');
  const activeCusts = readActiveList('Customer partnerek.csv');
  const activeTrans = readActiveList('Transport Company partnerek.csv');

  // 2. All from historical CSV
  const histContent = fs.readFileSync(path.join(basePath, '25-26 Fuvarok összesítö V2 260617.csv'), 'utf8');
  const histLines = histContent.split(/\r?\n/);
  const header = histLines[0].split(';');
  const refIdx = header.indexOf('Reference');
  const custIdx = header.indexOf('Customer');
  const transIdx = header.indexOf('Transport company');

  const allHistRefs = new Set();
  const allHistCusts = new Set();
  const allHistTrans = new Set();

  for (let i = 1; i < histLines.length; i++) {
    const line = histLines[i].trim();
    if (!line) continue;
    const cols = line.split(';');
    if (refIdx !== -1 && isValid(cols[refIdx])) allHistRefs.add(cols[refIdx].trim());
    if (custIdx !== -1 && isValid(cols[custIdx])) allHistCusts.add(cols[custIdx].trim());
    if (transIdx !== -1 && isValid(cols[transIdx])) allHistTrans.add(cols[transIdx].trim());
  }

  // 3. Find ones NOT in Admin module (active lists)
  const missingFromAdminRefs = Array.from(allHistRefs).filter(n => !activeRefs.has(n.toUpperCase())).sort();
  const missingFromAdminCusts = Array.from(allHistCusts).filter(n => !activeCusts.has(n.toUpperCase())).sort();
  const missingFromAdminTrans = Array.from(allHistTrans).filter(n => !activeTrans.has(n.toUpperCase())).sort();

  console.log(`Admin modulból hiányzók:
  - Reference: ${missingFromAdminRefs.length} db
  - Customer: ${missingFromAdminCusts.length} db
  - Transport: ${missingFromAdminTrans.length} db\n`);

  // 4. For each missing, check if exists in partners DB
  async function checkInDb(name) {
    const upper = name.toUpperCase();
    // Check partner_identifiers first
    const byIdent = await db('partner_identifiers as pi')
      .select('p.id', 'p.name as partner_name', 'p.is_active', 'pi.id_type', 'pi.value')
      .leftJoin('partners as p', 'pi.partner_id', 'p.id')
      .whereRaw("UPPER(pi.value) = ?", [upper])
      .first();
    if (byIdent) return { found: true, via: 'identifier', ...byIdent };

    // Check partners.name
    const byName = await db('partners')
      .whereRaw("UPPER(name) LIKE ?", [`%${upper}%`])
      .orWhereRaw("UPPER(invoice_name) LIKE ?", [`%${upper}%`])
      .first();
    if (byName) return { found: true, via: 'name', id: byName.id, partner_name: byName.name, is_active: byName.is_active, id_type: '-', value: name };

    // Check transporters
    const byTrans = await db('transporters')
      .whereRaw("UPPER(name) = ?", [upper])
      .first();
    if (byTrans) return { found: true, via: 'transporters', id: byTrans.id, partner_name: byTrans.name, is_active: byTrans.is_active, id_type: 'Fuvarozók', value: name };

    return { found: false, via: null, partner_name: null, is_active: null };
  }

  async function processCategory(missingList) {
    const found = [];
    const notFound = [];
    for (const name of missingList) {
      const result = await checkInDb(name);
      if (result.found) {
        found.push({ name, ...result });
      } else {
        notFound.push(name);
      }
    }
    return { found, notFound };
  }

  const refResult = await processCategory(missingFromAdminRefs);
  const custResult = await processCategory(missingFromAdminCusts);
  const transResult = await processCategory(missingFromAdminTrans);

  // 5. Generate MD report
  let md = `# CSV vs. Admin Modul – Hiányzó Partnerek Elemzése\n\n`;
  md += `**Forrás:** \`25-26 Fuvarok összesítö V2 260617.csv\`\n`;
  md += `**Admin aktív lista forrás:** \`Reference partnerek.csv\`, \`Customer partnerek.csv\`, \`Transport Company partnerek.csv\`\n\n`;
  md += `> Az alábbi partnerek a CSV-ben szerepelnek, de **NEM** találhatók az Admin modulban (aktív listaként).\n`;
  md += `> Minden egyes névnél megvizsgáljuk, hogy a **Partnerek adatbázisban** megtalálható-e.\n\n`;

  function renderCategory(title, result) {
    let s = `## ${title}\n\n`;
    s += `**Összesen hiányzik az Admin modulból:** ${result.found.length + result.notFound.length} db\n`;
    s += `- ✅ Megtalálható a Partnerek adatbázisban: **${result.found.length} db**\n`;
    s += `- ❌ Sehol sem található (teljesen új partner): **${result.notFound.length} db**\n\n`;

    if (result.found.length > 0) {
      s += `### ✅ Megtalálható a Partnerek adatbázisban (${result.found.length} db)\n\n`;
      s += `| # | CSV Név | Azonosítás módja | DB Partner Neve | Partner ID | Aktív? |\n`;
      s += `|---|---|---|---|---|---|\n`;
      result.found.forEach((item, i) => {
        const via = item.via === 'identifier' ? '`partner_identifiers`' : item.via === 'transporters' ? '`transporters`' : '`partners.name`';
        s += `| ${i+1} | \`${item.name}\` | ${via} | ${item.partner_name} | ${item.id || '-'} | ${item.is_active ? '🟢 Igen' : '🔴 Nem'} |\n`;
      });
    }

    if (result.notFound.length > 0) {
      s += `\n### ❌ NEM található sehol az adatbázisban (${result.notFound.length} db)\n\n`;
      s += `| # | CSV Név | Teendő |\n`;
      s += `|---|---|---|\n`;
      result.notFound.forEach((name, i) => {
        s += `| ${i+1} | \`${name}\` | Új inaktív partnerként felvenni |\n`;
      });
    }
    return s + '\n---\n\n';
  }

  md += renderCategory('1. Reference (Szállítók) – CSV-ben van, Admin modulban NINCS', refResult);
  md += renderCategory('2. Customer (Vevők) – CSV-ben van, Admin modulban NINCS', custResult);
  md += renderCategory('3. Transport Company (Fuvarozók) – CSV-ben van, Admin modulban NINCS', transResult);

  const outPath = path.join(basePath, 'CSV_vs_Admin_Hianyzo_Partnerek.md');
  fs.writeFileSync(outPath, md, 'utf8');
  console.log('\n✅ Riport mentve:', outPath);

  await db.destroy();
}

main().catch(e => { console.error(e.message); process.exit(1); });
