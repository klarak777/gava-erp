require('dotenv').config();
const fs = require('fs');
const db = require('knex')(require('./knexfile')['development']);

// Explicit mapping dictionary for historical variations/typos -> Target Partner Name
const EXPLICIT_MAPPINGS = {
  // Typos -> Target Partner
  'KOPFALAT': { name: 'KOPFSALAT TRADE SL.', role: '(Reference) Szállítók' },
  'KOPFSALT': { name: 'KOPFSALAT TRADE SL.', role: '(Reference) Szállítók' },
  'KOPFSLAT': { name: 'KOPFSALAT TRADE SL.', role: '(Reference) Szállítók' },
  'DELGARUITS': { name: 'Delgafruits S.L.', role: '(Reference) Szállítók' },
  'DELGAFRUIT': { name: 'Delgafruits S.L.', role: '(Reference) Szállítók' },
  'EUROGROUP DEUTCHLAND': { name: 'EUROGROUP ESPANA FRUTAS Y VERDURAS S.A.U.', role: '(Reference) Szállítók' },
  'EUROGROUP DETUSCHLAND': { name: 'EUROGROUP ESPANA FRUTAS Y VERDURAS S.A.U.', role: '(Reference) Szállítók' },
  'EUROGROUP  DEUTSCHLAND': { name: 'EUROGROUP ESPANA FRUTAS Y VERDURAS S.A.U.', role: '(Reference) Szállítók' },
  'EUROGROUP DEUSCHLAND': { name: 'EUROGROUP ESPANA FRUTAS Y VERDURAS S.A.U.', role: '(Reference) Szállítók' },
  'EURORGROUP DE': { name: 'EUROGROUP ESPANA FRUTAS Y VERDURAS S.A.U.', role: '(Reference) Szállítók' },
  'EUROGROUP SPAIN': { name: 'EUROGROUP ESPANA FRUTAS Y VERDURAS S.A.U.', role: '(Reference) Szállítók' },
  'OYMPIC FRUIT': { name: 'Olympic Fruit B.V.', role: '(Reference) Szállítók' },
  'FRUBLMED': { name: 'FRUBALMED SLU', role: '(Reference) Szállítók' },
  'FRUBAMED': { name: 'FRUBALMED SLU', role: '(Reference) Szállítók' },
  'AXARFUIT': { name: 'Axarfruit', role: '(Reference) Szállítók' },
  'Axarfuit': { name: 'Axarfruit', role: '(Reference) Szállítók' },
  'EXPOLAMA': { name: 'Expoalma S.L.', role: '(Reference) Szállítók' },
  'AGROPONIENTS NATURAL': { name: 'Agroponiente Natural Produce S.L.', role: '(Reference) Szállítók' },
  'AGROPONIENTE GUARDIAS': { name: 'Agroponiente Natural Produce S.L.', role: '(Reference) Szállítók' },
  'MKF FRESH': { name: 'MK FRESH PRODUCT SARL', role: '(Reference) Szállítók' },
  'MK FESH': { name: 'MK FRESH PRODUCT SARL', role: '(Reference) Szállítók' },
  'VERMOUTH': { name: 'VERMIO', role: '(Reference) Szállítók' },
  'BILEKLEVI': { name: 'BILEK', role: '(Customer) Vevők' },

  // Customers Typos / Variations
  'EUROGROUP DEUTCHLAND_C': { value: 'EUROGROUP DEUTCHLAND', name: 'EUROGROUP ESPANA FRUTAS Y VERDURAS S.A.U.', role: '(Customer) Vevők' },
  'EUROGROUP DETUSCHLAND_C': { value: 'EUROGROUP DETUSCHLAND', name: 'EUROGROUP ESPANA FRUTAS Y VERDURAS S.A.U.', role: '(Customer) Vevők' },
  'EURORGROUP DE_C': { value: 'EURORGROUP DE', name: 'EUROGROUP ESPANA FRUTAS Y VERDURAS S.A.U.', role: '(Customer) Vevők' },
  'EUROGROUP SPAIN_C': { value: 'EUROGROUP SPAIN', name: 'EUROGROUP ESPANA FRUTAS Y VERDURAS S.A.U.', role: '(Customer) Vevők' }
};

// Branch / Store Prefix Mappings -> Target Partner Name
const PREFIX_MAPPINGS = [
  { prefix: 'SPAR HU', target: 'SPAR HU', role: '(Customer) Vevők' },
  { prefix: 'Spar Hu', target: 'SPAR HU', role: '(Customer) Vevők' },
  { prefix: 'SPAR HR', target: 'SPAR HU', role: '(Customer) Vevők' },
  { prefix: 'Spar HR', target: 'SPAR HU', role: '(Customer) Vevők' },
  { prefix: 'Spar Cro', target: 'SPAR HU', role: '(Customer) Vevők' },
  { prefix: 'SPAR CRO', target: 'SPAR HU', role: '(Customer) Vevők' },
  { prefix: 'Spar Slo', target: 'SPAR HU', role: '(Customer) Vevők' },
  { prefix: 'SPAR SLO', target: 'SPAR HU', role: '(Customer) Vevők' },
  { prefix: 'Spar Slovenia', target: 'SPAR HU', role: '(Customer) Vevők' },
  { prefix: 'Spar Hu', target: 'SPAR HU', role: '(Customer) Vevők' },
  { prefix: 'MERCATOR', target: 'HOFER Trgovina d.o.o.', role: '(Customer) Vevők' }
];

async function addOrUpdateIdentifier(partnerId, idType, value, isInactive = true) {
  const cleanVal = value.trim();
  const existing = await db('partner_identifiers')
    .where('partner_id', partnerId)
    .where('id_type', idType)
    .whereRaw('UPPER(value) = ?', [cleanVal.toUpperCase()])
    .first();

  if (!existing) {
    await db('partner_identifiers').insert({
      partner_id: partnerId,
      id_type: idType,
      value: cleanVal,
      is_inactive: isInactive,
      is_verified: false,
      checked_by: '',
      created_at: new Date(),
      updated_at: new Date()
    });
    console.log(`  ➕ Hozzáadva [${idType}]: "${cleanVal}" -> Partner ID ${partnerId} (Inaktív)`);
  } else {
    await db('partner_identifiers')
      .where('id', existing.id)
      .update({ is_inactive: isInactive, updated_at: new Date() });
    console.log(`  🔄 Frissítve [${idType}]: "${cleanVal}" -> Partner ID ${partnerId} (Inaktív)`);
  }
}

async function main() {
  console.log('=== TÖRTÉNELMI AZONOSÍTÓK FELVÉTELE ÉS BEBEÁLLÍTÁSA ===\n');

  const partners = await db('partners').select('id', 'name');

  // 1. Explicit elírások feldolgozása
  for (const [key, map] of Object.entries(EXPLICIT_MAPPINGS)) {
    const val = map.value || key;
    const partner = partners.find(p => p.name.trim().toUpperCase() === map.name.trim().toUpperCase());
    if (partner) {
      await addOrUpdateIdentifier(partner.id, map.role, val, true);
    } else {
      console.warn(`  ⚠️ Nem található a partner: ${map.name}`);
    }
  }

  // 2. Fiókkódok (SPAR, MERCATOR stb.) feldolgozása az audit eredményekből
  const auditData = JSON.parse(fs.readFileSync('historical_csv_audit_results.json', 'utf8'));

  for (const [file, res] of Object.entries(auditData)) {
    // Process Customer missing values for prefixes
    for (const val of res.unmatched.customer) {
      for (const pm of PREFIX_MAPPINGS) {
        if (val.toUpperCase().startsWith(pm.prefix.toUpperCase())) {
          const partner = partners.find(p => p.name.trim().toUpperCase() === pm.target.trim().toUpperCase());
          if (partner) {
            await addOrUpdateIdentifier(partner.id, pm.role, val, true);
          }
        }
      }
    }
  }

  // 3. Történelmi hiányzó beszállítók létrehozása inaktív partnerként (ha még nem léteznek)
  const historicalSuppliers = [
    'COSTA', 'HORTICHUELAS', 'AGRICOLAS COCO', 'EJIDOZONE', 'ALDENOR', 
    'CALIFORNIA', 'SZENTESI', 'RIZOTERRA', 'PATSALAS', 'ANAGNOSTOU', 
    'NEA PARAGOGI', 'EXQUISITE', 'AGRICOLA GUAINOS', 'AGRODIRECT', 
    'AGRUPAEJIDO', 'INICIATIVAS', 'AGROMOLINILLO', 'FONAL', 'BA-RO FRUIT', 
    'AZAMAFA', 'ASAMFA', 'HISPA', 'PREMIUMKERT', 'VALEX CITRUS', 'VALEX', 
    'ECOINVER', 'PADRON', 'LOVEFRUITS', 'VERTIPACK', 'ESMAR FRUTAS', 
    'TOLEDANO', 'BONDÁR', 'LIMITED FOOTPRINT', "QUEEN'S LOGISTICS", 
    'PETRAS GROUP', 'MABE', 'NEJITE', 'GODOY', 'ALEXANDROS', 'BRETAGNE', 
    'MASA MŰHELY'
  ];

  console.log('\n--- Történelmi beszállítók ellenőrzése / felvétele ---');

  for (const suppName of historicalSuppliers) {
    let partner = partners.find(p => p.name.trim().toUpperCase() === suppName.trim().toUpperCase());
    
    if (!partner) {
      // Check if identifier exists anywhere
      const identMatch = await db('partner_identifiers as pi')
        .join('partners as p', 'p.id', 'pi.partner_id')
        .whereRaw('UPPER(pi.value) = ?', [suppName.toUpperCase()])
        .select('p.id', 'p.name')
        .first();

      if (identMatch) {
        partner = identMatch;
      } else {
        // Create new inactive partner
        const [newIdObj] = await db('partners').insert({
          name: suppName,
          type: 'szAllA-tA3', // supplier
          is_inactive: true,
          created_at: new Date(),
          updated_at: new Date()
        }).returning('id');

        const newId = typeof newIdObj === 'object' ? newIdObj.id : newIdObj;
        partner = { id: newId, name: suppName };
        console.log(`  🆕 Létrehozva inaktív partnerként: "${suppName}" (ID: ${newId})`);
      }
    }

    // Ensure it has reference identifier marked as inactive
    await addOrUpdateIdentifier(partner.id, '(Reference) Szállítók', suppName, true);
  }

  console.log('\n✅ Történelmi azonosítók szinkronizálása sikeresen befejeződött!');
  await db.destroy();
}

main().catch(e => { console.error(e); process.exit(1); });
