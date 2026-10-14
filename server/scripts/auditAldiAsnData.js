// Read-only local inventory; never print connection credentials or personal data.
const db = require('../src/db/db');
async function main() {
  const connection = db.client.config.connection;
  const local = typeof connection === 'string' ? ['127.0.0.1', 'localhost'].includes(new URL(connection).hostname) : ['127.0.0.1', 'localhost'].includes(connection.host);
  if (!local) throw new Error('Az ASN adataudit csak helyi adatbázison futtatható.');
  const columns = await db('information_schema.columns').where({ table_schema: 'public' }).where(function () {
    this.where('table_name', 'like', 'aldi_%').orWhereIn('table_name', ['sscc_labels', 'partners', 'products', 'chain_products', 'partner_addresses']);
  }).select('table_name', 'column_name').orderBy(['table_name', 'ordinal_position']);
  const schema = {};
  for (const c of columns) (schema[c.table_name] ||= []).push(c.column_name);
  const counts = {};
  for (const name of ['aldi_trucks', 'aldi_truck_lines', 'aldi_commission_lines', 'sscc_labels', 'aldi_daily_order_lines']) counts[name] = Number((await db(name).count('* as count').first()).count);
  const labels = await db('sscc_labels').where('is_provisional', false).select('sscc', 'picked_cartons', 'aldi_truck_line_id', 'commission_line_id', 'consolidated_sscc', 'is_consolidated_master');
  const ssccPrefixes = {};
  for (const l of labels) {
    const prefix = String(l.sscc).slice(1, 11);
    ssccPrefixes[prefix] = (ssccPrefixes[prefix] || 0) + 1;
  }
  const trucks = await db('aldi_trucks').select('id', 'is_loaded', 'delivery_date');
  const lines = await db('aldi_truck_lines').select('*');
  const refs = await db('aldi_daily_order_lines').select('*');
  const sampleOrderFields = refs.length ? Object.keys(refs[0]).filter(k => /line|gln|buyer|warehouse|reference|gtin/.test(k)) : [];
  const commission = await db('aldi_commission_lines').select('id', 'aldi_truck_id', 'aldi_truck_line_id', 'cartons', 'pallets', 'pallets_json');
  if (process.argv.includes('--summary')) {
    const asn = require('../src/services/aldiAsn').createAsn(db);
    const audit = [];
    for (const truck of trucks) {
      const result = await asn.audit(truck.id);
      audit.push({ truckId: truck.id, loaded: truck.is_loaded, ready: result.ready, issues: [...new Set(result.issues.map(i => i.code))] });
    }
    console.log(JSON.stringify({ counts, finalLabels: labels.length, ownPrefixLabels: labels.filter(l => String(l.sscc).slice(1, 11) === '5999883976').length,
      configuredCompanyPrefix: process.env.GS1_COMPANY_PREFIX || require('../src/utils/gs1').GAVA_COMPANY_PREFIX,
      missingOrderReferences: refs.filter(l => !l.edi_line_reference).length, missingDestinations: lines.filter(l => !l.destination).length,
      profile: await asn.getProfile(), audit }, null, 2));
    return;
  }
  console.log(JSON.stringify({ schema, counts, finalLabels: labels.length, ownPrefixLabels: labels.filter(l => String(l.sscc).slice(1, 11) === '5999883976').length, ssccPrefixes, trucks: trucks.map(t => ({ id: t.id, loaded: t.is_loaded, lines: lines.filter(l => l.aldi_truck_id === t.id).length })), sampleOrderFields, lineData: lines.map(l => ({ id: l.id, orderLine: l.aldi_daily_order_line_id, cartons: l.ordered_cartons, picked: l.picked_cartons, destination: l.destination })), commission, labelLinks: labels.map(l => ({ ...l, sscc: '[redacted]' })) }, null, 2));
}
main().catch(e => { console.error(e.message); process.exitCode = 1; }).finally(() => db.destroy());
