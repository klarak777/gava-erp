exports.up = async function(knex) {
  await knex.schema.alterTable('aldi_truck_lines', table => {
    table.string('partner').nullable();
    table.string('destination').nullable();
    table.decimal('gross_weight', 10, 2).nullable();
    table.decimal('net_weight', 10, 2).nullable();
    table.string('packaging_type').nullable();
    table.decimal('tare_weight', 10, 2).nullable();
    table.string('origin_country').nullable();
    table.string('lot_number').nullable();
    table.string('pallet_type').nullable();
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('aldi_truck_lines', table => {
    table.dropColumns(
      'partner',
      'destination',
      'gross_weight',
      'net_weight',
      'packaging_type',
      'tare_weight',
      'origin_country',
      'lot_number',
      'pallet_type'
    );
  });
};
