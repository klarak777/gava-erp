const db = require('./server/src/db/db');

async function findDuplicates() {
  console.log('Duplikációk keresése az adatbázisban...');

  const partners = await db('partners').select('id', 'name', 'tax_id', 'invoice_name');
  console.log(`Összes partner: ${partners.length}`);

  // 1. Keresés Adószám alapján (ahol van adószám)
  const taxIdGroups = {};
  for (const p of partners) {
    if (p.tax_id && p.tax_id.trim() !== '') {
      const cleanTax = p.tax_id.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      if (!taxIdGroups[cleanTax]) taxIdGroups[cleanTax] = [];
      taxIdGroups[cleanTax].push(p);
    }
  }

  const taxIdDuplicates = Object.values(taxIdGroups).filter(group => group.length > 1);

  // 2. Keresés Név alapján (case-insensitive, szóközök és idézőjelek nélkül)
  const nameGroups = {};
  for (const p of partners) {
    if (p.name && p.name.trim() !== '') {
      const cleanName = p.name.toLowerCase().replace(/["']/g, '').replace(/\s+/g, ' ').trim();
      if (!nameGroups[cleanName]) nameGroups[cleanName] = [];
      nameGroups[cleanName].push(p);
    }
  }

  const nameDuplicates = Object.values(nameGroups).filter(group => group.length > 1);

  console.log(`\nAdószám alapján talált duplikált csoportok száma: ${taxIdDuplicates.length}`);
  if (taxIdDuplicates.length > 0) {
    for (let i = 0; i < Math.min(5, taxIdDuplicates.length); i++) {
      console.log(`- Csoport ${i+1}:`, taxIdDuplicates[i].map(p => `[ID: ${p.id}] ${p.name} (Adószám: ${p.tax_id})`));
    }
  }

  console.log(`\nNév alapján talált duplikált csoportok száma: ${nameDuplicates.length}`);
  if (nameDuplicates.length > 0) {
    for (let i = 0; i < Math.min(5, nameDuplicates.length); i++) {
      console.log(`- Csoport ${i+1}:`, nameDuplicates[i].map(p => `[ID: ${p.id}] ${p.name}`));
    }
  }

  process.exit(0);
}

findDuplicates().catch(err => {
  console.error(err);
  process.exit(1);
});
