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

// A három fő szerepkör-kategória. Ezekre érvényes a globális névegyediség:
// egy néven belül kategóriánként csak EGY aktív azonosító létezhet a rendszerben.
// Ugyanazon a partneren belül több alias megengedett (pl. CASI / CASI AIRPORT).
const ROLE_ID_TYPES = ['(Reference) Szállítók', '(Customer) Vevők', 'Fuvarozók'];

function normalizeIdentifierValue(value) {
  return (value || '').trim().toUpperCase();
}

/**
 * Ellenőrzi, hogy a partnerhez menteni kívánt aktív szerepkör-azonosítók
 * nem ütköznek-e egymással, illetve más partner már aktív azonosítójával.
 * Ütközés esetén 400-as hibát dob, így a mentés tranzakciója visszagördül.
 *
 * A `partner_identifiers` táblán ugyanezt a szabályt egy részleges egyedi index is
 * védi (042 migráció) — ez a függvény adja hozzá az érthető magyar hibaüzenetet.
 */
async function assertRoleIdentifiersUnique(trx, partnerId, identifiers) {
  if (!Array.isArray(identifiers)) return;

  const active = identifiers.filter(i =>
    ROLE_ID_TYPES.includes(i.id_type) && !i.is_inactive && normalizeIdentifierValue(i.value)
  );
  if (active.length === 0) return;

  // 1. Ütközés a beküldött listán belül
  const seen = new Map();
  for (const i of active) {
    const key = `${i.id_type}::${normalizeIdentifierValue(i.value)}`;
    if (seen.has(key)) {
      const err = new Error(
        `A(z) "${i.value}" név kétszer szerepel aktívként a "${i.id_type}" szerepkörben. ` +
        `Egy néven belül csak egy aktív azonosító lehet.`
      );
      err.statusCode = 400;
      throw err;
    }
    seen.set(key, i);
  }

  // 2. Ütközés másik partner aktív azonosítójával
  const conflicts = await trx('partner_identifiers as pi')
    .join('partners as p', 'p.id', 'pi.partner_id')
    .whereIn('pi.id_type', ROLE_ID_TYPES)
    .andWhere('pi.is_inactive', false)
    .andWhereNot('pi.partner_id', partnerId)
    .select('pi.id_type', 'pi.value', 'p.id as partner_id', 'p.name as partner_name');

  const taken = new Map();
  for (const c of conflicts) {
    taken.set(`${c.id_type}::${normalizeIdentifierValue(c.value)}`, c);
  }

  for (const i of active) {
    const hit = taken.get(`${i.id_type}::${normalizeIdentifierValue(i.value)}`);
    if (hit) {
      const err = new Error(
        `Ilyen névvel ("${i.value}") már van aktív azonosító a "${i.id_type}" szerepkörben, ` +
        `a(z) "${hit.partner_name}" partnerhez rendelve (ID: ${hit.partner_id}). ` +
        `Módosítsa a nevet, vagy előbb tegye inaktívvá a másikat.`
      );
      err.statusCode = 400;
      throw err;
    }
  }
}

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
  // Szerepkör-azonosítók egyediségének ellenőrzése MÉG a törlés-újraírás előtt,
  // hogy ütközés esetén a teljes mentés visszagörduljön.
  await assertRoleIdentifiersUnique(trx, partnerId, body.identifiers);

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

  // Auto-sync partners.type based on role identifiers
  // If identifiers include role types, set partners.type accordingly
    if (Array.isArray(body.identifiers)) {
      const roleTypes = body.identifiers.map(i => i.id_type);
      let newType = null;
      if (roleTypes.includes('(Reference) SzAllA-tA3k') || roleTypes.includes('(Reference) Szállítók') || roleTypes.includes('(Reference) Sz\xC3\xA1ll\xC3\xADt\xC3\xB3k')) {
        newType = 'szAllA-tA3';
      } else if (roleTypes.includes('(Customer) Vev`k') || roleTypes.includes('(Customer) Vevők') || roleTypes.includes('(Customer) Vev\xC5\x91k')) {
        newType = 'vev`';
      } else if (roleTypes.includes('FuvarozA3k') || roleTypes.includes('Fuvarozók') || roleTypes.includes('Fuvaroz\xC3\xB3k')) {
        newType = 'fuvarozA3';
      }
      // Only update type if a role identifier is present; don't clear existing type
      if (newType) {
        await trx('partners').where('id', partnerId).update({ type: newType });
      }
    }
}

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// GET /api/v1/partners?searchName=...&searchTax=...&searchCity=...&limit=100
router.get('/', async (req, res) => {
  try {
    const { searchName, searchTax, searchCity, limit = 200, offset = 0, status } = req.query;
    let query = db('partners')
      .modify(function(qb) {
        if (status === 'active') {
          qb.where(function() {
            this.where('partners.is_inactive', false).orWhereNull('partners.is_inactive');
          });
        } else if (status === 'inactive') {
          qb.where('partners.is_inactive', true);
        }
      })
      .leftJoin('partner_identifiers as pi_eu', function() {
        this.on('partners.id', '=', 'pi_eu.partner_id')
            .andOnVal('pi_eu.id_type', '=', 'Közösségi adószám');
      })
      .leftJoin('partner_identifiers as pi_tax', function() {
        this.on('partners.id', '=', 'pi_tax.partner_id')
            .andOnVal('pi_tax.id_type', '=', 'Adószám');
      })
      .select(
        'partners.id', 'partners.name', 'partners.invoice_name', 'partners.type',
        'partners.is_inactive', 'partners.country', 'partners.city', 'partners.zip',
        'partners.street_name', 'partners.street_number', 'partners.tax_id',
        'partners.is_natural_person', 'pi_eu.value as eu_tax_id', 'pi_tax.value as pi_tax_id'
      )
      .orderBy('partners.name');

    if (searchName) {
      let clean = searchName.toLowerCase();
      if (clean.startsWith('"') || clean.startsWith("'")) {
        clean = clean.substring(1);
      }
      const s1 = `${clean}%`;
      const s2 = `"${clean}%`;
      const s3 = `'${clean}%`;
      query = query.where(function() {
        this.whereRaw('LOWER(partners.name) LIKE ?', [s1])
            .orWhereRaw('LOWER(partners.name) LIKE ?', [s2])
            .orWhereRaw('LOWER(partners.name) LIKE ?', [s3])
            .orWhereRaw('LOWER(partners.invoice_name) LIKE ?', [s1])
            .orWhereRaw('LOWER(partners.invoice_name) LIKE ?', [s2])
            .orWhereRaw('LOWER(partners.invoice_name) LIKE ?', [s3]);
      });
    }
    if (searchTax) {
      const s = `${searchTax.toLowerCase()}%`;
      query = query.where(function() {
        this.whereRaw('LOWER(partners.tax_id) LIKE ?', [s])
            .orWhereRaw('LOWER(pi_tax.value) LIKE ?', [s])
            .orWhereRaw('LOWER(pi_eu.value) LIKE ?', [s]);
      });
    }
    if (searchCity) {
      const s = `${searchCity.toLowerCase()}%`;
      query = query.whereRaw('LOWER(partners.city) LIKE ?', [s]);
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
    
    if (!data.isValid && countryCode === 'HU') {
      data.userError = 'A partnernek NINCS Közösségi (EU) adószáma a VIES adatbázisában! (Ha belföldön élő adószáma van, azt a központi EU rendszer nem ismeri, kizárólag a magyar NAV adatbázisa tudná ellenőrizni).';
    }

    res.json(data);
  } catch (err) {
    console.error('VIES API hiba:', err);
    res.status(500).json({ error: 'Hiba a VIES ellenőrzés során: ' + err.message });
  }
});

// GET /api/v1/partners/archived/list - inaktív partnerek és aktív partnerek inaktív azonosítói
router.get('/archived/list', async (req, res) => {
  try {
    const inactiveIdentifiers = await db('partner_identifiers').where('is_inactive', true);
    const inactivePartners = await db('partners').where('is_inactive', true);
    
    const activePartnerIdsWithInactiveIdentifiers = [...new Set(inactiveIdentifiers.map(i => i.partner_id))];
    const activePartnersWithInactiveIdens = await db('partners')
        .where(b => b.where('is_inactive', false).orWhereNull('is_inactive'))
        .whereIn('id', activePartnerIdsWithInactiveIdentifiers);

    const allPartners = [...inactivePartners, ...activePartnersWithInactiveIdens];

    const result = allPartners.map(p => ({
        ...p,
        identifiers: inactiveIdentifiers.filter(i => i.partner_id === p.id)
    }));
    result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    res.json(result);
  } catch (err) {
    console.error('Hiba archív lekérdezésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba' });
  }
});

// GET /api/v1/partners/active/search - karakteres keresés partner reassignhez
router.get('/active/search', async (req, res) => {
    try {
        const q = req.query.q || '';
        const includeInactive = req.query.include_inactive === 'true';
        let query = db('partners');
        
        if (!includeInactive) {
            query = query.where(b => b.where('is_inactive', false).orWhereNull('is_inactive'));
        }
        
        const partners = await query
            .andWhereRaw('LOWER(name) LIKE ?', [`${q.toLowerCase()}%`])
            .select('id', 'name', 'is_inactive')
            .limit(50);
        res.json(partners);
    } catch (err) {
        res.status(500).json({ error: 'Belső szerverhiba' });
    }
});

// PUT /api/v1/partners/identifiers/:id/reassign
router.put('/identifiers/:id/reassign', async (req, res) => {
    try {
        const { id } = req.params;
        const { target_partner_id } = req.body;
        
        const identifier = await db('partner_identifiers').where('id', id).first();
        if (!identifier) return res.status(404).json({ error: 'Azonosító nem található' });

        const targetPartner = await db('partners').where('id', target_partner_id).first();
        if (!targetPartner) return res.status(404).json({ error: 'Cél partner nem található' });

        if (!identifier.is_inactive && targetPartner.is_inactive) {
            return res.status(400).json({ error: 'Aktív azonosítót nem lehet inaktív partnerhez rendelni!' });
        }

        // Aktív szerepkör áthelyezésekor a globális névegyediség érvényes:
        // (Bárhol máshol a rendszerben nem lehet aktív ugyanez a név)
        if (!identifier.is_inactive && ROLE_ID_TYPES.includes(identifier.id_type)) {
            const conflict = await db('partner_identifiers as pi')
                .join('partners as p', 'p.id', 'pi.partner_id')
                .where('pi.id_type', identifier.id_type)
                .whereRaw('UPPER(TRIM(pi.value)) = ?', [normalizeIdentifierValue(identifier.value)])
                .andWhere('pi.is_inactive', false)
                .andWhereNot('pi.id', identifier.id)
                .select('p.name as partner_name')
                .first();

            if (conflict) {
                return res.status(400).json({
                    error: `Ilyen névvel ("${identifier.value}") már van aktív azonosító a "${identifier.id_type}" ` +
                           `szerepkörben, a(z) "${conflict.partner_name}" partnerhez rendelve!`
                });
            }
        }

        // Inaktív azonosítók áthelyezésekor lokális egyediség érvényes:
        // A CÉLPARTNERNÉL nem létezhet ugyanezzel a névvel és szerepkörrel azonosító (legyen az aktív vagy inaktív)
        if (identifier.is_inactive && ROLE_ID_TYPES.includes(identifier.id_type)) {
            const localConflict = await db('partner_identifiers')
                .where('partner_id', target_partner_id)
                .where('id_type', identifier.id_type)
                .whereRaw('UPPER(TRIM(value)) = ?', [normalizeIdentifierValue(identifier.value)])
                .andWhereNot('id', identifier.id)
                .first();
            
            if (localConflict) {
                return res.status(400).json({
                    error: `A célpartnernél ("${targetPartner.name}") már létezik egy "${identifier.value}" nevű azonosító a(z) "${identifier.id_type}" szerepkörben!`
                });
            }
        }

        if (req.query.dry_run === 'true') {
            return res.json({ success: true, message: 'Valid' });
        }

        await db('partner_identifiers').where('id', id).update({ partner_id: target_partner_id, updated_at: new Date() });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Szerverhiba' });
    }
});

// PUT /api/v1/partners/identifiers/:id/activate
router.put('/identifiers/:id/activate', async (req, res) => {
    try {
        const { id } = req.params;
        const identifier = await db('partner_identifiers').where('id', id).first();
        if (!identifier) return res.status(404).json({ error: 'Azonosító nem található' });

        const partner = await db('partners').where('id', identifier.partner_id).first();
        if (partner.is_inactive) {
            return res.status(400).json({ error: 'Inaktív partner azonosítóját nem lehet aktiválni! Előbb a partnert kell aktiválni.' });
        }

        const roleCategory = identifier.id_type;
        if (ROLE_ID_TYPES.includes(roleCategory)) {
            // Globális névegyediség: ugyanazon a partneren belül több alias megengedett
            // (pl. CASI / CASI AIRPORT), de két különböző partner nem viselheti
            // ugyanazt az aktív szerepkör-nevet.
            const globallyExisting = await db('partner_identifiers')
                .join('partners', 'partners.id', 'partner_identifiers.partner_id')
                .where('partner_identifiers.id_type', roleCategory)
                .whereRaw('UPPER(TRIM(partner_identifiers.value)) = ?', [normalizeIdentifierValue(identifier.value)])
                .andWhere('partner_identifiers.is_inactive', false)
                .andWhereNot('partner_identifiers.id', identifier.id)
                .select('partners.name')
                .first();

            if (globallyExisting) {
                return res.status(400).json({ error: `Ilyen névvel ("${identifier.value}") már van aktív azonosító a rendszerben, a(z) "${globallyExisting.name}" partnerhez rendelve!` });
            }
        }

        await db('partner_identifiers').where('id', id).update({ is_inactive: false, updated_at: new Date() });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Szerverhiba' });
    }
});

// PUT /api/v1/partners/identifiers/:id/deactivate
router.put('/identifiers/:id/deactivate', async (req, res) => {
    try {
        const { id } = req.params;
        const identifier = await db('partner_identifiers').where('id', id).first();
        if (!identifier) return res.status(404).json({ error: 'Azonosító nem található' });

        await db('partner_identifiers').where('id', id).update({ is_inactive: true, updated_at: new Date() });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Szerverhiba' });
    }
});

// DELETE /api/v1/partners/identifiers/:id
router.delete('/identifiers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const identifier = await db('partner_identifiers').where('id', id).first();
        if (!identifier) return res.status(404).json({ error: 'Azonosító nem található' });

        const val = (identifier.value || '').trim().toLowerCase();

        // Fuvar ellenőrzések. A historikus táblák NÉV szerint hivatkoznak az
        // azonosítóra (az albaran_number mező is a partner rövid nevét tárolja),
        // ezért minden érintett szöveges oszlopot vizsgálunk.
        const [usedInShipments, usedInShipmentLines, usedInCargo] = await Promise.all([
            db('shipments').where('transporter_id', identifier.partner_id).first(),
            db('shipment_lines')
                .whereRaw('LOWER(TRIM(customer)) = ?', [val])
                .orWhereRaw('LOWER(TRIM(destination)) = ?', [val])
                .orWhereRaw('LOWER(TRIM(COALESCE(albaran_number, \'\'))) = ?', [val])
                .first(),
            db('cargo_demands')
                .whereRaw('LOWER(TRIM(COALESCE(partner_name, \'\'))) = ?', [val])
                .orWhereRaw('LOWER(TRIM(COALESCE(customer_name, \'\'))) = ?', [val])
                .orWhereRaw('LOWER(TRIM(COALESCE(albaran_number, \'\'))) = ?', [val])
                .orWhereRaw('LOWER(TRIM(COALESCE(destination, \'\'))) = ?', [val])
                .first(),
        ]);

        if (usedInShipments || usedInShipmentLines || usedInCargo) {
            return res.status(400).json({ error: 'Ezt az azonosítót nem lehet törölni, mert már hozzá van kötve korábbi fuvarokhoz vagy áru igényekhez! Tegye inkább inaktívvá — így az Archív partnerek modulban megmarad.' });
        }

        await db('partner_identifiers').where('id', id).del();
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Szerverhiba' });
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

// GET /api/v1/partners/check-identifier - ellenőrzi, hogy létezik-e már aktívként az azonosító
router.get('/check-identifier/active', async (req, res) => {
  try {
    const { type, value, exclude_id } = req.query;
    if (!type || !value) return res.status(400).json({ error: 'Hiányzó type vagy value' });
    
    let query = db('partner_identifiers')
      .join('partners', 'partners.id', 'partner_identifiers.partner_id')
      .select('partner_identifiers.*', 'partners.name as partner_name')
      .where('partner_identifiers.id_type', type)
      .whereRaw('UPPER(partner_identifiers.value) = ?', [value.toUpperCase()])
      .where(function() {
         this.where('partner_identifiers.is_inactive', false).orWhereNull('partner_identifiers.is_inactive');
      });
      
    if (exclude_id && exclude_id !== 'null' && exclude_id !== 'undefined') {
      query = query.whereNot('partner_id', exclude_id);
    }
    
    const duplicate = await query.first();
    res.json({ exists: !!duplicate, duplicate });
  } catch (err) {
    console.error('Hiba az azonosító ellenőrzésekor:', err);
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
    if (err.statusCode === 400) return res.status(400).json({ error: err.message });
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
    if (err.statusCode === 400) return res.status(400).json({ error: err.message });
    console.error('Hiba a partner frissítésekor:', err);
    res.status(500).json({ error: 'Belső szerverhiba: ' + err.message });
  }
});

// PUT /api/v1/partners/:id/status
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { is_inactive } = req.body;
        
        const partner = await db('partners').where('id', id).first();
        if (!partner) return res.status(404).json({ error: 'Partner nem található' });

        if (is_inactive) {
            // Check if there is any active identifier before archiving
            const activeIdentifiers = await db('partner_identifiers')
                .where('partner_id', id)
                .where(b => b.where('is_inactive', false).orWhereNull('is_inactive'))
                .select('id_type');
            
            const mainRoles = ['(Reference) Szállítók', '(Customer) Vevők', 'Fuvarozók'];
            const hasActiveRole = activeIdentifiers.some(i => mainRoles.includes(i.id_type));
            
            if (hasActiveRole) {
                return res.status(400).json({ error: 'Nem archiválható a partner, mert még van aktív fő szerepköre (Szállító / Vevő / Fuvarozó)!' });
            }
        }

        await db('partners').where('id', id).update({ is_inactive: is_inactive ? true : false, updated_at: new Date() });
        res.json({ success: true });
    } catch (err) {
        console.error('Hiba a partner státuszának módosításakor:', err);
        res.status(500).json({ error: 'Belső szerverhiba' });
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
