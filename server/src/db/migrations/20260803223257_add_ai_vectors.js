/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // We need to run raw query for the vector extension
  await knex.raw('CREATE EXTENSION IF NOT EXISTS vector;');
  
  await knex.schema.createTable('ai_documents', (table) => {
    table.increments('id').primary();
    table.string('filename').notNullable();
    table.string('original_name').notNullable();
    table.string('mimetype').notNullable();
    table.string('category').nullable(); // e.g., 'legal', 'finance', 'general'
    table.timestamps(true, true);
  });

  await knex.schema.createTable('ai_vectors', (table) => {
    table.increments('id').primary();
    table.integer('document_id').unsigned().references('id').inTable('ai_documents').onDelete('CASCADE');
    table.text('content').notNullable(); // The chunk of text
    table.specificType('embedding', 'vector(1536)'); // 1536 is for text-embedding-3-small
    table.jsonb('metadata').nullable(); // any additional metadata
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('ai_vectors');
  await knex.schema.dropTableIfExists('ai_documents');
  // We generally don't drop the extension in down migrations in case other things use it, but we could:
  // await knex.raw('DROP EXTENSION IF EXISTS vector;');
};
