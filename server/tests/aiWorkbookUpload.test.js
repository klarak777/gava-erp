const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const xlsx = require('xlsx');
const { isWorkbook, readWorkbook } = require('../src/utils/aiWorkbook');

function workbookBuffer(sheets, bookType = 'xlsx') {
  const workbook = xlsx.utils.book_new();
  for (const [name, data] of sheets) xlsx.utils.book_append_sheet(workbook, xlsx.utils.aoa_to_sheet(data), name);
  return xlsx.write(workbook, { type: 'buffer', bookType });
}
const multi = workbookBuffer([
  ['Bevételek', [['ONLY_INCOME', 100]]],
  ['Kiadások', [['ONLY_EXPENSE', 50]]],
  ['Összesítés', [['ONLY_TOTAL', 50]]]
]);

function uploadFixture() {
  const records = { documents: [], vectors: [], embeddings: [] };
  const db = table => ({ insert(data) {
    if (table === 'ai_documents') {
      records.documents.push(data);
      return { returning: async () => [{ id: 42 }] };
    }
    assert.equal(table, 'ai_vectors');
    records.vectors.push(...data);
    return Promise.resolve();
  } });
  class OpenAI {
    constructor() { this.embeddings = { create: async ({ input }) => {
      records.embeddings.push(...input);
      return { data: input.map(() => ({ embedding: [0.1, 0.2] })) };
    } }; }
  }
  const servicePath = path.join(__dirname, '../src/services/aiService.js');
  const serviceRequire = createRequire(servicePath), serviceModule = { exports: {} };
  const serviceMocks = { openai: { OpenAI }, '../db/db': db,
    'pdf-parse': {}, mammoth: {}, './agents/AgentManager': class {} };
  vm.runInNewContext(fs.readFileSync(servicePath, 'utf8'), {
    require: name => serviceMocks[name] || serviceRequire(name), module: serviceModule,
    process: { env: { OPENAI_API_KEY: 'test-no-network' } }, console
  });
  const routes = {};
  const router = { post(url, ...handlers) { routes[url] = handlers.at(-1); }, get() {}, delete() {} };
  const multer = () => ({ single: () => () => {} });
  multer.memoryStorage = () => ({});
  const routePath = path.join(__dirname, '../src/routes/ai.js'), routeRequire = createRequire(routePath);
  const routeMocks = { express: { Router: () => router }, multer, '../services/aiService': serviceModule.exports };
  vm.runInNewContext(fs.readFileSync(routePath, 'utf8'), {
    require: name => routeMocks[name] || routeRequire(name), module: { exports: {} }, console: { error() {} }
  });
  return { records, async upload(buffer = multi, body = {}, filename = 'kimutatás.xlsx') {
    let status = 200, data;
    await routes['/upload']({ file: { originalname: filename, buffer, mimetype: '' }, body }, {
      status(value) { status = value; return this; }, json(value) { data = value; }
    });
    return { status, data };
  } };
}

test('multi-sheet inspection asks for selection before saving or generating embeddings', async () => {
  const fixture = uploadFixture(), result = await fixture.upload();
  assert.equal(result.status, 200);
  assert.equal(result.data.selectionRequired, true);
  assert.equal(result.data.success, false);
  assert.deepEqual(Array.from(result.data.worksheets), ['Bevételek', 'Kiadások', 'Összesítés']);
  assert.equal(result.data.documentId, undefined);
  assert.match(result.data.error, /Frissítse az alkalmazás oldalát/);
  assert.deepEqual(fixture.records, { documents: [], vectors: [], embeddings: [] });
});

test('all worksheets reach the document, with sheet names in every chunk including long sheets', async () => {
  const buffer = workbookBuffer([
    ['Hosszú', Array.from({ length: 500 }, (_, i) => [`Sor ${i}`, 'LONG_DATA'])],
    ['Második', [['SECOND_DATA']]], ['Harmadik', [['THIRD_DATA']]]
  ]);
  const fixture = uploadFixture(), result = await fixture.upload(buffer, { allWorksheets: 'true' });
  assert.equal(result.status, 200);
  assert.equal(result.data.documentId, 42);
  assert.deepEqual(Array.from(result.data.worksheets), ['Hosszú', 'Második', 'Harmadik']);
  const text = fixture.records.vectors.map(record => record.content).join('\n');
  assert.match(text, /LONG_DATA/); assert.match(text, /SECOND_DATA/); assert.match(text, /THIRD_DATA/);
  assert.ok(fixture.records.vectors.filter(record => record.content.startsWith('Munkalap: Hosszú\n')).length > 1);
  assert.ok(fixture.records.vectors.every(record => record.content.startsWith('Munkalap: ')));
  assert.equal(fixture.records.documents.length, 1);
});

test('selection includes only chosen worksheets, once, in workbook order', async () => {
  const fixture = uploadFixture(), result = await fixture.upload(multi, {
    worksheets: JSON.stringify(['Összesítés', 'Kiadások', 'Kiadások'])
  });
  assert.equal(result.data.success, true);
  assert.deepEqual(Array.from(result.data.worksheets), ['Kiadások', 'Összesítés']);
  const text = fixture.records.embeddings.join('\n');
  assert.doesNotMatch(text, /ONLY_INCOME/);
  assert.match(text, /ONLY_EXPENSE/); assert.match(text, /ONLY_TOTAL/);
  assert.equal(fixture.records.vectors.length, 2);
});

test('invalid or empty selections are rejected before database and embedding calls', async () => {
  for (const body of [
    { worksheets: '[' }, { worksheets: '[]' }, { worksheets: 'null' },
    { worksheets: '[1]' }, { worksheets: '["Nem létezik"]' },
    { allWorksheets: 'yes' }, { allWorksheets: 'true', worksheets: '["Kiadások"]' }
  ]) {
    const fixture = uploadFixture(), result = await fixture.upload(multi, body);
    assert.equal(result.status, 400, JSON.stringify(body));
    assert.equal(fixture.records.documents.length, 0);
    assert.equal(fixture.records.embeddings.length, 0);
  }
});

test('one-sheet XLSX, legacy XLS and CSV continue without a selection prompt', async () => {
  assert.equal(isWorkbook('IMPORT.XLS', ''), true);
  for (const [buffer, filename] of [
    [workbookBuffer([['Egyetlen', [['SINGLE_DATA']]]]), 'import.XLSX'],
    [workbookBuffer([['Régi', [['LEGACY_DATA']]]], 'xls'), 'import.xls'],
    [Buffer.from('Termék,Ár\nAlma,100'), 'import.csv']
  ]) {
    const fixture = uploadFixture(), result = await fixture.upload(buffer, {}, filename);
    assert.equal(result.data.success, true);
    assert.equal(result.data.selectionRequired, undefined);
    assert.equal(fixture.records.documents.length, 1);
    assert.equal(fixture.records.embeddings.length, 1);
  }
});

test('an empty selected sheet is rejected, while the other sheet may still be processed', async () => {
  const buffer = workbookBuffer([['Üres', []], ['Adatok', [['DATA']]]]);
  const fixture = uploadFixture();
  assert.equal((await fixture.upload(buffer, { worksheets: '["Üres"]' })).status, 400);
  assert.equal(fixture.records.documents.length, 0);
  assert.equal((await fixture.upload(buffer, { worksheets: '["Adatok"]' })).data.success, true);
  assert.throws(() => readWorkbook(buffer, { worksheets: [] }), /legalább egy/);
});

test('browser: clickable all/selected worksheets, cancellation, processing errors and one-sheet upload', async t => {
  const http = require('node:http');
  const { chromium } = require('playwright');
  const source = fs.readFileSync(path.join(__dirname, '../../Access UI/src/modules/ai-chat.js'), 'utf8');
  const mainSource = fs.readFileSync(path.join(__dirname, '../../Access UI/src/main.js'), 'utf8');
  const indexSource = fs.readFileSync(path.join(__dirname, '../../Access UI/index.html'), 'utf8');
  const entry = indexSource.match(/<script type="module" src="([^"]*main\.js[^\"]*)"/)[1];
  const aiImport = mainSource.match(/^import \{ initAiChat \} from .*$/m)[0];
  const requests = [];
  const fixture = uploadFixture();
  let failProcessing = false;
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      requests.push(req.url);
      if (url.pathname === '/src/main.js') {
        res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
        res.end(aiImport + ';initAiChat();window.dispatchEvent(new Event("app:open-ai-chat"));'); return;
      }
      if (url.pathname === '/src/modules/ai-chat.js') {
        res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' }); res.end(source); return;
      }
      if (url.pathname === '/src/modules/ai-pdf-export.js') {
        res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
        res.end(fs.readFileSync(path.join(__dirname, '../../Access UI/src/modules/ai-pdf-export.js'))); return;
      }
      if (req.url === '/api/v1/ai/upload') {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const form = await new Request('http://localhost/upload', {
          method: 'POST', headers: { 'Content-Type': req.headers['content-type'] }, body: Buffer.concat(chunks)
        }).formData();
        const file = form.get('file'), body = {};
        for (const key of ['worksheets', 'allWorksheets']) if (form.has(key)) body[key] = form.get(key);
        const result = failProcessing && Object.keys(body).length
          ? { status: 500, data: { error: 'Teszt feldolgozási hiba' } }
          : await fixture.upload(Buffer.from(await file.arrayBuffer()), body, file.name);
        res.writeHead(result.status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(result.data)); return;
      }
      if (req.url.startsWith('/api/v1/ai/options/')) {
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"success":true,"options":[]}'); return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<!doctype html><html><head><script id="chart-js-lib"></script></head><body><script type="module" src="' + entry + '"></script></body></html>');
    } catch (error) { res.writeHead(500); res.end(error.message); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } }), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const input = page.locator('#ai-file-input');
  const choose = async () => {
    await input.setInputFiles({ name: 'kimutatás.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: multi });
    await page.locator('.ai-worksheet-choice').waitFor();
  };
  const waitReady = () => page.waitForFunction(() => !document.querySelector('#ai-upload-btn').disabled);
  await choose();
  assert.equal(fixture.records.documents.length, 0);
  assert.equal(fixture.records.embeddings.length, 0);
  assert.equal(await page.getByRole('button', { name: 'Kijelölt fülek feldolgozása', exact: true }).isVisible(), false);
  await page.getByRole('button', { name: 'Összes fül feldolgozása', exact: true }).click();
  await waitReady();
  assert.equal(fixture.records.documents.length, 1);
  assert.match(await page.locator('#ai-active-doc-name').textContent(), /Bevételek, Kiadások, Összesítés/);
  assert.equal(fixture.records.vectors.length, 3);

  const beforeSelected = fixture.records.embeddings.length;
  await choose();
  await page.getByRole('button', { name: 'Fülek kiválasztása', exact: true }).click();
  const selected = page.getByRole('button', { name: 'Kijelölt fülek feldolgozása', exact: true });
  assert.equal(await selected.isDisabled(), true);
  await page.getByRole('checkbox', { name: 'Kiadások', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Összesítés', exact: true }).check();
  await selected.click(); await waitReady();
  assert.equal(fixture.records.documents.length, 2);
  assert.doesNotMatch(fixture.records.embeddings.slice(beforeSelected).join('\n'), /ONLY_INCOME/);
  assert.match(await page.locator('#ai-active-doc-name').textContent(), /Fülek: Kiadások, Összesítés/);
  const active = await page.locator('#ai-active-doc-name').textContent();

  await choose();
  await page.getByRole('button', { name: 'Mégse', exact: true }).click(); await waitReady();
  assert.equal(fixture.records.documents.length, 2);
  assert.equal(await page.locator('#ai-active-doc-name').textContent(), active);
  assert.equal(await input.inputValue(), '');

  failProcessing = true;
  await choose();
  await page.getByRole('button', { name: 'Összes fül feldolgozása', exact: true }).click(); await waitReady();
  assert.match(await page.locator('#ai-chat-history').textContent(), /Teszt feldolgozási hiba/);
  assert.equal(fixture.records.documents.length, 2);
  assert.equal(await page.locator('#ai-active-doc-name').textContent(), active);
  failProcessing = false;

  await input.setInputFiles({ name: 'egyetlen.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: workbookBuffer([['Egyetlen', [['SINGLE_DATA']]]]) });
  await page.waitForFunction(() => document.querySelector('#ai-active-doc-name').textContent.includes('egyetlen.xlsx'));
  await waitReady();
  assert.equal(await page.locator('.ai-worksheet-choice').count(), 0);
  assert.equal(fixture.records.documents.length, 3);

  const unusualName = '<img onerror=alert(1)>';
  await input.setInputFiles({ name: 'különleges.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: workbookBuffer([[unusualName, [['DATA']]], ['Másik', [['OTHER']]]]) });
  await page.locator('.ai-worksheet-choice').waitFor();
  await page.getByRole('button', { name: 'Fülek kiválasztása', exact: true }).click();
  assert.equal(await page.locator('.ai-worksheet-list img').count(), 0);
  await page.getByRole('checkbox', { name: unusualName, exact: true }).check();
  await page.getByRole('button', { name: 'Kijelölt fülek feldolgozása', exact: true }).click(); await waitReady();
  assert.equal(await page.locator('#ai-chat-history img').count(), 0);
  assert.match(await page.locator('#ai-active-doc-name').textContent(), /<img onerror=alert\(1\)>/);

  // Use the reported workbook when present; CI uses the same twelve-tab layout.
  const reportedPath = path.join(__dirname, '../../Eurogroup-Aldi óraszámok új 2025.xlsx');
  const months = ['Január', 'Február', 'Március', 'Április', 'Május', 'Június',
    'Július', 'Szeptember', 'Augusztus', 'Október', 'November', 'December'];
  const reportedBuffer = fs.existsSync(reportedPath) ? fs.readFileSync(reportedPath)
    : workbookBuffer(months.map(month => [month, [['Óraszám', 100]]]));
  const reportedFile = { name: 'Eurogroup-Aldi óraszámok új 2025.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: reportedBuffer };
  const beforeReported = fixture.records.documents.length;
  await input.setInputFiles(reportedFile);
  await page.locator('.ai-worksheet-choice').waitFor();
  assert.match(await page.locator('.ai-worksheet-choice').textContent(), /12 fület/);
  assert.equal(fixture.records.documents.length, beforeReported);
  await page.getByRole('button', { name: 'Fülek kiválasztása', exact: true }).click();
  assert.equal(await page.getByRole('checkbox').count(), 12);
  await page.getByRole('checkbox', { name: 'November', exact: true }).check();
  await page.getByRole('checkbox', { name: 'December', exact: true }).check();
  const beforeMonths = fixture.records.embeddings.length;
  await page.getByRole('button', { name: 'Kijelölt fülek feldolgozása', exact: true }).click(); await waitReady();
  assert.match(await page.locator('#ai-active-doc-name').textContent(), /Fülek: November, December/);
  assert.ok(fixture.records.embeddings.slice(beforeMonths).every(chunk => /^Munkalap: (November|December)\n/.test(chunk)));
  await input.setInputFiles(reportedFile);
  await page.locator('.ai-worksheet-choice').waitFor();
  const beforeAllMonths = fixture.records.embeddings.length;
  await page.getByRole('button', { name: 'Összes fül feldolgozása', exact: true }).click(); await waitReady();
  assert.ok(months.every(month => fixture.records.embeddings.slice(beforeAllMonths).some(chunk => chunk.startsWith('Munkalap: ' + month + '\n'))));
  assert.equal(fixture.records.documents.length, beforeReported + 2);
  assert.ok(requests.some(url => url.startsWith('/src/main.js?v=') && !url.endsWith('v=0.9.7.1')));
  assert.ok(requests.some(url => url.startsWith('/src/modules/ai-chat.js?v=') && !url.endsWith('v=7')));
  assert.deepEqual(errors, []);
});
