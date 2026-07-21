/**
 * Migration 036: Fix Kopfsalat partner split on production DB
 */

exports.up = async function(knex) {
  console.log('Running migration 036: Fix Kopfsalat split');

  // 1. Find partner with EU tax ID ESB60713880 or identifier ESB60713880
  const euIdent = await knex('partner_identifiers')
    .where('value', 'ESB60713880')
    .first();

  let targetId = euIdent ? euIdent.partner_id : null;

  if (!targetId) {
    const p5 = await knex('partners').where('id', 5).first();
    if (p5) targetId = 5;
  }

  if (targetId) {
    // Fix the EU partner (KOPFSALAT TRADE SL.)
    await knex('partners').where('id', targetId).update({
      name: 'KOPFSALAT TRADE SL.',
      invoice_name: 'KOPFSALAT TRADE SL.',
      tax_id: ''
    });

    // Remove Hungarian tax_id from identifiers for this partner
    await knex('partner_identifiers')
      .where('partner_id', targetId)
      .andWhere('id_type', 'Adószám')
      .del();

    console.log(`Updated partner ${targetId} to KOPFSALAT TRADE SL. (cleared Hungarian tax_id)`);
  }

  // 2. Check if 'Kopfsalat Trade Sl' with tax_id '30528949-2-51' exists
  const existingHuPartner = await knex('partners')
    .where('tax_id', '30528949-2-51')
    .first();

  if (!existingHuPartner) {
    const [inserted] = await knex('partners').insert({
      name: 'Kopfsalat Trade Sl',
      invoice_name: 'Kopfsalat Trade Sl',
      tax_id: '30528949-2-51',
      country: 'HU',
      zip: '08040',
      city: 'Barcelona',
      street_name: 'Calle Longitudinal 9 Mercabarna Num 91',
      is_active: true
    }).returning('id');

    const newId = typeof inserted === 'object' ? inserted.id : inserted;

    await knex('partner_sites').insert({
      partner_id: newId,
      name: 'Székhely',
      country: 'HU',
      zip: '08040',
      city: 'Barcelona',
      street_name: 'Calle Longitudinal 9 Mercabarna Num 91',
      is_same_as_hq: true
    });

    await knex('partner_identifiers').insert({
      partner_id: newId,
      id_type: 'Adószám',
      value: '30528949-2-51'
    });

    console.log(`Created separate partner Kopfsalat Trade Sl (id: ${newId}) with tax_id 30528949-2-51`);
  }
};

exports.down = async function(knex) {
};
