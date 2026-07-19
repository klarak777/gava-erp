/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Migrate old transporter short codes to partner_identifiers
  const transporters = await knex('transporters').select('name', 'code').whereNotNull('code');
  const partners = await knex('partners').select('id', 'name');

  const normalizePartner = (name) => {
    if (!name) return '';
    return name.toUpperCase().replace(/\s+/g, ' ').trim();
  };

  const partnerMap = new Map();
  for (const p of partners) {
    partnerMap.set(normalizePartner(p.name), p.id);
  }

  for (const t of transporters) {
    if (!t.code) continue;
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
      // Check if already exists
      const existing = await knex('partner_identifiers')
        .where('partner_id', partnerId)
        .andWhere('id_type', 'Fuvarozók')
        .first();
        
      if (!existing) {
        await knex('partner_identifiers').insert({
          partner_id: partnerId,
          id_type: 'Fuvarozók',
          value: t.code,
          is_verified: false,
          checked_by: ''
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
  await knex('partner_identifiers').where('id_type', 'Fuvarozók').delete();
};
