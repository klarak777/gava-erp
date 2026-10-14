exports.up = async db => {
  await db.schema.alterTable('aldi_daily_order_lines', t => t.string('edi_line_reference', 6).nullable());
  await db.schema.alterTable('aldi_truck_lines', t => t.string('asn_order_line_reference', 6).nullable());
  await db.schema.alterTable('aldi_trucks', t => t.timestamp('asn_loaded_at', { useTz: true }).nullable());
  await db.schema.alterTable('sscc_labels', t => { t.date('asn_best_before').nullable(); t.date('asn_expiry_date').nullable(); });
  await db.schema.createTable('aldi_asn_settings', t => { t.integer('id').primary(); t.jsonb('profile').notNullable(); });
  await db('aldi_asn_settings').insert({ id: 1, profile: JSON.stringify({ sender: '5990696117005', supplier: '5990696117005', receiver: '', buyer: '', syntax: 'UNOC', variant: 'lpn_item', mode: 'test', confirmed: false, quantityConfirmed: false, requireLot: false, requiredDateType: 'none', destinations: [] }) });
  await db.schema.createTable('aldi_asn_shipments', t => {
    t.bigIncrements('id'); t.integer('truck_id').notNullable().references('id').inTable('aldi_trucks').onDelete('RESTRICT');
    t.integer('generation').notNullable(); t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(db.fn.now());
    t.jsonb('source').notNullable(); t.jsonb('profile').notNullable(); t.jsonb('issues').notNullable(); t.unique(['truck_id', 'generation']);
  });
  await db.schema.createTable('aldi_asn_messages', t => {
    t.bigIncrements('id'); t.bigInteger('shipment_id').notNullable().references('id').inTable('aldi_asn_shipments').onDelete('RESTRICT');
    t.string('asn_number', 35).notNullable().unique(); t.string('filename', 100).notNullable().unique(); t.jsonb('snapshot').notNullable();
    t.jsonb('profile').notNullable(); t.binary('raw_bytes').notNullable(); t.string('sha256', 64).notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(db.fn.now());
  });
  await db.schema.createTable('aldi_asn_jobs', t => {
    t.bigInteger('message_id').primary().references('id').inTable('aldi_asn_messages').onDelete('RESTRICT');
    t.string('state', 30).notNullable().defaultTo('queued'); t.integer('attempts').notNullable().defaultTo(0);
    t.timestamp('next_attempt_at', { useTz: true }).notNullable().defaultTo(db.fn.now()); t.timestamp('last_attempt_at', { useTz: true }); t.text('error');
  });
  await db.schema.createTable('aldi_asn_events', t => {
    t.bigIncrements('id'); t.bigInteger('shipment_id').nullable().references('id').inTable('aldi_asn_shipments').onDelete('RESTRICT');
    t.bigInteger('message_id').nullable().references('id').inTable('aldi_asn_messages').onDelete('RESTRICT');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(db.fn.now()); t.string('state', 40).notNullable(); t.text('description').notNullable(); t.jsonb('details').notNullable().defaultTo('{}');
  });
  await db.raw(`CREATE FUNCTION aldi_asn_immutable() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Az ASN archívum nem módosítható vagy törölhető.'; END $$`);
  for (const table of ['aldi_asn_shipments', 'aldi_asn_messages', 'aldi_asn_events']) {
    await db.raw('CREATE TRIGGER asn_immutable BEFORE UPDATE OR DELETE ON ?? FOR EACH ROW EXECUTE FUNCTION aldi_asn_immutable()', [table]);
    await db.raw('CREATE TRIGGER asn_no_truncate BEFORE TRUNCATE ON ?? FOR EACH STATEMENT EXECUTE FUNCTION aldi_asn_immutable()', [table]);
  }
};
exports.down = async db => {
  if (await db('aldi_asn_shipments').first()) throw new Error('Nem üres ASN archívum nem vonható vissza.');
  for (const table of ['aldi_asn_events', 'aldi_asn_jobs', 'aldi_asn_messages', 'aldi_asn_shipments', 'aldi_asn_settings']) await db.schema.dropTable(table);
  await db.raw('DROP FUNCTION aldi_asn_immutable()');
  await db.schema.alterTable('aldi_trucks', t => t.dropColumn('asn_loaded_at'));
  await db.schema.alterTable('sscc_labels', t => t.dropColumns('asn_best_before', 'asn_expiry_date'));
  await db.schema.alterTable('aldi_truck_lines', t => t.dropColumn('asn_order_line_reference'));
  await db.schema.alterTable('aldi_daily_order_lines', t => t.dropColumn('edi_line_reference'));
};
