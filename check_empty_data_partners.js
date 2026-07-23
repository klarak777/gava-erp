const db = require('./server/src/db/db');
async function run() {
  try {
    // A partner is considered "empty" if it has no tax_id, no zip, no city, no street_name, no invoice_name (or same as name), and no identifiers
    const allPartners = await db('partners').select('*');
    const allIdentifiers = await db('partner_identifiers').select('partner_id');
    const partnersWithIdents = new Set(allIdentifiers.map(i => i.partner_id));
    
    const emptyPartners = [];
    for (const p of allPartners) {
      const hasTaxId = p.tax_id && p.tax_id.trim() !== '';
      const hasAddress = (p.zip && p.zip.trim() !== '') || (p.city && p.city.trim() !== '') || (p.street_name && p.street_name.trim() !== '');
      const hasIdentifiers = partnersWithIdents.has(p.id);
      const hasInvoiceName = p.invoice_name && p.invoice_name !== p.name && p.invoice_name.trim() !== '';
      const hasNameOnly = !hasTaxId && !hasAddress && !hasIdentifiers && !hasInvoiceName;
      
      // We also check if the name itself is empty or just spaces
      const isNameEmpty = !p.name || p.name.trim() === '';
      
      if (hasNameOnly || isNameEmpty) {
        emptyPartners.push(p);
      }
    }
    
    console.log(`Found ${emptyPartners.length} partners with no data besides name (or empty name). Attempting to delete...`);
    
    let deletedCount = 0;
    let fkErrorCount = 0;
    for (const p of emptyPartners) {
      try {
        // partner_sites will be cascade deleted, but if there are other FKs, it will throw an error
        await db('partners').where('id', p.id).del();
        deletedCount++;
      } catch (err) {
        if (err.code === '23503') { // Foreign Key violation in Postgres
          fkErrorCount++;
        } else {
          console.error(`Error deleting partner ${p.id}:`, err.message);
        }
      }
    }
    
    console.log(`Successfully deleted ${deletedCount} empty partners.`);
    console.log(`Skipped ${fkErrorCount} partners due to existing foreign key references.`);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
