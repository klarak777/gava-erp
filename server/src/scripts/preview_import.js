const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');
const knex = require('knex')(require('../../knexfile').development);

const csvPath = path.join(__dirname, '../../..', 'Partner_cleaned.csv');

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

function extractShortName(fullName) {
  if (!fullName) return '';
  let n = normalizeForMatch(fullName);

  const suffixes = [
    'KORLÁTOLT FELELŐSSÉGŰ TÁRSASÁG',
    'KERESKEDELMI ÉS SZOLGÁLTATÓ',
    'KERESKEDELMI SZOLGÁLTATÓ',
    'KERESKEDELMI',
    'SZOLGÁLTATÓ',
    'KÖZHASZNÚ ALAPÍTVÁNY',
    'ALAPÍTVÁNY',
    'SZÖVETKEZET',
    'BETÉTI TÁRSASÁG',
    'KÖZKERESETI TÁRSASÁG',
    'RÉSZVÉNYTÁRSASÁG',
    'EGYÉNI VÁLLALKOZÓ',
    'EGYÉNI CÉG',
    'ZÁRTKÖRŰEN MŰKÖDŐ',
    'NYILVÁNOSAN MŰKÖDŐ',
    'KFT.', 'KFT',
    'BT.', 'BT',
    'RT.', 'RT',
    'ZRT.', 'ZRT',
    'NYRT.', 'NYRT',
    'S.L.U.', 'S.L.U',
    'S.L.', 'S.L',
    'S.A.T.', 'S.A.T',
    'S.A.', 'S.A',
    'GMBH & CO. KG', 'GMBH & CO KG',
    'GMBH',
    'AG',
    'B.V.', 'B.V',
    'LTD.', 'LTD',
    'INC.', 'INC',
    'SRL', 'SPA',
    'E.V.', 'E.V',
  ];

  for (const suf of suffixes) {
    const idx = n.lastIndexOf(suf);
    if (idx > 0) {
      n = n.substring(0, idx).trim();
    }
  }
  n = n.replace(/[.,\-–]+$/, '').trim();
  return n;
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

    const existingPartners = await knex('partners').select('id', 'name', 'type', 'tax_id');
    const existingMap = new Map();
    for (const p of existingPartners) {
      const norm = normalizeForMatch(p.name);
      existingMap.set(norm, p);
    }

    // Show MATCHED items only (first 30)
    let matchCount = 0;
    for (const line of dataLines) {
      const cols = parseCSVLine(line);
      const fullName = cols[0] || '';
      if (!fullName.trim()) continue;

      const csvShort = extractShortName(fullName);
      const normFull = normalizeForMatch(fullName);
      let matchedPartner = null;

      if (existingMap.has(normFull)) {
        matchedPartner = existingMap.get(normFull);
      }

      if (!matchedPartner && csvShort) {
        for (const [existingNorm, existingP] of existingMap) {
          if (csvShort === existingNorm ||
              csvShort.startsWith(existingNorm + ' ') ||
              existingNorm.startsWith(csvShort + ' ') ||
              csvShort.startsWith(existingNorm) ||
              existingNorm.startsWith(csvShort)) {
            matchedPartner = existingP;
            break;
          }
        }
      }

      if (matchedPartner && matchCount < 40) {
        console.log(`MATCH: CSV: "${fullName}" => SHORT: "${csvShort}" => DB: "${matchedPartner.name}" (ID:${matchedPartner.id}, type:${matchedPartner.type})`);
        matchCount++;
      }
    }
    console.log(`\nTotal matches shown: ${matchCount}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
