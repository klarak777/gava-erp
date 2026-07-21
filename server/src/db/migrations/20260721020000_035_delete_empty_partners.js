/**
 * Migration 035: Clean up empty partners and fix Kopfsalat tax IDs
 */

exports.up = async function(knex) {
  console.log('Running migration 035: Delete empty partners and fix Kopfsalat');
  
  // 1. Delete empty partners (no identifiers, no valid address, no invoice name, or empty name)
  const allPartners = await knex('partners').select('*');
  const allIdentifiers = await knex('partner_identifiers').select('partner_id');
  const partnersWithIdents = new Set(allIdentifiers.map(i => i.partner_id));
  
  const emptyPartners = [];
  for (const p of allPartners) {
    const hasTaxId = p.tax_id && p.tax_id.trim() !== '';
    const hasAddress = (p.zip && p.zip.trim() !== '') || (p.city && p.city.trim() !== '') || (p.street_name && p.street_name.trim() !== '');
    const hasIdentifiers = partnersWithIdents.has(p.id);
    const hasInvoiceName = p.invoice_name && p.invoice_name !== p.name && p.invoice_name.trim() !== '';
    const hasNameOnly = !hasTaxId && !hasAddress && !hasIdentifiers && !hasInvoiceName;
    
    const isNameEmpty = !p.name || p.name.trim() === '';
    
    if (hasNameOnly || isNameEmpty) {
      emptyPartners.push(p);
    }
  }
  
  let deletedCount = 0;
  for (const p of emptyPartners) {
    try {
      await knex('partners').where('id', p.id).del();
      deletedCount++;
    } catch (err) {
      // Ignore foreign key constraints (we only want to delete safely isolated empty records)
      if (err.code !== '23503' && !err.message.includes('foreign key constraint')) {
        console.error(`Warning: Could not delete empty partner ${p.id}:`, err.message);
      }
    }
  }
  console.log(`Deleted ${deletedCount} empty partners.`);

  // 2. Fix Kopfsalat tax_id so 'Kopfsalat Trade Sl' and 'KOPFSALAT TRADE SL.' can coexist correctly
  // We clear the tax_id from 'KOPFSALAT TRADE SL.' (which has ESB60713880 in EU VAT)
  // because it accidentally took '30528949-2-51' during a previous merge.
  const kopfsalatPartners = await knex('partners').whereRaw("name ILIKE '%Kopfsalat%'");
  for (const p of kopfsalatPartners) {
    if (p.name === 'KOPFSALAT TRADE SL.' && p.tax_id === '30528949-2-51') {
      await knex('partners').where('id', p.id).update({ tax_id: '' });
      await knex('partner_identifiers').where('partner_id', p.id).andWhere('id_type', 'Adószám').del();
      console.log(`Cleared incorrect Adószám from ${p.name} (id: ${p.id})`);
    }
  }
};

exports.down = async function(knex) {
  // Empty deletion is not easily reversible without data backups
};
