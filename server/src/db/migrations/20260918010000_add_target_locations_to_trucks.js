exports.up = function(knex) {
  return knex.schema.alterTable('aldi_trucks', table => {
    table.jsonb('target_locations').nullable().defaultTo('[]')
      .comment('A kamionhoz rendelt cél lokáció sorok azonosítói (JSON tömb)');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('aldi_trucks', table => {
    table.dropColumn('target_locations');
  });
};
