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
  'ROMANIA', 'ROMÁNIA', 'SAN NICOLA', 'SENOR TOMATE', 'SHEBA', 'SMART', 'SOLHERBS', 
  'SPAR HU', 'SYLVAN', 'TOMATO-AL', 'VEGACANADA', 'VERMION', 'WRAPPING'
].map(s => s.toUpperCase()));

const ALLOWED_CUSTOMERS = new Set([
  'ALDI AT', 'ANTON DÜRBECK', 'ANTON DURBECK', 'BILEK', 'CASAS ROYES', 'CORD', 
  'CRETAN ROOT', 'DG69', 'EUROGROUP DEUTSCHLAND', 'EUROGROUP ESPANA', 'EXOTIC FRESH', 
  'FRUBALMED', 'GAVA', 'GEMÜSERING', 'GEMUSERING', 'GHU', 'GLOBAL BERRY', 
  'GREENCOOP', 'GREENYARD', 'GYÜMÖLCSÉRT', 'HOFER', 'IDEAL FRUITS', 'KONYA', 'KÓNYA', 
  'KOPFSALAT', 'KV LOGISTIKA', 'LEHMANN & TROOST', 'LEVENTE', 'MANDERSLOOT', 
  'OLYMPIC FRUIT', 'R&M', 'ROMANIA', 'ROMÁNIA', 'SAN NICOLA', 'SPAR HU', 'SYLVAN', 'VILLAFRUT'
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

const ROLE_TYPES = {
  reference: ['(Reference) Szállítók', '(Reference) SzAllA-tA3k', '(Reference) SzAllA-tA3k', '(Reference) Sz\xC3\xA1ll\xC3\xADt\xC3\xB3k'],
  customer: ['(Customer) Vevők', '(Customer) Vev`k', '(Customer) Vev\xC5\x91k'],
  transporter: ['Fuvarozók', 'FuvarozA3k', 'Fuvaroz\xC3\xB3k']
};

// Amikor egy azonosító értékhez (pl. KÓNYA) több partner is tartozik az adatbázisban,
// itt adjuk meg, hogy melyik a hivatalos, megtartandó partner neve.
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
    
    // Szállítók (Reference)
    { type: '(Reference) Szállítók', value: 'GAVA', correct_partner_name: 'GAVA TXEQUIA S.R.O.' },
    { type: '(Reference) Szállítók', value: 'KÓNYA', correct_partner_name: 'KÓNYA ZOLTÁNNÉ' },
    { type: '(Reference) Szállítók', value: 'AGROPONIENTE NIJAR', correct_partner_name: 'Agroponiente Natural Produce S.L.' },
    { type: '(Reference) Szállítók', value: 'CASI AEROPORTO', correct_partner_name: 'CASI' },
    { type: '(Reference) Szállítók', value: 'CASI AIRPORT', correct_partner_name: 'CASI' },
    { type: '(Reference) Szállítók', value: 'COMPAGRI', correct_partner_name: 'KOMPAGRI ESPANA SL' },
    { type: '(Reference) Szállítók', value: 'DG69', correct_partner_name: 'DG 69, d.o.o., Vrhnika' },
    { type: '(Reference) Szállítók', value: 'EUROGROUP ESPANA', correct_partner_name: 'EUROGROUP ESPANA FRUTAS Y VERDURAS S.A.U.' },
    { type: '(Reference) Szállítók', value: 'SMART', correct_partner_name: 'Smart Fruits S.L.' },
    { type: '(Reference) Szállítók', value: 'AGROPONIENTE', correct_partner_name: 'Agroponiente Natural Produce S.L.' },
    { type: '(Reference) Szállítók', value: 'CRETAN ROOT', correct_partner_name: 'Cretan Root' },

    // Vevők (Customer)
    { type: '(Customer) Vevők', value: 'GAVA', correct_partner_name: 'GAVA TXEQUIA S.R.O.' },
    { type: '(Customer) Vevők', value: 'KÓNYA', correct_partner_name: 'KÓNYA ZOLTÁNNÉ' },
    { type: '(Customer) Vevők', value: 'DG69', correct_partner_name: 'DG 69, d.o.o., Vrhnika' },
    { type: '(Customer) Vevők', value: 'EUROGROUP ESPANA', correct_partner_name: 'EUROGROUP ESPANA FRUTAS Y VERDURAS S.A.U.' },
    { type: '(Customer) Vevők', value: 'CRETAN ROOT', correct_partner_name: 'Cretan Root' }
];

async function syncRoleCategory(roleName, allowSet, dbIdTypes) {
  console.log(`\n=== Processing ${roleName} ===`);
  
  const identifiers = await db('partner_identifiers as pi')
    .join('partners as p', 'p.id', 'pi.partner_id')
    .whereIn('pi.id_type', dbIdTypes)
    .select('pi.id as pi_id', 'pi.id_type', 'pi.value', 'pi.is_inactive', 'p.name as partner_name');

  let deactivatedNotAllowed = 0;
  let deactivatedDuplicate = 0;
  let activeCount = 0;

  for (const iden of identifiers) {
    const valUpper = (iden.value || '').toUpperCase().trim();
    const isAllowed = allowSet.has(valUpper);

    if (!isAllowed) {
      if (!iden.is_inactive) {
        await db('partner_identifiers').where('id', iden.pi_id).update({ is_inactive: true });
        deactivatedNotAllowed++;
      }
      continue;
    }

    // Is in allow list, check if there's a specific correct partner name specified for this role/value
    const rule = CORRECT_MAPPINGS.find(m => 
      dbIdTypes.includes(m.type) && 
      m.value.toUpperCase() === valUpper
    );

    if (rule) {
      const match = iden.partner_name.trim().toLowerCase() === rule.correct_partner_name.trim().toLowerCase();
      if (!match) {
        if (!iden.is_inactive) {
          await db('partner_identifiers').where('id', iden.pi_id).update({ is_inactive: true });
          console.log(`[${roleName}] Deactivated wrong duplicate: '${valUpper}' mapped to '${iden.partner_name}' (expected '${rule.correct_partner_name}')`);
          deactivatedDuplicate++;
        }
        continue;
      }
    }

    // Ensure it is ACTIVE
    if (iden.is_inactive) {
      await db('partner_identifiers').where('id', iden.pi_id).update({ is_inactive: false });
    }
    activeCount++;
  }

  console.log(`Summary for ${roleName}: Active = ${activeCount}, Deactivated (Not Allowed) = ${deactivatedNotAllowed}, Deactivated (Duplicates) = ${deactivatedDuplicate}`);
}

async function runDynamicSync() {
    try {
        console.log("Starting full DB sync based on allowlists and partner names...");

        await syncRoleCategory('Reference (Szállítók)', ALLOWED_REFERENCES, ROLE_TYPES.reference);
        await syncRoleCategory('Customer (Vevők)', ALLOWED_CUSTOMERS, ROLE_TYPES.customer);
        await syncRoleCategory('Transporter (Fuvarozók)', ALLOWED_TRANSPORTERS, ROLE_TYPES.transporter);
        
        // Clean up transporters table to match partner_identifiers
        console.log("\nCleaning up transporters table...");
        const transporters = await db('transporters').select('id', 'name');
        let deactivatedTransporters = 0;
        let activatedTransporters = 0;
        
        const activePartnerNames = new Set();
        const partners = await db('partner_identifiers as pi')
          .join('partners as p', 'p.id', 'pi.partner_id')
          .whereIn('pi.id_type', ROLE_TYPES.transporter)
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
            if (!activePartnerNames.has(upperName) && t.is_active) {
                await db('transporters').where('id', t.id).update({ is_active: false });
                deactivatedTransporters++;
            } else if (activePartnerNames.has(upperName) && !t.is_active) {
                await db('transporters').where('id', t.id).update({ is_active: true });
                activatedTransporters++;
            }
        }
        
        console.log(`Transporters table updated: Deactivated = ${deactivatedTransporters}, Activated = ${activatedTransporters}`);
        console.log("\nALL SYNCS COMPLETED SUCCESSFULLY.");

    } catch (e) {
        console.error(e);
    } finally {
        db.destroy();
    }
}

runDynamicSync();
