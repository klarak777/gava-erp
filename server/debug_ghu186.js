require('dotenv').config();
const db = require('knex')(require('./knexfile')['development']);

async function main() {
  // 1. GHU 186 fuvar adatai az adatbázisból
  console.log('=== GHU 186 FUVAR – ADATBÁZIS TARTALOM ===\n');
  
  const lines = await db('shipment_lines as sl')
    .select(
      'sl.id as line_id',
      'sl.shipment_id',
      's.order_number',
      's.loading_date',
      's.arrival_date',
      'sl.partner_id',
      'p.name as partner_name',
      db.raw("(SELECT pi.value FROM partner_identifiers pi WHERE pi.partner_id = sl.partner_id AND pi.id_type = '(Reference) Szállítók' AND (pi.is_inactive = false OR pi.is_inactive IS NULL) LIMIT 1) as ref_identifier"),
      db.raw("(SELECT pi.value FROM partner_identifiers pi WHERE pi.partner_id = sl.partner_id AND pi.id_type = '(Reference) Szállítók' LIMIT 1) as ref_identifier_any"),
      db.raw("COALESCE((SELECT pi.value FROM partner_identifiers pi WHERE pi.partner_id = sl.partner_id AND pi.id_type = '(Reference) Szállítók' LIMIT 1), p.name) as ref_coalesce"),
      'prod.name as product_name',
      'prod.code as product_code'
    )
    .leftJoin('shipments as s', 'sl.shipment_id', 's.id')
    .leftJoin('partners as p', 'sl.partner_id', 'p.id')
    .leftJoin('products as prod', 'sl.product_id', 'prod.id')
    .where('s.order_number', 'like', '%GHU 186%')
    .orderBy('s.order_number')
    .orderBy('sl.id');

  if (lines.length === 0) {
    console.log('Nincs GHU 186 fuvar az adatbázisban! Keresünk variánsokat...');
    const variants = await db('shipments')
      .where('order_number', 'like', '%186%')
      .andWhere('order_number', 'like', '%GHU%')
      .select('id', 'order_number', 'loading_date');
    console.log('Variánsok:', variants);
  } else {
    console.log(`Összesen ${lines.length} sor a GHU 186-hoz:\n`);
    console.log('line_id | order_number      | partner_id | partner_name                    | ref_identifier | ref_coalesce           | product');
    console.log('--------|-------------------|------------|--------------------------------|----------------|------------------------|--------');
    lines.forEach(l => {
      console.log(
        `${String(l.line_id).padEnd(8)}| ${(l.order_number||'').padEnd(18)}| ${String(l.partner_id||'?').padEnd(11)}| ${(l.partner_name||'NULL').padEnd(31)}| ${(l.ref_identifier||'NULL').padEnd(15)}| ${(l.ref_coalesce||'NULL').padEnd(23)}| ${l.product_name||''}`
      );
    });
  }

  // 2. CSV-ből a GHU 186 sorok
  console.log('\n\n=== GHU 186 FUVAR – CSV TARTALOM (forrás igazság) ===\n');
  const fs = require('fs');
  const csvPath = 'c:\\Users\\klara\\Documents\\Nepelemes ügyek\\Gavá\\ERP Access\\25-26 Fuvarok összesítö V2 260617.csv';
  const content = fs.readFileSync(csvPath, 'utf8');
  const csvLines = content.split(/\r?\n/);
  const header = csvLines[0].split(';');
  
  const refIdx = header.indexOf('Reference');
  const orderIdx = header.indexOf('Order Number');
  const loadIdx = header.indexOf('Loading date');
  const custIdx = header.indexOf('Customer');
  const productIdx = header.indexOf('Product');
  
  console.log(`CSV oszlopok: Reference=${refIdx}, Order Number=${orderIdx}, Loading date=${loadIdx}, Customer=${custIdx}, Product=${productIdx}\n`);
  
  console.log('order_number      | Reference        | Customer        | Product         | Loading date');
  console.log('------------------|------------------|-----------------|-----------------|-------------');
  
  for (let i = 1; i < csvLines.length; i++) {
    const cols = csvLines[i].split(';');
    const order = (cols[orderIdx] || '').trim();
    if (order.includes('GHU 186')) {
      console.log(
        `${order.padEnd(18)}| ${(cols[refIdx]||'').trim().padEnd(17)}| ${(cols[custIdx]||'').trim().padEnd(16)}| ${(cols[productIdx]||'').trim().padEnd(16)}| ${(cols[loadIdx]||'').trim()}`
      );
    }
  }

  // 3. Vizsgáljuk meg az importálási logikát – hogyan jön be a partner_id
  console.log('\n\n=== PARTNER MAPPING ELLENŐRZÉS ===\n');
  const csvRefs = ['KOPFSALAT', 'CASI', 'MALENO', 'DELGAFRUITS', 'AGROPONIENTE', 'FRESSAN'];
  for (const ref of csvRefs) {
    const ident = await db('partner_identifiers as pi')
      .join('partners as p', 'p.id', 'pi.partner_id')
      .where('pi.value', ref)
      .andWhere('pi.id_type', '(Reference) Szállítók')
      .select('p.id', 'p.name', 'pi.value', 'pi.is_inactive');
    
    const identAll = await db('partner_identifiers as pi')
      .join('partners as p', 'p.id', 'pi.partner_id')
      .whereRaw('UPPER(pi.value) = ?', [ref.toUpperCase()])
      .select('p.id', 'p.name', 'pi.value', 'pi.id_type', 'pi.is_inactive');
    
    console.log(`"${ref}":`, ident.length > 0 ? ident : '❌ NEM TALÁLHATÓ mint Reference');
    if (identAll.length > 0 && ident.length === 0) {
      console.log(`  → DE megtalálható más típussal:`, identAll);
    }
  }

  await db.destroy();
}

main().catch(e => { console.error(e); process.exit(1); });
