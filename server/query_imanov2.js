const db = require('./src/db/db');

async function test() {
    try {
        const activePartnerNames = new Set();
        const partners = await db('partner_identifiers as pi')
          .join('partners as p', 'p.id', 'pi.partner_id')
          .whereIn('pi.id_type', ['Fuvarozók', 'FuvarozA3k', 'Fuvaroz\xC3\xB3k'])
          .andWhere('p.is_active', true)
          .andWhere(function() {
            this.where('pi.is_inactive', false).orWhereNull('pi.is_inactive');
          })
          .select('p.name as name', 'pi.value as short_name');

        partners.forEach(p => {
            const pName = (p.short_name || p.name || '').trim();
            if (pName) activePartnerNames.add(pName.toUpperCase());
        });
        
        console.log("Does activePartnerNames have IMANOV / KÓNYA?", activePartnerNames.has('IMANOV / KÓNYA'));
        console.log("Does activePartnerNames have IMANOV?", activePartnerNames.has('IMANOV'));
        
        // Find which partner_identifiers generated this name
        const generated = partners.filter(p => (p.short_name || p.name || '').trim().toUpperCase() === 'IMANOV / KÓNYA');
        console.log("Generated from:", generated);
        
    } catch (e) {
        console.error(e);
    } finally {
        db.destroy();
    }
}
test();
