exports.up = async function (knex) {
  // Bevételezve állapot levétele azokról a fuvarokról, amelyek Május 31 utániak
  await knex('shipment_lines')
    .whereIn('shipment_id', function() {
      this.select('id')
        .from('shipments')
        .where('loading_date', '>', '2026-05-31');
    })
    .update({
      is_received: false
    });
};

exports.down = async function (knex) {
  // Ez a migráció nem fordítható vissza tökéletesen
};
