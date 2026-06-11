const bcrypt = require('bcryptjs');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('product_demands').del();
  await knex('ekaer_records').del();
  await knex('transport_orders').del();
  await knex('loading_events').del();
  await knex('shipment_lines').del();
  await knex('shipments').del();
  await knex('pallet_conversion').del();
  await knex('users').del();
  await knex('partners').del();
  await knex('products').del();
  await knex('transporters').del();
  await knex('seasons').del();

  // 1. Seasons
  await knex('seasons').insert([
    { id: 1, code: '19-20', start_date: '2019-09-01', end_date: '2020-08-31' },
    { id: 2, code: '20-21', start_date: '2020-09-01', end_date: '2021-08-31' },
    { id: 3, code: '21-22', start_date: '2021-09-01', end_date: '2022-08-31' },
    { id: 4, code: '22-23', start_date: '2022-09-01', end_date: '2023-08-31' },
    { id: 5, code: '23-24', start_date: '2023-09-01', end_date: '2024-08-31' },
    { id: 6, code: '24-25', start_date: '2024-09-01', end_date: '2025-08-31' },
    { id: 7, code: '25-26', start_date: '2025-09-01', end_date: '2026-08-31' }
  ]);

  // 2. Transporters
  await knex('transporters').insert([
    { name: 'BILEK', code: 'BIL' },
    { name: 'BOGNÁR', code: 'BOG' },
    { name: 'HANKA', code: 'HAN' },
    { name: 'KÁDÁR', code: 'KAD' },
    { name: 'KERMOR', code: 'KER' },
    { name: 'KÓNYA', code: 'KON' },
    { name: 'KUSEK', code: 'KUS' },
    { name: 'MK FRESH', code: 'MKF' },
    { name: 'RONI', code: 'RON' },
    { name: 'STI', code: 'STI' },
    { name: 'GARTNER', code: 'GAR' },
    { name: 'WABERERS', code: 'WAB' }
  ]);

  // 3. Users (Default Admin)
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash('admin123', salt);
  await knex('users').insert([
    { 
      username: 'admin', 
      password_hash: password_hash, 
      full_name: 'System Administrator', 
      role: 'Admin', 
      is_active: true 
    }
  ]);

  // 4. Pallet Conversion Table
  const conversionData = [
    { normal_count: 1, euro_equivalent: 1 },
    { normal_count: 2, euro_equivalent: 3 },
    { normal_count: 3, euro_equivalent: 4 },
    { normal_count: 4, euro_equivalent: 5 },
    { normal_count: 5, euro_equivalent: 6 },
    { normal_count: 6, euro_equivalent: 8 },
    { normal_count: 7, euro_equivalent: 9 },
    { normal_count: 8, euro_equivalent: 10 },
    { normal_count: 9, euro_equivalent: 11 },
    { normal_count: 10, euro_equivalent: 13 },
    { normal_count: 11, euro_equivalent: 14 },
    { normal_count: 12, euro_equivalent: 15 },
    { normal_count: 13, euro_equivalent: 16 },
    { normal_count: 14, euro_equivalent: 18 },
    { normal_count: 15, euro_equivalent: 19 },
    { normal_count: 16, euro_equivalent: 20 },
    { normal_count: 17, euro_equivalent: 21 },
    { normal_count: 18, euro_equivalent: 23 },
    { normal_count: 19, euro_equivalent: 24 },
    { normal_count: 20, euro_equivalent: 25 },
    { normal_count: 21, euro_equivalent: 26 },
    { normal_count: 22, euro_equivalent: 28 },
    { normal_count: 23, euro_equivalent: 29 },
    { normal_count: 24, euro_equivalent: 30 },
    { normal_count: 25, euro_equivalent: 31 },
    { normal_count: 26, euro_equivalent: 33 }
  ];
  await knex('pallet_conversion').insert(conversionData);
};
