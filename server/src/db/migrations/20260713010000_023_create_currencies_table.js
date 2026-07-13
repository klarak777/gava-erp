exports.up = async function(knex) {
  await knex.schema.createTable('currencies', table => {
    table.increments('id').primary();
    table.string('code', 10).notNullable().unique();
    table.string('name', 50);
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });

  // Alap devizák előre felvéve
  await knex('currencies').insert([
    { code: 'EUR', name: 'Euro' },
    { code: 'HUF', name: 'Magyar Forint' },
    { code: 'USD', name: 'US Dollar' }
  ]);
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('currencies');
};
