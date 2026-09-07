const fs = require('fs');
const readline = require('readline');
const path = require('path');
const knex = require('./node_modules/knex');

const db = knex({
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    port: 5432,
    user: 'gava_admin',
    password: 'adminpassword123',
    database: 'gava_erp'
  }
});

function parseTsvVal(val) {
  if (val === '\\N') return null;
  return val;
}

function parseBool(val) {
  if (val === 't') return true;
  if (val === 'f') return false;
  return false;
}

async function main() {
  console.log('=== RESTORING ARCHIVED PARTNERS & IDENTIFIERS FROM AUG 2 BACKUP ===\n');

  // 1. Check baseline counts
  const [initShipments] = await db('shipments').count();
  const [initPartners] = await db('partners').count();
  const [initInactivePartners] = await db('partners').where('is_inactive', true).count();
  const [initIdens] = await db('partner_identifiers').count();
  const [initInactiveIdens] = await db('partner_identifiers').where('is_inactive', true).count();
  const [initAldi] = await db('aldi_daily_orders').count();

  console.log(`Baseline before restore:
  - Shipments: ${initShipments.count}
  - Partners: ${initPartners.count} (Inactive: ${initInactivePartners.count})
  - Identifiers: ${initIdens.count} (Inactive: ${initInactiveIdens.count})
  - ALDI daily orders: ${initAldi.count}\n`);

  // 2. Read backup_partners_pre_dedup_20260802.sql
  const backupFile = path.join(__dirname, '..', 'backup_partners_pre_dedup_20260802.sql');
  console.log(`Reading backup file: ${backupFile}...`);

  const rl = readline.createInterface({
    input: fs.createReadStream(backupFile, { encoding: 'utf8' }),
    crlfDelay: Infinity
  });

  let inPartners = false;
  let inIdens = false;
  let partnerCols = [];
  let idenCols = [];
  const backupPartners = [];
  const backupIdens = [];

  for await (const line of rl) {
    if (line.startsWith('COPY public.partners (')) {
      inPartners = true;
      inIdens = false;
      const colStr = line.slice('COPY public.partners ('.length, line.indexOf(') FROM stdin;'));
      partnerCols = colStr.split(', ').map(c => c.trim());
      continue;
    }
    if (line.startsWith('COPY public.partner_identifiers (')) {
      inPartners = false;
      inIdens = true;
      const colStr = line.slice('COPY public.partner_identifiers ('.length, line.indexOf(') FROM stdin;'));
      idenCols = colStr.split(', ').map(c => c.trim());
      continue;
    }
    if (line.trim() === '\\.') {
      inPartners = false;
      inIdens = false;
      continue;
    }

    if (inPartners) {
      const parts = line.split('\t');
      const row = {};
      partnerCols.forEach((col, idx) => {
        row[col] = parseTsvVal(parts[idx]);
      });
      ['is_active', 'is_natural_person', 'is_inactive', 'is_anonymized', 'sync_from_moszr',
       'mailing_same_as_hq', 'has_compensation_surcharge', 'has_domestic_tax_num',
       'has_eu_tax_num', 'has_other_tax_num', 'claims_as_current_account',
       'invoice_compensation_allowed', 'cash_flow_accounting', 'late_fee_applicable',
       'is_kata_taxpayer'].forEach(col => {
         if (row[col] !== undefined && row[col] !== null) {
           row[col] = parseBool(row[col]);
         }
       });
      row.id = parseInt(row.id);
      backupPartners.push(row);
    }

    if (inIdens) {
      const parts = line.split('\t');
      const row = {};
      idenCols.forEach((col, idx) => {
        row[col] = parseTsvVal(parts[idx]);
      });
      row.id = parseInt(row.id);
      row.partner_id = parseInt(row.partner_id);
      if (row.is_verified !== undefined && row.is_verified !== null) row.is_verified = parseBool(row.is_verified);
      if (row.is_inactive !== undefined && row.is_inactive !== null) row.is_inactive = parseBool(row.is_inactive);
      backupIdens.push(row);
    }
  }

  console.log(`Parsed from backup:
  - Partners: ${backupPartners.length} (Inactive: ${backupPartners.filter(p => p.is_inactive).length})
  - Identifiers: ${backupIdens.length} (Inactive: ${backupIdens.filter(i => i.is_inactive).length})\n`);

  await db.raw("SET session_replication_role = 'replica';");
  await db.raw("DROP INDEX IF EXISTS ux_partner_identifiers_active_role_value;");

  try {
    console.log('Synchronizing partners...');
    const currentPartners = await db('partners').select('id', 'is_inactive');
    const currentPartnerMap = new Map(currentPartners.map(p => [p.id, p]));

    let partnersInserted = 0;
    let partnersUpdatedInactive = 0;

    for (const p of backupPartners) {
      if (currentPartnerMap.has(p.id)) {
        if (p.is_inactive) {
          await db('partners').where('id', p.id).update({ is_inactive: true });
          partnersUpdatedInactive++;
        }
      } else {
        await db('partners').insert(p);
        partnersInserted++;
        currentPartnerMap.set(p.id, p);
      }
    }
    console.log(`  Partners inserted: ${partnersInserted}, updated to inactive: ${partnersUpdatedInactive}`);

    console.log('Synchronizing partner_identifiers...');
    const currentIdens = await db('partner_identifiers').select('id', 'is_inactive');
    const currentIdenMap = new Map(currentIdens.map(i => [i.id, i]));

    let idensInserted = 0;
    let idensUpdatedInactive = 0;

    for (const iden of backupIdens) {
      if (!currentPartnerMap.has(iden.partner_id)) continue;

      if (currentIdenMap.has(iden.id)) {
        if (iden.is_inactive) {
          await db('partner_identifiers').where('id', iden.id).update({ is_inactive: true });
          idensUpdatedInactive++;
        }
      } else {
        await db('partner_identifiers').insert(iden);
        idensInserted++;
      }
    }
    console.log(`  Identifiers inserted: ${idensInserted}, updated to inactive: ${idensUpdatedInactive}`);

    console.log('Applying Migration 042 active role deduplication...');
    const TO_DEACTIVATE = [
      [5845, 6836, 'AXARFRUIT'],
      [5895, 6898, 'CRETAN ROOT'],
      [5894, 6898, 'CRETAN ROOT'],
      [5898, 6900, 'TOMATO-AL'],
      [5900, 6953, 'PAP JÓZSEFNÉ'],
      [5575, 22,   'GAVA POLSKA'],
      [5621, 52,   'MALENO'],
      [5683, 288,  'ESMAR'],
      [5707, 4685, 'EUROGROUP DEUTSCHLAND'],
      [5705, 2592, 'NATURINDA'],
      [5317, 3456, 'TRANS-SPED'],
    ];

    for (const [id, partnerId, value] of TO_DEACTIVATE) {
      const row = await db('partner_identifiers').where('id', id).first();
      if (row && row.partner_id === partnerId && (row.value || '').trim().toUpperCase() === value) {
        await db('partner_identifiers').where('id', id).update({ is_inactive: true, updated_at: new Date() });
      }
    }

    const ROLE_TYPES = ['(Reference) Szállítók', '(Customer) Vevők', 'Fuvarozók'];
    const remaining = await db('partner_identifiers as pi')
      .join('partners as p', 'p.id', 'pi.partner_id')
      .whereIn('pi.id_type', ROLE_TYPES)
      .andWhere('pi.is_inactive', false)
      .select('pi.id', 'pi.id_type', 'pi.value', 'pi.partner_id', 'p.name');

    const groups = new Map();
    for (const r of remaining) {
      const key = `${r.id_type}::${(r.value || '').trim().toUpperCase()}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    }

    let extraDeactivated = 0;
    for (const [key, rows] of groups) {
      if (rows.length < 2) continue;
      rows.sort((a, b) => a.id - b.id);
      const keep = rows[0];
      const drop = rows.slice(1);
      await db('partner_identifiers').whereIn('id', drop.map(r => r.id))
        .update({ is_inactive: true, updated_at: new Date() });
      extraDeactivated += drop.length;
    }
    console.log(`  Extra duplicate active roles deactivated: ${extraDeactivated}`);

    console.log('Recreating unique active role index...');
    await db.raw(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_partner_identifiers_active_role_value
      ON partner_identifiers (id_type, UPPER(TRIM(value)))
      WHERE is_inactive = false
        AND id_type IN ('(Reference) Szállítók', '(Customer) Vevők', 'Fuvarozók');
    `);

    console.log('Applying Migration 043 duplicate inactive identifier cleanup...');
    const duplicates = await db('partner_identifiers')
      .where('is_inactive', true)
      .groupBy('partner_id', 'id_type', db.raw('UPPER(TRIM(value))'))
      .havingRaw('count(*) > 1')
      .select(
        'partner_id',
        'id_type',
        db.raw('UPPER(TRIM(value)) as normalized_value'),
        db.raw('count(*) as cnt')
      );

    let deletedInactiveDupes = 0;
    for (const dup of duplicates) {
      const records = await db('partner_identifiers')
        .where('is_inactive', true)
        .andWhere('partner_id', dup.partner_id)
        .andWhere('id_type', dup.id_type)
        .whereRaw('UPPER(TRIM(value)) = ?', [dup.normalized_value])
        .orderBy('updated_at', 'desc')
        .select('id');
      if (records.length > 1) {
        const idsToDelete = records.slice(1).map(r => r.id);
        await db('partner_identifiers').whereIn('id', idsToDelete).del();
        deletedInactiveDupes += idsToDelete.length;
      }
    }
    console.log(`  Duplicate inactive identifiers cleaned: ${deletedInactiveDupes}`);

    await db.raw("SELECT setval('partners_id_seq', COALESCE((SELECT MAX(id) FROM partners), 1));");
    await db.raw("SELECT setval('partner_identifiers_id_seq', COALESCE((SELECT MAX(id) FROM partner_identifiers), 1));");

  } finally {
    await db.raw("SET session_replication_role = 'origin';");
  }

  const [finalShipments] = await db('shipments').count();
  const [finalPartners] = await db('partners').count();
  const [finalInactivePartners] = await db('partners').where('is_inactive', true).count();
  const [finalIdens] = await db('partner_identifiers').count();
  const [finalInactiveIdens] = await db('partner_identifiers').where('is_inactive', true).count();
  const [finalAldi] = await db('aldi_daily_orders').count();

  console.log(`\n=== VERIFICATION ===
  - Shipments: ${finalShipments.count} (was ${initShipments.count})
  - Partners: ${finalPartners.count} (Inactive: ${finalInactivePartners.count})
  - Identifiers: ${finalIdens.count} (Inactive: ${finalInactiveIdens.count})
  - ALDI daily orders: ${finalAldi.count} (was ${initAldi.count})
  `);

  await db.destroy();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
