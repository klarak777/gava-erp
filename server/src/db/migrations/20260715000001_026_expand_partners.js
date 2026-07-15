/**
 * Migration 026: Expand partners table with detailed fields
 * and create all partner sub-tables for the new Partner module.
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Add new columns to existing partners table
  await knex.schema.alterTable('partners', table => {
    // Already existing: id, name, type, address, contact, is_active, created_at, updated_at

    // --- Alapadatok ---
    table.boolean('is_natural_person').defaultTo(false);
    table.boolean('is_inactive').defaultTo(false);
    table.boolean('is_anonymized').defaultTo(false);

    // --- Székhely: Cím ---
    table.boolean('sync_from_moszr').defaultTo(false);
    table.string('invoice_name').nullable();       // Név a bizonylaton
    table.string('country').nullable();            // Ország
    table.string('region').nullable();             // Régió
    table.string('zip').nullable();                // Irányítószám
    table.string('city').nullable();               // Helység
    table.string('district').nullable();           // Kerület
    table.string('street_name').nullable();        // Közterület neve
    table.string('street_type').nullable();        // Jellege (utca, út stb.)
    table.string('street_number').nullable();      // Száma
    table.string('building').nullable();           // Épület
    table.string('staircase').nullable();          // Lépcsőház
    table.string('floor').nullable();              // Emelet
    table.string('door').nullable();               // Ajtó

    // --- Levelezési cím ---
    table.boolean('mailing_same_as_hq').defaultTo(true);
    table.string('mailing_invoice_name').nullable();
    table.string('mailing_country').nullable();
    table.string('mailing_region').nullable();
    table.string('mailing_zip').nullable();
    table.string('mailing_city').nullable();
    table.string('mailing_street_name').nullable();
    table.string('mailing_street_type').nullable();
    table.string('mailing_street_number').nullable();
    table.string('gln').nullable();                // GLN

    // --- Természetes személy adatok ---
    table.string('nat_family_name_prefix').nullable();
    table.string('nat_family_name').nullable();
    table.string('nat_first_name').nullable();
    table.string('nat_prev_family_name_prefix').nullable();
    table.string('nat_prev_family_name').nullable();
    table.string('nat_prev_first_name').nullable();
    // Születési adatok
    table.string('birth_family_name').nullable();
    table.string('birth_first_name').nullable();
    table.string('birth_display_name').nullable();
    table.string('birth_place').nullable();
    date('birth_date', table);
    table.string('gender').nullable();             // nem
    table.string('mothers_family_name').nullable();
    table.string('mothers_first_name').nullable();
    table.string('mothers_display_name').nullable();
    // Személyes azonosítók
    table.string('tax_id').nullable();             // Adóazonosító jel
    table.string('taj').nullable();                // TAJ szám
    table.string('farmer_reg_number').nullable();  // Őstermelői regisztrációs szám
    table.string('farmer_cert_number').nullable(); // Őstermelői igazolvány száma
    table.string('farmer_activity_id').nullable(); // Őstermelői tevékenység azon.
    table.string('family_farm_id').nullable();     // Családi gazdaság azonosítója
    table.boolean('has_compensation_surcharge').defaultTo(false); // Kompenzációs felárra jogosult
    table.string('citizenship').nullable();        // Állampolgárság

    // --- Egyéb adatok (pénzügyi jellegű) ---
    table.string('currency').nullable();           // Deviza (pl. EUR)
    table.string('price_type').nullable();         // Árforma
    table.string('payment_method').nullable();     // Fizetési mód
    table.boolean('has_domestic_tax_num').defaultTo(false);
    table.boolean('has_eu_tax_num').defaultTo(false);
    table.boolean('has_other_tax_num').defaultTo(false);
    table.string('product_tax_code').nullable();   // Termékdíj ügyletkód
    table.string('product_id_type').nullable();    // Termékazonosító
    table.boolean('claims_as_current_account').defaultTo(false);
    table.boolean('invoice_compensation_allowed').defaultTo(false);
    table.boolean('cash_flow_accounting').defaultTo(false);
    table.boolean('late_fee_applicable').defaultTo(false);
    table.boolean('is_kata_taxpayer').defaultTo(false);
    // E-számla
    table.date('einvoice_receive_start').nullable();
    table.date('einvoice_receive_end').nullable();
    table.date('einvoice_send_start').nullable();
    table.date('einvoice_send_end').nullable();
    table.string('edi_provider').nullable();        // EDI/e-számla szolgáltató
    table.string('default_print_mode').defaultTo('system'); // Rendszerbeállítás / Helyi / Távnyomtatás

    // --- Megjegyzés ---
    table.text('notes').nullable();
  });

  // 2. Create partner_sites (Telephelyek)
  await knex.schema.createTable('partner_sites', table => {
    table.increments('id').primary();
    table.integer('partner_id').notNullable().references('id').inTable('partners').onDelete('CASCADE');
    table.string('name').notNullable();
    table.string('country').nullable();
    table.string('zip').nullable();
    table.string('city').nullable();
    table.string('street_name').nullable();
    table.string('street_type').nullable();
    table.string('street_number').nullable();
    table.boolean('is_deleted').defaultTo(false);
    table.timestamps(true, true);
  });

  // 3. Create partner_communications (Elérhetőségek - Székhelyhez vagy Telephelyhez)
  await knex.schema.createTable('partner_communications', table => {
    table.increments('id').primary();
    table.integer('partner_id').notNullable().references('id').inTable('partners').onDelete('CASCADE');
    table.integer('site_id').nullable().references('id').inTable('partner_sites').onDelete('CASCADE'); // null = Székhely
    table.string('channel_type').notNullable(); // pl. Telefon, Email, Fax, Web
    table.string('value').notNullable();
    table.timestamps(true, true);
  });

  // 4. Create partner_contacts (Kapcsolattartók - Székhelyhez vagy Telephelyhez)
  await knex.schema.createTable('partner_contacts', table => {
    table.increments('id').primary();
    table.integer('partner_id').notNullable().references('id').inTable('partners').onDelete('CASCADE');
    table.integer('site_id').nullable().references('id').inTable('partner_sites').onDelete('CASCADE'); // null = Székhely
    table.string('name').notNullable();           // Kapcsolattartó neve
    table.string('title').nullable();             // Titulus
    table.timestamps(true, true);
  });

  // 5. Create partner_agents (Ügynökök)
  await knex.schema.createTable('partner_agents', table => {
    table.increments('id').primary();
    table.integer('partner_id').notNullable().references('id').inTable('partners').onDelete('CASCADE');
    table.date('valid_from').nullable();           // Érvényesség kezdete
    table.date('valid_to').nullable();             // Érvényesség vége
    table.string('agent_name').notNullable();      // Ügynök neve
    table.timestamps(true, true);
  });

  // 6. Create partner_identifiers (Egyéb azonosítók)
  await knex.schema.createTable('partner_identifiers', table => {
    table.increments('id').primary();
    table.integer('partner_id').notNullable().references('id').inTable('partners').onDelete('CASCADE');
    table.string('id_type').notNullable();         // Típus (pl. Adószám, EU adószám)
    table.string('value').notNullable();           // Érték
    table.string('checked_by').nullable();         // Ellenőrizte (É oszlop)
    table.boolean('is_verified').defaultTo(false); // Ellenőrizve
    table.timestamps(true, true);
  });

  // 7. Create partner_characteristics (Jellemzők)
  await knex.schema.createTable('partner_characteristics', table => {
    table.increments('id').primary();
    table.integer('partner_id').notNullable().references('id').inTable('partners').onDelete('CASCADE');
    table.string('characteristic').notNullable(); // Jellemző neve
    table.string('value').nullable();             // Értéke
    table.timestamps(true, true);
  });

  // 8. Create partner_restrictions (Korlátozások)
  await knex.schema.createTable('partner_restrictions', table => {
    table.increments('id').primary();
    table.integer('partner_id').notNullable().references('id').inTable('partners').onDelete('CASCADE');
    table.string('operation_name').notNullable(); // Művelet megnevezése
    table.date('ban_start').nullable();           // Tiltás kezdete
    table.timestamps(true, true);
  });

  // 9. Create partner_categories (Kategóriák)
  await knex.schema.createTable('partner_categories', table => {
    table.increments('id').primary();
    table.integer('partner_id').notNullable().references('id').inTable('partners').onDelete('CASCADE');
    table.string('category').notNullable();       // Kategória neve
    table.timestamps(true, true);
  });

  // 10. Create partner_bank_accounts (Bankszámlák)
  await knex.schema.createTable('partner_bank_accounts', table => {
    table.increments('id').primary();
    table.integer('partner_id').notNullable().references('id').inTable('partners').onDelete('CASCADE');
    table.string('account_number').notNullable(); // Számlaszám
    table.string('bank_name').nullable();         // Bank neve
    table.boolean('is_primary').defaultTo(false); // Elsődleges számla (A oszlop)
    table.timestamps(true, true);
  });

  // 11. Create partner_discount_percentages (Százalékos kedvezmények)
  await knex.schema.createTable('partner_discounts', table => {
    table.increments('id').primary();
    table.integer('partner_id').notNullable().references('id').inTable('partners').onDelete('CASCADE');
    table.string('product_group').nullable();     // Termékcsoport
    table.decimal('discount_pct', 8, 4).nullable(); // Kedvezmény %
    table.timestamps(true, true);
  });

  // 12. Create partner_credit_settings (Hitelek, késedelmi kamat, csoportos beszedés)
  await knex.schema.createTable('partner_credit_settings', table => {
    table.increments('id').primary();
    table.integer('partner_id').notNullable().references('id').inTable('partners').onDelete('CASCADE').unique(); // 1:1
    table.decimal('credit_limit', 14, 2).nullable();       // Hitelkeret összege
    table.decimal('late_interest_pct', 8, 4).nullable();   // Késedelmi kamat %
    table.boolean('group_collection').defaultTo(false);     // Csoportos beszedés
    table.string('collection_account').nullable();          // Beszedési számla
    table.timestamps(true, true);
  });

  // 13. Create partner_events (Események)
  await knex.schema.createTable('partner_events', table => {
    table.increments('id').primary();
    table.integer('partner_id').notNullable().references('id').inTable('partners').onDelete('CASCADE');
    table.datetime('event_date').notNullable().defaultTo(knex.fn.now());
    table.string('event_type').nullable();        // Esemény típus
    table.string('name').nullable();              // Megnevezés
    table.string('created_by').nullable();        // Létrehozó
    table.string('partner_name').nullable();      // Partner (ki hozta létre)
    table.timestamps(true, true);
  });

  // 14. Create partner_attachments (Csatolmányok)
  await knex.schema.createTable('partner_attachments', table => {
    table.increments('id').primary();
    table.integer('partner_id').notNullable().references('id').inTable('partners').onDelete('CASCADE');
    table.string('file_name').notNullable();      // Fájl neve (megjelenítve)
    table.string('file_path').notNullable();      // Teljes elérési út (háttérben)
    table.string('file_type').nullable();         // Típus (pl. PDF, JPG)
    table.string('attached_by').nullable();       // Ki csatolta
    table.boolean('is_global').defaultTo(false);  // G oszlop
    table.boolean('is_archive').defaultTo(false); // A oszlop
    table.boolean('is_blocked').defaultTo(false); // B oszlop
    table.boolean('is_expired').defaultTo(false); // X oszlop
    table.boolean('is_encrypted').defaultTo(false); // E oszlop
    table.boolean('is_template').defaultTo(false);  // T oszlop
    table.boolean('is_checked').defaultTo(false);   // É oszlop
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('partner_attachments');
  await knex.schema.dropTableIfExists('partner_events');
  await knex.schema.dropTableIfExists('partner_credit_settings');
  await knex.schema.dropTableIfExists('partner_discounts');
  await knex.schema.dropTableIfExists('partner_bank_accounts');
  await knex.schema.dropTableIfExists('partner_categories');
  await knex.schema.dropTableIfExists('partner_restrictions');
  await knex.schema.dropTableIfExists('partner_characteristics');
  await knex.schema.dropTableIfExists('partner_identifiers');
  await knex.schema.dropTableIfExists('partner_agents');
  await knex.schema.dropTableIfExists('partner_contacts');
  await knex.schema.dropTableIfExists('partner_communications');
  await knex.schema.dropTableIfExists('partner_sites');

  // Remove added columns from partners table
  await knex.schema.alterTable('partners', table => {
    table.dropColumns(
      'is_natural_person', 'is_inactive', 'is_anonymized',
      'sync_from_moszr', 'invoice_name', 'country', 'region', 'zip', 'city', 'district',
      'street_name', 'street_type', 'street_number', 'building', 'staircase', 'floor', 'door',
      'mailing_same_as_hq', 'mailing_invoice_name', 'mailing_country', 'mailing_region',
      'mailing_zip', 'mailing_city', 'mailing_street_name', 'mailing_street_type', 'mailing_street_number', 'gln',
      'nat_family_name_prefix', 'nat_family_name', 'nat_first_name', 'nat_prev_family_name_prefix',
      'nat_prev_family_name', 'nat_prev_first_name', 'birth_family_name', 'birth_first_name',
      'birth_display_name', 'birth_place', 'birth_date', 'gender', 'mothers_family_name', 'mothers_first_name',
      'mothers_display_name', 'tax_id', 'taj', 'farmer_reg_number', 'farmer_cert_number',
      'farmer_activity_id', 'family_farm_id', 'has_compensation_surcharge', 'citizenship',
      'currency', 'price_type', 'payment_method', 'has_domestic_tax_num', 'has_eu_tax_num',
      'has_other_tax_num', 'product_tax_code', 'product_id_type', 'claims_as_current_account',
      'invoice_compensation_allowed', 'cash_flow_accounting', 'late_fee_applicable', 'is_kata_taxpayer',
      'einvoice_receive_start', 'einvoice_receive_end', 'einvoice_send_start', 'einvoice_send_end',
      'edi_provider', 'default_print_mode', 'notes'
    );
  });
};

// Helper to add date column
function date(name, table) {
  table.date(name).nullable();
}
