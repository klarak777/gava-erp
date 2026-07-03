exports.up = async function (knex) {
  // Május 31-ig visszamenőleg minden beállítása is_sent = true-ra
  await knex('transport_orders')
    .whereIn('id', function() {
      this.select('transport_orders.id')
        .from('transport_orders')
        .join('shipments', 'transport_orders.shipment_id', 'shipments.id')
        .where('shipments.loading_date', '<=', '2026-05-31')
        .orWhere('transport_orders.loading_date', '<=', '2026-05-31');
    })
    .update({
      is_sent: true
    });

  await knex('ekaer_records')
    .whereIn('id', function() {
      this.select('ekaer_records.id')
        .from('ekaer_records')
        .join('shipments', 'ekaer_records.shipment_id', 'shipments.id')
        .where('shipments.loading_date', '<=', '2026-05-31')
        .orWhere('ekaer_records.load_date', '<=', '2026-05-31');
    })
    .update({
      is_sent: true
    });
};

exports.down = async function (knex) {
  // Mivel nem tudjuk pontosan, melyik volt eredetileg true és melyik false május 31 előtt,
  // ez a migráció nem fordítható vissza tökéletesen (irreversible data change),
  // de üres down blokkot hagyunk, hogy ne blokkolja a rollback-et.
};
