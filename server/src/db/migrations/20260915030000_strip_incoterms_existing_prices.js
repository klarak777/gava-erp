/**
 * Migration: Strip Incoterms (DDP, DPT, EXW, FCA, CPT, CIP, DAP, DPU, FAS, FOB, CFR, CIF)
 * from aldi_weekly_price_lines and aldi_price_currency_periods tables.
 */

exports.up = async function(knex) {
  const hasPriceLines = await knex.schema.hasTable('aldi_weekly_price_lines');
  if (hasPriceLines) {
    await knex.raw(`
      UPDATE aldi_weekly_price_lines
      SET 
        crate_cost = TRIM(REGEXP_REPLACE(REGEXP_REPLACE(crate_cost, '\\y(DDP|DPT|EXW|FCA|CPT|CIP|DAP|DPU|FAS|FOB|CFR|CIF)\\y', '', 'gi'), '\\s+', ' ', 'g')),
        unit_cost  = TRIM(REGEXP_REPLACE(REGEXP_REPLACE(unit_cost,  '\\y(DDP|DPT|EXW|FCA|CPT|CIP|DAP|DPU|FAS|FOB|CFR|CIF)\\y', '', 'gi'), '\\s+', ' ', 'g'))
      WHERE crate_cost IS NOT NULL OR unit_cost IS NOT NULL;
    `);
  }

  const hasCurrencyPeriods = await knex.schema.hasTable('aldi_price_currency_periods');
  if (hasCurrencyPeriods) {
    await knex.raw(`
      UPDATE aldi_price_currency_periods
      SET 
        crate_cost = TRIM(REGEXP_REPLACE(REGEXP_REPLACE(crate_cost, '\\y(DDP|DPT|EXW|FCA|CPT|CIP|DAP|DPU|FAS|FOB|CFR|CIF)\\y', '', 'gi'), '\\s+', ' ', 'g')),
        unit_cost  = TRIM(REGEXP_REPLACE(REGEXP_REPLACE(unit_cost,  '\\y(DDP|DPT|EXW|FCA|CPT|CIP|DAP|DPU|FAS|FOB|CFR|CIF)\\y', '', 'gi'), '\\s+', ' ', 'g'))
      WHERE crate_cost IS NOT NULL OR unit_cost IS NOT NULL;
    `);
  }
};

exports.down = function(knex) {
  return Promise.resolve();
};
