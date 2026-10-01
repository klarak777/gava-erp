exports.up = function(knex) {
  return knex.schema.alterTable('employees', table => {
    table.string('pda_session_token');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('employees', table => {
    table.dropColumn('pda_session_token');
  });
};
