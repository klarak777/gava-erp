exports.up = async function(knex) {
  console.log('--- Indul a 027_cleanup_and_sync_partners migráció ---');

  // 1. Kézi összevonás: AGRPONIENTE (53) -> AGROPONIENTE (27)
  const manualDups = [53];
  for (const dupId of manualDups) {
    await knex('shipment_lines').where('partner_id', dupId).update({ partner_id: 27 });
    await knex('product_demands').where('partner_id', dupId).update({ partner_id: 27 });
    await knex('finance_transport_lines').where('partner_id', dupId).update({ partner_id: 27 });
    await knex('partners').where('id', dupId).del();
  }

  // 2. Automatikus összevonás pontos név egyezés alapján
  const dupsQuery = await knex('partners')
    .select('name')
    .count('id as c')
    .groupBy('name')
    .having(knex.raw('count(id) > 1'));

  for (const row of dupsQuery) {
    const records = await knex('partners').where('name', row.name).orderBy('id', 'asc');
    if (records.length <= 1) continue;

    const mainId = records[0].id;
    const dupIds = records.slice(1).map(r => r.id);

    for (const dupId of dupIds) {
      await knex('shipment_lines').where('partner_id', dupId).update({ partner_id: mainId });
      await knex('product_demands').where('partner_id', dupId).update({ partner_id: mainId });
      await knex('finance_transport_lines').where('partner_id', dupId).update({ partner_id: mainId });
    }
    await knex('partners').whereIn('id', dupIds).del();
  }

  // 3. Kézi összevonás: EUROGROUP DEUTSCHLAND duplikátumok -> EUROGROUP DE (78)
  const euroDups = [10, 58, 72, 296, 339];
  // Csak azokat dolgozzuk fel, amik még léteznek (ha többször futna a migráció)
  const existingEuroDups = await knex('partners').whereIn('id', euroDups);
  if (existingEuroDups.length > 0) {
    const existingEuroDupIds = existingEuroDups.map(r => r.id);
    for (const dupId of existingEuroDupIds) {
      await knex('shipment_lines').where('partner_id', dupId).update({ partner_id: 78 });
      await knex('product_demands').where('partner_id', dupId).update({ partner_id: 78 });
      await knex('finance_transport_lines').where('partner_id', dupId).update({ partner_id: 78 });
    }
    await knex('partners').whereIn('id', existingEuroDupIds).del();
  }

  // 4. Fuzzy duplikátumok törlése
  const partners = await knex('partners').select('id', 'name').orderBy('id', 'asc');
  
  const normalize = (name) => {
    if (!name) return '';
    let n = name.toUpperCase()
      .replace(/[\.,\-\/]/g, '')
      .replace(/\s+/g, '')
      .replace(/KFT$/g, '')
      .replace(/GMBH$/g, '')
      .replace(/SL$/g, '')
      .replace(/LTD$/g, '')
      .replace(/SPA$/g, '')
      .replace(/SRL$/g, '')
      .replace(/INC$/g, '')
      .replace(/CO$/g, '');
    if (n.endsWith('S') && !n.endsWith('SS')) {
      n = n.substring(0, n.length - 1);
    }
    return n;
  };

  const groups = {};
  for (const p of partners) {
    const norm = normalize(p.name);
    if (!groups[norm]) groups[norm] = [];
    groups[norm].push(p);
  }

  for (const norm in groups) {
    if (groups[norm].length > 1) {
      const records = groups[norm].sort((a, b) => a.id - b.id);
      const mainId = records[0].id;
      const dupIds = records.slice(1).map(r => r.id);

      for (const dupId of dupIds) {
        await knex('shipment_lines').where('partner_id', dupId).update({ partner_id: mainId });
        await knex('product_demands').where('partner_id', dupId).update({ partner_id: mainId });
        await knex('finance_transport_lines').where('partner_id', dupId).update({ partner_id: mainId });
      }
      await knex('partners').whereIn('id', dupIds).del();
    }
  }

  // 5. Fuvarozók szinkronizálása
  const transporters = await knex('transporters').select('id', 'name').orderBy('name');
  const allPartners = await knex('partners').select('id', 'name', 'type');

  const normalizePartner = (name) => {
    if (!name) return '';
    return name.toUpperCase().replace(/\s+/g, ' ').trim();
  };

  const partnerMap = new Map();
  for (const p of allPartners) {
    partnerMap.set(normalizePartner(p.name), p);
  }

  for (const t of transporters) {
    const normT = normalizePartner(t.name);
    let partner = partnerMap.get(normT);

    if (!partner && normT.length >= 4) {
      for (const [normP, p] of partnerMap) {
        if (normP.length < 4) continue;
        if (normT === normP || normT.startsWith(normP + ' ') || normP.startsWith(normT + ' ')) {
          partner = p;
          break;
        }
      }
    }

    if (partner) {
      await knex('partners').where('id', partner.id).update({ type: 'fuvarozó' });
    } else {
      await knex('partners').insert({
        name: t.name,
        type: 'fuvarozó',
        is_active: true,
        is_inactive: false,
        is_natural_person: false,
      });
    }
  }

  console.log('--- 027 migráció befejeződött ---');
};

exports.down = async function(knex) {
  // A down ágat üresen hagyjuk, mivel az adatbázis tisztítás visszafordíthatatlan adatvesztés (duplikátumok törlése) nélkül
};
