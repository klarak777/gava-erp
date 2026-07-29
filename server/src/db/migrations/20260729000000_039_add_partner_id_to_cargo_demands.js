exports.up = async function (knex) {
  // 1. Add partner_id column
  await knex.schema.alterTable('cargo_demands', table => {
    table.integer('partner_id').unsigned().nullable();
    table.foreign('partner_id').references('partners.id').onDelete('SET NULL');
  });

  // 2. Data migration: attempt to populate partner_id based on existing partner_name
  // We use a similar COALESCE logic: find partner by name or by partner_identifiers value
  const demands = await knex('cargo_demands').whereNotNull('partner_name').select('id', 'partner_name');
  
  for (const demand of demands) {
    const partner = await knex('partners')
      .leftJoin('partner_identifiers', 'partners.id', 'partner_identifiers.partner_id')
      .whereRaw('LOWER(partners.name) = ?', [demand.partner_name.toLowerCase()])
      .orWhereRaw('LOWER(partner_identifiers.value) = ?', [demand.partner_name.toLowerCase()])
      .select('partners.id')
      .first();

    if (partner) {
      await knex('cargo_demands')
        .where('id', demand.id)
        .update({ partner_id: partner.id });
    }
  }
};

exports.down = async function (knex) {
  await knex.schema.alterTable('cargo_demands', table => {
    table.dropForeign('partner_id');
    table.dropColumn('partner_id');
  });
};
