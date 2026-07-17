/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('partner_sites', table => {
    table.string('document_name').nullable(); // Név a bizonylaton
    table.boolean('is_same_as_hq').defaultTo(false); // Azonos a székhely címmel
    table.boolean('is_billing_address').defaultTo(false); // Számlázási cím
    table.string('mailing_address_source').nullable(); // Cím forrása
    table.boolean('is_invoice_mailing_address').defaultTo(false); // Számla postázási cím
    
    // Levelezési cím mezők
    table.string('mailing_document_name').nullable(); // Név a bizonylaton (Levelezési cím)
    table.string('mailing_gln').nullable(); // GLN (Levelezési cím)
    table.string('mailing_country').nullable();
    table.string('mailing_region').nullable();
    table.string('mailing_zip').nullable();
    table.string('mailing_city').nullable();
    table.string('mailing_street_name').nullable();
    
    // Eredeti cím kibővítése (ha nincs)
    table.string('region').nullable();
    // "Utca, hsz." összevont mező a képen látható egyedi mezőként, ha külön kell
    table.string('street_full').nullable();
    table.string('mailing_street_full').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('partner_sites', table => {
    table.dropColumn('document_name');
    table.dropColumn('is_same_as_hq');
    table.dropColumn('is_billing_address');
    table.dropColumn('mailing_address_source');
    table.dropColumn('is_invoice_mailing_address');
    
    table.dropColumn('mailing_document_name');
    table.dropColumn('mailing_gln');
    table.dropColumn('mailing_country');
    table.dropColumn('mailing_region');
    table.dropColumn('mailing_zip');
    table.dropColumn('mailing_city');
    table.dropColumn('mailing_street_name');
    
    table.dropColumn('region');
    table.dropColumn('street_full');
    table.dropColumn('mailing_street_full');
  });
};
