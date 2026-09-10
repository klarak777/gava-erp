exports.up = async function(knex) {
  // 1. Heti lekötés fő tábla
  await knex.schema.createTable('aldi_weekly_commitments', table => {
    table.increments('id').primary();
    table.integer('year').notNullable();
    table.integer('week_number').notNullable();
    table.string('week_str').notNullable(); // pl. KW36 (2026)
    table.string('normal_file_path').nullable(); // Normál rendelési terv
    table.string('action_file_path').nullable(); // Akciós rendelési terv
    table.timestamps(true, true);
    
    // Egy év/hét kombinációhoz csak egy lekötés tartozik
    table.unique(['year', 'week_number']);
  });

  // 2. Heti lekötés tételek tábla (az Excelből kiolvasott nyers adatok)
  await knex.schema.createTable('aldi_weekly_commitment_items', table => {
    table.increments('id').primary();
    table.integer('commitment_id').unsigned().references('id').inTable('aldi_weekly_commitments').onDelete('CASCADE');
    table.integer('product_id').unsigned().references('id').inTable('products').onDelete('SET NULL');
    table.enum('type', ['normal', 'action']).notNullable();
    table.string('display_name').notNullable(); // Cikkszám / Termék neve az Excelből
    table.string('action_period').nullable(); // Akciós időszak szöveg pl "Szer. Csüt."
    table.decimal('total_forecast_cartons', 10, 2).notNullable(); // KWxx oszlop értéke
    table.timestamps(true, true);
  });

  // 3. Felhasználó által megadott készletadatok (Raktárkészlet és Érkező)
  await knex.schema.createTable('aldi_weekly_stock_inputs', table => {
    table.increments('id').primary();
    table.integer('product_id').unsigned().references('id').inTable('products').onDelete('CASCADE');
    table.integer('year').notNullable();
    table.integer('week_number').notNullable();
    
    table.decimal('initial_stock', 10, 2).defaultTo(0); // Raktárkészlet
    
    // Napi érkező mennyiségek
    table.decimal('inc_wed', 10, 2).defaultTo(0);
    table.decimal('inc_thu', 10, 2).defaultTo(0);
    table.decimal('inc_fri', 10, 2).defaultTo(0);
    table.decimal('inc_sat', 10, 2).defaultTo(0);
    table.decimal('inc_sun', 10, 2).defaultTo(0);
    table.decimal('inc_mon', 10, 2).defaultTo(0);
    table.decimal('inc_tue', 10, 2).defaultTo(0);
    
    table.timestamps(true, true);
    
    // Egy terméknek egy héten csak egy készlet sora lehet
    table.unique(['product_id', 'year', 'week_number']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('aldi_weekly_stock_inputs');
  await knex.schema.dropTableIfExists('aldi_weekly_commitment_items');
  await knex.schema.dropTableIfExists('aldi_weekly_commitments');
};
