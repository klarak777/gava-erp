/**
 * Migration: Create chain_products table for retail chain product mappings (ALDI, SPAR, PENNY, TESCO)
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const exists = await knex.schema.hasTable('chain_products');
  if (!exists) {
    await knex.schema.createTable('chain_products', table => {
      table.increments('id').primary();
      table.string('chain', 50).notNullable().defaultTo('ALDI').index();
      table.string('product_name', 255).notNullable();
      table.string('article_number', 100);
      table.string('gtin', 50);
      table.string('ean', 50);
      table.string('label', 255);
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    });
  }

  // Seed initial ALDI products
  const initialAldiProducts = [
    { article_number: '330166', product_name: 'Nektarin 7kg', gtin: '4061462848056', ean: '', label: '', chain: 'ALDI' },
    { article_number: '330171', product_name: 'Nektarin 10*1kg', gtin: '4061462848001', ean: '', label: '', chain: 'ALDI' },
    { article_number: '329885', product_name: 'Őszibarack 7kg', gtin: '4061462851506', ean: '', label: '', chain: 'ALDI' },
    { article_number: '330173', product_name: 'Őszibarack 10*1kg', gtin: '4061462847981', ean: '', label: '', chain: 'ALDI' },
    { article_number: '330167', product_name: 'Sárgabarack 5kg', gtin: '4061462848049', ean: '', label: '', chain: 'ALDI' },
    { article_number: '330117', product_name: 'Sárgabarack 10*500g', gtin: '4061462848544', ean: '', label: '', chain: 'ALDI' },
    { article_number: '330165', product_name: 'Lapos barack 5kg', gtin: '4061462848704', ean: '', label: '', chain: 'ALDI' },
    { article_number: '530766', product_name: 'Körte Limonera 12kg', gtin: '4061459877144', ean: '', label: '', chain: 'ALDI' },
    { article_number: '597477', product_name: 'Petrezselyem 10*100g', gtin: '4061462789717', ean: '', label: '', chain: 'ALDI' },
    { article_number: '666998', product_name: 'Kapor 6*100g', gtin: '4061463554338', ean: '', label: '', chain: 'ALDI' },
    { article_number: '330088', product_name: 'Fürtös uborka 5kg', gtin: '4061462846892', ean: '', label: '', chain: 'ALDI' },
    { article_number: '687493', product_name: 'Cukkini 10kg', gtin: '4069365093832', ean: '', label: '', chain: 'ALDI' },
    { article_number: '658525', product_name: 'Padlizsán 6kg', gtin: '4061463243454', ean: '', label: '', chain: 'ALDI' },
    { article_number: '768144', product_name: 'Fokhagyma 5kg', gtin: '4069366402930', ean: '', label: '', chain: 'ALDI' },
    { article_number: '329758', product_name: 'Paprika Palermo 12*300g', gtin: '4061462850196', ean: '', label: '', chain: 'ALDI' },
    { article_number: '279530', product_name: 'Kalif Piros 5kg', gtin: '4061461995188', ean: '', label: '', chain: 'ALDI' }
  ];

  for (const item of initialAldiProducts) {
    const existing = await knex('chain_products')
      .where({ chain: item.chain, article_number: item.article_number })
      .first();

    if (!existing) {
      await knex('chain_products').insert({
        ...item,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('chain_products');
};
