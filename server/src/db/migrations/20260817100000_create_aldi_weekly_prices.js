/**
 * Migration: Create ALDI Weekly Prices tables
 * - aldi_weekly_prices: Heti árlisták nyilvántartása (év, KW szám, fájl elérési út)
 * - aldi_weekly_price_lines: Az XLSX-ből kinyert sorok (GTIN, ár, időszak stb.)
 * - aldi_price_currency_periods: Deviza időszakok soronként
 */
exports.up = async function(knex) {
  // 1. Heti árlisták fejlécei
  const hasWeeklyPrices = await knex.schema.hasTable('aldi_weekly_prices');
  if (!hasWeeklyPrices) {
    await knex.schema.createTable('aldi_weekly_prices', table => {
      table.increments('id').primary();
      table.integer('year').notNullable();                    // pl. 2026
      table.string('week_code', 10).notNullable();           // pl. 'KW33'
      table.integer('week_number').notNullable();            // pl. 33
      table.text('xlsx_file_path');                          // hálózati elérési út a fájlhoz
      table.text('network_folder_path');                     // hálózati mappa elérési útja
      table.timestamps(true, true);
      table.unique(['year', 'week_code']);
    });
  }

  // 2. Heti árlista sorok (XLSX kinyert adatok)
  const hasPriceLines = await knex.schema.hasTable('aldi_weekly_price_lines');
  if (!hasPriceLines) {
    await knex.schema.createTable('aldi_weekly_price_lines', table => {
      table.increments('id').primary();
      table.integer('weekly_price_id')
        .notNullable()
        .references('id')
        .inTable('aldi_weekly_prices')
        .onDelete('CASCADE');
      table.integer('chain_product_id')
        .nullable()
        .references('id')
        .inTable('chain_products')
        .onDelete('SET NULL');          // GTIN match → melyik chain_products rekord
      table.string('xlsx_product_name', 255);               // XLSX eredeti terméknév
      table.string('gtin', 50);                             // Rendelési GTIN
      table.integer('carton_content');                      // Kartontartalom
      table.text('origin');                                 // Származás (lehet többsoros)
      table.text('packaging');                              // Szállítási csomagolás
      table.string('crate_cost', 100);                     // Rekeszköltség (str: "€14,5000 DDP")
      table.string('unit_cost', 100);                      // Egységköltség (str: "€1,4500 DDP")
      table.date('delivery_period_start');                  // Szállítási időszak kezdete
      table.date('delivery_period_end');                    // Szállítási időszak vége
      table.string('delivery_period_raw', 200);            // Eredeti szöveg ("Sze 2026.08.12 - K 2026.08.25")
      table.boolean('is_gtin_matched').defaultTo(false);   // true = sikerült beazonosítani
      table.integer('row_order').defaultTo(0);             // Sorrend az XLSX-ben
      table.timestamps(true, true);
    });
  }

  // 3. Deviza időszakok soronként
  const hasCurrencyPeriods = await knex.schema.hasTable('aldi_price_currency_periods');
  if (!hasCurrencyPeriods) {
    await knex.schema.createTable('aldi_price_currency_periods', table => {
      table.increments('id').primary();
      table.integer('price_line_id')
        .notNullable()
        .references('id')
        .inTable('aldi_weekly_price_lines')
        .onDelete('CASCADE');
      table.string('currency_code', 10).notNullable();   // pl. 'EUR', 'HUF'
      table.date('period_start').notNullable();
      table.date('period_end').notNullable();
      table.text('note');
      table.timestamps(true, true);
    });
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('aldi_price_currency_periods');
  await knex.schema.dropTableIfExists('aldi_weekly_price_lines');
  await knex.schema.dropTableIfExists('aldi_weekly_prices');
};
