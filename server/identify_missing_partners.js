require('dotenv').config();
const fs = require('fs');
const path = require('path');
const knex = require('knex');
const db = knex(require('./knexfile')['development']);

const missingRefs = [
  'AGROPONIENTE',
  'AGROPONIENTE NIJAR',
  'CASI AEROPORTO',
  'CASI AIRPORT',
  'COMPAGRI',
  'GAVA',
  'MALENO Y TORRES',
  'OLASO',
  'WRAPPING'
];

const missingCusts = [
  'BILEK',
  'KÓNYA'
];

async function findMatches(missingName) {
  const clean = missingName.trim();
  const words = clean.split(/\s+/);
  const firstWord = words[0];

  // 1. Direct name match
  let matches = await db('partners')
    .where('name', 'ilike', `%${clean}%`)
    .orWhere('invoice_name', 'ilike', `%${clean}%`);

  // 2. If no direct match, search by first word
  if (matches.length === 0 && firstWord.length > 2) {
    matches = await db('partners')
      .where('name', 'ilike', `%${firstWord}%`)
      .orWhere('invoice_name', 'ilike', `%${firstWord}%`);
  }

  // Also check existing partner_identifiers for any match
  const identifiers = await db('partner_identifiers as pi')
    .select('pi.id_type', 'pi.value', 'p.id as partner_id', 'p.name as partner_name')
    .leftJoin('partners as p', 'pi.partner_id', 'p.id')
    .where('pi.value', 'ilike', `%${clean}%`)
    .orWhere('pi.value', 'ilike', `%${firstWord}%`);

  return { matches, identifiers };
}

async function main() {
  console.log('=== HIÁNYZÓ REFERENCE PARTNEREK BEAZONOSÍTÁSA ===\n');
  
  const refResults = [];
  for (const ref of missingRefs) {
    const res = await findMatches(ref);
    refResults.push({ name: ref, ...res });
  }

  console.log('=== HIÁNYZÓ CUSTOMER PARTNEREK BEAZONOSÍTÁSA ===\n');
  const custResults = [];
  for (const cust of missingCusts) {
    const res = await findMatches(cust);
    custResults.push({ name: cust, ...res });
  }

  // Build Markdown
  let md = `# Hiányzó Partnerek Beazonosítása a Partnerek Modulban\n\n`;
  md += `Az alábbi elemzés az \`Aktiv_Partnerek_Osszehasonlitas.md\` során talált hiányzó azonosítókat keresi meg a PostgreSQL **partners** táblájában.\n\n`;

  md += `## 1. Hiányzó Reference Partnerek Beazonosítása (9 db)\n\n`;
  for (const item of refResults) {
    md += `### 🔹 Keresett Név: \`${item.name}\`\n\n`;
    if (item.matches.length > 0) {
      md += `**Találatok a \`partners\` táblában (${item.matches.length} db):**\n\n`;
      md += `| ID | Partner Neve (\`name\`) | Számlázási Név (\`invoice_name\`) | Cím / Város |\n|---|---|---|---|\n`;
      item.matches.forEach(m => {
        md += `| ${m.id} | ${m.name} | ${m.invoice_name || '-'} | ${m.city || '-'}, ${m.street_name || '-'} |\n`;
      });
    } else {
      md += `❌ **Nincs közvetlen találat a \`partners\` táblában.**\n`;
    }

    if (item.identifiers.length > 0) {
      md += `\n**Kapcsolódó létező azonosítók a \`partner_identifiers\` táblában:**\n\n`;
      md += `| ID Type (Szerepkör) | Azonosító Érték (\`value\`) | Partner ID | Partner Neve |\n|---|---|---|---|\n`;
      item.identifiers.forEach(id => {
        md += `| ${id.id_type} | ${id.value} | ${id.partner_id} | ${id.partner_name} |\n`;
      });
    }
    md += `\n---\n\n`;
  }

  md += `## 2. Hiányzó Customer Partnerek Beazonosítása (2 db)\n\n`;
  for (const item of custResults) {
    md += `### 🔹 Keresett Név: \`${item.name}\`\n\n`;
    if (item.matches.length > 0) {
      md += `**Találatok a \`partners\` táblában (${item.matches.length} db):**\n\n`;
      md += `| ID | Partner Neve (\`name\`) | Számlázási Név (\`invoice_name\`) | Cím / Város |\n|---|---|---|---|\n`;
      item.matches.forEach(m => {
        md += `| ${m.id} | ${m.name} | ${m.invoice_name || '-'} | ${m.city || '-'}, ${m.street_name || '-'} |\n`;
      });
    } else {
      md += `❌ **Nincs közvetlen találat a \`partners\` táblában.**\n`;
    }

    if (item.identifiers.length > 0) {
      md += `\n**Kapcsolódó létező azonosítók a \`partner_identifiers\` táblában:**\n\n`;
      md += `| ID Type (Szerepkör) | Azonosító Érték (\`value\`) | Partner ID | Partner Neve |\n|---|---|---|---|\n`;
      item.identifiers.forEach(id => {
        md += `| ${id.id_type} | ${id.value} | ${id.partner_id} | ${id.partner_name} |\n`;
      });
    }
    md += `\n---\n\n`;
  }

  const outPath = path.join('c:\\Users\\klara\\Documents\\Nepelemes ügyek\\Gavá\\ERP Access', 'Hianyzo_Partnerek_Beazonositas.md');
  fs.writeFileSync(outPath, md, 'utf8');
  console.log('Saved identification report to:', outPath);

  await db.destroy();
}

main().catch(e => { console.error(e.message); process.exit(1); });
