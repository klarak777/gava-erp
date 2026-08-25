exports.up = async function(knex) {
  await knex.schema.createTable('aldi_commission_lines', table => {
    table.increments('id').primary();
    table.integer('aldi_truck_id').unsigned().notNullable()
      .references('id').inTable('aldi_trucks').onDelete('CASCADE');
    
    table.string('product_name').notNullable();
    table.integer('cartons').notNullable().defaultTo(0);
    table.decimal('gross_weight', 10, 2).nullable();
    table.decimal('net_weight', 10, 2).nullable();
    table.decimal('average_weight', 10, 2).nullable();
    table.decimal('pallets', 10, 2).nullable();
    
    table.string('origin_country').nullable();
    table.string('carton_type').nullable();
    table.decimal('tare_weight', 10, 2).nullable();
    table.string('pallet_type').nullable();
    table.string('lot_number').nullable();
    
    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('aldi_commission_lines');
};
