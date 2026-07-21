const fs = require('fs');
const path = require('path');

/**
 * Migration 033: Restore full partner names from merged_partners_import.json / invoice_name
 * for partners that were stored using short codes (transporter/supplier/customer names),
 * while retaining the short names in partner_identifiers.
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  console.log('--- Indul a 033_restore_full_partner_names migráció ---');

  let jsonPath = path.join(__dirname, '../../scripts/merged_partners_import.json');
  if (!fs.existsSync(jsonPath)) {
    jsonPath = path.join(__dirname, '../scripts/merged_partners_import.json');
  }
  if (!fs.existsSync(jsonPath)) {
    jsonPath = path.join(__dirname, 'merged_partners_import.json');
  }

  let partnersData = [];
  if (fs.existsSync(jsonPath)) {
    partnersData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } else {
    console.log('merged_partners_import.json nem található, csak az invoice_name alapon végzünk helyreállítást.');
  }

  const dbPartners = await knex('partners').select('id', 'name', 'tax_id', 'invoice_name', 'street_name');

  const jsonByTax = new Map();
  const jsonByName = new Map();
  const jsonByInvoiceName = new Map();
  const jsonByStreet = new Map();

  for (const p of partnersData) {
    if (p.identifiers && p.identifiers['Adószám']) {
      const cleanTax = p.identifiers['Adószám'].replace(/[^A-Z0-9]/gi, '').toUpperCase();
      if (cleanTax) jsonByTax.set(cleanTax, p);
    }
    if (p.name) {
      const cleanName = p.name.toLowerCase().replace(/["']/g, '').replace(/\s+/g, ' ').trim();
      jsonByName.set(cleanName, p);
    }
    if (p.invoiceName) {
      const cleanInv = p.invoiceName.toLowerCase().replace(/["']/g, '').replace(/\s+/g, ' ').trim();
      jsonByInvoiceName.set(cleanInv, p);
    }
    if (p.fullAddress && p.fullAddress.trim().length > 10) {
      const cleanStreet = p.fullAddress.toLowerCase().replace(/["']/g, '').replace(/\s+/g, ' ').trim();
      jsonByStreet.set(cleanStreet, p);
    }
  }

  let updatedCount = 0;

  for (const pDb of dbPartners) {
    const cleanDbTax = pDb.tax_id ? pDb.tax_id.replace(/[^A-Z0-9]/gi, '').toUpperCase() : '';
    let match = cleanDbTax ? jsonByTax.get(cleanDbTax) : null;

    if (!match && pDb.invoice_name) {
      const cleanDbInv = pDb.invoice_name.toLowerCase().replace(/["']/g, '').replace(/\s+/g, ' ').trim();
      match = jsonByInvoiceName.get(cleanDbInv);
    }

    if (!match && pDb.street_name) {
      const cleanDbStreet = pDb.street_name.toLowerCase().replace(/["']/g, '').replace(/\s+/g, ' ').trim();
      match = jsonByStreet.get(cleanDbStreet);
    }

    if (!match && pDb.name) {
      const cleanDbName = pDb.name.toLowerCase().replace(/["']/g, '').replace(/\s+/g, ' ').trim();
      match = jsonByName.get(cleanDbName);
    }

    let targetName = null;

    if (match && match.name && match.name.length > pDb.name.length) {
      targetName = match.name;
    } else if (pDb.invoice_name && pDb.invoice_name.trim().length > pDb.name.trim().length) {
      targetName = pDb.invoice_name.trim();
    }

    if (targetName && targetName !== pDb.name) {
      await knex('partners').where('id', pDb.id).update({
        name: targetName,
        invoice_name: pDb.invoice_name || (match ? match.invoiceName : null) || targetName
      });
      updatedCount++;
    }
  }

  console.log(`--- 033 migráció befejeződött: ${updatedCount} partner neve helyreállítva a teljes névre. ---`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Irreversible name restoration
};
