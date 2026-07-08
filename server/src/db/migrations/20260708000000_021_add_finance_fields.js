/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('finance_truck_types', table => {
      table.increments('id').primary();
      table.string('name').notNullable(); // e.g. "Normal", "Special"
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .table('products', table => {
      table.string('code'); // Code Prod, e.g. "OAP"
    })
    .table('shipments', table => {
      table.string('price_trance_toll');
      table.decimal('overhead_percent', 5, 2);
      table.string('goods_currency').defaultTo('EUR');
      table.decimal('exchange_rate', 14, 4); // ExchRt
      table.integer('finance_truck_type_id').unsigned().references('id').inTable('finance_truck_types').onDelete('SET NULL');
      table.string('supplier_name'); // For "Supplier"
      table.string('finance_status').defaultTo('Open'); // Open / Close
      table.date('finance_date'); // Date of creation/finance
      table.text('finance_comments'); // Comments
    })
    .table('shipment_lines', table => {
      table.decimal('boxes', 10, 2);
      table.decimal('kgs_finance', 10, 2); // Separated from gross_weight_kg for finance
      table.decimal('unit_price', 14, 2); // Unit Pr
      table.decimal('net_amount', 14, 2); // Netto Amnt
      table.decimal('unit_price_a', 14, 2); // Un Pr A
      table.decimal('tax_percent', 5, 2); // TpTAX (0, 27, etc)
      table.decimal('amount_a_bt', 14, 2); // AmountA BT
      table.decimal('tax_amount', 14, 2); // TAX
      table.decimal('amount_a', 14, 2); // AmountA
      table.string('description_finance'); // Description
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .table('shipment_lines', table => {
      table.dropColumn('boxes');
      table.dropColumn('kgs_finance');
      table.dropColumn('unit_price');
      table.dropColumn('net_amount');
      table.dropColumn('unit_price_a');
      table.dropColumn('tax_percent');
      table.dropColumn('amount_a_bt');
      table.dropColumn('tax_amount');
      table.dropColumn('amount_a');
      table.dropColumn('description_finance');
    })
    .table('shipments', table => {
      table.dropColumn('price_trance_toll');
      table.dropColumn('overhead_percent');
      table.dropColumn('goods_currency');
      table.dropColumn('exchange_rate');
      table.dropForeign('finance_truck_type_id');
      table.dropColumn('finance_truck_type_id');
      table.dropColumn('supplier_name');
      table.dropColumn('finance_status');
      table.dropColumn('finance_date');
      table.dropColumn('finance_comments');
    })
    .table('products', table => {
      table.dropColumn('code');
    })
    .dropTableIfExists('finance_truck_types');
};
