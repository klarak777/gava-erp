require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('knex')(require('./knexfile')['development']);

const basePath = 'c:\\Users\\klara\\Documents\\Nepelemes ügyek\\Gavá\\ERP Access';

function readCsv(filename) {
  const filePath = path.join(basePath, filename);
  const buf = fs.readFileSync(filePath);
  // Auto-detect: UTF-8 BOM → UTF-8, otherwise try UTF-8 first, fallback to latin1
  let content;
  if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
    content = buf.toString('utf8').slice(1);
  } else {
    content = buf.toString('utf8');
    // Ha replacement karakter (�) van benne, latin1-ként olvassuk újra
    if (content.includes('\uFFFD') || content.includes('�')) {
      content = buf.toString('latin1');
    }
  }
  const lines = content.split(/\r?\n/);
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const val = lines[i].trim();
    if (val && val !== '-' && val !== '0') result.push(val);
  }
  return result;
}

async function auditCategory(csvFile, idType, label) {
  const csvNames = readCsv(csvFile);
  const results = [];

  for (const name of csvNames) {
    // Keresés: van-e AKTÍV azonosítója ennek a névnek?
    const activeIdent = await db('partner_identifiers as pi')
      .join('partners as p', 'p.id', 'pi.partner_id')
      .where('pi.id_type', idType)
      .andWhereRaw('UPPER(pi.value) = ?', [name.toUpperCase()])
      .andWhere(function() {
        this.where('pi.is_inactive', false).orWhereNull('pi.is_inactive');
      })
      .select('p.id', 'p.name', 'p.is_active', 'pi.value', 'pi.is_inactive', 'pi.id as pi_id')
      .first();

    // Van-e BÁRMILYEN (inaktív is) azonosítója?
    const anyIdent = await db('partner_identifiers as pi')
      .join('partners as p', 'p.id', 'pi.partner_id')
      .where('pi.id_type', idType)
      .andWhereRaw('UPPER(pi.value) = ?', [name.toUpperCase()])
      .select('p.id', 'p.name', 'p.is_active', 'pi.value', 'pi.is_inactive', 'pi.id as pi_id');

    // Duplikált aktív azonosítók?
    const activeCount = await db('partner_identifiers as pi')
      .join('partners as p', 'p.id', 'pi.partner_id')
      .where('pi.id_type', idType)
      .andWhereRaw('UPPER(pi.value) = ?', [name.toUpperCase()])
      .andWhere(function() {
        this.where('pi.is_inactive', false).orWhereNull('pi.is_inactive');
      })
      .count('* as cnt');

    const cnt = parseInt(activeCount[0].cnt);

    let status = '✅ OK';
    let issue = '';
    if (!activeIdent) {
      if (anyIdent.length > 0) {
        status = '⚠️ INAKTÍV';
        issue = `Létezik de inaktívra jelölve (pi_id: ${anyIdent.map(a => a.pi_id).join(',')})`;
      } else {
        status = '❌ HIÁNYZIK';
        issue = 'Nincs ilyen azonosító az adatbázisban!';
      }
    } else if (cnt > 1) {
      status = '🔶 DUPLIKÁLT';
      issue = `${cnt} aktív azonosító ugyanazzal az értékkel!`;
    } else if (!activeIdent.is_active) {
      status = '⚠️ PARTNER INAKTÍV';
      issue = `Partner (id=${activeIdent.id}) is_active=false`;
    }

    results.push({
      csvName: name,
      status,
      issue,
      partnerId: activeIdent?.id || anyIdent[0]?.id || null,
      partnerName: activeIdent?.name || anyIdent[0]?.name || null,
      dbValue: activeIdent?.value || anyIdent[0]?.value || null,
      activeCount: cnt
    });
  }

  return { label, idType, csvFile, results };
}

async function main() {
  const refAudit = await auditCategory('Reference partnerek.csv', '(Reference) Szállítók', 'Reference (Szállítók)');
  const custAudit = await auditCategory('Customer partnerek.csv', '(Customer) Vevők', 'Customer (Vevők)');
  const transAudit = await auditCategory('Transport Company partnerek.csv', 'Fuvarozók', 'Transport Company (Fuvarozók)');

  // Generáljuk az MD riportot
  let md = `# Aktív Partnerek – Admin CSV vs. Adatbázis Audit\n\n`;
  md += `**Generálva:** ${new Date().toISOString().split('T')[0]}\n\n`;
  md += `Az Admin modul CSV fájljaiban szereplő aktív partnerek ellenőrzése az adatbázisban.\n\n`;

  function renderAudit(audit) {
    const ok = audit.results.filter(r => r.status === '✅ OK');
    const issues = audit.results.filter(r => r.status !== '✅ OK');

    let s = `## ${audit.label}\n\n`;
    s += `**Forrás:** \`${audit.csvFile}\` | **Azonosító típus:** \`${audit.idType}\`\n\n`;
    s += `| Összesen | ✅ OK | ⚠️ Problémás |\n|---|---|---|\n`;
    s += `| ${audit.results.length} | ${ok.length} | ${issues.length} |\n\n`;

    if (issues.length > 0) {
      s += `### ⚠️ Problémás tételek (${issues.length} db)\n\n`;
      s += `| # | CSV Név | Státusz | Partner ID | Partner Neve | Probléma |\n`;
      s += `|---|---|---|---|---|---|\n`;
      issues.forEach((r, i) => {
        s += `| ${i+1} | \`${r.csvName}\` | ${r.status} | ${r.partnerId || '-'} | ${r.partnerName || '-'} | ${r.issue} |\n`;
      });
      s += '\n';
    }

    if (ok.length > 0) {
      s += `### ✅ Rendben lévő tételek (${ok.length} db)\n\n`;
      s += `| # | CSV Név | Partner ID | Partner Neve | DB Érték |\n`;
      s += `|---|---|---|---|---|\n`;
      ok.forEach((r, i) => {
        s += `| ${i+1} | \`${r.csvName}\` | ${r.partnerId} | ${r.partnerName} | \`${r.dbValue}\` |\n`;
      });
      s += '\n';
    }

    return s + '---\n\n';
  }

  md += renderAudit(refAudit);
  md += renderAudit(custAudit);
  md += renderAudit(transAudit);

  // Extra: ellenőrizzük nincs-e duplikált AKTÍV azonosító
  md += `## Duplikált Aktív Azonosítók Ellenőrzése\n\n`;
  const dupes = await db.raw(`
    SELECT pi.partner_id, p.name, pi.id_type, COUNT(*) as cnt,
           STRING_AGG(pi.value, ', ' ORDER BY pi.id) as values
    FROM partner_identifiers pi
    JOIN partners p ON p.id = pi.partner_id
    WHERE pi.id_type IN ('(Reference) Szállítók', '(Customer) Vevők', 'Fuvarozók')
      AND (pi.is_inactive = false OR pi.is_inactive IS NULL)
    GROUP BY pi.partner_id, p.name, pi.id_type
    HAVING COUNT(*) > 1
    ORDER BY pi.id_type, cnt DESC
  `);
  if (dupes.rows.length === 0) {
    md += `✅ **Nincs duplikált aktív szerepkör azonosító** – minden partner típusonként max. 1 aktív azonosítóval rendelkezik.\n\n`;
  } else {
    md += `⚠️ **${dupes.rows.length} partner rendelkezik duplikált aktív azonosítóval:**\n\n`;
    md += `| Partner ID | Partner Neve | Típus | Darab | Értékek |\n|---|---|---|---|---|\n`;
    dupes.rows.forEach(r => {
      md += `| ${r.partner_id} | ${r.name} | ${r.id_type} | ${r.cnt} | ${r.values} |\n`;
    });
  }

  const outPath = path.join(basePath, 'Aktiv_Partner_Audit.md');
  fs.writeFileSync(outPath, md, 'utf8');
  console.log('✅ Riport mentve:', outPath);

  // Összegzés konzolon
  [refAudit, custAudit, transAudit].forEach(a => {
    const issues = a.results.filter(r => r.status !== '✅ OK');
    console.log(`\n${a.label}: ${a.results.length} tétel, ${issues.length} problémás`);
    issues.forEach(r => console.log(`  ${r.status} "${r.csvName}" → ${r.issue}`));
  });

  await db.destroy();
}

main().catch(e => { console.error(e); process.exit(1); });
