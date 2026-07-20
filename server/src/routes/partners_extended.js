const express = require('express');
const router = express.Router();
const db = require('../db/db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// ─── File upload setup ────────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '../../documents/partners');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/[^a-zA-Z0-9._\-]/g, '_');
    cb(null, `${ts}_${safe}`);
  }
});
const upload = multer({ storage });

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getPartnerFull(partnerId, trx) {
  const db_ = trx || db;
  const [partner, sites, communications, contacts, agents, identifiers,
    characteristics, restrictions, categories, bankAccounts, discounts,
    creditSettings, events, attachments] = await Promise.all([
    db_('partners').where('id', partnerId).first(),
    db_('partner_sites').where('partner_id', partnerId).orderBy('id'),
    db_('partner_communications').where('partner_id', partnerId).orderBy('id'),
    db_('partner_contacts').where('partner_id', partnerId).orderBy('id'),
    db_('partner_agents').where('partner_id', partnerId).orderBy('id'),
    db_('partner_identifiers').where('partner_id', partnerId).orderBy('id'),
    db_('partner_characteristics').where('partner_id', partnerId).orderBy('id'),
    db_('partner_restrictions').where('partner_id', partnerId).orderBy('id'),
    db_('partner_categories').where('partner_id', partnerId).orderBy('id'),
    db_('partner_bank_accounts').where('partner_id', partnerId).orderBy('id'),
    db_('partner_discounts').where('partner_id', partnerId).orderBy('id'),
    db_('partner_credit_settings').where('partner_id', partnerId).first(),
    db_('partner_events').where('partner_id', partnerId).orderBy('event_date', 'desc'),
    db_('partner_attachments').where('partner_id', partnerId).orderBy('id'),
  ]);

  return {
    partner,
    sites,
    communications,
    contacts,
    agents,
    identifiers,
    characteristics,
    restrictions,
    categories,
    bankAccounts,
    discounts,
    creditSettings: creditSettings || null,
    events,
    attachments: (attachments || []).map(a => ({ ...a, file_path: undefined })) // Ne küldjük ki az elérési utat
  };
}

async function saveSubTables(trx, partnerId, body) {
  const siteTempMap = {};
  
  // 1. Sites: save first to get database IDs
  if (Array.isArray(body.sites)) {
    for (const site of body.sites) {
      const tempId = site._tempId;
      const dbRow = {
        name: site.name, country: site.country, zip: site.zip, city: site.city, district: site.district,
        street_name: site.street_name, street_type: site.street_type,
        street_number: site.street_number, building: site.building,
        staircase: site.staircase, floor: site.floor, door: site.door,
        comm_lang: site.comm_lang, excise_num: site.excise_num, gln: site.gln,
        delivery_warehouse: site.delivery_warehouse, default_transaction: site.default_transaction,
        document_name: site.document_name, is_same_as_hq: site.is_same_as_hq,
        is_billing_address: site.is_billing_address, mailing_address_source: site.mailing_address_source,
        is_invoice_mailing_address: site.is_invoice_mailing_address,
        mailing_document_name: site.mailing_document_name, mailing_gln: site.mailing_gln,
        mailing_country: site.mailing_country, mailing_region: site.mailing_region,
        mailing_zip: site.mailing_zip, mailing_city: site.mailing_city,
        mailing_street_name: site.mailing_street_name,
        region: site.region, street_full: site.street_full,
        mailing_street_full: site.mailing_street_full,
        is_deleted: site.is_deleted || false
      };
      if (site.id) {
        await trx('partner_sites').where('id', site.id).where('partner_id', partnerId).update(dbRow);
        siteTempMap[site.id] = site.id;
      } else {
        const [inserted] = await trx('partner_sites').insert({ ...dbRow, partner_id: partnerId }).returning('id');
        const insertedId = typeof inserted === 'object' ? inserted.id : inserted;
        if (tempId) {
          siteTempMap[tempId] = insertedId;
        }
      }
    }
  }

  // 2. Prep communications and contacts with resolved site IDs
  const coms = (body.communications || []).map(c => {
    let sId = c.site_id;
    if (c.site_temp_id && siteTempMap[c.site_temp_id]) {
      sId = siteTempMap[c.site_temp_id];
    }
    return { ...c, site_id: sId, site_temp_id: undefined };
  });

  const conts = (body.contacts || []).map(c => {
    let sId = c.site_id;
    if (c.site_temp_id && siteTempMap[c.site_temp_id]) {
      sId = siteTempMap[c.site_temp_id];
    }
    return { ...c, site_id: sId, site_temp_id: undefined };
  });

  const sub = [
    { table: 'partner_communications', data: coms },
    { table: 'partner_contacts', data: conts },
    { table: 'partner_agents', data: body.agents },
    { table: 'partner_identifiers', data: body.identifiers },
    { table: 'partner_characteristics', data: body.characteristics },
    { table: 'partner_restrictions', data: body.restrictions },
    { table: 'partner_categories', data: body.categories },
    { table: 'partner_bank_accounts', data: body.bankAccounts },
    { table: 'partner_discounts', data: body.discounts },
  ];

  for (const { table, data } of sub) {
    if (!Array.isArray(data)) continue;
    await trx(table).where('partner_id', partnerId).del();
    if (data.length > 0) {
      const rows = data.map(r => ({ ...r, partner_id: partnerId, id: undefined, created_at: undefined, updated_at: undefined }));
      await trx(table).insert(rows);
    }
  }

  // Credit settings: upsert
  if (body.creditSettings) {
    const existing = await trx('partner_credit_settings').where('partner_id', partnerId).first();
    const cs = { ...body.creditSettings, partner_id: partnerId, id: undefined, created_at: undefined, updated_at: undefined };
    if (existing) {
      await trx('partner_credit_settings').where('partner_id', partnerId).update(cs);
    } else {
      await trx('partner_credit_settings').insert(cs);
    }
  }
}

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// GET /api/v1/partners?searchName=...&searchTax=...&searchCity=...&limit=100
router.get('/', async (req, res) => {
  try {
    const { searchName, searchTax, searchCity, limit = 200, offset = 0 } = req.query;
    let query = db('partners').select(
      'id', 'name', 'invoice_name', 'type', 'is_inactive', 'country', 'city', 'zip', 'street_name', 'street_number', 'tax_id', 'is_natural_person'
    ).orderBy('name');

    if (searchName) {
      let clean = searchName.toLowerCase();
      if (clean.startsWith('"') || clean.startsWith("'")) {
        clean = clean.substring(1);
      }
      const s1 = `${clean}%`;
      const s2 = `"${clean}%`;
      const s3 = `'${clean}%`;
      query = query.where(function() {
        this.whereRaw('LOWER(name) LIKE ?', [s1])
            .orWhereRaw('LOWER(name) LIKE ?', [s2])
            .orWhereRaw('LOWER(name) LIKE ?', [s3])
            .orWhereRaw('LOWER(invoice_name) LIKE ?', [s1])
            .orWhereRaw('LOWER(invoice_name) LIKE ?', [s2])
            .orWhereRaw('LOWER(invoice_name) LIKE ?', [s3]);
      });
    }
    if (searchTax) {
      const s = `%${searchTax.toLowerCase()}%`;
      query = query.whereRaw('LOWER(tax_id) LIKE ?', [s]);
    }
    if (searchCity) {
      const s = `%${searchCity.toLowerCase()}%`;
      query = query.whereRaw('LOWER(city) LIKE ?', [s]);
    }
    
    query = query.limit(parseInt(limit)).offset(parseInt(offset));

    const rows = await query;
    res.json(rows);
  } catch (err) {
    console.error('Hiba a partnerek lekérdezésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

// GET /api/v1/partners/verify-vat/:vatNumber - EU VAT check via VIES
router.get('/verify-vat/:vatNumber', async (req, res) => {
  try {
    let { vatNumber } = req.params;
    vatNumber = vatNumber.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (vatNumber.length < 3) return res.status(400).json({ error: 'Túl rövid adószám' });
    
    // Ha az adószám csak számokból áll (pl. egy hazai adószám), alakítsuk át Közösségi adószámmá a VIES-hez
    if (/^\d{8,}$/.test(vatNumber)) {
      vatNumber = 'HU' + vatNumber.substring(0, 8);
    }
    
    const countryCode = vatNumber.substring(0, 2);
    const vat = vatNumber.substring(2);
    
    const response = await fetch(`https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${countryCode}/vat/${vat}`);
    if (!response.ok) throw new Error('VIES API nem elérhető');
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('VIES API hiba:', err);
    res.status(500).json({ error: 'Hiba a VIES ellenőrzés során: ' + err.message });
  }
});

// GET /api/v1/partners/:id - teljes partner adat
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^\d+$/.test(id)) return res.status(400).json({ error: 'Érvénytelen ID' });
    const data = await getPartnerFull(id);
    if (!data.partner) return res.status(404).json({ error: 'Partner nem található' });
    res.json(data);
  } catch (err) {
    console.error('Hiba a partner lekérdezésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

// POST /api/v1/partners - új partner
router.post('/', async (req, res) => {
  try {
    const { partner, ...body } = req.body;
    if (!partner || !partner.name) return res.status(400).json({ error: 'A partner neve kötelező' });

    let partnerId;
    await db.transaction(async trx => {
      const [id] = await trx('partners').insert({
        name: partner.name,
        type: partner.type || 'supplier',
        is_natural_person: partner.is_natural_person || false,
        is_inactive: partner.is_inactive || false,
        is_anonymized: partner.is_anonymized || false,
        invoice_name: partner.invoice_name,
        sync_from_moszr: partner.sync_from_moszr || false,
        country: partner.country, region: partner.region, zip: partner.zip,
        city: partner.city, district: partner.district,
        street_name: partner.street_name, street_type: partner.street_type,
        street_number: partner.street_number, building: partner.building,
        staircase: partner.staircase, floor: partner.floor, door: partner.door,
        mailing_same_as_hq: partner.mailing_same_as_hq !== false,
        mailing_invoice_name: partner.mailing_invoice_name,
        mailing_country: partner.mailing_country, mailing_region: partner.mailing_region,
        mailing_zip: partner.mailing_zip, mailing_city: partner.mailing_city,
        mailing_street_name: partner.mailing_street_name,
        mailing_street_type: partner.mailing_street_type,
        mailing_street_number: partner.mailing_street_number, gln: partner.gln,
        // természetes személy
        nat_family_name_prefix: partner.nat_family_name_prefix, nat_family_name: partner.nat_family_name,
        nat_first_name: partner.nat_first_name,
        nat_prev_family_name_prefix: partner.nat_prev_family_name_prefix, nat_prev_family_name: partner.nat_prev_family_name,
        nat_prev_first_name: partner.nat_prev_first_name,
        birth_family_name: partner.birth_family_name, birth_first_name: partner.birth_first_name,
        birth_display_name: partner.birth_display_name, birth_place: partner.birth_place,
        birth_date: partner.birth_date, gender: partner.gender,
        mothers_family_name: partner.mothers_family_name, mothers_first_name: partner.mothers_first_name,
        mothers_display_name: partner.mothers_display_name,
        tax_id: partner.tax_id, taj: partner.taj,
        farmer_reg_number: partner.farmer_reg_number, farmer_cert_number: partner.farmer_cert_number,
        farmer_activity_id: partner.farmer_activity_id, family_farm_id: partner.family_farm_id,
        has_compensation_surcharge: partner.has_compensation_surcharge || false,
        citizenship: partner.citizenship,
        // pénzügyi
        currency: partner.currency, price_type: partner.price_type,
        payment_method: partner.payment_method,
        has_domestic_tax_num: partner.has_domestic_tax_num || false,
        has_eu_tax_num: partner.has_eu_tax_num || false,
        has_other_tax_num: partner.has_other_tax_num || false,
        product_tax_code: partner.product_tax_code, product_id_type: partner.product_id_type,
        claims_as_current_account: partner.claims_as_current_account || false,
        invoice_compensation_allowed: partner.invoice_compensation_allowed || false,
        cash_flow_accounting: partner.cash_flow_accounting || false,
        late_fee_applicable: partner.late_fee_applicable || false,
        is_kata_taxpayer: partner.is_kata_taxpayer || false,
        einvoice_receive_start: partner.einvoice_receive_start || null,
        einvoice_receive_end: partner.einvoice_receive_end || null,
        einvoice_send_start: partner.einvoice_send_start || null,
        einvoice_send_end: partner.einvoice_send_end || null,
        edi_provider: partner.edi_provider,
        notes: partner.notes, default_print_mode: partner.default_print_mode || 'system',
        comm_lang: partner.comm_lang, excise_num: partner.excise_num,
        delivery_warehouse: partner.delivery_warehouse, default_transaction: partner.default_transaction,
      }).returning('id');
      partnerId = typeof id === 'object' ? id.id : id;
      await saveSubTables(trx, partnerId, body);
    });

    const data = await getPartnerFull(partnerId);
    res.status(201).json(data);
  } catch (err) {
    console.error('Hiba a partner mentésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba: ' + err.message });
  }
});

// PUT /api/v1/partners/:id - partner frissítése
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^\d+$/.test(id)) return res.status(400).json({ error: 'Érvénytelen ID' });
    const { partner, ...body } = req.body;
    if (!partner) return res.status(400).json({ error: 'Hiányzó partner adatok' });

    await db.transaction(async trx => {
      await trx('partners').where('id', id).update({
        name: partner.name, type: partner.type,
        is_natural_person: partner.is_natural_person || false,
        is_inactive: partner.is_inactive || false,
        is_anonymized: partner.is_anonymized || false,
        invoice_name: partner.invoice_name,
        sync_from_moszr: partner.sync_from_moszr || false,
        country: partner.country, region: partner.region, zip: partner.zip,
        city: partner.city, district: partner.district,
        street_name: partner.street_name, street_type: partner.street_type,
        street_number: partner.street_number, building: partner.building,
        staircase: partner.staircase, floor: partner.floor, door: partner.door,
        mailing_same_as_hq: partner.mailing_same_as_hq !== false,
        mailing_invoice_name: partner.mailing_invoice_name,
        mailing_country: partner.mailing_country, mailing_region: partner.mailing_region,
        mailing_zip: partner.mailing_zip, mailing_city: partner.mailing_city,
        mailing_street_name: partner.mailing_street_name,
        mailing_street_type: partner.mailing_street_type,
        mailing_street_number: partner.mailing_street_number, gln: partner.gln,
        nat_family_name_prefix: partner.nat_family_name_prefix, nat_family_name: partner.nat_family_name,
        nat_first_name: partner.nat_first_name,
        nat_prev_family_name_prefix: partner.nat_prev_family_name_prefix, nat_prev_family_name: partner.nat_prev_family_name,
        nat_prev_first_name: partner.nat_prev_first_name,
        birth_family_name: partner.birth_family_name, birth_first_name: partner.birth_first_name,
        birth_display_name: partner.birth_display_name, birth_place: partner.birth_place,
        birth_date: partner.birth_date, gender: partner.gender,
        mothers_family_name: partner.mothers_family_name, mothers_first_name: partner.mothers_first_name,
        mothers_display_name: partner.mothers_display_name,
        tax_id: partner.tax_id, taj: partner.taj,
        farmer_reg_number: partner.farmer_reg_number, farmer_cert_number: partner.farmer_cert_number,
        farmer_activity_id: partner.farmer_activity_id, family_farm_id: partner.family_farm_id,
        has_compensation_surcharge: partner.has_compensation_surcharge || false,
        citizenship: partner.citizenship,
        currency: partner.currency, price_type: partner.price_type,
        payment_method: partner.payment_method,
        has_domestic_tax_num: partner.has_domestic_tax_num || false,
        has_eu_tax_num: partner.has_eu_tax_num || false,
        has_other_tax_num: partner.has_other_tax_num || false,
        product_tax_code: partner.product_tax_code, product_id_type: partner.product_id_type,
        claims_as_current_account: partner.claims_as_current_account || false,
        invoice_compensation_allowed: partner.invoice_compensation_allowed || false,
        cash_flow_accounting: partner.cash_flow_accounting || false,
        late_fee_applicable: partner.late_fee_applicable || false,
        is_kata_taxpayer: partner.is_kata_taxpayer || false,
        einvoice_receive_start: partner.einvoice_receive_start || null,
        einvoice_receive_end: partner.einvoice_receive_end || null,
        einvoice_send_start: partner.einvoice_send_start || null,
        einvoice_send_end: partner.einvoice_send_end || null,
        edi_provider: partner.edi_provider,
        notes: partner.notes, default_print_mode: partner.default_print_mode || 'system',
        comm_lang: partner.comm_lang, excise_num: partner.excise_num,
        delivery_warehouse: partner.delivery_warehouse, default_transaction: partner.default_transaction,
        updated_at: new Date(),
      });
      await saveSubTables(trx, id, body);
    });

    const data = await getPartnerFull(id);
    res.json(data);
  } catch (err) {
    console.error('Hiba a partner frissítésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba: ' + err.message });
  }
});

// DELETE /api/v1/partners/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query;
    
    if (force !== 'true') {
      // Ellenőrizzük, hogy a partner szerepel-e fuvarokban vagy pénzügyi sorokban
      const slCheck = await db('shipment_lines').where('partner_id', id).first();
      const ftCheck = await db('finance_transport_lines').where('partner_id', id).first();
      
      if (slCheck || ftCheck) {
        return res.status(409).json({ warning: true, error: 'A partner szerepel korábban rögzített fuvarokban (pl. szállítóként, vevőként vagy fuvarozóként).\n\nBiztosan törölni szeretnéd a partnert az adatbázisból?' });
      }
    }

    await db('partners').where('id', id).delete();
    res.json({ success: true });
  } catch (err) {
    console.error('Hiba a partner törlésekor:', err);
    if (err.code === '23503') { // PostgreSQL Foreign Key Violation
      return res.status(400).json({ error: 'A partner nem törölhető, mert már szigorú hivatkozás történik rá más rögzített adatokban.' });
    }
    res.status(500).json({ error: 'Belső szerverhiba a törlés során' });
  }
});

// POST /api/v1/partners/:id/attachments - fájl feltöltése
router.post('/:id/attachments', upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'Nincs fájl csatolva' });

    const [row] = await db('partner_attachments').insert({
      partner_id: id,
      file_name: req.file.originalname,
      file_path: req.file.path,
      file_type: path.extname(req.file.originalname).replace('.', '').toUpperCase(),
      attached_by: req.body.attached_by || '',
    }).returning('*');

    res.json({ ...row, file_path: undefined }); // Ne adjuk vissza az elérési utat
  } catch (err) {
    console.error('Hiba a csatolmány feltöltésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

// GET /api/v1/partners/:id/attachments/:attachmentId/download - fájl letöltése
router.get('/:id/attachments/:attachmentId/download', async (req, res) => {
  try {
    const { id, attachmentId } = req.params;
    const attachment = await db('partner_attachments')
      .where('id', attachmentId)
      .where('partner_id', id)
      .first();
    if (!attachment) return res.status(404).json({ error: 'Csatolmány nem található' });
    if (!fs.existsSync(attachment.file_path)) {
      return res.status(404).json({ error: 'Fájl nem található a szerveren' });
    }
    res.download(attachment.file_path, attachment.file_name);
  } catch (err) {
    console.error('Hiba a letöltéskor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

// DELETE /api/v1/partners/:id/attachments/:attachmentId
router.delete('/:id/attachments/:attachmentId', async (req, res) => {
  try {
    const { id, attachmentId } = req.params;
    const attachment = await db('partner_attachments')
      .where('id', attachmentId).where('partner_id', id).first();
    if (attachment && fs.existsSync(attachment.file_path)) {
      fs.unlinkSync(attachment.file_path);
    }
    await db('partner_attachments').where('id', attachmentId).del();
    res.json({ success: true });
  } catch (err) {
    console.error('Hiba a csatolmány törlésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

module.exports = router;
