/**
 * Standalone script: Assign Penny characteristics to target partners on DO Server or Local DB
 * Usage: node src/db/assign_penny_partners.js
 */
const db = require('./db');

async function assignPennyCharacteristics() {
  console.log('=== GAVA ERP: Penny Partnerek Azonosítása és Hozzárendelése ===\n');

  // 1. Ensure San Lucar exists
  let sanLucar = await db('partners').whereRaw('LOWER(name) LIKE ? OR LOWER(invoice_name) LIKE ?', ['%san%lucar%', '%san%lucar%']).first();
  if (!sanLucar) {
    const [inserted] = await db('partners').insert({
      name: 'San Lucar Fruit',
      invoice_name: 'San Lucar Fruit S.L.',
      type: 'szállító',
      is_inactive: false
    }).returning('*');
    sanLucar = inserted || (await db('partners').where('name', 'San Lucar Fruit').first());
    console.log(`[+] Létrehozva új partner: "San Lucar Fruit" (ID: ${sanLucar ? sanLucar.id : '?'})`);
  }

  const allPartners = await db('partners').select('id', 'name', 'invoice_name', 'is_inactive');

  const rules = [
    { label: 'San Lucar Fruit', test: p => /san.*lucar|lucar.*san/i.test(`${p.name} ${p.invoice_name}`) },
    { label: 'A.N Boekel', test: p => /boekel/i.test(`${p.name} ${p.invoice_name}`) },
    { label: 'Anton Dürbeck', test: p => /d[üu]rbeck/i.test(`${p.name} ${p.invoice_name}`) },
    { label: 'Kv Logistic', test: p => /kv\s*log/i.test(`${p.name} ${p.invoice_name}`) },
    { label: 'Kölla', test: p => /k[öo]lla/i.test(`${p.name} ${p.invoice_name}`) },
    { label: 'Mandersloot', test: p => /mandersloot/i.test(`${p.name} ${p.invoice_name}`) },
    { label: 'Vermion Fresh', test: p => /vermio/i.test(`${p.name} ${p.invoice_name}`) },
    { label: 'Olympic Fruit', test: p => /olympic/i.test(`${p.name} ${p.invoice_name}`) },
    { label: 'Nutri Frucht', test: p => /nutri/i.test(`${p.name} ${p.invoice_name}`) },
    { label: 'Lehmann', test: p => /lehmann/i.test(`${p.name} ${p.invoice_name}`) },
    { label: 'Hillfresh', test: p => /hillfresh/i.test(`${p.name} ${p.invoice_name}`) },
    { label: 'Greenyard Espana', test: p => /greenyard.*(spain|espa|s\.a\b)/i.test(`${p.name} ${p.invoice_name}`) && !/ital/i.test(`${p.name} ${p.invoice_name}`) },
    { label: 'Greenyard Italy', test: p => /greenyard.*(ital|spa\b)/i.test(`${p.name} ${p.invoice_name}`) && !/spain/i.test(`${p.name} ${p.invoice_name}`) },
    { label: 'Campina Verde', test: p => /campina/i.test(`${p.name} ${p.invoice_name}`) },
    { label: 'Cretan Root', test: p => /cretan/i.test(`${p.name} ${p.invoice_name}`) },
    { label: 'Dolcefrutta', test: p => /dolcefrutta/i.test(`${p.name} ${p.invoice_name}`) },
    { label: 'Eurogroup Deutschland', test: p => /eurogroup.*(deutsch|gmbh)/i.test(`${p.name} ${p.invoice_name}`) },
    { label: 'Eurogroup Espana', test: p => /eurogroup.*(espana|spain|s\.a\.u|frutas)/i.test(`${p.name} ${p.invoice_name}`) },
    { label: 'Eurogroup Italy', test: p => /eurogroup.*(ital|s\.r\.l)/i.test(`${p.name} ${p.invoice_name}`) },
  ];

  const matchedPartnerIds = new Set();
  if (sanLucar && sanLucar.id) matchedPartnerIds.add(sanLucar.id);

  console.log('--- Partnerek beazonosítása szabályok alapján ---');
  for (const rule of rules) {
    const matches = allPartners.filter(rule.test);
    console.log(`\n• ${rule.label} (${matches.length} találat):`);
    for (const m of matches) {
      matchedPartnerIds.add(m.id);
      console.log(`   └─ [ID: ${m.id}] "${m.name}" ${m.invoice_name ? `(${m.invoice_name})` : ''}`);
    }
  }

  console.log(`\nÖsszesen ${matchedPartnerIds.size} partner kap "Penny" láncjellemzőt.`);

  let updatedCount = 0;
  let insertedCount = 0;

  for (const pid of matchedPartnerIds) {
    const existing = await db('partner_characteristics')
      .where('partner_id', pid)
      .where(function() {
        this.where('characteristic', 'Partnerlánc jellemzők').orWhere('characteristic', 'Penny');
      })
      .first();

    if (existing) {
      await db('partner_characteristics')
        .where('id', existing.id)
        .update({
          characteristic: 'Partnerlánc jellemzők',
          value: 'Penny',
          updated_at: new Date()
        });
      updatedCount++;
    } else {
      await db('partner_characteristics').insert({
        partner_id: pid,
        characteristic: 'Partnerlánc jellemzők',
        value: 'Penny',
        created_at: new Date(),
        updated_at: new Date()
      });
      insertedCount++;
    }
  }

  console.log(`\n[SIKER] Kész! Frissítve: ${updatedCount}, Beszúrva: ${insertedCount}`);
  process.exit(0);
}

assignPennyCharacteristics().catch(e => {
  console.error('[HIBA] Nem sikerült a hozzárendelés:', e);
  process.exit(1);
});
