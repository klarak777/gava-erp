const { generateSscc } = require('../../src/utils/gs1');
const profile = { sender: '5990696117005', supplier: '5990696117005', receiver: '4099200007472', buyer: '4099200005096', syntax: 'UNOC', variant: 'lpn_item', mode: 'test', confirmed: false, quantityConfirmed: false, requiredDateType: 'none', requireLot: false, destinations: [] };
function source() {
  return {
    truck: { id: 1, delivery_date: '2026-10-15', is_loaded: true },
    lines: [{ id: 1, aldi_truck_id: 1, aldi_daily_order_line_id: 1, product_name: 'Teszttermék', gtin: '4061462846892', edi_line_reference: '00040', destination: 'Raktár A', ordered_cartons: 100, picked_cartons: 30, order: { base_order_number: '4500012345', ordered_cartons: 100, fulfilled_cartons: 30 } }],
    commissions: [{ id: 1, aldi_truck_id: 1, aldi_truck_line_id: 1, cartons: 30, pallets: 1, lot_number: 'LOT-1' }],
    labels: [{ id: 1, sscc: generateSscc(1, '5999883976'), commission_line_id: 1, aldi_truck_line_id: 1, picked_cartons: 30, is_provisional: false, is_consolidated_master: false }]
  };
}
module.exports = { profile, source };
