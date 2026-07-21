const fs = require('fs');
const path = require('path');
const db = require('../db/db');

async function main() {
  const jsonPath = path.join(__dirname, 'merged_partners_import.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('Nincs meg a merged_partners_import.json fájl!');
    process.exit(1);
  }

  const partnersData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Feldolgozandó partnerek száma: ${partnersData.length}`);

  // Lekérjük a meglévő partnereket
  const existingPartners = await db('partners').select('id', 'name', 'invoice_name', 'tax_id', 'type');
  const partnerMapByName = {};
  const partnerMapByInvoiceName = {};
  const partnerMapByTaxId = {};
  
  for (const p of existingPartners) {
    if (p.name) partnerMapByName[p.name.toLowerCase()] = p.id;
    if (p.invoice_name) partnerMapByInvoiceName[p.invoice_name.toLowerCase()] = p.id;
    if (p.tax_id) partnerMapByTaxId[p.tax_id.replace(/[^A-Z0-9]/gi, '').toUpperCase()] = p.id;
  }

  // Meglévő azonosítók a duplikáció elkerülésére
  const existingIdents = await db('partner_identifiers').select('partner_id', 'id_type', 'value');
  const identsSet = new Set(existingIdents.map(id => `${id.partner_id}_${id.id_type}_${id.value}`));

  let insertedCount = 0;
  let updatedCount = 0;
  let identifierCount = 0;

  for (const p of partnersData) {
    let matchedId = null;
    
    // Keresés meglévők között
    if (partnerMapByName[p.name.toLowerCase()]) {
      matchedId = partnerMapByName[p.name.toLowerCase()];
    } else if (p.identifiers['Adószám'] && partnerMapByTaxId[p.identifiers['Adószám'].replace(/[^A-Z0-9]/gi, '').toUpperCase()]) {
      matchedId = partnerMapByTaxId[p.identifiers['Adószám'].replace(/[^A-Z0-9]/gi, '').toUpperCase()];
    } else if (p.invoiceName && partnerMapByInvoiceName[p.invoiceName.toLowerCase()]) {
      matchedId = partnerMapByInvoiceName[p.invoiceName.toLowerCase()];
    }

    const taxId = p.identifiers['Adószám'] || '';
    
    if (!matchedId) {
      // ÚJ PARTNER BESZÚRÁSA
      const newPartner = {
        name: p.name,
        invoice_name: p.invoiceName || p.name,
        tax_id: taxId,
        country: 'HU',
        zip: p.parsedAddress.zip || '',
        city: p.parsedAddress.city || '',
        street_name: p.parsedAddress.street || p.fullAddress || '',
        is_active: true
      };
      
      const [inserted] = await db('partners').insert(newPartner).returning('id');
      matchedId = typeof inserted === 'object' ? inserted.id : inserted; // Knex Postgres kompatibilitás
      
      // Székhely beszúrása a partner_sites táblába
      await db('partner_sites').insert({
        partner_id: matchedId,
        name: 'Székhely',
        country: 'HU',
        zip: p.parsedAddress.zip || '',
        city: p.parsedAddress.city || '',
        street_name: p.parsedAddress.street || p.fullAddress || '',
        is_same_as_hq: true
      });
      
      insertedCount++;
      
      // Update cache, hogy a cikluson belül is lássuk
      partnerMapByName[p.name.toLowerCase()] = matchedId;
      if (taxId) partnerMapByTaxId[taxId.replace(/[^A-Z0-9]/gi, '').toUpperCase()] = matchedId;
      if (newPartner.invoice_name) partnerMapByInvoiceName[newPartner.invoice_name.toLowerCase()] = matchedId;
      
    } else {
      // LÉTEZŐ PARTNER FRISSÍTÉSE
      const updateData = {};
      const existingDbRecord = existingPartners.find(ep => ep.id === matchedId);
      
      if (existingDbRecord) {
        if (!existingDbRecord.tax_id && taxId) {
          updateData.tax_id = taxId;
          existingDbRecord.tax_id = taxId;
        }
        if (!existingDbRecord.invoice_name && p.invoiceName) {
          updateData.invoice_name = p.invoiceName;
          existingDbRecord.invoice_name = p.invoiceName;
        }
      }

      if (Object.keys(updateData).length > 0) {
        await db('partners').where('id', matchedId).update(updateData);
        updatedCount++;
      }
    }

    // IDENTIFIERS (Azonosítók) beszúrása
    const identsToInsert = [];
    for (const [idType, value] of Object.entries(p.identifiers)) {
      // Még az adószámot is betesszük a partner_identifiers táblába, ha nincs benne, mert hasznos lehet
      const key = `${matchedId}_${idType}_${value}`;
      if (!identsSet.has(key)) {
        identsToInsert.push({
          partner_id: matchedId,
          id_type: idType,
          value: value
        });
        identsSet.add(key);
      }
    }

    if (identsToInsert.length > 0) {
      await db('partner_identifiers').insert(identsToInsert);
      identifierCount += identsToInsert.length;
    }
  }

  console.log(`\nSikeres Importálás Befejezve! Eredmények:`);
  console.log(`- Újonnan felvett partnerek száma: ${insertedCount}`);
  console.log(`- Kibővített/frissített létező partnerek száma: ${updatedCount}`);
  console.log(`- Újonnan felvett azonosítók (CCW, NEBIH, stb.) száma: ${identifierCount}`);

  process.exit(0);
}

main().catch(err => {
  console.error('Hiba történt az importálás során:', err);
  process.exit(1);
});
