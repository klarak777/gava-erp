exports.up = async function (knex) {
  // Május 31-ig visszamenőleg minden beállítása is_received = true-ra
  await knex('shipment_lines')
    .whereIn('shipment_id', function () {
      this.select('id')
        .from('shipments')
        .where('loading_date', '<=', '2026-05-31');
    })
    .update({
      is_received: true
    });
};

exports.down = async function (knex) {
  // Mivel nem tudjuk pontosan, melyik volt eredetileg true és melyik false május 31 előtt,
  // ez a migráció nem fordítható vissza tökéletesen,
  // de üres down blokkot hagyunk, hogy ne blokkolja a rollback-et.
};
