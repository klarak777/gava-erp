const crypto = require('node:crypto');
const { analyse, buildMessage, profileValue } = require('./aldiAsnMessage');
function createAsn(db) {
  const event = (trx, shipmentId, messageId, state, description, details = {}) => trx('aldi_asn_events').insert({ shipment_id: shipmentId, message_id: messageId, state, description, details: JSON.stringify(details) });
  const getProfile = async (trx = db) => (await trx('aldi_asn_settings').where({ id: 1 }).first()).profile;
  async function source(trx, truckId) {
    const truck = await trx('aldi_trucks').where({ id: truckId }).select('*', trx.raw('delivery_date::text AS delivery_date')).first();
    if (!truck) throw new Error('A kamion nem található.');
    const lines = await trx('aldi_truck_lines as t').leftJoin('aldi_daily_order_lines as l', 'l.id', 't.aldi_daily_order_line_id')
      .leftJoin('aldi_daily_orders as o', 'o.id', 'l.daily_order_id').leftJoin('aldi_order_families as f', 'f.id', 'o.order_family_id')
      .where('t.aldi_truck_id', truckId).select('t.*', 'l.gtin', 'l.edi_line_reference', 'l.ordered_cartons as order_quantity', 'l.fulfilled_cartons as fulfilled_quantity', 'f.base_order_number');
    for (const l of lines) { l.order = { base_order_number: l.base_order_number, ordered_cartons: l.order_quantity, fulfilled_cartons: l.fulfilled_quantity }; }
    const commissions = await trx('aldi_commission_lines').where({ aldi_truck_id: truckId });
    const labelColumns = ['*', trx.raw('asn_best_before::text AS asn_best_before'), trx.raw('asn_expiry_date::text AS asn_expiry_date')];
    const labels = await trx('sscc_labels').select(...labelColumns).where(function () {
      this.whereIn('commission_line_id', commissions.map(c => c.id)).orWhereIn('aldi_truck_line_id', lines.map(l => l.id));
    });
    const masters = labels.map(l => l.consolidated_sscc).filter(Boolean);
    if (masters.length) labels.push(...await trx('sscc_labels').select(...labelColumns).whereIn('sscc', masters));
    return { truck, lines, commissions, labels };
  }
  async function audit(truckId) {
    const data = await source(db, truckId), profile = await getProfile();
    const result = analyse(data, profile);
    return { ...result, truck: data.truck, lines: data.lines.map(l => ({ id: l.id, productName: l.product_name, gtin: l.gtin, orderNumber: l.order.base_order_number, reference: l.asn_order_line_reference || l.edi_line_reference || '', destination: l.destination || '', pickedCartons: l.picked_cartons })), labels: data.labels.filter(l => l.is_provisional === false && !l.is_consolidated_master).map(l => ({ id: l.id, sscc: l.consolidated_sscc || l.sscc, lot: l.lot_number || '', bestBefore: l.asn_best_before, expiryDate: l.asn_expiry_date })), palletCount: result.groups.reduce((n, g) => n + g.pallets.length, 0) };
  }
  async function capture(trx, truckId, regenerate = false) {
    await trx('aldi_trucks').where({ id: truckId }).forUpdate().first();
    const last = await trx('aldi_asn_shipments').where({ truck_id: truckId }).orderBy('generation', 'desc').first();
    // A valid captured payload never changes or gets sent twice when the truck is saved again.
    if (last && !last.issues.length) {
      if (!regenerate) return { shipmentId: last.id, status: 'existing', issues: [] };
      const jobs = await trx('aldi_asn_jobs as j').join('aldi_asn_messages as m', 'm.id', 'j.message_id').where('m.shipment_id', last.id).select('j.*').forUpdate('j');
      if (jobs.some(j => ['sent', 'sending', 'uncertain'].includes(j.state))) throw new Error('Már továbbított vagy bizonytalan kézbesítésű ASN nem építhető át. Korrekcióhoz ALDI-egyeztetés szükséges.');
      await trx('aldi_asn_jobs').whereIn('message_id', jobs.map(j => j.message_id)).update({ state: 'superseded' });
      await event(trx, last.id, null, 'superseded', 'Még nem továbbított ASN helyett új, ellenőrzött változat készül.');
    }
    const data = await source(trx, truckId), profile = await getProfile(trx), check = analyse(data, profile);
    if (!data.truck.is_loaded) throw new Error('ASN csak a Rakodva állapot sikeres mentése után készíthető.');
    const [shipment] = await trx('aldi_asn_shipments').insert({ truck_id: truckId, generation: (last?.generation || 0) + 1, source: JSON.stringify(data), profile: JSON.stringify(profile), issues: JSON.stringify(check.issues) }).returning('*');
    const messages = [];
    if (check.ready) for (const [index, group] of check.groups.entries()) {
      const asnNumber = `GAVA-${shipment.id}-${index + 1}`, controlReference = `GA${shipment.id}X${index + 1}`;
      // Build before commit: if character encoding is invalid, retain a blocked attempt instead of a partial set.
      const raw = buildMessage(group, { asnNumber, controlReference, deliveryDate: data.truck.delivery_date });
      const [message] = await trx('aldi_asn_messages').insert({ shipment_id: shipment.id, asn_number: asnNumber, filename: `${asnNumber}.edi`, snapshot: JSON.stringify(group), profile: JSON.stringify(group.profile), raw_bytes: raw, sha256: crypto.createHash('sha256').update(raw).digest('hex') }).returning('id');
      await trx('aldi_asn_jobs').insert({ message_id: message.id });
      messages.push(message.id);
    }
    await event(trx, shipment.id, null, check.ready ? 'queued' : 'blocked', check.ready ? 'Warehouse DESADV elkészült, küldésre vár.' : 'Az ASN kötelező adatai hiányoznak vagy nem egyeznek.', { issues: check.issues, messages });
    return { shipmentId: shipment.id, status: check.ready ? 'queued' : 'blocked', issues: check.issues, messages };
  }
  async function prepare(truckId, regenerate = false) { return db.transaction(trx => capture(trx, truckId, regenerate)); }
  async function list() {
    const shipments = await db('aldi_asn_shipments as s').join('aldi_trucks as t', 't.id', 's.truck_id').select('s.id', 's.truck_id', 's.generation', 's.created_at', 's.issues', 't.truck_number').orderBy('s.id', 'desc').limit(100);
    const jobs = await db('aldi_asn_messages as m').join('aldi_asn_jobs as j', 'j.message_id', 'm.id').whereIn('m.shipment_id', shipments.map(s => s.id)).select('m.shipment_id', 'm.id', 'm.asn_number', 'j.state', 'j.error');
    return shipments.map(s => ({ ...s, messages: jobs.filter(j => j.shipment_id === s.id) }));
  }
  async function detail(id) {
    const shipment = await db('aldi_asn_shipments').where({ id }).first();
    if (!shipment) return null;
    const messages = await db('aldi_asn_messages as m').join('aldi_asn_jobs as j', 'j.message_id', 'm.id').where('m.shipment_id', id).select('m.*', 'j.state', 'j.error', 'j.attempts');
    return { ...shipment, messages: messages.map(({ raw_bytes, ...m }) => ({ ...m, text: require('iconv-lite').decode(raw_bytes, m.profile.syntax === 'UNOD' ? 'iso-8859-2' : 'latin1') })), events: await db('aldi_asn_events').where({ shipment_id: id }).orderBy('id') };
  }
  return { db, event, source, audit, capture, prepare, list, detail, getProfile };
}
module.exports = { createAsn };
