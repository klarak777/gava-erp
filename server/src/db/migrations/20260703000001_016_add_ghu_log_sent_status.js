exports.up = async function (knex) {
  // 1. transport_orders tábla módosítása
  await knex.schema.table('transport_orders', table => {
    table.boolean('is_sent_ghu').defaultTo(false);
    table.boolean('is_sent_log').defaultTo(false);
  });

  // 2. ekaer_records tábla módosítása
  await knex.schema.table('ekaer_records', table => {
    table.boolean('is_sent_ghu').defaultTo(false);
    table.boolean('is_sent_log').defaultTo(false);
  });

  // 3. Adatok átemelése a régi is_sent mezőből (mindkét új mezőbe true lesz, ami korábban is_sent = true volt)
  await knex('transport_orders')
    .where('is_sent', true)
    .update({
      is_sent_ghu: true,
      is_sent_log: true
    });

  await knex('ekaer_records')
    .where('is_sent', true)
    .update({
      is_sent_ghu: true,
      is_sent_log: true
    });

  // Opcionálisan később törölhető a régi is_sent mező, de egyelőre meghagyjuk a biztonság kedvéért.
};

exports.down = async function (knex) {
  await knex.schema.table('transport_orders', table => {
    table.dropColumn('is_sent_ghu');
    table.dropColumn('is_sent_log');
  });

  await knex.schema.table('ekaer_records', table => {
    table.dropColumn('is_sent_ghu');
    table.dropColumn('is_sent_log');
  });
};
