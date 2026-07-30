require('dotenv').config();
const fs = require('fs');
const path = require('path');
const knex = require('knex');
const db = knex(require('./knexfile')['development']);

const missingRefsHistorical = [
  'AGROPONIENTE',
  'AGROPONIENTE NIJAR',
  'AGRPONIENTE',
  'AXAFRUIT',
  'CASI AEROPORTO',
  'CASI AIRPORT',
  'CASI ARIPORT',
  'COMPAGRI',
  'DELGAFRUIT',
  'EUROGROUP',
  'EUROGROUP DE',
  'EUROGROUP ES',
  'EURORGOUP DEUTSCHLAND',
  'GAVA',
  'GHU',
  'LEHMANN',
  'MALENO Y TORRES',
  'OLASO',
  'OLYMPIC',
  'OLYMPIC FRUITS',
  'WRAPPING'
];

const missingCustsHistorical = [
  'BILEK',
  'EUROGROUP',
  'EUROGROUP DE',
  'EUROGROUP ES',
  'KÓNYA',
  'LEHMANN',
  'MANDRESLOOT',
  'OLYMPIC',
  'OLYMPIC FRUITS'
];

const missingTransHistorical = [
  'HILTOP'
];

async function analyzeItem(name, role) {
  const clean = name.trim();

  // 1. Direct or fuzzy search in partners
  const partners = await db('partners')
    .where('name', 'ilike', `%${clean}%`)
    .orWhere('invoice_name', 'ilike', `%${clean}%`);

  // 2. Search partner_identifiers
  const identifiers = await db('partner_identifiers as pi')
    .select('pi.id_type', 'pi.value', 'p.id as partner_id', 'p.name as partner_name', 'p.is_active')
    .leftJoin('partners as p', 'pi.partner_id', 'p.id')
    .where('pi.value', 'ilike', `%${clean}%`);

  // 3. Search transporters table if role is transporter
  let transporters = [];
  if (role === 'transporter') {
    transporters = await db('transporters')
      .where('name', 'ilike', `%${clean}%`);
  }

  return { name, role, partners, identifiers, transporters };
}

async function main() {
  const refAnalysis = [];
  for (const name of missingRefsHistorical) {
    refAnalysis.push(await analyzeItem(name, 'reference'));
  }

  const custAnalysis = [];
  for (const name of missingCustsHistorical) {
    custAnalysis.push(await analyzeItem(name, 'customer'));
  }

  const transAnalysis = [];
  for (const name of missingTransHistorical) {
    transAnalysis.push(await analyzeItem(name, 'transporter'));
  }

  let md = `# Történelmi Hiányzó Partnerek Elemzése és Beazonosítása\n\n`;
  md += `Elemzés a teljes \`25-26 Fuvarok összesítö V2 260617.csv\` adatállomány alapján kinyert történelmi partnerekre.\n\n`;

  // 1. Reference
  md += `## 1. Történelmi Reference Partnerek (${refAnalysis.length} db)\n\n`;
  md += `| # | CSV Név | Beazonosított Partner az Adatbázisban | Partner ID | Javasolt Művelet / Azonosító |\n`;
  md += `|---|---|---|---|---|\n`;

  refAnalysis.forEach((item, idx) => {
    let matchStr = '❌ Nincs közvetlen találat';
    let idStr = '-';
    let actionStr = 'Új inaktív partnerként felvenni';

    if (item.identifiers.length > 0) {
      const match = item.identifiers[0];
      matchStr = `${match.partner_name} (${match.value})`;
      idStr = match.partner_id;
      actionStr = `Azonosító felvétele: \`${item.name}\` -> Partner ID ${match.partner_id}`;
    } else if (item.partners.length > 0) {
      const p = item.partners[0];
      matchStr = p.name;
      idStr = p.id;
      actionStr = `Azonosító felvétele: \`${item.name}\` -> Partner ID ${p.id}`;
    }

    md += `| ${idx + 1} | \`${item.name}\` | ${matchStr} | ${idStr} | ${actionStr} |\n`;
  });

  // 2. Customer
  md += `\n---\n\n## 2. Történelmi Customer Partnerek (${custAnalysis.length} db)\n\n`;
  md += `| # | CSV Név | Beazonosított Partner az Adatbázisban | Partner ID | Javasolt Művelet / Azonosító |\n`;
  md += `|---|---|---|---|---|\n`;

  custAnalysis.forEach((item, idx) => {
    let matchStr = '❌ Nincs közvetlen találat';
    let idStr = '-';
    let actionStr = 'Új inaktív partnerként felvenni';

    if (item.identifiers.length > 0) {
      const match = item.identifiers[0];
      matchStr = `${match.partner_name} (${match.value})`;
      idStr = match.partner_id;
      actionStr = `Azonosító felvétele: \`${item.name}\` -> Partner ID ${match.partner_id}`;
    } else if (item.partners.length > 0) {
      const p = item.partners[0];
      matchStr = p.name;
      idStr = p.id;
      actionStr = `Azonosító felvétele: \`${item.name}\` -> Partner ID ${p.id}`;
    }

    md += `| ${idx + 1} | \`${item.name}\` | ${matchStr} | ${idStr} | ${actionStr} |\n`;
  });

  // 3. Transporter
  md += `\n---\n\n## 3. Történelmi Fuvarozó Partnerek (${transAnalysis.length} db)\n\n`;
  md += `| # | CSV Név | Beazonosított Fuvarozó az Adatbázisban | Javasolt Művelet |\n`;
  md += `|---|---|---|---|\n`;

  transAnalysis.forEach((item, idx) => {
    let matchStr = '❌ Nincs találat';
    let actionStr = 'Új fuvarozóként felvenni';

    if (item.transporters.length > 0) {
      matchStr = item.transporters[0].name;
      actionStr = `Szinonimaként / azonosítóként hozzárendelni a meglévő ${item.transporters[0].name} fuvarozóhoz`;
    } else if (item.identifiers.length > 0) {
      matchStr = item.identifiers[0].partner_name;
      actionStr = `Azonosító felvétele: \`${item.name}\``;
    }

    md += `| ${idx + 1} | \`${item.name}\` | ${matchStr} | ${actionStr} |\n`;
  });

  const outPath = path.join('c:\\Users\\klara\\Documents\\Nepelemes ügyek\\Gavá\\ERP Access', 'Tortenelmi_Partnerek_Beazonositas.md');
  fs.writeFileSync(outPath, md, 'utf8');
  console.log('Saved historical identification report to:', outPath);

  await db.destroy();
}

main().catch(e => { console.error(e.message); process.exit(1); });
