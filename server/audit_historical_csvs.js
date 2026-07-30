require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('knex')(require('./knexfile')['development']);

const basePath = 'c:\\Users\\klara\\Documents\\Nepelemes ügyek\\Gavá\\ERP Access';

function readCsvLines(filePath) {
  const buf = fs.readFileSync(filePath);
  // Detect BOM / encoding
  let text = '';
  if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
    text = buf.toString('utf8').slice(1);
  } else {
    // Try utf8 first, if garbled, fall back to latin1
    const utf8Str = buf.toString('utf8');
    if (utf8Str.includes('')) {
      text = buf.toString('latin1');
    } else {
      text = utf8Str;
    }
  }
  return text.split(/\r?\n/).filter(line => line.trim().length > 0);
}

function parseCsvLine(line, delimiter = '\t') {
  // Simple tab or semicolon split
  if (!line.includes('\t') && line.includes(';')) {
    delimiter = ';';
  }
  return line.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
}

async function main() {
  // 1. Fetch DB identifiers
  const dbIdents = await db('partner_identifiers as pi')
    .join('partners as p', 'p.id', 'pi.partner_id')
    .select(
      'pi.id',
      'pi.id_type',
      'pi.value',
      'pi.is_inactive',
      'p.id as partner_id',
      'p.name as partner_name'
    );

  const dbPartners = await db('partners').select('id', 'name');

  // Helper function to find match in DB
  function findMatch(val, roleType) {
    if (!val) return null;
    const cleanVal = val.trim().toUpperCase();
    if (!cleanVal || cleanVal === '-' || cleanVal === '0') return null;

    // Check exact match in partner_identifiers for that role
    const piMatch = dbIdents.find(i => 
      i.id_type === roleType && 
      i.value.trim().toUpperCase() === cleanVal
    );

    if (piMatch) {
      return {
        matched: true,
        matchedVia: 'partner_identifiers',
        partner_id: piMatch.partner_id,
        partner_name: piMatch.partner_name,
        is_inactive: !!piMatch.is_inactive,
        matched_value: piMatch.value
      };
    }

    // Check match in partner_identifiers regardless of role
    const piAnyMatch = dbIdents.find(i => 
      i.value.trim().toUpperCase() === cleanVal
    );

    if (piAnyMatch) {
      return {
        matched: true,
        matchedVia: `partner_identifiers (${piAnyMatch.id_type})`,
        partner_id: piAnyMatch.partner_id,
        partner_name: piAnyMatch.partner_name,
        is_inactive: !!piAnyMatch.is_inactive,
        matched_value: piAnyMatch.value
      };
    }

    // Check direct match in partners.name
    const pMatch = dbPartners.find(p => p.name.trim().toUpperCase() === cleanVal);
    if (pMatch) {
      return {
        matched: true,
        matchedVia: 'partners.name',
        partner_id: pMatch.id,
        partner_name: pMatch.name,
        is_inactive: false,
        matched_value: pMatch.name
      };
    }

    return { matched: false };
  }

  // List of files to process
  const files = fs.readdirSync(basePath).filter(f => 
    f.endsWith('.csv') && 
    (f.includes('Fuvarok') || f.includes('fuvarok'))
  );

  console.log(`Talált CSV fájlok: ${files.length} db`);

  const report = {};

  for (const file of files) {
    const filePath = path.join(basePath, file);
    const lines = readCsvLines(filePath);
    if (lines.length < 2) continue;

    const headers = parseCsvLine(lines[0]);
    
    // Find column indexes
    let refIdx = headers.findIndex(h => /ref/i.test(h) || /szállító/i.test(h) || /supplier/i.test(h));
    let customerIdx = headers.findIndex(h => /vevő/i.test(h) || /customer/i.test(h) || /vevo/i.test(h));
    let transporterIdx = headers.findIndex(h => /fuvarozó/i.test(h) || /transporter/i.test(h) || /fuvarozo/i.test(h) || /szállító cég/i.test(h));

    report[file] = {
      totalRows: lines.length - 1,
      headers: headers,
      columns: { refIdx, customerIdx, transporterIdx },
      unmatched: {
        reference: new Set(),
        customer: new Set(),
        transporter: new Set()
      },
      matchedStats: {
        reference: { total: 0, active: 0, inactive: 0, missing: 0 },
        customer: { total: 0, active: 0, inactive: 0, missing: 0 },
        transporter: { total: 0, active: 0, inactive: 0, missing: 0 }
      }
    };

    const refValues = new Set();
    const customerValues = new Set();
    const transporterValues = new Set();

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      if (refIdx !== -1 && cols[refIdx]) refValues.add(cols[refIdx]);
      if (customerIdx !== -1 && cols[customerIdx]) customerValues.add(cols[customerIdx]);
      if (transporterIdx !== -1 && cols[transporterIdx]) transporterValues.add(cols[transporterIdx]);
    }

    // Process References
    for (const val of refValues) {
      if (!val || val === '-' || val === '0') continue;
      report[file].matchedStats.reference.total++;
      const match = findMatch(val, '(Reference) Szállítók');
      if (match && match.matched) {
        if (match.is_inactive) report[file].matchedStats.reference.inactive++;
        else report[file].matchedStats.reference.active++;
      } else {
        report[file].matchedStats.reference.missing++;
        report[file].unmatched.reference.add(val);
      }
    }

    // Process Customers
    for (const val of customerValues) {
      if (!val || val === '-' || val === '0') continue;
      report[file].matchedStats.customer.total++;
      const match = findMatch(val, '(Customer) Vevők');
      if (match && match.matched) {
        if (match.is_inactive) report[file].matchedStats.customer.inactive++;
        else report[file].matchedStats.customer.active++;
      } else {
        report[file].matchedStats.customer.missing++;
        report[file].unmatched.customer.add(val);
      }
    }

    // Process Transporters
    for (const val of transporterValues) {
      if (!val || val === '-' || val === '0') continue;
      report[file].matchedStats.transporter.total++;
      const match = findMatch(val, 'Fuvarozók');
      if (match && match.matched) {
        if (match.is_inactive) report[file].matchedStats.transporter.inactive++;
        else report[file].matchedStats.transporter.active++;
      } else {
        report[file].matchedStats.transporter.missing++;
        report[file].unmatched.transporter.add(val);
      }
    }
  }

  // Print Summary Report
  console.log('\n==================================================');
  console.log('TÖRTÉNELMI FUVAR CSV AUDIT JELENTÉS SUMMARY');
  console.log('==================================================\n');

  const formattedOutput = {};

  for (const [file, stat] of Object.entries(report)) {
    console.log(`\n📄 FÁJL: ${file}`);
    console.log(`   Összes sor: ${stat.totalRows}`);
    console.log(`   Oszlopok: Reference[${stat.columns.refIdx}], Customer[${stat.columns.customerIdx}], Transport[${stat.columns.transporterIdx}]`);
    console.log(`   - Reference:   ${stat.matchedStats.reference.active} aktív | ${stat.matchedStats.reference.inactive} inaktív | ❌ ${stat.matchedStats.reference.missing} hiányzik`);
    console.log(`   - Customer:    ${stat.matchedStats.customer.active} aktív | ${stat.matchedStats.customer.inactive} inaktív | ❌ ${stat.matchedStats.customer.missing} hiányzik`);
    console.log(`   - Transporter: ${stat.matchedStats.transporter.active} aktív | ${stat.matchedStats.transporter.inactive} inaktív | ❌ ${stat.matchedStats.transporter.missing} hiányzik`);

    formattedOutput[file] = {
      totalRows: stat.totalRows,
      stats: stat.matchedStats,
      unmatched: {
        reference: Array.from(stat.unmatched.reference),
        customer: Array.from(stat.unmatched.customer),
        transporter: Array.from(stat.unmatched.transporter)
      }
    };
  }

  fs.writeFileSync(path.join(__dirname, 'historical_csv_audit_results.json'), JSON.stringify(formattedOutput, null, 2), 'utf8');

  await db.destroy();
}

main().catch(e => { console.error(e); process.exit(1); });
