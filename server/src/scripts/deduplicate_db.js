const db = require('../db/db');

// A táblák listája, amelyek hivatkoznak a partners táblára
const FkTables = [
  'shipment_lines',
  'product_demands',
  'finance_transport_lines',
  'partner_sites',
  'partner_communications',
  'partner_contacts',
  'partner_agents',
  'partner_identifiers',
  'partner_characteristics',
  'partner_restrictions',
  'partner_categories',
  'partner_bank_accounts',
  'partner_discounts',
  'partner_credit_settings',
  'partner_events',
  'partner_attachments'
];

async function mergeDuplicates(groups, groupType) {
  let mergedGroupsCount = 0;
  let deletedPartnersCount = 0;

  for (const group of groups) {
    if (group.length <= 1) continue;

    // A fő partner kiválasztása: a legrégebbi (legkisebb ID)
    group.sort((a, b) => a.id - b.id);
    const primary = group[0];
    const duplicates = group.slice(1);
    const duplicateIds = duplicates.map(p => p.id);

    console.log(`Összevonás (${groupType}): Fő partner ID: ${primary.id} (${primary.name}) <- Duplikátum ID-k: ${duplicateIds.join(', ')}`);

    // Hivatkozások átkötözése
    for (const table of FkTables) {
      try {
        await db(table).whereIn('partner_id', duplicateIds).update({ partner_id: primary.id });
      } catch (err) {
        // 23505: Unique constraint violation (Postgres)
        // 19: SQLITE_CONSTRAINT (SQLite)
        if (err.code === '23505' || err.code === 'SQLITE_CONSTRAINT' || err.errno === 19) {
          // Ha unique violation van, rekordonként csináljuk
          const records = await db(table).whereIn('partner_id', duplicateIds);
          for (const record of records) {
            try {
              await db(table).where('id', record.id).update({ partner_id: primary.id });
            } catch (innerErr) {
              if (innerErr.code === '23505' || innerErr.code === 'SQLITE_CONSTRAINT' || innerErr.errno === 19) {
                // Már létezik a fő partneren is, így ezt törölhetjük
                await db(table).where('id', record.id).del();
              } else {
                console.error(`Hiba a(z) ${table} átkötésekor:`, innerErr);
              }
            }
          }
        } else {
          console.error(`Hiba a(z) ${table} átkötésekor (Tömeges update):`, err);
        }
      }
    }

    // A fő partner frissítése, ha hiányozna nála a tax_id vagy invoice_name, de a duplikátumokban benne van
    const updateData = {};
    const pWithLongerName = group.find(p => p.name && p.name.length > (updateData.name || primary.name).length);
    if (pWithLongerName) {
      updateData.name = pWithLongerName.name;
    }
    if (!primary.tax_id) {
      const pWithTaxId = duplicates.find(d => d.tax_id);
      if (pWithTaxId) updateData.tax_id = pWithTaxId.tax_id;
    }
    if (!primary.invoice_name) {
      const pWithInvName = duplicates.find(d => d.invoice_name);
      if (pWithInvName) updateData.invoice_name = pWithInvName.invoice_name;
    }
    if (Object.keys(updateData).length > 0) {
      await db('partners').where('id', primary.id).update(updateData);
    }

    // A duplikátumok törlése
    await db('partners').whereIn('id', duplicateIds).del();
    
    mergedGroupsCount++;
    deletedPartnersCount += duplicateIds.length;
  }

  return { mergedGroupsCount, deletedPartnersCount };
}

async function main() {
  console.log('Kezdés: Duplikált partnerek összevonása és törlése...');
  const partners = await db('partners').select('id', 'name', 'tax_id', 'invoice_name');
  
  // 1. ADÓSZÁM ALAPJÁN
  const taxIdGroups = {};
  for (const p of partners) {
    if (p.tax_id && p.tax_id.trim() !== '') {
      const cleanTax = p.tax_id.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      if (!taxIdGroups[cleanTax]) taxIdGroups[cleanTax] = [];
      taxIdGroups[cleanTax].push(p);
    }
  }
  const taxIdDuplicates = Object.values(taxIdGroups).filter(group => group.length > 1);
  console.log(`\nAdószám alapján talált duplikált csoportok száma: ${taxIdDuplicates.length}`);
  
  const taxResult = await mergeDuplicates(taxIdDuplicates, 'Adószám alapján');

  // Frissítjük a partnerek listáját a név alapú kereséshez
  const remainingPartners = await db('partners').select('id', 'name', 'tax_id', 'invoice_name');

  // 2. NÉV ALAPJÁN
  const nameGroups = {};
  for (const p of remainingPartners) {
    if (p.name && p.name.trim() !== '') {
      const cleanName = p.name.toLowerCase().replace(/["']/g, '').replace(/\s+/g, ' ').trim();
      if (!nameGroups[cleanName]) nameGroups[cleanName] = [];
      nameGroups[cleanName].push(p);
    }
  }
  const nameDuplicates = Object.values(nameGroups).filter(group => group.length > 1);
  console.log(`\nNév alapján talált duplikált csoportok száma: ${nameDuplicates.length}`);

  const nameResult = await mergeDuplicates(nameDuplicates, 'Név alapján');

  console.log('\n=============================================');
  console.log('DEDUPLIKÁCIÓ SIKERESEN BEFEJEZVE!');
  console.log(`Összevont csoportok száma (Adószám): ${taxResult.mergedGroupsCount}`);
  console.log(`Törölt duplikált partnerek (Adószám): ${taxResult.deletedPartnersCount}`);
  console.log(`Összevont csoportok száma (Név): ${nameResult.mergedGroupsCount}`);
  console.log(`Törölt duplikált partnerek (Név): ${nameResult.deletedPartnersCount}`);
  console.log('=============================================');

  process.exit(0);
}

main().catch(err => {
  console.error('Hiba a deduplikáció során:', err);
  process.exit(1);
});
