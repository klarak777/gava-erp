const knex = require('knex');
const knexfile = require('./knexfile');
const db = knex(knexfile.development);

const rawDoText = `
AXARFRUIT                                                           | (Reference) Szállítók | AXARFRUIT
 Agronervion, S.L.U.                                                 | (Reference) Szállítók | AGRONERVION
 Agroponiente Natural Produce S.L.                                   | (Reference) Szállítók | AGROPONIENTE
 Agroponiente Natural Produce S.L.                                   | (Reference) Szállítók | AGROPONIENTE NATURAL
 Agroponiente Natural Produce S.L.                                   | (Reference) Szállítók | AGROPONIENTE NIJAR
 All Fresh Logistics GmbH                                            | Fuvarozók             | ALL FRESH
 Anton Dürbeck GmbH                                                  | (Reference) Szállítók | ANTON DÜRBECK
 BILEK                                                               | (Reference) Szállítók | BILEK
 BILEK                                                               | Fuvarozók             | BILEK
 BVT                                                                 | Fuvarozók             | BVT
 Bertipack, S.L.                                                     | (Reference) Szállítók | BERTIPACK
 Bognár Transport Korlátolt Felelősségű Társaság                     | Fuvarozók             | BOGNÁR
 Bugyi Ferenc Kft.                                                   | Fuvarozók             | BUGYI FERENC
 CASAS ROYES EXPORT S.L.                                             | (Reference) Szállítók | CASAS ROYES
 CASI                                                                | (Reference) Szállítók | CASI
 CASI                                                                | (Reference) Szállítók | CASI AEROPORTO
 CASI                                                                | (Reference) Szállítók | CASI AIRPORT
 CASI PARTIDORES                                                     | (Reference) Szállítók | CASI PARTIDORES
 CLARA EXPORT, S.L.                                                  | (Reference) Szállítók | CLARA
 CORD                                                                | (Reference) Szállítók | CORD
 CRETAN ROOT                                                         | (Reference) Szállítók | CRETAN ROOT
 CRETAN ROOT                                                         | Fuvarozók             | CRETAN ROOT
 DERBY FRUIT TRADE KFT.                                              | Fuvarozók             | DERBY
 DG 69, d.o.o., Vrhnika                                              | (Reference) Szállítók | DG69
 Delgafruits S.L.                                                    | (Reference) Szállítók | DELGAFRUITS
 ESCOFRESH                                                           | (Reference) Szállítók | ESCOFRESH
 ESKADA                                                              | Fuvarozók             | ESKADA
 EUROGROUP ESPANA FRUTAS Y VERDURAS S.A.U.                           | (Reference) Szállítók | EUROGROUP ESPANA
 EUROGROUP ITALIA S.R.L.                                             | (Reference) Szállítók | EUROGROUP ITALY
 EXOTIC FRESH                                                        | (Reference) Szállítók | EXOTIC FRESH
 Ecoinver Bio S.L                                                    | (Reference) Szállítók | ECOINVER BIO
 Escobar Reyes, S.L.                                                 | (Reference) Szállítók | ESCOBAR
 Esmar Frutas Imp-Exp. SL                                            | (Reference) Szállítók | ESMAR
 Eurogroup Deutschland Gmbh                                          | (Reference) Szállítók | EUROGROUP DEUTSCHLAND
 Expoalma S.L.                                                       | (Reference) Szállítók | EXPOALMA
 FARAON EGIPCIO SL                                                   | (Reference) Szállítók | FARAON
 FARAON EGIPCIO SL                                                   | Fuvarozók             | FARAON
 FRANIAL                                                             | (Reference) Szállítók | FRANIAL
 FRESSAN                                                             | (Reference) Szállítók | FRESSAN
 FRIGOSPED                                                           | Fuvarozók             | FRIGOSPED
 FRUBALMED SLU                                                       | (Reference) Szállítók | FRUBALMED
 FRUBALMED SLU                                                       | Fuvarozók             | FRUBALMED
 FRUTAS GAVA                                                         | (Reference) Szállítók | FRUTAS GAVA
 FUSTER                                                              | Fuvarozók             | FUSTER
 Fa. De Jong - Fruit                                                 | (Reference) Szállítók | FA. DE JONG
 Fer Trans '96 Szállítási Szolgáltató Korlátolt Felelősségű Társaság | Fuvarozók             | FER TRANS
 Fructus Trade                                                       | Fuvarozók             | FRUCTUS
 GALLARDO                                                            | (Reference) Szállítók | GALLARDO
 GAVA TXEQUIA S.R.O.                                                 | (Reference) Szállítók | GAVA
 GAVA TXEQUIA S.R.O.                                                 | Fuvarozók             | GAVA
 GEMÜSERING                                                          | (Reference) Szállítók | GEMÜSERING
 GREEN QUALITY                                                       | (Reference) Szállítók | GREEN QUALITY
 GREENCOOP                                                           | (Reference) Szállítók | GREENCOOP
 Gava Polska Sp. z o.o.                                              | (Reference) Szállítók | GAVA POLSKA
 Gava Polska Sp. z o.o.                                              | Fuvarozók             | GAVA POLSKA
 Global Berry S.L.                                                   | (Reference) Szállítók | GLOBAL BERRY
 Greenyard Fresh Spain SA                                            | (Reference) Szállítók | GREENYARD
 Gyümölcsért Kft.                                                    | (Reference) Szállítók | GYÜMÖLCSÉRT
 HANKA                                                               | Fuvarozók             | HANKA
 HZ                                                                  | Fuvarozók             | HZ
 Hilltop Logisztikai Kft                                             | Fuvarozók             | HILLTOP
 Ideal Fruits, S.l.                                                  | (Reference) Szállítók | IDEAL FRUITS
 KOMPAGRI ESPANA SL                                                  | (Reference) Szállítók | COMPAGRI
 KOMPAGRI ESPANA SL                                                  | (Reference) Szállítók | KOMPAGRI
 KOPALMERIA S.L.                                                     | (Reference) Szállítók | KOPALMERIA
 KOPFSALAT TRADE SL.                                                 | (Reference) Szállítók | KOPFSALAT
 KUSEK                                                               | (Reference) Szállítók | KUSEK
 KUSEK                                                               | Fuvarozók             | KUSEK
 KV LOG                                                              | Fuvarozók             | KV LOG
 Kermor Bt.......                                                    | Fuvarozók             | KERMOR
 Kónya Trans Korlátolt Felelősségű Társaság                          | (Reference) Szállítók | KÓNYA
 Kónya Trans Korlátolt Felelősségű Társaság                          | Fuvarozók             | KÓNYA
 LA CALIFORNIA TRADING ESPANA SL.                                    | (Reference) Szállítók | LA CALIFORNIA
 LEHMANN & TROOST B.V.                                               | (Reference) Szállítók | LEHMANN & TROOST
 LEVENTE                                                             | (Reference) Szállítók | LEVENTE
 LIVIU                                                               | Fuvarozók             | LIVIU
 LOGISTICHOME                                                        | Fuvarozók             | LOGISTICHOME
 MESAVERDE KFT.                                                      | Fuvarozók             | MESAVERDE
 Maleno Y Torres Exportación S.L.                                    | (Reference) Szállítók | MALENO
 Maleno Y Torres Exportación S.L.                                    | (Reference) Szállítók | MALENO Y TORRES
 Mandersloot Expeditiebedrijf B.V.                                   | (Reference) Szállítók | MANDERSLOOT
 Mandersloot Expeditiebedrijf B.V.                                   | Fuvarozók             | MANDERSLOOT
 Müller-Transporte Gesellschaft m.b.H.                               | Fuvarozók             | MÜLLER
 NATURINDA, SLNE                                                     | (Reference) Szállítók | NATURINDA
 NATURNAR KRYLUAN SL.                                                | (Reference) Szállítók | NATURNAR
 NH Cargo Kft                                                        | Fuvarozók             | NH CARGO
 OLASO                                                               | (Reference) Szállítók | OLASO
 Olympic Fruit B.V.                                                  | (Reference) Szállítók | OLYMPIC FRUITS
 PAP JÓZSEFNÉ                                                        | Fuvarozók             | PAP JÓZSEFNÉ
 PET-IMPEX                                                           | Fuvarozók             | PET-IMPEX
 R&M                                                                 | (Reference) Szállítók | R&M
 RAINBOW                                                             | Fuvarozók             | RAINBOW
 RENACRIS                                                            | Fuvarozók             | RENACRIS
 ROMÁNIA                                                             | (Reference) Szállítók | ROMÁNIA
 Roni Cargo Kft.                                                     | Fuvarozók             | RONI
 S-Transport                                                         | Fuvarozók             | S-TRANSPORT
 SAN NICOLA GROUP S.R.L.                                             | (Reference) Szállítók | SAN NICOLA
 SHEBA                                                               | (Reference) Szállítók | SHEBA
 SHEBA                                                               | Fuvarozók             | SHEBA
 SOLHERBS, S.L.U.                                                    | (Reference) Szállítók | SOLHERBS
 SPAR Magyarország Kereskedelmi Kft.                                 | (Reference) Szállítók | SPAR HU
 STI                                                                 | Fuvarozók             | STI
 Senor Tomate Kereskedelmi Korlátolt Felelősségű Társaság            | (Reference) Szállítók | SENOR TOMATE
 Smart Fruits S.L.                                                   | (Reference) Szállítók | SMART
 Swiss Temp Logistics GmbH                                           | Fuvarozók             | SWISS
 Sylvan Hungária Zrt.                                                | (Reference) Szállítók | SYLVAN
 Székesi Kft.                                                        | Fuvarozók             | SZÉKESI
 THERMO FRUCHT Kft.                                                  | Fuvarozók             | THERMO FRUCHT
 TOMATO-AL                                                           | (Reference) Szállítók | TOMATO-AL
 Trans-Sped Kft.                                                     | Fuvarozók             | TRANS-SPED
 TÓTH FRIGO                                                          | Fuvarozók             | TÓTH FRIGO
 VEGACANADA                                                          | (Reference) Szállítók | VEGACANADA
 VERMION                                                             | (Reference) Szállítók | VERMION
 VERMION                                                             | Fuvarozók             | VERMION
 WRAPPING                                                            | (Reference) Szállítók | WRAPPING
`;

async function main() {
  // Parse DO records
  const doRecords = rawDoText
    .trim()
    .split('\n')
    .filter(line => line.includes('|'))
    .map(line => {
      const parts = line.split('|').map(p => p.trim());
      return { partner: parts[0], role: parts[1], value: parts[2] };
    });

  // Query Local DB
  const localDbRecords = await db('partner_identifiers as pi')
    .join('partners as p', 'pi.partner_id', 'p.id')
    .where('pi.is_inactive', false)
    .whereIn('pi.id_type', ['(Reference) Szállítók', 'Fuvarozók', 'Vevők', 'Customer'])
    .select('p.name as partner', 'pi.id_type as role', 'pi.value as value')
    .orderBy('p.name', 'asc')
    .orderBy('pi.id_type', 'asc')
    .orderBy('pi.value', 'asc');

  console.log(`=== ÖSSZEHASONLÍTÁS EREDMÉNYE ===`);
  console.log(`DO Szerveren lévő rekordok száma: ${doRecords.length}`);
  console.log(`Lokális adatbázisban lévő rekordok száma: ${localDbRecords.length}\n`);

  // Helper key string function
  const makeKey = (r) => `${r.partner.toUpperCase()} | ${r.role} | ${r.value.toUpperCase()}`;

  const doKeys = new Set(doRecords.map(makeKey));
  const localKeys = new Set(localDbRecords.map(makeKey));

  const missingLocally = doRecords.filter(r => !localKeys.has(makeKey(r)));
  const missingOnDO = localDbRecords.filter(r => !doKeys.has(makeKey(r)));

  console.log(`--- DO-n megvan, de a LOKÁLISBÓL hiányzik (${missingLocally.length} db) ---`);
  if (missingLocally.length === 0) {
    console.log('Nincs ilyen!');
  } else {
    missingLocally.forEach(r => console.log(`  + ${r.partner} | ${r.role} | ${r.value}`));
  }

  console.log(`\n--- Lokálisan megvan, de a DO-ról hiányzik (${missingOnDO.length} db) ---`);
  if (missingOnDO.length === 0) {
    console.log('Nincs ilyen!');
  } else {
    missingOnDO.forEach(r => console.log(`  - ${r.partner} | ${r.role} | ${r.value}`));
  }

  process.exit(0);
}

main();
