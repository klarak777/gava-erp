/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('ai_actions_audit', (table) => {
    table.increments('id').primary();
    table.string('action_name').notNullable(); 
    table.jsonb('payload').notNullable(); 
    table.string('status').notNullable().defaultTo('pending'); 
    table.string('user_id').nullable(); 
    table.jsonb('execution_result').nullable(); 
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('ai_actions_audit');
};
