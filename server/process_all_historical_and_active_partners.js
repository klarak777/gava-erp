require('dotenv').config();
const fs = require('fs');
const path = require('path');
const knex = require('knex');
const db = knex(require('./knexfile')['development']);

const basePath = 'c:\\Users\\klara\\Documents\\Nepelemes ügyek\\Gavá\\ERP Access';

function readList(filename) {
  const filePath = path.join(basePath, filename);
  const buf = fs.readFileSync(filePath);
  let content = buf.toString('utf8');
  if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
    content = content.slice(1);
  }
  const lines = content.split(/\r?\n/);
  const set = new Set();
  for (let i = 1; i < lines.length; i++) {
    const val = lines[i].trim();
    if (val && val !== '-' && val !== '0' && val !== '0,00' && val !== '#N/A') {
      set.add(val);
    }
  }
  return Array.from(set);
}

const isValid = (val) => {
  if (!val) return false;
  const v = val.trim();
  if (v === '' || v === '-' || v === '0' || v === '0,00' || v === '#N/A') return false;
  return true;
};

// Mapping for typos to main partner names
const KNOWN_MAP = {
  // Reference
  'AGRPONIENTE': 'Agroponiente Natural Produce S.L.',
  'AXAFRUIT': 'Axarfruit',
  'CASI ARIPORT': 'CASI',
  'DELGAFRUIT': 'Delgafruits S.L.',
  'EURORGOUP DEUTSCHLAND': 'Eurogroup Deutschland Gmbh',
  'EUROGROUP DE': 'Eurogroup Deutschland Gmbh',
  'EUROGROUP ES': 'EUROGROUP ESPANA',
  'LEHMANN': 'LEHMANN & TROOST B.V.',
  'OLYMPIC': 'Olympic Fruit B.V.',
  'OLYMPIC FRUITS': 'Olympic Fruit B.V.',
  
  // Customer
  'MANDRESLOOT': 'Mandersloot Expeditiebedrijf B.V.',
  
  // Transporter
  'HILTOP': 'HILLTOP'
};

async function main() {
  console.log('--- TELJES PARTNER SZINKRONIZÁCIÓ (AKTÍV ÉS INAKTÍV) ---\n');

  // 1. Read Active CSVs
  const activeRefs = new Set(readList('Reference partnerek.csv').map(s => s.trim()));
  const activeCusts = new Set(readList('Customer partnerek.csv').map(s => s.trim()));
  const activeTrans = new Set(readList('Transport Company partnerek.csv').map(s => s.trim()));

  // 2. Read Historical CSV
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

  console.log(`Kinyerve a történelmi CSV-ből:
  - Reference: ${allHistRefs.size} db
  - Customer: ${allHistCusts.size} db
  - Transport company: ${allHistTrans.size} db\n`);

  const sqlStatements = [];
  sqlStatements.push('-- FULL PARTNER & IDENTIFIER SYNC (ACTIVE & INACTIVE)');
  sqlStatements.push('BEGIN;');
  sqlStatements.push('');

  async function processRole(namesSet, activeSet, roleType, roleLabel) {
    console.log(`Processing role ${roleLabel}...`);
    let addedCount = 0;

    for (const name of namesSet) {
      const isActive = activeSet.has(name);
      
      // Determine partner target
      let targetPartnerName = KNOWN_MAP[name] || name;
      
      // Check if target partner exists in DB
      let partner = await db('partners').where('name', 'ilike', targetPartnerName).first();
      
      if (!partner) {
        // Find by ILIKE or create new partner
        partner = await db('partners').where('name', 'ilike', `%${targetPartnerName}%`).first();
      }

      if (!partner) {
        // Insert new partner
        const [newP] = await db('partners').insert({
          name: targetPartnerName,
          is_active: isActive,
          created_at: db.fn.now(),
          updated_at: db.fn.now()
        }).returning('*');
        partner = newP || await db('partners').where('name', targetPartnerName).first();
        console.log(`  ➕ Új partner létrehozva: "${targetPartnerName}" (is_active: ${isActive}, ID: ${partner.id})`);
        
        sqlStatements.push(
          `INSERT INTO partners (name, is_active, created_at, updated_at) ` +
          `SELECT '${targetPartnerName.replace(/'/g, "''")}', ${isActive}, NOW(), NOW() ` +
          `WHERE NOT EXISTS (SELECT 1 FROM partners WHERE UPPER(name) = UPPER('${targetPartnerName.replace(/'/g, "''")}'));`
        );
      } else {
        // Update is_active if it is active in the active CSV
        if (isActive && !partner.is_active) {
          await db('partners').where('id', partner.id).update({ is_active: true });
          console.log(`  🟢 Partner aktívra állítva: "${partner.name}" (ID: ${partner.id})`);
          sqlStatements.push(`UPDATE partners SET is_active = true WHERE id = ${partner.id};`);
        }
      }

      // Check partner_identifier
      const existingIdent = await db('partner_identifiers')
        .where({ partner_id: partner.id, id_type: roleType, value: name })
        .first();

      if (!existingIdent) {
        await db('partner_identifiers').insert({
          partner_id: partner.id,
          id_type: roleType,
          value: name,
          created_at: db.fn.now(),
          updated_at: db.fn.now()
        });
        console.log(`  ✅ Azonosító felvéve: [${roleLabel}] "${name}" -> Partner "${partner.name}" (ID: ${partner.id})`);
        addedCount++;

        sqlStatements.push(
          `INSERT INTO partner_identifiers (partner_id, id_type, value, created_at, updated_at) ` +
          `SELECT id, '${roleType.replace(/'/g, "''")}', '${name.replace(/'/g, "''")}', NOW(), NOW() ` +
          `FROM partners WHERE UPPER(name) = UPPER('${targetPartnerName.replace(/'/g, "''")}') ` +
          `AND NOT EXISTS (SELECT 1 FROM partner_identifiers WHERE partner_id = partners.id AND id_type = '${roleType.replace(/'/g, "''")}' AND value = '${name.replace(/'/g, "''")}') LIMIT 1;`
        );
      }

      // If transporter role, also ensure entry in transporters table
      if (roleType === 'Fuvarozók') {
        const transRecord = await db('transporters').where('name', 'ilike', name).first();
        if (!transRecord) {
          await db('transporters').insert({
            name: name,
            is_active: isActive,
            created_at: db.fn.now(),
            updated_at: db.fn.now()
          });
          console.log(`  🚛 Új fuvarozó felvéve a transporters táblába: "${name}"`);

          sqlStatements.push(
            `INSERT INTO transporters (name, is_active, created_at, updated_at) ` +
            `SELECT '${name.replace(/'/g, "''")}', ${isActive}, NOW(), NOW() ` +
            `WHERE NOT EXISTS (SELECT 1 FROM transporters WHERE UPPER(name) = UPPER('${name.replace(/'/g, "''")}'));`
          );
        }
      }
    }
    console.log(`Finished ${roleLabel}: ${addedCount} új azonosító hozzáadva.\n`);
  }

  await processRole(allHistRefs, activeRefs, '(Reference) Szállítók', 'Reference');
  await processRole(allHistCusts, activeCusts, '(Customer) Vevők', 'Customer');
  await processRole(allHistTrans, activeTrans, 'Fuvarozók', 'Transport Company');

  sqlStatements.push('');
  sqlStatements.push('COMMIT;');

  const sqlFile = path.join(basePath, 'server', 'do_sync_all_partners.sql');
  fs.writeFileSync(sqlFile, Buffer.from(sqlStatements.join('\n'), 'utf8'));
  console.log(`✅ DO szerver SQL szinkronizációs fájl kiírva: ${sqlFile}`);

  await db.destroy();
}

main().catch(e => { console.error(e.message); process.exit(1); });
