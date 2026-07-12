exports.up = async function(knex) {
  // 1. Keresd meg a fő (legelső aktív) AGROPONIENTE partnert
  const mainPartner = await knex('partners')
    .whereRaw('UPPER(name) = ?', ['AGROPONIENTE'])
    .where('is_active', true)
    .orderBy('id', 'asc')
    .first();

  if (!mainPartner) {
    console.log('Nem található aktív AGROPONIENTE partner, a migrációt kihagyjuk.');
    return;
  }

  const mainId = mainPartner.id;
  console.log(`Fő AGROPONIENTE partner ID: ${mainId}`);

  // 2. Keresd meg az összes többi AGROPONIENTE-vel kezdődő partner ID-t (aktív és inaktív is)
  const duplicatePartners = await knex('partners')
    .whereRaw('UPPER(name) LIKE ?', ['AGROPONIENTE%'])
    .whereNot('id', mainId);

  const duplicateIds = duplicatePartners.map(p => p.id);

  if (duplicateIds.length > 0) {
    // 3. Frissítsd a shipment_lines táblát
    const updatedLines = await knex('shipment_lines')
      .whereIn('partner_id', duplicateIds)
      .update({ partner_id: mainId });
    console.log(`Frissítve ${updatedLines} sor a shipment_lines táblában.`);

    // 4. Frissítsd a product_demands táblát
    const updatedDemands = await knex('product_demands')
      .whereIn('partner_id', duplicateIds)
      .update({ partner_id: mainId });
    console.log(`Frissítve ${updatedDemands} sor a product_demands táblában.`);

    // 5. Deaktiváld a duplikált partnereket, és jelöld meg őket a nevükben is a követhetőség miatt
    for (const p of duplicatePartners) {
      await knex('partners')
        .where('id', p.id)
        .update({
          is_active: false,
          name: p.name + ' (MERGED TO ID ' + mainId + ')'
        });
    }
    console.log('Duplikált partnerek deaktiválva és megjelölve.');
  }
};

exports.down = async function(knex) {
  // A down-ban nem tudjuk automatikusan visszaállítani az eredeti ID-kat, 
  // mert nem mentettük el a sorok szintjén, hogy melyik sor melyik duplikált partnerhez tartozott.
  // De a json biztonsági mentésből visszaállítható szükség esetén.
};
