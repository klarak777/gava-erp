const knex = require('knex');
const knexConfig = require('../../knexfile');
const types = require('pg').types;

// 1082 is the OID for the PostgreSQL DATE type.
// We return the raw string (YYYY-MM-DD) instead of parsing it into a local JS Date object
// to prevent timezone shifts (e.g. 2026-06-02 -> 2026-06-01T22:00:00Z) when serialized to JSON.
types.setTypeParser(1082, function(val) {
  return val;
});

const environment = process.env.NODE_ENV || 'development';
const db = knex(knexConfig[environment]);

module.exports = db;
