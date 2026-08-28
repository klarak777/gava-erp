exports.up = async function(knex) {
  // 1. Audit existing data
  // Check if there are any lines where loaded_cartons > ordered_cartons
  const invalidLines = await knex('aldi_daily_order_lines as l')
    .select('l.id', 'l.ordered_cartons', knex.raw('COALESCE(SUM(t.ordered_cartons), 0) as loaded_cartons'))
    .leftJoin('aldi_truck_lines as t', 't.aldi_daily_order_line_id', 'l.id')
    .groupBy('l.id')
    .having(knex.raw('COALESCE(SUM(t.ordered_cartons), 0) > l.ordered_cartons'));

  if (invalidLines && invalidLines.length > 0) {
    console.error('CRITICAL BACKFILL ERROR: Found lines where loaded_cartons > ordered_cartons:', invalidLines);
    throw new Error(`Migration aborted. Data inconsistency detected. ${invalidLines.length} lines have loaded_cartons > ordered_cartons. Manual intervention required.`);
  }

  // 2. Add sent_cartons column
  await knex.schema.alterTable('aldi_daily_order_lines', function(table) {
    table.decimal('sent_cartons', 10, 3).notNullable().defaultTo(0);
  });

  // 3. Backfill data
  // Update sent_cartons = ordered_cartons where the parent order has sent_to_rakodas = true
  // OR where there is already quantity on a truck (loaded_cartons > 0).
  // Note: SQLite doesn't support JOIN in UPDATE, so we use a subquery or knex builder.
  // Wait, the ERP uses PostgreSQL or MySQL? Or SQLite locally? The prod uses PG (`pg_dump`).
  // The docker uses PG. We can use a standard subquery.
  await knex.raw(`
    UPDATE aldi_daily_order_lines
    SET sent_cartons = ordered_cartons
    WHERE id IN (
      SELECT l.id
      FROM aldi_daily_order_lines l
      JOIN aldi_daily_orders o ON o.id = l.daily_order_id
      LEFT JOIN aldi_truck_lines t ON t.aldi_daily_order_line_id = l.id
      GROUP BY l.id, o.sent_to_rakodas
      HAVING o.sent_to_rakodas = true OR COALESCE(SUM(t.ordered_cartons), 0) > 0
    )
  `);

  // 4. Add Check Constraint
  // In sqlite check constraints can be added with alter table add constraint on some versions, but knex often struggles. 
  // Let's use raw check constraint for Postgres/MySQL. If it's sqlite, it might fail.
  const client = knex.client.config.client;
  if (client === 'pg' || client === 'mysql' || client === 'mysql2') {
    await knex.raw(`
      ALTER TABLE aldi_daily_order_lines
      ADD CONSTRAINT check_sent_cartons_bounds
      CHECK (sent_cartons >= 0 AND sent_cartons <= ordered_cartons)
    `);
  }
};

exports.down = async function(knex) {
  const client = knex.client.config.client;
  if (client === 'pg' || client === 'mysql' || client === 'mysql2') {
    await knex.raw(`
      ALTER TABLE aldi_daily_order_lines
      DROP CONSTRAINT IF EXISTS check_sent_cartons_bounds
    `);
  }

  await knex.schema.alterTable('aldi_daily_order_lines', function(table) {
    table.dropColumn('sent_cartons');
  });
};
