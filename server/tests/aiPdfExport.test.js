const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

function reportMarkdown() {
  const lines = ['Elkészítettem a részletes elemzést a **Január** munkalap alapján.', '',
    '## 1. Elemzett időszak és adatforrás', '', 'Időszak: 2025. január', '',
    '## 2. Munkalap szerinti főösszesítő', '', 'A dokumentum felső összesítő sora alapján:', '',
    '| Partner / terület | Munkalap szerinti érték |', '| --- | --- |',
    '| Eurogroup | 2 545,96 |', '| Aldi | 13 624,63 |', '| Spar | 301,93 |',
    '| Tesco | 1 828,45 |', '| Egyéb | 34,63 |', '| **Összesített munkalapérték** | **18 335,60** |', ''];
  for (let section = 3; section <= 22; section++) {
    lines.push(`## ${section}. Részletes bontás`, '',
      'A kimutatás adatait az alábbi táblázat tartalmazza. Az adatok a feltöltött munkalapról származnak.', '',
      '| Partner / terület | Érték | Arány |', '| --- | --- | --- |');
    for (let row = 1; row <= 6; row++) lines.push(`| SECTION_${section}_ROW_${row} | 1 234,56 | 25,5% |`);
    lines.push('', 'Az összesítéshez minden sor adata szükséges. A következő szakasz újabb részleteket mutat be.', '', '---', '');
  }
  lines.push('## 23. Hosszú napi kimutatás', '', '| Napi sor | Óraszám |', '| --- | --- |');
  for (let row = 1; row <= 100; row++) lines.push(`| DAILY_ROW_${row} | 12,50 |`);
  lines.push('', '## 24. Hosszú szöveges megjegyzés', '',
    Array.from({ length: 1600 }, (_, i) => `word_${i}`).join(' ') + ' **Megőrzött félkövér szöveg**', '',
    '- Első ellenőrzés', '- Második ellenőrzés', '', '## 25. Grafikon', '');
  return lines.join('\n');
}

async function browserFixture(t, library) {
  const chat = fs.readFileSync(path.join(__dirname, '../../Access UI/src/modules/ai-chat.js'));
  const exporter = fs.readFileSync(path.join(__dirname, '../../Access UI/src/modules/ai-pdf-export.js'));
  const markdown = reportMarkdown();
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/chat.js' || url.pathname === '/ai-pdf-export.js') {
      res.setHeader('Content-Type', 'text/javascript'); res.end(url.pathname === '/chat.js' ? chat : exporter); return;
    }
    if (url.pathname === '/library.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(fs.readFileSync(library)); return; }
    if (url.pathname === '/api/v1/ai/chat') {
      for await (const chunk of req) {} // Consume the request body.
      res.setHeader('Content-Type', 'text/event-stream');
      res.end('data: ' + JSON.stringify({ delta: markdown }) + '\n\ndata: [DONE]\n\n'); return;
    }
    res.setHeader('Content-Type', 'text/html');
    res.end('<!doctype html><head><script id="chart-js-lib"></script>' +
      (library ? '<script src="/library.js"></script>' : '') +
      '</head><body><script type="module">import {initAiChat} from "/chat.js";initAiChat();window.dispatchEvent(new Event("app:open-ai-chat"));</script></body>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1200, height: 850 } });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.locator('#ai-text-input').fill('Készíts részletes elemzést.');
  await page.locator('#ai-send-btn').click();
  await page.locator('[data-ai-answer="true"]').waitFor();
  await page.evaluate(() => {
    document.querySelector('#ai-active-doc-name').textContent = 'Aktív dokumentum: Eurogroup-Aldi óraszámok új 2025.xlsx – Fülek: Január';
    const canvas = document.createElement('canvas');
    canvas.width = 600; canvas.height = 230;
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff'; context.fillRect(0, 0, 600, 230);
    context.fillStyle = '#6366f1'; context.fillRect(25, 30, 100, 170);
    context.fillStyle = '#10b981'; context.fillRect(175, 75, 100, 125);
    context.fillStyle = '#111827'; context.font = '20px Arial'; context.fillText('Januári óraszámok', 320, 100);
    document.querySelector('[data-ai-answer="true"]').appendChild(canvas);
  });
  return page;
}

test('PDF layout preserves all rows and text, repeats long-table headers and keeps headings with content', async t => {
  const page = await browserFixture(t);
  const stats = await page.evaluate(async () => {
    const { buildReportPages } = await import('/ai-pdf-export.js');
    const answer = document.querySelector('[data-ai-answer="true"]');
    const before = answer.innerHTML;
    const report = await buildReportPages(answer, document.querySelector('#ai-active-doc-name').textContent);
    try {
      return { pages: report.pages.length, sourceUnchanged: answer.innerHTML === before,
        tables: report.pages.flatMap(page => Array.from(page.querySelectorAll('table')).map(table => ({
          header: table.tHead?.textContent, rows: Array.from(table.querySelectorAll('tbody > tr')).map(row => row.textContent)
        }))),
        paragraphs: report.pages.flatMap(page => Array.from(page.querySelectorAll('p')).map(p => p.textContent)).join(' '),
        headings: report.pages.flatMap(page => Array.from(page.querySelectorAll('h3')).map(node => node.textContent)),
        images: report.pages.reduce((count, page) => count + page.querySelectorAll('img').length, 0),
        footer: report.pages.map(page => page.querySelector('.ai-pdf-footer').textContent),
        overflow: report.pages.some(page => {
          const body = page.querySelector('.ai-pdf-body');
          return body.scrollHeight > body.clientHeight + 1 || Array.from(body.children)
            .some(block => block.getBoundingClientRect().bottom > body.getBoundingClientRect().bottom + 0.5);
        }),
        orphanHeading: report.pages.some(page => Array.from(page.querySelectorAll('h3')).some(heading =>
          !heading.nextElementSibling || !heading.parentElement.contains(heading.nextElementSibling))) };
    } finally { report.cleanup(); }
  });
  assert.ok(stats.pages > 10);
  assert.equal(stats.overflow, false);
  assert.equal(stats.orphanHeading, false);
  assert.equal(stats.sourceUnchanged, true);
  assert.equal(stats.images, 1);
  for (let section = 3; section <= 22; section++) for (let row = 1; row <= 6; row++) {
    assert.equal(stats.tables.flatMap(table => table.rows).filter(text => text.includes(`SECTION_${section}_ROW_${row}`)).length, 1);
  }
  const dailyTables = stats.tables.filter(table => table.rows.some(row => row.startsWith('DAILY_ROW_')));
  assert.ok(dailyTables.length > 1);
  assert.ok(dailyTables.every(table => table.header === 'Napi sorÓraszám'));
  assert.equal(dailyTables.flatMap(table => table.rows).length, 100);
  for (let row = 1; row <= 100; row++) assert.equal(dailyTables.flatMap(table => table.rows).filter(text => text.startsWith(`DAILY_ROW_${row}12,50`)).length, 1);
  for (let i = 0; i < 1600; i++) assert.match(stats.paragraphs, new RegExp(`\\bword_${i}\\b`));
  assert.ok(stats.headings.includes('23. Hosszú napi kimutatás'));
  assert.deepEqual(stats.footer, Array.from({ length: stats.pages }, (_, i) => `${i + 1} / ${stats.pages}`));
  assert.equal(await page.locator('.ai-pdf-staging').count(), 0);
});

test('real PDF rendering: one A4 page per measured page, chart survives and repeated exports use the answer', async t => {
  const library = path.join(__dirname, '../../scratch/ai-pdf/html2pdf.bundle.min.js');
  if (!fs.existsSync(library)) { t.skip('Optional local html2pdf bundle is not present.'); return; }
  const page = await browserFixture(t, library);
  const stats = await page.evaluate(async () => {
    const { buildReportPages, exportAiReport } = await import('/ai-pdf-export.js');
    const answer = document.querySelector('[data-ai-answer="true"]');
    const layout = await buildReportPages(answer, 'PDF-tördelési próba');
    const expected = layout.pages.length; layout.cleanup();
    const pdf = await exportAiReport(answer, 'PDF-tördelési próba', () => {}, false);
    window.testPdf = pdf;
    return { expected, actual: pdf.getNumberOfPages(), width: pdf.internal.pageSize.getWidth(), height: pdf.internal.pageSize.getHeight() };
  });
  assert.equal(stats.actual, stats.expected);
  assert.ok(Math.abs(stats.width - 210) < 0.1); assert.ok(Math.abs(stats.height - 297) < 0.1);
  if (process.env.AI_PDF_ARTIFACT_DIR) {
    fs.mkdirSync(process.env.AI_PDF_ARTIFACT_DIR, { recursive: true });
    const [download] = await Promise.all([page.waitForEvent('download'), page.evaluate(() => window.testPdf.save('minta.pdf'))]);
    await download.saveAs(path.join(process.env.AI_PDF_ARTIFACT_DIR, 'Gava_MI_Elemzes_tordeles_minta.pdf'));
  }
  const repeated = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#ai-export-btn').click()]);
    await page.waitForFunction(() => !document.querySelector('#ai-export-btn').disabled);
    const bytes = fs.readFileSync(await download.path());
    assert.equal(bytes.subarray(0, 8).toString('ascii'), '%PDF-1.3');
    repeated.push((bytes.toString('latin1').match(/\/Type \/Page\b/g) || []).length);
  }
  assert.deepEqual(repeated, [stats.expected, stats.expected]);
  assert.equal(await page.locator('.ai-pdf-staging').count(), 0);
});
