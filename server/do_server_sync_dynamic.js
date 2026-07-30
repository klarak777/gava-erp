const db = require('./src/db/db');

// Csak a név számít, mert az ID-k eltérnek a lokális és a DO szerver között!
const CORRECT_MAPPINGS = [
    // Fuvarozók
    { type: 'Fuvarozók', value: 'BOGNÁR', correct_partner_name: 'Bognár Transport Korlátolt Felelősségű Társaság' },
    { type: 'Fuvarozók', value: 'CRETAN ROOT', correct_partner_name: 'Cretan Root' },
    { type: 'Fuvarozók', value: 'DERBY', correct_partner_name: 'DERBY FRUIT TRADE KFT.' },
    { type: 'Fuvarozók', value: 'FRUCTUS', correct_partner_name: 'Fructus Trade' },
    { type: 'Fuvarozók', value: 'GAVA', correct_partner_name: 'GAVA TXEQUIA S.R.O.' },
    { type: 'Fuvarozók', value: 'GAVA POLSKA', correct_partner_name: 'Gava Polska Sp. z o.o.' },
    { type: 'Fuvarozók', value: 'HANKA', correct_partner_name: 'HANKA' },
    { type: 'Fuvarozók', value: 'KÓNYA', correct_partner_name: 'KÓNYA ZOLTÁNNÉ' },
    { type: 'Fuvarozók', value: 'MÜLLER', correct_partner_name: 'Müller-Transporte Gesellschaft m.b.H.' },
    { type: 'Fuvarozók', value: 'PAP JÓZSEFNÉ', correct_partner_name: 'Pap Józsefné' },
    { type: 'Fuvarozók', value: 'RONI', correct_partner_name: 'Roni Cargo Kft.' },
    { type: 'Fuvarozók', value: 'S-TRANSPORT', correct_partner_name: 'S-Transport' },
    { type: 'Fuvarozók', value: 'STI', correct_partner_name: 'STI' },
    { type: 'Fuvarozók', value: 'THERMO FRUCHT', correct_partner_name: 'THERMO FRUCHT Kft.' },
    
    // Szállítók / Vevők
    { type: '(Reference) Szállítók', value: 'GAVA', correct_partner_name: 'GAVA TXEQUIA S.R.O.' },
    { type: '(Customer) Vevők', value: 'GAVA', correct_partner_name: 'GAVA TXEQUIA S.R.O.' },
    { type: '(Reference) Szállítók', value: 'KÓNYA', correct_partner_name: 'KÓNYA ZOLTÁNNÉ' },
    { type: '(Reference) Szállítók', value: 'AGROPONIENTE NIJAR', correct_partner_name: 'Agroponiente Natural Produce S.L.' },
    { type: '(Reference) Szállítók', value: 'CASI AEROPORTO', correct_partner_name: 'CASI' },
    { type: '(Reference) Szállítók', value: 'CASI AIRPORT', correct_partner_name: 'CASI' },
    { type: '(Reference) Szállítók', value: 'COMPAGRI', correct_partner_name: 'KOMPAGRI ESPANA SL' },
    { type: '(Customer) Vevők', value: 'DG69', correct_partner_name: 'DG 69, d.o.o., Vrhnika' },
    { type: '(Reference) Szállítók', value: 'DG69', correct_partner_name: 'DG 69, d.o.o., Vrhnika' },
    { type: '(Reference) Szállítók', value: 'EUROGROUP ESPANA', correct_partner_name: 'EUROGROUP ESPANA FRUTAS Y VERDURAS S.A.U.' },
    { type: '(Reference) Szállítók', value: 'SMART', correct_partner_name: 'Smart Fruits S.L.' },
    { type: '(Reference) Szállítók', value: 'AGROPONIENTE', correct_partner_name: 'Agroponiente Natural Produce S.L.' }
];

async function runDynamicSync() {
    try {
        console.log("Starting dynamic duplicate resolution based on partner names...");
        
        let deactivatedCount = 0;
        
        for (const mapping of CORRECT_MAPPINGS) {
            // Find ALL active partner_identifiers for this type and value
            const identifiers = await db('partner_identifiers as pi')
                .join('partners as p', 'p.id', 'pi.partner_id')
                .where('pi.id_type', mapping.type)
                .whereRaw('UPPER(pi.value) = ?', [mapping.value.toUpperCase()])
                .where(function() {
                    this.where('pi.is_inactive', false).orWhereNull('pi.is_inactive');
                })
                .select('pi.id as pi_id', 'p.name as partner_name');
            
            // If there's more than 1, or even if there is 1 but it's the wrong one:
            for (const iden of identifiers) {
                // If this is NOT the correct partner name, deactivate it!
                if (iden.partner_name.trim().toLowerCase() !== mapping.correct_partner_name.trim().toLowerCase()) {
                    await db('partner_identifiers').where('id', iden.pi_id).update({ is_inactive: true });
                    console.log(`Deactivated WRONG mapping: ${mapping.type} '${mapping.value}' mapped to '${iden.partner_name}'`);
                    deactivatedCount++;
                }
            }
        }

        console.log(`\nDeactivated a total of ${deactivatedCount} incorrect duplicate identifiers.`);
        
        // Clean up transporters table to remove anything that is no longer active
        console.log("Cleaning up transporters table...");
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
        
        console.log(`Deactivated ${deactivatedTransporters} transporters in transporters table.`);
        console.log("Dynamic sync completed successfully.");

    } catch (e) {
        console.error(e);
    } finally {
        db.destroy();
    }
}

runDynamicSync();
