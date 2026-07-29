require('dotenv').config();
const db = require('knex')(require('./knexfile')['development']);

async function main() {
  // Mik vannak CASI-hoz mint Reference?
  console.log('=== CASI partner Reference azonosítói ===');
  const casiIdents = await db('partner_identifiers as pi')
    .join('partners as p', 'p.id', 'pi.partner_id')
    .whereRaw("UPPER(p.name) LIKE '%CASI%'")
    .orWhereRaw("UPPER(pi.value) LIKE '%CASI%'")
    .select('p.id', 'p.name', 'pi.id', 'pi.id_type', 'pi.value', 'pi.is_inactive')
    .orderBy('p.id');
  casiIdents.forEach(r => console.log(`  partner[${r.id}] "${r.name}" | ${r.id_type} | "${r.value}" | inactive=${r.is_inactive}`));

  // Nézzük a shipment_lines.partner_id értékeket a GHU 186-hoz
  console.log('\n=== GHU 186 sorok partner_id + ÖSSZES Reference azonosító ===\n');
  const lines = await db('shipment_lines as sl')
    .select(
      'sl.id as line_id',
      'sl.shipment_id',
      's.order_number',
      'sl.partner_id',
      'p.name as partner_name',
      'prod.name as product_name'
    )
    .leftJoin('shipments as s', 'sl.shipment_id', 's.id')
    .leftJoin('partners as p', 'sl.partner_id', 'p.id')
    .leftJoin('products as prod', 'sl.product_id', 'prod.id')
    .where('s.order_number', 'like', '%GHU 186%')
    .andWhereRaw("(UPPER(COALESCE(p.name, '')) LIKE '%CASI%' OR sl.partner_id IN (SELECT DISTINCT partner_id FROM partner_identifiers WHERE UPPER(value) LIKE '%CASI%'))")
    .orderBy('sl.id');

  for (const l of lines) {
    const refs = await db('partner_identifiers')
      .where('partner_id', l.partner_id)
      .whereIn('id_type', ['(Reference) Szállítók'])
      .select('value', 'is_inactive');
    console.log(`  line[${l.line_id}] partner[${l.partner_id}] "${l.partner_name}" | product="${l.product_name}"`);
    console.log(`    Reference azonosítók: ${refs.map(r => `"${r.value}" (inactive=${r.is_inactive})`).join(', ')}`);
  }

  // Most nézzük meg az EGÉSZ LEFT JOIN eredményét - a probléma a JOIN-ban van?
  console.log('\n=== TELJES JOIN EREDMÉNY (mit lát a shipment_lines API) ===\n');
  const joinResult = await db('shipment_lines as sl')
    .select(
      'sl.id as line_id',
      'sl.partner_id',
      'p.name as partner_name',
      'pi.id as pi_id',
      'pi.value as pi_value',
      'pi.id_type as pi_type',
      'prod.name as product_name'
    )
    .leftJoin('shipments as s', 'sl.shipment_id', 's.id')
    .leftJoin('products as prod', 'sl.product_id', 'prod.id')
    .leftJoin('partners as p', 'sl.partner_id', 'p.id')
    .leftJoin('partner_identifiers as pi', function() {
      this.on('pi.partner_id', '=', 'p.id')
          .andOn('pi.id_type', '=', db.raw("?", ['(Reference) Szállítók']));
    })
    .where('s.order_number', 'GHU 186')
    .andWhereRaw("UPPER(COALESCE(p.name, '')) LIKE '%CASI%'")
    .orderBy('sl.id');

  console.log('line_id | partner_id | pi_id | pi_value          | partner_name');
  joinResult.forEach(r => {
    console.log(`  ${r.line_id} | ${r.partner_id} | ${r.pi_id || 'NULL'} | ${(r.pi_value || 'NULL').padEnd(18)} | ${r.partner_name} | ${r.product_name}`);
  });

  // CRITICAL: van-e duplikált Reference a CASI partnerhez?
  console.log('\n=== DUPLIKÁLT REFERENCE AZONOSÍTÓK (1 partnernek több Reference) ===\n');
  const dupes = await db.raw(`
    SELECT pi.partner_id, p.name, COUNT(*) as cnt, STRING_AGG(pi.value, ', ') as values
    FROM partner_identifiers pi
    JOIN partners p ON p.id = pi.partner_id
    WHERE pi.id_type = '(Reference) Szállítók'
    GROUP BY pi.partner_id, p.name
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC
  `);
  dupes.rows.forEach(r => {
    console.log(`  partner[${r.partner_id}] "${r.name}" → ${r.cnt}x: [${r.values}]`);
  });

  await db.destroy();
}

main().catch(e => { console.error(e); process.exit(1); });
