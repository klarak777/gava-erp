/**
 * Migration: Strip Incoterms (DDP, DPT, EXW, FCA, CPT, CIP, DAP, DPU, FAS, FOB, CFR, CIF)
 * and remove decimals for HUF / Ft prices from aldi_weekly_price_lines and aldi_price_currency_periods tables.
 */

exports.up = async function(knex) {
  const hasPriceLines = await knex.schema.hasTable('aldi_weekly_price_lines');
  if (hasPriceLines) {
    await knex.raw(`
      UPDATE aldi_weekly_price_lines
      SET 
        crate_cost = CASE 
          WHEN crate_cost ~* 'Ft|HUF' THEN REGEXP_REPLACE(TRIM(REGEXP_REPLACE(REGEXP_REPLACE(crate_cost, '\\y(DDP|DPT|EXW|FCA|CPT|CIP|DAP|DPU|FAS|FOB|CFR|CIF)\\y', '', 'gi'), '\\s+', ' ', 'g')), '[,.]\\d+', '', 'g')
          ELSE TRIM(REGEXP_REPLACE(REGEXP_REPLACE(crate_cost, '\\y(DDP|DPT|EXW|FCA|CPT|CIP|DAP|DPU|FAS|FOB|CFR|CIF)\\y', '', 'gi'), '\\s+', ' ', 'g'))
        END,
        unit_cost  = CASE 
          WHEN unit_cost ~* 'Ft|HUF' THEN REGEXP_REPLACE(TRIM(REGEXP_REPLACE(REGEXP_REPLACE(unit_cost,  '\\y(DDP|DPT|EXW|FCA|CPT|CIP|DAP|DPU|FAS|FOB|CFR|CIF)\\y', '', 'gi'), '\\s+', ' ', 'g')), '[,.]\\d+', '', 'g')
          ELSE TRIM(REGEXP_REPLACE(REGEXP_REPLACE(unit_cost,  '\\y(DDP|DPT|EXW|FCA|CPT|CIP|DAP|DPU|FAS|FOB|CFR|CIF)\\y', '', 'gi'), '\\s+', ' ', 'g'))
        END
      WHERE crate_cost IS NOT NULL OR unit_cost IS NOT NULL;
    `);
  }

  const hasCurrencyPeriods = await knex.schema.hasTable('aldi_price_currency_periods');
  if (hasCurrencyPeriods) {
    await knex.raw(`
      UPDATE aldi_price_currency_periods
      SET 
        crate_cost = CASE 
          WHEN crate_cost ~* 'Ft|HUF' THEN REGEXP_REPLACE(TRIM(REGEXP_REPLACE(REGEXP_REPLACE(crate_cost, '\\y(DDP|DPT|EXW|FCA|CPT|CIP|DAP|DPU|FAS|FOB|CFR|CIF)\\y', '', 'gi'), '\\s+', ' ', 'g')), '[,.]\\d+', '', 'g')
          ELSE TRIM(REGEXP_REPLACE(REGEXP_REPLACE(crate_cost, '\\y(DDP|DPT|EXW|FCA|CPT|CIP|DAP|DPU|FAS|FOB|CFR|CIF)\\y', '', 'gi'), '\\s+', ' ', 'g'))
        END,
        unit_cost  = CASE 
          WHEN unit_cost ~* 'Ft|HUF' THEN REGEXP_REPLACE(TRIM(REGEXP_REPLACE(REGEXP_REPLACE(unit_cost,  '\\y(DDP|DPT|EXW|FCA|CPT|CIP|DAP|DPU|FAS|FOB|CFR|CIF)\\y', '', 'gi'), '\\s+', ' ', 'g')), '[,.]\\d+', '', 'g')
          ELSE TRIM(REGEXP_REPLACE(REGEXP_REPLACE(unit_cost,  '\\y(DDP|DPT|EXW|FCA|CPT|CIP|DAP|DPU|FAS|FOB|CFR|CIF)\\y', '', 'gi'), '\\s+', ' ', 'g'))
        END
      WHERE crate_cost IS NOT NULL OR unit_cost IS NOT NULL;
    `);
  }
};

exports.down = function(knex) {
  return Promise.resolve();
};
