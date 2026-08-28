const baseOrderNumber = value => String(value || '').replace(/-\d+$/, '');
const num = value => Number.parseFloat(value) || 0;

exports.up = async function up(knex) {
  await knex.schema.createTable('aldi_order_families', table => {
    table.increments('id').primary();
    table.string('base_order_number', 100).notNullable().unique();
    table.integer('current_order_id').nullable();
    table.timestamps(true, true);
  });

  await knex.schema.alterTable('aldi_daily_orders', table => {
    table.integer('order_family_id').nullable().references('id').inTable('aldi_order_families').onDelete('CASCADE');
    table.integer('version_number').notNullable().defaultTo(1);
    table.string('version_status', 20).notNullable().defaultTo('current');
    table.integer('superseded_by_order_id').nullable().references('id').inTable('aldi_daily_orders').onDelete('SET NULL');
    table.timestamp('superseded_at').nullable();
    table.string('pdf_hash', 64).nullable();
  });

  await knex.schema.createTable('aldi_order_item_states', table => {
    table.increments('id').primary();
    table.integer('order_family_id').notNullable().references('id').inTable('aldi_order_families').onDelete('CASCADE');
    table.string('gtin', 50).notNullable();
    table.decimal('sent_cartons', 10, 3).notNullable().defaultTo(0);
    table.boolean('requires_reconciliation').notNullable().defaultTo(false);
    table.text('reconciliation_reason').nullable();
    table.timestamps(true, true);
    table.unique(['order_family_id', 'gtin']);
    table.check('sent_cartons >= 0', [], 'check_aldi_item_state_sent_nonnegative');
  });

  await knex.schema.alterTable('aldi_daily_order_lines', table => {
    table.integer('order_item_state_id').nullable().references('id').inTable('aldi_order_item_states').onDelete('SET NULL');
    table.decimal('previous_ordered_cartons', 10, 3).nullable();
    table.decimal('quantity_delta', 10, 3).nullable();
    table.string('change_type', 20).notNullable().defaultTo('unchanged');
    table.boolean('is_virtual_removed').notNullable().defaultTo(false);
  });

  await knex.schema.alterTable('aldi_truck_lines', table => {
    table.integer('order_item_state_id').nullable().references('id').inTable('aldi_order_item_states').onDelete('RESTRICT');
    table.integer('row_order').notNullable().defaultTo(0);
  });

  await knex.schema.alterTable('aldi_commission_lines', table => {
    table.integer('aldi_truck_line_id').nullable().references('id').inTable('aldi_truck_lines').onDelete('SET NULL');
    table.integer('order_item_state_id').nullable().references('id').inTable('aldi_order_item_states').onDelete('RESTRICT');
  });

  const orders = await knex('aldi_daily_orders').orderBy([{ column: 'created_at', order: 'asc' }, { column: 'id', order: 'asc' }]);
  const grouped = new Map();
  for (const order of orders) {
    const base = baseOrderNumber(order.order_number);
    if (!grouped.has(base)) grouped.set(base, []);
    grouped.get(base).push(order);
  }

  for (const [base, familyOrders] of grouped) {
    const [family] = await knex('aldi_order_families').insert({ base_order_number: base }).returning('*');
    for (let index = 0; index < familyOrders.length; index += 1) {
      const order = familyOrders[index];
      await knex('aldi_daily_orders').where({ id: order.id }).update({
        order_family_id: family.id,
        version_number: index + 1,
        version_status: index === familyOrders.length - 1 ? 'current' : 'superseded',
        superseded_by_order_id: index < familyOrders.length - 1 ? familyOrders[index + 1].id : null,
        superseded_at: index < familyOrders.length - 1 ? familyOrders[index + 1].created_at : null
      });
    }
    const currentOrder = familyOrders[familyOrders.length - 1];
    await knex('aldi_order_families').where({ id: family.id }).update({ current_order_id: currentOrder.id });

    const lines = await knex('aldi_daily_order_lines as l')
      .join('aldi_daily_orders as o', 'o.id', 'l.daily_order_id')
      .where('o.order_family_id', family.id)
      .select('l.*', 'o.version_number');
    const byGtin = new Map();
    for (const line of lines) {
      if (!byGtin.has(line.gtin)) byGtin.set(line.gtin, []);
      byGtin.get(line.gtin).push(line);
    }

    for (const [gtin, itemLines] of byGtin) {
      const lineIds = itemLines.map(line => line.id);
      const loadedRow = await knex('aldi_truck_lines').whereIn('aldi_daily_order_line_id', lineIds).sum('ordered_cartons as total').first();
      const loaded = num(loadedRow && loadedRow.total);
      const historicalSent = Math.max(0, ...itemLines.map(line => num(line.sent_cartons)));
      const sent = Math.max(loaded, historicalSent);
      const currentLine = itemLines.find(line => line.daily_order_id === currentOrder.id);
      const currentOrdered = currentLine ? num(currentLine.ordered_cartons) : 0;
      const conflict = sent > currentOrdered;
      const [state] = await knex('aldi_order_item_states').insert({
        order_family_id: family.id,
        gtin,
        sent_cartons: sent,
        requires_reconciliation: conflict,
        reconciliation_reason: conflict ? `A mozgatott mennyiség (${sent}) meghaladja az aktuális rendelést (${currentOrdered}).` : null
      }).returning('*');
      await knex('aldi_daily_order_lines').whereIn('id', lineIds).update({ order_item_state_id: state.id });
      await knex('aldi_truck_lines').whereIn('aldi_daily_order_line_id', lineIds).update({ order_item_state_id: state.id });
    }
  }

  await knex.raw('ALTER TABLE aldi_order_families ADD CONSTRAINT aldi_order_families_current_order_fk FOREIGN KEY (current_order_id) REFERENCES aldi_daily_orders(id) ON DELETE SET NULL');
  await knex.raw("ALTER TABLE aldi_daily_orders ALTER COLUMN order_family_id SET NOT NULL");
  await knex.raw("ALTER TABLE aldi_daily_orders ADD CONSTRAINT check_aldi_order_version_status CHECK (version_status IN ('current', 'superseded'))");
  await knex.raw('ALTER TABLE aldi_daily_orders ADD CONSTRAINT uq_aldi_order_family_version UNIQUE (order_family_id, version_number)');
  await knex.raw('ALTER TABLE aldi_daily_orders ADD CONSTRAINT uq_aldi_order_family_pdf_hash UNIQUE (order_family_id, pdf_hash)');
  await knex.raw('ALTER TABLE aldi_daily_order_lines ALTER COLUMN order_item_state_id SET NOT NULL');
  await knex.schema.alterTable('aldi_daily_orders', table => table.index(['order_family_id', 'version_number']));
  await knex.schema.alterTable('aldi_daily_order_lines', table => table.index('order_item_state_id'));
  await knex.schema.alterTable('aldi_truck_lines', table => table.index('order_item_state_id'));

  const hasOldSent = await knex.schema.hasColumn('aldi_daily_order_lines', 'sent_cartons');
  if (hasOldSent) {
    await knex.raw('ALTER TABLE aldi_daily_order_lines DROP CONSTRAINT IF EXISTS check_sent_cartons_bounds');
    await knex.schema.alterTable('aldi_daily_order_lines', table => table.dropColumn('sent_cartons'));
  }
};

exports.down = async function down(knex) {
  const hasOldSent = await knex.schema.hasColumn('aldi_daily_order_lines', 'sent_cartons');
  if (!hasOldSent) {
    await knex.schema.alterTable('aldi_daily_order_lines', table => table.decimal('sent_cartons', 10, 3).notNullable().defaultTo(0));
    await knex.raw(`UPDATE aldi_daily_order_lines l SET sent_cartons = s.sent_cartons FROM aldi_order_item_states s WHERE s.id = l.order_item_state_id`);
  }
  await knex.schema.alterTable('aldi_commission_lines', table => table.dropColumns('aldi_truck_line_id', 'order_item_state_id'));
  await knex.schema.alterTable('aldi_truck_lines', table => table.dropColumns('order_item_state_id', 'row_order'));
  await knex.schema.alterTable('aldi_daily_order_lines', table => table.dropColumns('order_item_state_id', 'previous_ordered_cartons', 'quantity_delta', 'change_type', 'is_virtual_removed'));
  await knex.raw('ALTER TABLE aldi_order_families DROP CONSTRAINT IF EXISTS aldi_order_families_current_order_fk');
  await knex.raw('ALTER TABLE aldi_daily_orders DROP CONSTRAINT IF EXISTS check_aldi_order_version_status');
  await knex.raw('ALTER TABLE aldi_daily_orders DROP CONSTRAINT IF EXISTS uq_aldi_order_family_version');
  await knex.raw('ALTER TABLE aldi_daily_orders DROP CONSTRAINT IF EXISTS uq_aldi_order_family_pdf_hash');
  await knex.schema.alterTable('aldi_daily_orders', table => table.dropColumns('order_family_id', 'version_number', 'version_status', 'superseded_by_order_id', 'superseded_at', 'pdf_hash'));
  await knex.schema.dropTableIfExists('aldi_order_item_states');
  await knex.schema.dropTableIfExists('aldi_order_families');
};
