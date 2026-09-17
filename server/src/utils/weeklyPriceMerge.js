const clean = value => String(value ?? '').replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
const dateValue = value => {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
};

function identity(line) {
  const product = clean(line.gtin) || `name:${clean(line.xlsx_product_name).toLocaleLowerCase('hu-HU')}`;
  const start = dateValue(line.original_period_start || line.delivery_period_start);
  const end = dateValue(line.original_period_end || line.delivery_period_end);
  return `${product}|${start}|${end}`;
}

function content(line) {
  return JSON.stringify([
    clean(line.gtin), clean(line.xlsx_product_name), Number(line.carton_content) || null,
    clean(line.origin), clean(line.packaging), clean(line.crate_cost), clean(line.unit_cost),
    dateValue(line.original_period_start || line.delivery_period_start),
    dateValue(line.original_period_end || line.delivery_period_end)
  ]);
}

function classifyWeeklyPriceUpload(existingLines, incomingLines) {
  const existingByIdentity = new Map();
  for (const line of existingLines || []) {
    const key = identity(line);
    if (!existingByIdentity.has(key)) existingByIdentity.set(key, []);
    existingByIdentity.get(key).push(line);
  }

  const newIndexes = [];
  const changedIndexes = [];
  const duplicateIndexes = [];
  const incomingByIdentity = new Map();
  for (let index = 0; index < (incomingLines || []).length; index += 1) {
    const line = incomingLines[index];
    const key = identity(line);
    const lineContent = content(line);
    const candidates = existingByIdentity.get(key) || [];
    const earlierIncoming = incomingByIdentity.get(key) || [];
    if (candidates.some(candidate => content(candidate) === lineContent) || earlierIncoming.includes(lineContent)) {
      duplicateIndexes.push(index);
    } else if (candidates.length || earlierIncoming.length) {
      changedIndexes.push(index);
    } else {
      newIndexes.push(index);
    }
    earlierIncoming.push(lineContent);
    incomingByIdentity.set(key, earlierIncoming);
  }
  return { newIndexes, changedIndexes, duplicateIndexes };
}

module.exports = { classifyWeeklyPriceUpload };
