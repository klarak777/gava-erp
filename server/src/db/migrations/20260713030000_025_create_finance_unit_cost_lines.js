exports.up = async function(knex) {
  await knex.schema.createTable('finance_unit_cost_lines', table => {
    table.increments('id').primary();
    table.integer('shipment_id').unsigned().references('id').inTable('shipments').onDelete('CASCADE');
    table.string('ref_name', 200);
    table.integer('line_order').defaultTo(0);
    table.integer('product_id').unsigned().references('id').inTable('products').onDelete('SET NULL');
    table.text('description');
    table.decimal('netto_kgs', 14, 2).defaultTo(0);
    table.decimal('kgs_per_box', 10, 4).defaultTo(0);
    table.decimal('price_per_kg', 14, 4).defaultTo(0);
    table.decimal('trans_per_kg', 14, 4).defaultTo(0);
    table.decimal('v_cost_per_kg', 14, 4).defaultTo(0);
    table.decimal('oh_per_kg', 14, 4).defaultTo(0);
    table.decimal('tot_cost_per_kg', 14, 4).defaultTo(0);
    table.decimal('vat_per_kg', 14, 4).defaultTo(0);
    table.decimal('tot_cost_per_box', 14, 4).defaultTo(0);
    table.decimal('vat_per_box', 14, 4).defaultTo(0);
    table.decimal('v_cost_per_kg_eur', 14, 6).defaultTo(0);
    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('finance_unit_cost_lines');
};
