/**
 * Migration: Add partner_chain_labels table
 * Lánc jellemzők (Penny, Spar, Tesco, Aldi, egyéb) hozzárendelése partnerekhez.
 */
exports.up = async function(knex) {
  await knex.schema.createTable('partner_chain_labels', table => {
    table.increments('id').primary();
    table.integer('partner_id').notNullable()
      .references('id').inTable('partners').onDelete('CASCADE');
    table.string('label').notNullable(); // pl. 'Penny', 'Spar', 'Tesco', 'Aldi', 'egyéb'
    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('partner_chain_labels');
};
