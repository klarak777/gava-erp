const db = require('./src/db/db');

async function fixDuplicates() {
    try {
        const toDeactivate = [
            5582, // BOGNÁR (741 Bognárné)
            5585, // GAVA (48 FRUTAS GAVA - Transporter)
            5560, // GAVA (48 FRUTAS GAVA - Reference)
            5571, // GAVA (48 FRUTAS GAVA - Customer)
            5577, // KÓNYA (2051 Kónya Trans - Transporter)
            5549, // KÓNYA (2051 Kónya Trans - Reference)
            5583, // RONI (641 Békési Veronika)
            5554, // AGROPONIENTE NIJAR (6954) - keep 27
            5561, // CASI AEROPORTO (6957) - keep 41
            5558, // CASI AIRPORT (6955) - keep 41
            5559, // COMPAGRI (6956) - keep 59
            5572, // DG69 Customer (6958) - keep 1007
            5562, // DG69 Reference (6958) - keep 1007
            5553, // EUROGROUP ESPANA (31) - keep 23
            5546, // SMART (772) - keep 17
            5551, // AGROPONIENTE (3977) - keep 27
            2152, // 54374744-2-24 duplicate
            2439, // AA2356758 duplicate
            5354  // ESB12596128 duplicate
        ];

        const updated = await db('partner_identifiers')
            .whereIn('id', toDeactivate)
            .update({ is_inactive: true });
            
        console.log(`Deactivated ${updated} wrong duplicate identifiers.`);
        
        // Let's also sync transporters table again to remove any wrongly activated transporters
        const transporters = await db('transporters').select('id', 'name');
        let deactivatedTransporters = 0;
        
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
        
        for (const t of transporters) {
            const upperName = (t.name || '').toUpperCase().trim();
            if (!activePartnerNames.has(upperName)) {
                await db('transporters').where('id', t.id).update({ is_active: false });
                deactivatedTransporters++;
            }
        }
        
        console.log(`Also deactivated ${deactivatedTransporters} transporters in transporters table.`);

    } catch (e) {
        console.error(e);
    } finally {
        db.destroy();
    }
}

fixDuplicates();
