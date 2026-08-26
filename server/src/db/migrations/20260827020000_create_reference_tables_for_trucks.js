exports.up = async function(knex) {
  await knex.schema.createTable('ref_packaging_types', table => {
    table.increments('id').primary();
    table.string('name').notNullable().unique();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('ref_origin_countries', table => {
    table.increments('id').primary();
    table.string('name').notNullable().unique();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('ref_pallet_types', table => {
    table.increments('id').primary();
    table.string('name').notNullable().unique();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('ref_pallet_types');
  await knex.schema.dropTableIfExists('ref_origin_countries');
  await knex.schema.dropTableIfExists('ref_packaging_types');
};
