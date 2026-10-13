exports.up = async function(knex) {
  await knex.schema.createTable('aldi_edi_test_files', t => {
    t.bigIncrements('id');
    t.timestamp('received_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.string('filename', 255).notNullable();
    t.string('source', 20).notNullable();
    t.string('sha256', 64).notNullable().unique();
    t.binary('raw_bytes').notNullable();
    t.jsonb('profile').notNullable();
  });
  await knex.schema.createTable('aldi_edi_test_versions', t => {
    t.bigIncrements('id');
    t.bigInteger('file_id').notNullable().references('id').inTable('aldi_edi_test_files');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.string('sender', 35).notNullable();
    t.string('receiver', 35).notNullable();
    t.string('buyer', 35).notNullable();
    t.string('order_number', 35).notNullable();
    t.string('message_reference', 14).notNullable();
    t.string('control_reference', 14).notNullable();
    t.integer('internal_version').notNullable();
    t.jsonb('snapshot').notNullable();
    t.unique(['sender', 'receiver', 'control_reference', 'message_reference']);
    t.unique(['sender', 'receiver', 'buyer', 'order_number', 'internal_version']);
  });
  await knex.schema.createTable('aldi_edi_test_events', t => {
    t.bigIncrements('id');
    t.bigInteger('file_id').nullable().references('id').inTable('aldi_edi_test_files');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.string('status', 30).notNullable();
    t.text('description').notNullable();
    t.jsonb('details').notNullable().defaultTo('{}');
    t.index(['file_id', 'id']);
  });
  await knex.raw(`CREATE FUNCTION aldi_edi_test_archive_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN RAISE EXCEPTION 'Az EDI tesztarchívum és napló bejegyzései nem módosíthatók vagy törölhetők'; END; $$`);
  for (const table of ['aldi_edi_test_files', 'aldi_edi_test_versions', 'aldi_edi_test_events']) {
    await knex.raw(`CREATE TRIGGER ${table}_immutable BEFORE UPDATE OR DELETE ON ${table} FOR EACH ROW EXECUTE FUNCTION aldi_edi_test_archive_immutable()`);
    await knex.raw(`CREATE TRIGGER ${table}_no_truncate BEFORE TRUNCATE ON ${table} FOR EACH STATEMENT EXECUTE FUNCTION aldi_edi_test_archive_immutable()`);
  }
};

exports.down = async function(knex) {
  for (const table of ['aldi_edi_test_files', 'aldi_edi_test_versions', 'aldi_edi_test_events']) {
    if (await knex.schema.hasTable(table) && await knex(table).first()) throw new Error('A fogadott EDI archívumot tartalmazó migráció nem vonható vissza automatikusan.');
  }
  for (const table of ['aldi_edi_test_events', 'aldi_edi_test_versions', 'aldi_edi_test_files']) await knex.schema.dropTableIfExists(table);
  await knex.raw('DROP FUNCTION IF EXISTS aldi_edi_test_archive_immutable()');
};
