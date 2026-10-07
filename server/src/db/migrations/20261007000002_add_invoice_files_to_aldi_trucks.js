exports.up = async function(knex) {
  await knex.schema.alterTable('aldi_trucks', table => {
    table.jsonb('invoice_files').nullable();
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('aldi_trucks', table => {
    table.dropColumn('invoice_files');
  });
};
