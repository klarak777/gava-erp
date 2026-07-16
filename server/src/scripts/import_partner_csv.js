const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');
const knex = require('knex')(require('../../knexfile').development);

const csvPath = path.join(__dirname, '../../..', 'Partner_cleaned.csv');
const DRY_RUN = process.argv.includes('--dry-run');

function parseCSVLine(line) {
  const result = [];
  let inQuotes = false;
  let current = '';
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ';' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizeForMatch(name) {
  if (!name) return '';
  return name.toUpperCase()
    .replace(/[""„"«»]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract short name from full company name, removing suffixes
function extractShortName(fullName) {
  if (!fullName) return '';
  let n = normalizeForMatch(fullName);

  // Remove company type suffixes (longest first to avoid partial matches)
  const suffixes = [
    'KORLÁTOLT FELELŐSSÉGŰ TÁRSASÁG',
    'KERESKEDELMI ÉS SZOLGÁLTATÓ',
    'KERESKEDELMI SZOLGÁLTATÓ',
    'KÖZHASZNÚ ALAPÍTVÁNY',
    'BETÉTI TÁRSASÁG',
    'KÖZKERESETI TÁRSASÁG',
    'RÉSZVÉNYTÁRSASÁG',
    'EGYÉNI VÁLLALKOZÓ',
    'EGYÉNI CÉG',
    'ZÁRTKÖRŰEN MŰKÖDŐ',
    'NYILVÁNOSAN MŰKÖDŐ',
    'KERESKEDELMI',
    'SZOLGÁLTATÓ',
    'ALAPÍTVÁNY',
    'SZÖVETKEZET',
    'GMBH & CO. KG', 'GMBH & CO KG',
    'S.L.U.', 'S.L.U',
    'S.A.T.', 'S.A.T',
    'S.A.U.', 'S.A.U',
    'S.L.', 'S.L',
    'S.A.', 'S.A',
    'GMBH', 'AG',
    'B.V.', 'B.V',
    'LTD.', 'LTD',
    'INC.', 'INC',
    'SRL.', 'SRL',
    'SPA',
    'E.V.', 'E.V',
    'KFT.', 'KFT',
    'BT.', 'BT',
    'RT.', 'RT',
    'ZRT.', 'ZRT',
    'NYRT.', 'NYRT',
  ];

  for (const suf of suffixes) {
    if (n.endsWith(' ' + suf)) {
      n = n.substring(0, n.length - suf.length - 1).trim();
    }
  }

  // Remove trailing punctuation
  n = n.replace(/[.,\-–;:]+$/, '').trim();
  return n;
}

// Parse address like "6500 Baja, Péter Pál utca 1"
function parseAddress(addrStr) {
  if (!addrStr) return {};
  const m = addrStr.match(/^(\d{4})\s+([^,]+),?\s*(.*)$/);
  if (m) {
    return { zip: m[1], city: m[2].trim(), street: m[3].trim() };
  }
  return { street: addrStr };
}

// Intelligent matching: the CSV short name must contain the ENTIRE existing partner name
// OR the existing partner name must contain the ENTIRE first word of the CSV short name
// Minimum match length: 4 chars to avoid false positives
function findMatch(csvShort, normFull, existingMap, existingPartners, taxId) {
  // 1. Exact match on full name
  if (existingMap.has(normFull)) {
    return existingMap.get(normFull);
  }

  // 2. Exact match on short name
  if (existingMap.has(csvShort)) {
    return existingMap.get(csvShort);
  }

  // 3. CSV short name starts with existing DB name (e.g. "AGROPONIENTE NATURAL PRODUCE" starts with "AGROPONIENTE")
  if (csvShort && csvShort.length >= 4) {
    for (const [existingNorm, existingP] of existingMap) {
      if (existingNorm.length < 4) continue; // Skip too-short DB names
      
      // CSV short starts with existing + space (word boundary)
      if (csvShort.startsWith(existingNorm + ' ')) {
        return existingP;
      }
      // Existing starts with CSV short + space
      if (existingNorm.startsWith(csvShort + ' ')) {
        return existingP;
      }
    }
  }

  // 4. Tax ID match
  if (taxId) {
    for (const p of existingPartners) {
      if (p.tax_id && p.tax_id === taxId) {
        return p;
      }
    }
  }

  return null;
}

async function run() {
  try {
    const rawBuffer = fs.readFileSync(csvPath);
    let text;
    if (rawBuffer[0] === 0xEF && rawBuffer[1] === 0xBB && rawBuffer[2] === 0xBF) {
      text = rawBuffer.slice(3).toString('utf-8');
    } else {
      text = iconv.decode(rawBuffer, 'windows-1250');
    }

    const lines = text.split(/\r?\n/).filter(l => l.trim());
    const dataLines = lines.slice(1);

    console.log(`CSV sorok: ${dataLines.length}`);
    console.log(`Mód: ${DRY_RUN ? 'DRY RUN (nincs DB módosítás)' : 'ÉLES IMPORTÁLÁS'}`);

    const existingPartners = await knex('partners').select('id', 'name', 'type', 'tax_id');
    console.log(`Jelenlegi partnerek a DB-ben: ${existingPartners.length}\n`);

    const existingMap = new Map();
    for (const p of existingPartners) {
      existingMap.set(normalizeForMatch(p.name), p);
    }

    let matched = 0;
    let inserted = 0;
    let skipped = 0;
    let updatedExisting = 0;
    const matchLog = [];

    for (const line of dataLines) {
      const cols = parseCSVLine(line);
      const fullName = cols[0] || '';
      const invoiceName = cols[1] || '';
      const taxId = cols[2] || '';
      const orgUnit = cols[3] || '';
      const address = cols[4] || '';

      if (!fullName.trim()) { skipped++; continue; }

      const csvShort = extractShortName(fullName);
      const normFull = normalizeForMatch(fullName);
      const parsedAddr = parseAddress(address);

      const matchedPartner = findMatch(csvShort, normFull, existingMap, existingPartners, taxId);

      if (matchedPartner) {
        matchLog.push(`MATCH: "${fullName}" => DB: "${matchedPartner.name}" (ID:${matchedPartner.id}, type:${matchedPartner.type})`);
        
        if (!DRY_RUN) {
          const updates = {};
          if (!matchedPartner.tax_id && taxId) updates.tax_id = taxId;
          if (invoiceName) updates.invoice_name = invoiceName;
          if (parsedAddr.zip) updates.zip = parsedAddr.zip;
          if (parsedAddr.city) updates.city = parsedAddr.city;
          if (parsedAddr.street) updates.street_name = parsedAddr.street;

          if (Object.keys(updates).length > 0) {
            await knex('partners').where('id', matchedPartner.id).update(updates);
            updatedExisting++;
          }
        }
        matched++;
      } else {
        if (!DRY_RUN) {
          await knex('partners').insert({
            name: fullName,
            invoice_name: invoiceName || fullName,
            tax_id: taxId || null,
            zip: parsedAddr.zip || null,
            city: parsedAddr.city || null,
            street_name: parsedAddr.street || null,
            is_active: true,
            is_inactive: false,
            is_natural_person: false,
          });
        }
        inserted++;
      }
    }

    // Print some matches
    console.log('--- Példa párosítások (első 30) ---');
    matchLog.slice(0, 30).forEach(m => console.log(m));

    console.log('\n===== EREDMÉNY =====');
    console.log(`Párosítva meglévőhöz: ${matched} (frissítve: ${DRY_RUN ? 'N/A' : updatedExisting})`);
    console.log(`Új partner beszúrva: ${inserted}`);
    console.log(`Kihagyva (üres név): ${skipped}`);
    console.log(`Összesen a DB-ben lesz: ${existingPartners.length + inserted} partner`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
