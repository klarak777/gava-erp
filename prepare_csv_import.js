const fs = require('fs');
const path = require('path');
const iconv = require('./server/node_modules/iconv-lite');
const db = require('./server/src/db/db'); // Feltételezzük, hogy a gyökérből futtatjuk

const csvFolder = path.join(__dirname, 'CSV kibővített adatbázis');

const fileMapping = {
  'Partner adószám..csv': 'Adószám',
  'Partner ccw + kód.csv': 'CCW + Kód',
  'Partner Csop adószám..csv': 'Csoportos adószám',
  'Partner Felir azonosító.csv': 'FELIR azonosító',
  'Partner közösségi adószám..csv': 'Közösségi adószám',
  'Partner NEBIH.csv': 'NEBIH'
};

// Segédfüggvény CSV sorok idézőjeles darabolásához (nagyon egyszerűsített)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && line[i+1] === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ';' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// Cím szétszedése (Irányítószám, Helység, Utca)
// Pl: "6500 Baja, Péter Pál utca 1" vagy "6500 Baja, Péter Pál utca 1."
function parseAddress(fullAddress) {
  if (!fullAddress) return { zip: '', city: '', street: '' };
  fullAddress = fullAddress.trim();
  const match = fullAddress.match(/^(\d{4})\s+([^,]+),\s+(.+)$/);
  if (match) {
    return {
      zip: match[1].trim(),
      city: match[2].trim(),
      street: match[3].trim()
    };
  }
  // Ha nem passzol pontosan, akkor próbáljuk szóközzel
  const match2 = fullAddress.match(/^(\d{4})\s+([^ ]+)\s+(.+)$/);
  if (match2) {
    return {
      zip: match2[1].trim(),
      city: match2[2].trim(),
      street: match2[3].trim()
    };
  }
  return { zip: '', city: '', street: fullAddress }; // végső esetben marad az utca mezőben
}

async function main() {
  console.log('Kezdés: CSV fájlok olvasása...');
  const merged = {};

  for (const [filename, type] of Object.entries(fileMapping)) {
    const filePath = path.join(csvFolder, filename);
    if (!fs.existsSync(filePath)) {
      console.log(`Fájl nem található: ${filename}`);
      continue;
    }

    const buffer = fs.readFileSync(filePath);
    // Beolvasás Windows-1250 (ANSI) kódolással
    const content = iconv.decode(buffer, 'win1250');
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    
    // Első sor a fejléc
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length < 5) continue;

      const name = cols[0]?.trim();
      const invoiceName = cols[1]?.trim();
      const value = cols[2]?.trim();
      const orgUnit = cols[3]?.trim();
      const address = cols[4]?.trim();

      if (!name) continue;

      // Normalizáljuk a nevet az összevonáshoz (kisbetű, idézőjelek és dupla szóközök nélkül)
      const cleanName = name.toLowerCase().replace(/["']/g, '').replace(/\s+/g, ' ').trim();
      const cleanAddress = address ? address.toLowerCase().replace(/\s+/g, ' ').trim() : '';
      const mergeKey = cleanName + '||' + cleanAddress;

      if (!merged[mergeKey]) {
        merged[mergeKey] = {
          name, // Megtartjuk az eredeti nevet
          invoiceName,
          orgUnit,
          fullAddress: address,
          parsedAddress: parseAddress(address),
          identifiers: {}
        };
      }
      
      if (value) {
        merged[mergeKey].identifiers[type] = value;
      }
    }
  }

  // --- Új lépés: Duplikációk szűrése Adószám alapján ---
  const deduplicatedMerged = {};
  const taxIdMap = {};

  for (const [mergeKey, p] of Object.entries(merged)) {
    const taxId = p.identifiers['Adószám'];
    if (taxId && taxId.trim() !== '') {
      const cleanTaxId = taxId.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      if (taxIdMap[cleanTaxId]) {
        // Már van ilyen adószámmal rendelkező partner! Egyesítjük.
        const existingKey = taxIdMap[cleanTaxId];
        const existingP = deduplicatedMerged[existingKey];
        
        // Egyesítjük az azonosítókat
        for (const [idType, idVal] of Object.entries(p.identifiers)) {
          if (!existingP.identifiers[idType]) {
            existingP.identifiers[idType] = idVal;
          }
        }
        // Hosszabb, teljesebb név megtartása
        if (p.name.length > existingP.name.length) {
            existingP.name = p.name;
        }
      } else {
        taxIdMap[cleanTaxId] = mergeKey;
        deduplicatedMerged[mergeKey] = p;
      }
    } else {
      // Nincs adószáma, simán áttesszük
      deduplicatedMerged[mergeKey] = p;
    }
  }

  const finalPartners = Object.values(deduplicatedMerged).filter(p => {
    const hasIdentifiers = Object.keys(p.identifiers).length > 0;
    const hasAddress = p.fullAddress && p.fullAddress.trim() !== '';
    const hasOrgUnit = p.orgUnit && p.orgUnit.trim() !== '';
    // Csak akkor tartjuk meg, ha a neveken kívül van érdemi adat (Cím, Azonosító, vagy Szervezeti egység)
    return hasIdentifiers || hasAddress || hasOrgUnit;
  });
  console.log(`Összesen ${finalPartners.length} partner maradt (a csak 'Név'-vel rendelkező üresek törlése után).`);
  console.log('Meglévő partnerek és azonosítóik lekérdezése az adatbázisból...');

  // Get all existing partners
  const existingPartners = await db('partners').select('id', 'name', 'invoice_name', 'tax_id', 'type');
  const partnerMapByName = {};
  const partnerMapByInvoiceName = {};
  const partnerMapByTaxId = {};

  for (const p of existingPartners) {
    if (p.name) partnerMapByName[p.name.toLowerCase()] = p;
    if (p.invoice_name) partnerMapByInvoiceName[p.invoice_name.toLowerCase()] = p;
    if (p.tax_id) partnerMapByTaxId[p.tax_id.replace(/[^A-Z0-9]/gi, '').toUpperCase()] = p;
  }

  // Get identifiers for all partners
  const allIdentifiers = await db('partner_identifiers').select('partner_id', 'id_type', 'value');
  const identsByPartnerId = {};
  for (const id of allIdentifiers) {
    if (!identsByPartnerId[id.partner_id]) identsByPartnerId[id.partner_id] = [];
    identsByPartnerId[id.partner_id].push(`${id.id_type}: ${id.value}`);
  }

  // CSV Generálás
  const outLines = [];
  // Fejléc
  outLines.push([
    'Név', 
    'Név a bizonylaton', 
    'Szervezeti egység', 
    'Irányítószám', 
    'Helység', 
    'Utca (Teljes cím)', 
    'Adószám', 
    'CCW + Kód', 
    'Csoportos adószám', 
    'FELIR azonosító', 
    'Közösségi adószám', 
    'NEBIH',
    'Létezik a DB-ben?',
    'Meglévő DB Név (ha eltér)',
    'Meglévő DB Partner Típusa (szállító/vevő)',
    'Meglévő DB Azonosítók (pl. Fuvarozó kód)'
  ].join(';'));

  for (const p of finalPartners) {
    let matchedPartner = partnerMapByName[p.name.toLowerCase()];
    
    // Ha név alapján nem találtuk, próbáljuk Adószám alapján (ha van)
    if (!matchedPartner && p.identifiers['Adószám']) {
      const cleanTaxId = p.identifiers['Adószám'].replace(/[^A-Z0-9]/gi, '').toUpperCase();
      matchedPartner = partnerMapByTaxId[cleanTaxId];
    }
    
    // Ha még mindig nem találtuk, próbáljuk Név a bizonylaton alapján
    if (!matchedPartner && p.invoiceName) {
      matchedPartner = partnerMapByInvoiceName[p.invoiceName.toLowerCase()];
    }

    const isExisting = !!matchedPartner;
    const existingType = matchedPartner && matchedPartner.type ? matchedPartner.type : '';
    const existingName = matchedPartner && matchedPartner.name && matchedPartner.name.toLowerCase() !== p.name.toLowerCase() ? matchedPartner.name : '';
    const existingIdents = matchedPartner && identsByPartnerId[matchedPartner.id] ? identsByPartnerId[matchedPartner.id].join(' | ') : '';

    const row = [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${(p.invoiceName || '').replace(/"/g, '""')}"`,
      `"${(p.orgUnit || '').replace(/"/g, '""')}"`,
      `"${(p.parsedAddress.zip || '').replace(/"/g, '""')}"`,
      `"${(p.parsedAddress.city || '').replace(/"/g, '""')}"`,
      `"${(p.parsedAddress.street || p.fullAddress || '').replace(/"/g, '""')}"`,
      `"${(p.identifiers['Adószám'] || '').replace(/"/g, '""')}"`,
      `"${(p.identifiers['CCW + Kód'] || '').replace(/"/g, '""')}"`,
      `"${(p.identifiers['Csoportos adószám'] || '').replace(/"/g, '""')}"`,
      `"${(p.identifiers['FELIR azonosító'] || '').replace(/"/g, '""')}"`,
      `"${(p.identifiers['Közösségi adószám'] || '').replace(/"/g, '""')}"`,
      `"${(p.identifiers['NEBIH'] || '').replace(/"/g, '""')}"`,
      isExisting ? 'Igen' : 'Nem',
      `"${(existingName || '').replace(/"/g, '""')}"`,
      `"${(existingType || '').replace(/"/g, '""')}"`,
      `"${(existingIdents || '').replace(/"/g, '""')}"`
    ];
    outLines.push(row.join(';'));
  }

  // BOM hozzáadása, hogy az Excel helyesen nyissa meg UTF-8-ként
  const csvContent = '\uFEFF' + outLines.join('\n');
  const outPath = path.join(__dirname, 'merged_partners_review_v2.csv');
  fs.writeFileSync(outPath, csvContent, 'utf8');

  // JSON kimentése is az import scripthez
  const jsonOutPath = path.join(__dirname, 'merged_partners_import.json');
  fs.writeFileSync(jsonOutPath, JSON.stringify(finalPartners, null, 2), 'utf8');

  console.log(`\nSikeresen legenerálva!`);
  console.log(`CSV fájl: ${outPath}`);
  console.log(`JSON fájl: ${jsonOutPath}`);
  
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
