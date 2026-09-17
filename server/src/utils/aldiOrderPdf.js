const crypto = require('crypto');

const itemPattern = /(?:^|\s)(\d{5})\s+(\d{13,14})\s+([\d.,]+)\s+(20\d{6})(?=\s|$)/;
const deletedPattern = /\b2\s*-\s*Deleted\b/i;

const isoDate = raw => `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
const quantityNumber = raw => Number.parseFloat(String(raw).replace(/,/g, '.'));

function parseLineItems(text) {
  const lines = String(text || '').split(/\r?\n/);
  const matches = [];

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(itemPattern);
    if (match) matches.push({ index, match });
  }

  const deletedItemIndexes = new Set();
  const actionHeader = lines.find(line => /Action\s+Code/i.test(line) && /\bLI\b/i.test(line));
  const actionBeforeItem = actionHeader
    ? actionHeader.search(/Action\s+Code/i) < actionHeader.search(/\bLI\b/i)
    : false;
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    if (!deletedPattern.test(lines[lineIndex])) continue;
    let nearest = null;
    for (let itemIndex = 0; itemIndex < matches.length; itemIndex += 1) {
      const distance = Math.abs(matches[itemIndex].index - lineIndex);
      const preferOnTie = nearest && distance === nearest.distance
        && (actionBeforeItem ? matches[itemIndex].index > lineIndex : matches[itemIndex].index < lineIndex);
      if (distance <= 6 && (!nearest || distance < nearest.distance || preferOnTie)) nearest = { itemIndex, distance };
    }
    if (nearest) deletedItemIndexes.add(nearest.itemIndex);
  }

  const items = matches.map((entry, itemIndex) => {
    const actionDeleted = deletedItemIndexes.has(itemIndex);
    const parsedQuantity = quantityNumber(entry.match[3]);

    return {
      lineItem: entry.match[1],
      gtin: entry.match[2],
      quantity: actionDeleted ? 0 : parsedQuantity,
      deliveryDate: isoDate(entry.match[4]),
      actionCode: actionDeleted ? '2-Deleted' : null
    };
  });

  const grouped = new Map();
  for (const item of items) {
    if (!Number.isFinite(item.quantity) || item.quantity < 0) continue;
    const key = `${item.gtin}|${item.deliveryDate}`;
    const current = grouped.get(key);
    if (!current) {
      grouped.set(key, { ...item });
    } else if (!item.actionCode) {
      current.quantity += item.quantity;
      current.actionCode = null;
    }
  }

  return [...grouped.values()];
}

function canonicalQuantity(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new TypeError('Érvénytelen rendelési mennyiség.');
  return number.toString();
}

function buildOrderContentHash(deliveryDate, items) {
  const grouped = new Map();
  for (const item of items || []) {
    const gtin = String(item.gtin || '').trim();
    const itemDate = String(item.deliveryDate || deliveryDate || '').slice(0, 10);
    const key = `${itemDate}|${gtin}`;
    grouped.set(key, (grouped.get(key) || 0) + Number(item.quantity ?? item.ordered_cartons));
  }
  const rows = [...grouped.entries()].map(([key, quantity]) => {
    const separator = key.indexOf('|');
    return { deliveryDate:key.slice(0, separator), gtin:key.slice(separator + 1), quantity };
  });
  rows.sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate) || a.gtin.localeCompare(b.gtin));
  const canonical = rows
    .map(row => `${row.deliveryDate}|${row.gtin}|${canonicalQuantity(row.quantity)}`)
    .join('\n');
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

module.exports = { parseLineItems, buildOrderContentHash };
