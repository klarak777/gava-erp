exports.up = async function (knex) {
  // EKAER tábla visszaállítása
  await knex.schema.table('ekaer_records', function (table) {
    table.dropColumn('is_sent_ghu');
    table.dropColumn('is_sent_log');
    table.boolean('is_sent').defaultTo(false);
  });

  // Fuvarmegbízások tábla visszaállítása
  await knex.schema.table('transport_orders', function (table) {
    table.dropColumn('is_sent_ghu');
    table.dropColumn('is_sent_log');
    table.boolean('is_sent').defaultTo(false);
  });
};

exports.down = async function (knex) {
  // EKAER tábla
  await knex.schema.table('ekaer_records', function (table) {
    table.dropColumn('is_sent');
    table.boolean('is_sent_ghu').defaultTo(false);
    table.boolean('is_sent_log').defaultTo(false);
  });

  // Fuvarmegbízások tábla
  await knex.schema.table('transport_orders', function (table) {
    table.dropColumn('is_sent');
    table.boolean('is_sent_ghu').defaultTo(false);
    table.boolean('is_sent_log').defaultTo(false);
  });
};
