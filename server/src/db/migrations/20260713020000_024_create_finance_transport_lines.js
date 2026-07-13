exports.up = async function(knex) {
  await knex.schema.createTable('finance_transport_lines', table => {
    table.increments('id').primary();
    table.integer('shipment_id').unsigned().references('id').inTable('shipments').onDelete('CASCADE');
    table.string('ref_name', 200);       // alfuvar neve (pl. SOLHERBS, AGROPONIENTE)
    table.integer('line_order').defaultTo(0);
    table.date('date_entry');
    table.string('type_supp', 100);      // TypeSupp: Transport, Other stb.
    table.integer('partner_id').unsigned().references('id').inTable('partners').onDelete('SET NULL');
    table.string('invoice_number', 100);
    table.string('type_a', 20);          // TypeA: A, B stb.
    table.text('description');
    table.decimal('amount', 14, 2).defaultTo(0);
    table.decimal('tax_percent', 6, 3).defaultTo(0);
    table.decimal('tax_amount', 14, 2).defaultTo(0);
    table.decimal('tot_invoice', 14, 2).defaultTo(0);
    table.integer('currency_id').unsigned().references('id').inTable('currencies').onDelete('SET NULL');
    table.decimal('exchange_rate', 12, 4).defaultTo(0);
    table.decimal('total_inv_local', 16, 2).defaultTo(0);
    table.string('id_empr', 50);         // GHU / Customer értékéből
    table.string('season', 20);
    table.string('truck_nr', 50);
    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('finance_transport_lines');
};
