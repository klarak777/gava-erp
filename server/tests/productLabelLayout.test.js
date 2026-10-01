const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const PizZip = require('pizzip');
const { DOMParser } = require('@xmldom/xmldom');

const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const DRAWING_NS = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing';
const elements = (node, name) => Array.from(node.getElementsByTagNameNS(WORD_NS, name));
const attribute = (node, name) => node.getAttributeNS(WORD_NS, name);

async function generateLabel(overrides = {}) {
  const product = {
    id: 1, product_name: 'BIO UVA 10 x 400 g', ean: '1234567890128',
    label_origin: 'Magyarország', label_net_weight_unit: '400 g', label_net_weight_carton: '4 kg',
    is_bio: true, bio_certifier: 'HU-ÖKO-002', ...overrides
  };
  const file = path.join(__dirname, '../src/routes/chain_products.js');
  const actualRequire = createRequire(file);
  const mod = { exports: {} };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), {
    require: name => name === '../db/db'
      ? () => ({ where() { return this; }, async first() { return product; } })
      : actualRequire(name),
    module: mod, exports: mod.exports, __dirname: path.dirname(file), console
  }, { filename: file });
  const handler = mod.exports.stack.find(layer => layer.route?.path === '/:id/label').route.stack[0].handle;
  let buffer;
  await handler({ params: { id: 1 } }, {
    setHeader() {}, send(data) { buffer = data; },
    status(code) { throw new Error(`Label generation failed: ${code}`); }
  });
  const zip = new PizZip(buffer);
  const document = new DOMParser().parseFromString(zip.file('word/document.xml').asText(), 'application/xml');
  return { buffer, zip, document };
}

test('both Bio labels use 25:55:22 columns and have no visible internal borders', async () => {
  const { document } = await generateLabel();
  const tables = elements(document, 'tbl');
  assert.equal(tables.length, 2);
  for (const table of tables) {
    const cells = elements(table, 'tc');
    assert.equal(cells.length, 3);
    assert.equal(elements(cells[0], 't').map(node => node.textContent).join('').trim(), '');
    assert.match(cells[1].textContent, /BIO UVA/);
    assert.match(cells[2].textContent, /HU-ÖKO-002/);
    const widths = elements(table, 'gridCol').map(node => Number(attribute(node, 'w')));
    const totalWidth = widths.reduce((sum, width) => sum + width, 0);
    for (const [index, weight] of [25, 55, 22].entries()) {
      assert.ok(Math.abs(widths[index] - totalWidth * weight / 102) <= 1);
    }
    assert.deepEqual(cells.map(cell => Number(attribute(elements(cell, 'tcW')[0], 'w'))), widths);
    assert.equal(attribute(elements(table, 'tblLayout')[0], 'type'), 'fixed');
    for (const borders of elements(table, 'tblBorders')) {
      for (const side of ['insideH', 'insideV']) assert.equal(attribute(elements(borders, side)[0], 'color'), 'FFFFFF');
      for (const side of ['top', 'bottom', 'left', 'right']) assert.equal(attribute(elements(borders, side)[0], 'val'), 'single');
    }
    for (let i = 0; i < cells.length; i++) {
      const borders = elements(cells[i], 'tcBorders')[0];
      assert.equal(attribute(elements(borders, 'left')[0], 'color'), i === 0 ? '000000' : 'FFFFFF');
      assert.equal(attribute(elements(borders, 'right')[0], 'color'), i === 2 ? '000000' : 'FFFFFF');
      for (const paragraph of elements(cells[i], 'p')) assert.equal(attribute(elements(paragraph, 'jc')[0], 'val'), 'center');
    }
  }
  assert.ok(!document.toString().includes('w:sz="none"'));
});

test('the doubled logo keeps its 3:2 aspect ratio and fits the right column in both labels', async () => {
  const { document, zip } = await generateLabel();
  const extents = Array.from(document.getElementsByTagNameNS(DRAWING_NS, 'extent'));
  assert.equal(extents.length, 2);
  for (const extent of extents) {
    assert.equal(Number(extent.getAttribute('cx')), 108 * 9525);
    assert.equal(Number(extent.getAttribute('cy')), 72 * 9525);
  }
  for (const table of elements(document, 'tbl')) {
    const logoCell = elements(table, 'tc')[2];
    const columnWidth = Number(attribute(elements(logoCell, 'tcW')[0], 'w'));
    const margins = elements(logoCell, 'tcMar')[0];
    const availableWidth = columnWidth - Number(attribute(elements(margins, 'left')[0], 'w'))
      - Number(attribute(elements(margins, 'right')[0], 'w'));
    const extent = logoCell.getElementsByTagNameNS(DRAWING_NS, 'extent')[0];
    assert.ok(Number(extent.getAttribute('cx')) <= availableWidth * 635, 'Logo must fit within the column including cell margins');
  }
  const logo = fs.readFileSync(path.join(__dirname, '../assets/eu-organic-logo-600x400_0.png'));
  for (const image of Object.keys(zip.files).filter(name => name.startsWith('word/media/') && !zip.files[name].dir)) {
    assert.deepEqual(zip.file(image).asNodeBuffer(), logo);
  }
});

test('Bio checkbox and a non-empty certifier are both required for the Bio layout', async () => {
  for (const overrides of [{ is_bio: false }, { bio_certifier: '' }, { bio_certifier: '   ' }]) {
    const { document } = await generateLabel(overrides);
    for (const table of elements(document, 'tbl')) assert.equal(elements(table, 'tc').length, 1);
    assert.equal(document.getElementsByTagNameNS(DRAWING_NS, 'extent').length, 0);
  }
});

test('certifier text and edited multiline label content survive DOCX generation', async () => {
  const certifier = 'HU-ÖKO-002 / Audit & Test <Group>';
  const { document } = await generateLabel({ bio_certifier: certifier, label_custom_texts: { unit_content: 'Edited unit\n400 g', carton_content: 'Edited carton\n4 kg' } });
  const text = elements(document, 't').map(node => node.textContent).join('\n');
  assert.ok(text.includes(certifier));
  assert.match(text, /Edited unit\n400 g/);
  assert.match(text, /Edited carton\n4 kg/);
});

module.exports = { generateLabel };
