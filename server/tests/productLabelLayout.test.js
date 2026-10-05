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

test('both Bio labels put data left and the logo and certifier right without visible internal borders', async () => {
  const { document } = await generateLabel();
  const tables = elements(document, 'tbl');
  assert.equal(tables.length, 2);
  for (const table of tables) {
    const cells = elements(table, 'tc');
    assert.equal(cells.length, 2);
    assert.match(cells[0].textContent, /BIO UVA/);
    assert.match(cells[1].textContent, /HU-ÖKO-002/);
    assert.equal(cells[0].getElementsByTagNameNS(DRAWING_NS, 'extent').length, 0);
    assert.equal(cells[1].getElementsByTagNameNS(DRAWING_NS, 'extent').length, 1);
    const widths = elements(table, 'gridCol').map(node => Number(attribute(node, 'w')));
    const totalWidth = widths.reduce((sum, width) => sum + width, 0);
    for (const [index, weight] of [75, 25].entries()) {
      assert.ok(Math.abs(widths[index] - totalWidth * weight / 100) <= 1);
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
      assert.equal(attribute(elements(borders, 'right')[0], 'color'), i === 1 ? '000000' : 'FFFFFF');
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
    const logoCell = elements(table, 'tc')[1];
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

test('the Bio checkbox alone shows both logos even before a certifier has been entered', async () => {
  for (const certifier of ['', '   ', null]) {
    const { document } = await generateLabel({ bio_certifier: certifier });
    for (const table of elements(document, 'tbl')) assert.equal(elements(table, 'tc').length, 2);
    assert.equal(document.getElementsByTagNameNS(DRAWING_NS, 'extent').length, 2);
    for (const table of elements(document, 'tbl')) {
      const right = elements(table, 'tc')[1];
      assert.equal(elements(right, 't').map(node => node.textContent).join('').trim(), '', 'Empty Bio text must have no predefined wording');
    }
  }
  const { document } = await generateLabel({ is_bio: false });
  for (const table of elements(document, 'tbl')) assert.equal(elements(table, 'tc').length, 1);
  assert.equal(document.getElementsByTagNameNS(DRAWING_NS, 'extent').length, 0);
});

test('certifier text and edited multiline label content survive DOCX generation', async () => {
  const certifier = 'HU-ÖKO-002 / Audit & Test <Group>';
  const { document } = await generateLabel({ bio_certifier: certifier, label_custom_texts: { unit_content: 'Edited unit\n400 g', carton_content: 'Edited carton\n4 kg' } });
  const text = elements(document, 't').map(node => node.textContent).join('\n');
  assert.ok(text.includes(certifier));
  assert.match(text, /Edited unit\n400 g/);
  assert.match(text, /Edited carton\n4 kg/);
});

test('carton and unit certifiers are independent, multiline and may explicitly override the legacy text with blank', async () => {
  const texts = { unit_bio_certifier: 'Unit & Audit <Group>\nHU-ÖKO-001', carton_bio_certifier: 'Carton certifier\nHU-ÖKO-002',
    unit_content: 'Unit <400 g> & fruit', carton_content: 'Carton <4 kg> & fruit' };
  const { document } = await generateLabel({ label_custom_texts: JSON.stringify(texts) });
  const tables = elements(document, 'tbl');
  assert.match(elements(tables[0], 'tc')[0].textContent, /Unit <400 g> & fruit/);
  assert.match(elements(tables[1], 'tc')[0].textContent, /Carton <4 kg> & fruit/);
  for (const [index, type] of ['unit', 'carton'].entries()) {
    const cell = elements(tables[index], 'tc')[1];
    const paragraphs = elements(cell, 'p');
    assert.ok(paragraphs[0].getElementsByTagNameNS(DRAWING_NS, 'extent').length);
    assert.ok(paragraphs.map(p => elements(p, 't').map(node => node.textContent).join('')).join('\n').includes(texts[`${type}_bio_certifier`]));
    assert.equal(cell.textContent.includes(texts[`${type === 'unit' ? 'carton' : 'unit'}_bio_certifier`]), false);
  }
  const { document: blank } = await generateLabel({ label_custom_texts: { unit_bio_certifier: '' } });
  const blankTables = elements(blank, 'tbl');
  assert.equal(elements(blankTables[0], 'tc')[1].textContent.includes('HU-ÖKO-002'), false);
  assert.match(elements(blankTables[1], 'tc')[1].textContent, /HU-ÖKO-002/);
});

test('browser: both labels show the original logo and independently save centered Bio text used by DOCX', async t => {
  const http = require('node:http');
  const { chromium } = require('playwright');
  const product = { id: 1, product_name: 'BIO UVA 10 x 400 g', article_number: '12345',
    ean: '1234567890128', is_bio: true, bio_certifier: 'HU-ÖKO-002' };
  const updates = [];
  let failSave = false;
  const modulePath = path.resolve(__dirname, '../../Access UI/src/modules/aldi_termekek.js');
  const logoPath = path.resolve(__dirname, '../assets/eu-organic-logo-600x400_0.png');
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/') {
      res.setHeader('Content-Type', 'text/html');
      res.end('<div id="editor"></div><script type="module">import {renderAldiTermekAdattabla} from "/editor.js"; renderAldiTermekAdattabla(document.getElementById("editor"));</script>');
    } else if (url.pathname === '/editor.js') {
      res.setHeader('Content-Type', 'text/javascript'); res.end(fs.readFileSync(modulePath));
    } else if (url.pathname === '/AldiNord-WorldwideLogo.svg') {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.end(fs.readFileSync(path.resolve(__dirname, '../../Access UI/AldiNord-WorldwideLogo.svg')));
    } else if (url.pathname === '/api/v1/chain-products/bio-logo') {
      res.setHeader('Content-Type', 'image/png'); res.end(fs.readFileSync(logoPath));
    } else if (url.pathname === '/api/v1/chain-products' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify([product]));
    } else if (url.pathname === '/api/v1/chain-products/1' && req.method === 'PUT') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const update = JSON.parse(Buffer.concat(chunks).toString());
      updates.push(update);
      if (!failSave) Object.assign(product, update);
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = failSave ? 500 : 200;
      res.end(JSON.stringify(failSave ? { error: 'Teszt mentési hiba' } : product));
    } else if (url.pathname === '/api/v1/chain-products/1/label') {
      const { buffer } = await generateLabel(product);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.end(buffer);
    } else { res.writeHead(404); res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  t.after(async () => {
    await browser?.close();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  });
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('dialog', dialog => dialog.accept());
  await page.addInitScript(() => { window.open = url => { window.lastDownloadUrl = url; }; });
  const base = `http://127.0.0.1:${server.address().port}`;
  await page.goto(base);
  await page.locator('.aldi-prod-row').click();
  assert.equal(await page.locator('.aldi-label-bio img').count(), 2);
  await page.waitForFunction(() => [...document.querySelectorAll('.aldi-label-bio img')].every(image => image.complete && image.naturalWidth > 0));
  for (const label of await page.locator('.aldi-label-preview').all()) {
    const layout = await label.evaluate(node => {
      const data = node.querySelector('.aldi-label-content').getBoundingClientRect();
      const bio = node.querySelector('.aldi-label-bio');
      const image = bio.querySelector('img').getBoundingClientRect();
      const cert = bio.querySelector('.aldi-label-certifier');
      return { right: bio.getBoundingClientRect().left >= data.right,
        below: cert.getBoundingClientRect().top >= image.bottom,
        centered: getComputedStyle(cert).textAlign === 'center',
        border: getComputedStyle(bio).borderLeftWidth, overflow: node.scrollWidth > node.clientWidth };
    });
    assert.deepEqual(layout, { right: true, below: true, centered: true, border: '0px', overflow: false });
  }
  await page.locator('.inline-edit-base-btn').click();
  assert.equal(await page.locator('#aldi-inline-biocert').count(), 0);
  assert.equal(await page.locator('#aldi-bio-cert-wrapper').count(), 0);
  await page.locator('.inline-save-base-btn').click();
  await page.locator('.inline-edit-carton-btn').waitFor();
  assert.equal('bio_certifier' in updates.at(-1), false, 'Base saves must preserve the legacy certifier');
  assert.equal(product.bio_certifier, 'HU-ÖKO-002');

  await page.locator('.inline-edit-carton-btn').click();
  assert.equal(await page.locator('#aldi-inline-carton-biocert').inputValue(), 'HU-ÖKO-002');
  const cartonCert = 'Karton megjegyzés & <jelölés>\nHűvös helyen tárolandó\nTovábbi szabad szöveg';
  await page.locator('#aldi-inline-carton-biocert').fill(cartonCert);
  await page.locator('#aldi-inline-carton-content').fill('Karton adatok\n4 kg & <gyümölcs>');
  await page.locator('.inline-save-label-btn').click();
  await page.locator('.inline-edit-carton-btn').waitFor();
  assert.equal(JSON.parse(product.label_custom_texts).carton_bio_certifier, cartonCert);
  assert.equal(await page.locator('[data-label="unit"] .aldi-label-certifier').textContent(), 'HU-ÖKO-002');

  await page.locator('.inline-edit-unit-btn').click();
  const unitCert = 'Egység megjegyzés\nTetszőleges szöveg\nÚjabb sor';
  await page.locator('#aldi-inline-unit-biocert').fill(unitCert);
  await page.locator('#aldi-inline-unit-content').fill('Egység adatok\n400 g');
  if (process.env.PRODUCT_LABEL_ARTIFACT_DIR) {
    fs.mkdirSync(process.env.PRODUCT_LABEL_ARTIFACT_DIR, { recursive: true });
    await page.locator('#editor').screenshot({ path: path.join(process.env.PRODUCT_LABEL_ARTIFACT_DIR, 'bio-label-editor-editing.png') });
  }
  await page.locator('.inline-save-label-u-btn').click();
  await page.locator('.inline-edit-unit-btn').waitFor();
  assert.equal(JSON.parse(product.label_custom_texts).unit_bio_certifier, unitCert);
  assert.equal(await page.locator('[data-label="carton"] .aldi-label-certifier').textContent(), cartonCert);
  await page.reload();
  await page.locator('.aldi-prod-row').click();
  assert.equal(await page.locator('[data-label="unit"] .aldi-label-certifier').textContent(), unitCert);

  await page.locator('.inline-dl-btn').click();
  assert.equal(await page.evaluate(() => window.lastDownloadUrl), '/api/v1/chain-products/1/label');
  const response = await page.request.get(base + '/api/v1/chain-products/1/label');
  assert.equal(response.status(), 200);
  const exportedBuffer = await response.body();
  const exported = new DOMParser().parseFromString(new PizZip(exportedBuffer).file('word/document.xml').asText(), 'application/xml');
  const tables = elements(exported, 'tbl');
  assert.match(elements(tables[0], 'tc')[1].textContent, /Egység megjegyzés/);
  assert.match(elements(tables[1], 'tc')[1].textContent, /Karton megjegyzés & <jelölés>/);
  const exportedText = elements(exported, 't').map(node => node.textContent).join('\n');
  assert.equal(exportedText.includes('EU mezőgazdaság'), false);
  assert.equal(exportedText.includes('Tanúsító szervezet neve'), false);
  if (process.env.PRODUCT_LABEL_ARTIFACT_DIR) {
    fs.mkdirSync(process.env.PRODUCT_LABEL_ARTIFACT_DIR, { recursive: true });
    fs.writeFileSync(path.join(process.env.PRODUCT_LABEL_ARTIFACT_DIR, 'bio-label-editor-preview.docx'), exportedBuffer);
    await page.locator('#editor').screenshot({ path: path.join(process.env.PRODUCT_LABEL_ARTIFACT_DIR, 'bio-label-editor-preview.png') });
  }

  await page.locator('.inline-edit-carton-btn').click();
  await page.locator('#aldi-inline-carton-biocert').fill('Nem mentett változat');
  await page.locator('.inline-cancel-btn').click();
  assert.equal(await page.locator('[data-label="carton"] .aldi-label-certifier').textContent(), cartonCert);
  await page.locator('.inline-edit-carton-btn').click();
  await page.locator('#aldi-inline-carton-biocert').fill('Sikertelen mentés');
  failSave = true;
  const failed = page.waitForResponse(response => response.request().method() === 'PUT' && response.status() === 500);
  await page.locator('.inline-save-label-btn').click();
  await failed;
  await page.locator('.inline-cancel-btn').click();
  assert.equal(await page.locator('[data-label="carton"] .aldi-label-certifier').textContent(), cartonCert);
  failSave = false;
  await page.locator('.inline-edit-base-btn').click();
  await page.locator('#aldi-inline-bio').uncheck();
  await page.locator('.inline-save-base-btn').click();
  await page.waitForFunction(() => document.querySelectorAll('.aldi-label-bio').length === 0);
  await page.locator('.inline-edit-base-btn').click();
  await page.locator('#aldi-inline-bio').check();
  await page.locator('.inline-save-base-btn').click();
  await page.waitForFunction(() => document.querySelectorAll('.aldi-label-bio').length === 2);
  assert.equal(await page.locator('[data-label="carton"] .aldi-label-certifier').textContent(), cartonCert);

  // New products start empty; the larger text editor has no visible heading
  // or placeholder and preserves the logo and existing column widths.
  product.bio_certifier = '';
  delete product.label_custom_texts;
  await page.reload();
  await page.locator('.aldi-prod-row').click();
  for (const [type, button] of [['carton', '.inline-edit-carton-btn'], ['unit', '.inline-edit-unit-btn']]) {
    await page.locator(button).click();
    const input = page.locator(`#aldi-inline-${type}-biocert`);
    assert.equal(await input.inputValue(), '');
    assert.equal(await input.getAttribute('placeholder'), null);
    assert.equal(await page.locator(`label[for="aldi-inline-${type}-biocert"]`).count(), 0);
    const layout = await page.locator(`[data-label="${type}"]`).evaluate(node => {
      const input = node.querySelector('[aria-label="Címke szabad szövege"]');
      const logo = node.querySelector('img');
      return { inputHeight: input.getBoundingClientRect().height, logoWidth: logo.getBoundingClientRect().width,
        centered: getComputedStyle(input).textAlign, resizable: getComputedStyle(input).resize,
        overflow: node.scrollWidth > node.clientWidth, text: node.textContent.trim() };
    });
    assert.equal(layout.inputHeight, 100);
    assert.equal(layout.logoWidth, 108);
    assert.equal(layout.centered, 'center');
    assert.equal(layout.resizable, 'none');
    assert.equal(layout.overflow, false);
    assert.equal(layout.text.includes('EU mezőgazdaság'), false);
    assert.equal(layout.text.includes('Tanúsító szervezet neve'), false);
    await page.locator('.inline-cancel-btn').click();
  }
  assert.deepEqual(errors, []);
});

module.exports = { generateLabel };
