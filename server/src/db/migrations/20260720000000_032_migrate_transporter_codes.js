/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Migrate old transporter short codes (name) to partner_identifiers
  const transporters = await knex('transporters').select('name', 'code').whereNotNull('name');
  const partners = await knex('partners').select('id', 'name', 'type');

  const normalizePartner = (name) => {
    if (!name) return '';
    return name.toUpperCase().replace(/\s+/g, ' ').trim();
  };

  const partnerMap = new Map();
  for (const p of partners) {
    partnerMap.set(normalizePartner(p.name), p.id);
  }

  // 1. Fuvarozók
  for (const t of transporters) {
    if (!t.name) continue;
    const normT = normalizePartner(t.name);
    let partnerId = partnerMap.get(normT);

    if (!partnerId && normT.length >= 4) {
      for (const [normP, pId] of partnerMap) {
        if (normP.length < 4) continue;
        if (normT === normP || normT.startsWith(normP + ' ') || normP.startsWith(normT + ' ')) {
          partnerId = pId;
          break;
        }
      }
    }

    if (partnerId) {
      const existing = await knex('partner_identifiers')
        .where('partner_id', partnerId)
        .andWhere('id_type', 'Fuvarozók')
        .first();
        
      if (!existing) {
        await knex('partner_identifiers').insert({
          partner_id: partnerId,
          id_type: 'Fuvarozók',
          value: t.name, // The user wants the FULL short name (e.g. "KÓNYA" instead of "KON")
          is_verified: false,
          checked_by: ''
        });
      }
    }
  }

  // 2. (Reference) Szállítók & (Customer) Vevők
  // We populate them from their current names if they don't have one yet.
  for (const p of partners) {
    if (p.type === 'szállító') {
      const existing = await knex('partner_identifiers').where({ partner_id: p.id, id_type: '(Reference) Szállítók' }).first();
      if (!existing) {
        await knex('partner_identifiers').insert({
          partner_id: p.id,
          id_type: '(Reference) Szállítók',
          value: p.name,
          is_verified: false, checked_by: ''
        });
      }
    } else if (p.type === 'vevő') {
      const existing = await knex('partner_identifiers').where({ partner_id: p.id, id_type: '(Customer) Vevők' }).first();
      if (!existing) {
        await knex('partner_identifiers').insert({
          partner_id: p.id,
          id_type: '(Customer) Vevők',
          value: p.name,
          is_verified: false, checked_by: ''
        });
      }
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex('partner_identifiers').whereIn('id_type', ['Fuvarozók', '(Reference) Szállítók', '(Customer) Vevők']).delete();
};
