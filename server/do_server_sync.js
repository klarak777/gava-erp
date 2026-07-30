const db = require('./src/db/db');

const ALLOWED_REFERENCES = new Set([
  'AGRONERVION', 'AGROPONIENTE', 'AGROPONIENTE NATURAL', 'AGROPONIENTE NIJAR', 
  'ANTON DÜRBECK', 'ANTON DURBECK', 'AXARFRUIT', 'BERTIPACK', 'BILEK', 'CASAS ROYES',
  'CASI', 'CASI AEROPORTO', 'CASI AIRPORT', 'CASI PARTIDORES', 'CLARA', 'COMPAGRI', 
  'CORD', 'CRETAN ROOT', 'DELGAFRUITS', 'DG69', 'ECOINVER BIO', 'ESCOBAR', 
  'ESCOFRESH', 'ESMAR', 'EUROGROUP DEUTSCHLAND', 'EUROGROUP ESPANA', 'EXOTIC FRESH', 
  'EXPOALMA', 'FA. DE JONG', 'FARAON', 'FRANIAL', 'FRESSAN', 'FRUBALMED', 
  'FRUTAS GAVA', 'GALLARDO', 'GAVA', 'GAVA POLSKA', 'GEMÜSERING', 'GEMUSERING', 
  'GLOBAL BERRY', 'GREEN QUALITY', 'GREENCOOP', 'GREENYARD', 'GYÜMÖLCSÉRT', 
  'IDEAL FRUITS', 'KOMPAGRI', 'KONYA', 'KÓNYA', 'KOPALMERIA', 'KOPFSALAT', 'KUSEK', 
  'LA CALIFORNIA', 'LEHMANN & TROOST', 'LEVENTE', 'MALENO', 'MALENO Y TORRES', 
  'MANDERSLOOT', 'NATURINDA', 'NATURNAR', 'OLASO', 'OLYMPIC FRUIT', 'R&M', 
  'ROMANIA', 'SAN NICOLA', 'SENOR TOMATE', 'SHEBA', 'SMART', 'SOLHERBS', 
  'SPAR HU', 'SYLVAN', 'TOMATO-AL', 'VEGACANADA', 'VERMION', 'WRAPPING'
].map(s => s.toUpperCase()));

const ALLOWED_CUSTOMERS = new Set([
  'ALDI AT', 'ANTON DÜRBECK', 'ANTON DURBECK', 'BILEK', 'CASAS ROYES', 'CORD', 
  'CRETAN ROOT', 'DG69', 'EUROGROUP DEUTSCHLAND', 'EUROGROUP ESPANA', 'EXOTIC FRESH', 
  'FRUBALMED', 'GAVA', 'GEMÜSERING', 'GEMUSERING', 'GHU', 'GLOBAL BERRY', 
  'GREENCOOP', 'GREENYARD', 'GYÜMÖLCSÉRT', 'HOFER', 'IDEAL FRUITS', 'KONYA', 'KÓNYA', 
  'KOPFSALAT', 'KV LOGISTIKA', 'LEHMANN & TROOST', 'LEVENTE', 'MANDERSLOOT', 
  'OLYMPIC FRUIT', 'R&M', 'ROMANIA', 'SAN NICOLA', 'SPAR HU', 'SYLVAN', 'VILLAFRUT', 'ROMÁNIA'
].map(s => s.toUpperCase()));

const ALLOWED_TRANSPORTERS = new Set([
  'ALL FRESH', 'BILEK', 'BOGNÁR', 'BUGYI FERENC', 'BVT', 'CRETAN ROOT',
  'DERBY', 'ESKADA', 'FARAON', 'FER TRANS', 'FRIGOSPED', 'FRUBALMED',
  'FRUCTUS', 'FUSTER', 'GAVA', 'GAVA POLSKA', 'HANKA', 'HILLTOP', 'HZ',
  'KERMOR', 'KÓNYA', 'KUSEK', 'KV LOG', 'LIVIU', 'LOGISTICHOME',
  'MANDERSLOOT', 'MESAVERDE', 'MÜLLER', 'NH CARGO', 'PAP JÓZSEFNÉ',
  'PET-IMPEX', 'RAINBOW', 'RENACRIS', 'RONI', 'SHEBA', 'STI',
  'S-TRANSPORT', 'SWISS', 'SZÉKESI', 'THERMO FRUCHT', 'TÓTH FRIGO',
  'TRANS-SPED', 'VERMION'
].map(s => s.toUpperCase()));

const ROLE_MAP = {
    'reference': ['(Reference) Szállítók', '(Reference) SzAllA-tA3k', '(Reference) SzAllA-tA3k', '(Reference) Sz\xC3\xA1ll\xC3\xADt\xC3\xB3k'],
    'customer': ['(Customer) Vevők', '(Customer) Vev`k', '(Customer) Vev\xC5\x91k'],
    'transporter': ['Fuvarozók', 'FuvarozA3k', 'Fuvaroz\xC3\xB3k']
};

const WRONG_MAPPINGS = [
    { type: 'Fuvarozók', value: 'BOGNÁR', wrong_partner_id: 741 },
    { type: 'Fuvarozók', value: 'GAVA', wrong_partner_id: 48 },
    { type: '(Reference) Szállítók', value: 'GAVA', wrong_partner_id: 48 },
    { type: '(Customer) Vevők', value: 'GAVA', wrong_partner_id: 48 },
    { type: 'Fuvarozók', value: 'KÓNYA', wrong_partner_id: 2051 },
    { type: '(Reference) Szállítók', value: 'KÓNYA', wrong_partner_id: 2051 },
    { type: 'Fuvarozók', value: 'RONI', wrong_partner_id: 641 },
    { type: '(Reference) Szállítók', value: 'AGROPONIENTE NIJAR', wrong_partner_id: 6954 },
    { type: '(Reference) Szállítók', value: 'CASI AEROPORTO', wrong_partner_id: 6957 },
    { type: '(Reference) Szállítók', value: 'CASI AIRPORT', wrong_partner_id: 6955 },
    { type: '(Reference) Szállítók', value: 'COMPAGRI', wrong_partner_id: 6956 },
    { type: '(Customer) Vevők', value: 'DG69', wrong_partner_id: 6958 },
    { type: '(Reference) Szállítók', value: 'DG69', wrong_partner_id: 6958 },
    { type: '(Reference) Szállítók', value: 'EUROGROUP ESPANA', wrong_partner_id: 31 },
    { type: '(Reference) Szállítók', value: 'SMART', wrong_partner_id: 772 },
    { type: '(Reference) Szállítók', value: 'AGROPONIENTE', wrong_partner_id: 3977 },
    { type: 'Adószám', value: '54374744-2-24', wrong_partner_id: 1578 },
    { type: 'FELIR azonosító', value: 'AA2356758', wrong_partner_id: 1764 },
    { type: 'Közösségi adószám', value: 'ESB12596128', wrong_partner_id: 6949 }
];

async function syncRole(role, allowList, dbIdTypes) {
    const dbIdentifiers = await db('partner_identifiers')
        .whereIn('id_type', dbIdTypes)
        .select('id', 'partner_id', 'value', 'is_inactive', 'id_type');

    let deactivatedCount = 0;
    let activatedCount = 0;

    for (const d of dbIdentifiers) {
        const val = (d.value || '').toUpperCase().trim();
        const inCsv = allowList.has(val);
        
        let shouldBeInactive = !inCsv;
        
        // Also check if it's one of the explicitly known wrong mappings
        const isWrongMapping = WRONG_MAPPINGS.find(m => 
            dbIdTypes.includes(m.type) && 
            m.value.toUpperCase() === val && 
            m.wrong_partner_id === d.partner_id
        );
        
        if (isWrongMapping) {
            shouldBeInactive = true;
        }

        if (!shouldBeInactive) {
            if (d.is_inactive === true || d.is_inactive === 1) {
                await db('partner_identifiers').where('id', d.id).update({ is_inactive: false });
                activatedCount++;
            }
        } else {
            if (!d.is_inactive) {
                await db('partner_identifiers').where('id', d.id).update({ is_inactive: true });
                deactivatedCount++;
            }
        }
    }
    
    console.log(`[${role}] Deactivated: ${deactivatedCount}, Activated: ${activatedCount}`);
}

async function run() {
    try {
        console.log("Starting DO server sync...");
        
        // Deactivate wrong mappings for specific non-role identifiers too (like Adószám)
        for (const m of WRONG_MAPPINGS) {
            if (!['Fuvarozók', '(Reference) Szállítók', '(Customer) Vevők'].includes(m.type)) {
                await db('partner_identifiers')
                    .where('id_type', m.type)
                    .where('partner_id', m.wrong_partner_id)
                    .whereRaw('UPPER(value) = ?', [m.value.toUpperCase()])
                    .update({ is_inactive: true });
            }
        }

        await syncRole('Reference', ALLOWED_REFERENCES, ROLE_MAP['reference']);
        await syncRole('Customer', ALLOWED_CUSTOMERS, ROLE_MAP['customer']);
        await syncRole('Transporter', ALLOWED_TRANSPORTERS, ROLE_MAP['transporter']);
        
        // Clean up transporters table
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
        console.log("DO server database sync completed successfully.");

    } catch (e) {
        console.error(e);
    } finally {
        db.destroy();
    }
}

run();
