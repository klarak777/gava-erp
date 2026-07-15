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
  const sub = [
    { table: 'partner_communications', data: body.communications },
    { table: 'partner_contacts', data: body.contacts },
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

  // Sites: csak frissítés/hozzáadás, nem törlés (biztonságosabb)
  if (Array.isArray(body.sites)) {
    for (const site of body.sites) {
      if (site.id) {
        await trx('partner_sites').where('id', site.id).where('partner_id', partnerId).update({
          name: site.name, country: site.country, zip: site.zip, city: site.city,
          street_name: site.street_name, street_type: site.street_type,
          street_number: site.street_number, is_deleted: site.is_deleted || false
        });
      } else {
        await trx('partner_sites').insert({ ...site, id: undefined, partner_id: partnerId });
      }
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

// GET /api/v1/partners?search=...&type=...&limit=100
router.get('/', async (req, res) => {
  try {
    const { search, type, limit = 200, offset = 0 } = req.query;
    let query = db('partners').select(
      'id', 'name', 'type', 'is_inactive', 'country', 'city', 'zip', 'street_name', 'street_number', 'tax_id', 'is_natural_person'
    ).orderBy('name');

    if (search) {
      query = query.whereRaw('LOWER(name) LIKE ?', [`%${search.toLowerCase()}%`]);
    }
    if (type) {
      query = query.where('type', type);
    }
    query = query.limit(parseInt(limit)).offset(parseInt(offset));

    const rows = await query;
    res.json(rows);
  } catch (err) {
    console.error('Hiba a partnerek lekérdezésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
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
        nat_first_name: partner.nat_first_name, birth_place: partner.birth_place,
        birth_date: partner.birth_date, gender: partner.gender, tax_id: partner.tax_id,
        taj: partner.taj, farmer_reg_number: partner.farmer_reg_number,
        citizenship: partner.citizenship,
        // pénzügyi
        currency: partner.currency, price_type: partner.price_type,
        payment_method: partner.payment_method,
        has_domestic_tax_num: partner.has_domestic_tax_num || false,
        has_eu_tax_num: partner.has_eu_tax_num || false,
        notes: partner.notes, default_print_mode: partner.default_print_mode || 'system',
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
        nat_first_name: partner.nat_first_name, birth_place: partner.birth_place,
        birth_date: partner.birth_date, gender: partner.gender, tax_id: partner.tax_id,
        taj: partner.taj, farmer_reg_number: partner.farmer_reg_number,
        citizenship: partner.citizenship,
        currency: partner.currency, price_type: partner.price_type,
        payment_method: partner.payment_method,
        has_domestic_tax_num: partner.has_domestic_tax_num || false,
        has_eu_tax_num: partner.has_eu_tax_num || false,
        notes: partner.notes, default_print_mode: partner.default_print_mode || 'system',
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
    await db('partners').where('id', id).delete();
    res.json({ success: true });
  } catch (err) {
    console.error('Hiba a partner törlésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
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
