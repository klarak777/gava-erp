const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

test('ALDI Orders flyout opens on hover or click and launches four independent windows', async t => {
  const root = path.resolve(__dirname, '../../Access UI');
  const requests = [], errors = [];
  const year = new Date().getFullYear();
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    requests.push({ method: req.method, url: req.url });
    if (url.pathname.startsWith('/api/')) {
      let data = [];
      if (url.pathname === '/api/v1/aldi-daily-orders') data = [
        { id: 1, order_number: 'ORDER_A', delivery_date: '2026-10-06' },
        { id: 2, order_number: 'ORDER_B', delivery_date: '2026-10-07' }
      ];
      if (/\/aldi-weekly-commitments\/weeks\//.test(url.pathname)) data = [40, 41];
      else if (/\/aldi-weekly-commitments\/\d+\/\d+$/.test(url.pathname))
        data = { commitment: null, items: [], stocks: [], daily_orders: [], week_dates: [] };
      if (url.pathname === '/api/v1/aldi-weekly-prices') data = [
        { id: 401, week_code: 'KW40', year }, { id: 411, week_code: 'KW41', year }
      ];
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); return;
    }
    if (url.pathname === '/src/auth.js') {
      res.writeHead(200, { 'Content-Type': 'text/javascript' });
      res.end('export function initAuth(cb){document.querySelector("#app").style.display="flex";document.querySelector("#login-overlay").style.display="none";cb();}'); return;
    }
    if (url.pathname === '/src/modules/ai-chat.js') {
      res.writeHead(200, { 'Content-Type': 'text/javascript' }); res.end('export function initAiChat(){}'); return;
    }
    const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname)));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    const ext = path.extname(file);
    res.writeHead(200, { 'Content-Type': ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml' }[ext] || 'application/octet-stream') + '; charset=utf-8' });
    if (ext === '.html') {
      res.end(fs.readFileSync(file, 'utf8').replace(/<link[^>]*href="https:[^>]*>/g, '')
        .replace(/<script src="https:[^"]*"><\/script>/g, ''));
    } else res.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const category = page.locator('.nav-category[data-category-id="aldi"]');
  const toggle = category.locator('.nav-submenu-toggle');
  const submenu = category.locator('.nav-group-submenu');
  const open = async id => {
    if (!(await category.getAttribute('class')).includes('expanded')) await category.locator('.nav-category-header').click();
    await toggle.click();
    await submenu.locator(`[data-module="${id}"]`).click();
  };
  assert.deepEqual(await category.locator('.nav-category-items > .nav-group-button .nav-label, .nav-submenu-toggle .nav-label').allTextContents(), [
    'Rendelések', 'Stock', 'Quality', 'Rakodás', 'Belföldi fuvarok', 'Termék adattábla'
  ]);
  assert.deepEqual(await submenu.locator('.nav-label').allTextContents(), [
    'Napi rendelés', 'Heti lekötés', 'Heti árak', 'Komissió utasítás'
  ]);
  const ids = ['aldi_napi_rendeles', 'aldi_heti_lekotes', 'aldi_heti_arak', 'aldi_komissio_utasitas'];
  const win = id => page.locator(`.mdi-window[id^="${id}-"]`);
  const background = await page.locator('#content-view').innerHTML();
  await category.locator('.nav-category-header').click();
  assert.equal(await submenu.isVisible(), false);
  await toggle.hover();
  assert.equal(await submenu.isVisible(), true);
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
  const parentBox = await toggle.boundingBox(), submenuBox = await submenu.boundingBox();
  assert.ok(submenuBox.x >= parentBox.x + parentBox.width - 1, 'Submenu opens to the right');
  await submenu.locator(`[data-module="${ids[3]}"]`).hover();
  assert.equal(await submenu.isVisible(), true, 'Moving from parent to submenu keeps it open');
  await category.locator('.nav-category-header').hover();
  assert.equal(await submenu.isVisible(), false);
  await toggle.click();
  await page.mouse.move(1430, 950);
  assert.equal(await submenu.isVisible(), true, 'Click keeps the submenu open when the cursor leaves');
  assert.equal(await page.locator('.mdi-window').count(), 0, 'Parent click does not launch the old Orders module');
  assert.equal(await page.locator('#content-view').innerHTML(), background);
  await page.keyboard.press('Escape');
  assert.equal(await submenu.isVisible(), false);
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  await page.keyboard.press('Enter');
  assert.equal(await submenu.isVisible(), true);
  await page.mouse.click(1430, 950);
  assert.equal(await submenu.isVisible(), false, 'Outside click closes the flyout and category');
  for (const id of ids) await open(id);
  await win(ids[0]).locator('.aldi-order-link').first().waitFor({ state: 'attached' });
  await page.waitForFunction(() => document.querySelector('#aldi-lekotes-week-select')?.value === '41' &&
    document.querySelector('#aldi-arak-week-select')?.value === '411');
  assert.equal(await page.locator('.mdi-window').count(), 4);
  assert.equal(await page.locator('#content-view').innerHTML(), background);
  assert.equal(await page.locator('.mdi-window #aldi-tab-napi:visible').count(), 0);
  assert.ok(requests.some(r => r.url === `/api/v1/aldi-weekly-commitments/${year}/41`));
  assert.ok(requests.some(r => r.url === '/api/v1/aldi-weekly-prices/411/lines'));

  await open(ids[0]);
  await win(ids[0]).locator('#aldi-filter-order').fill('ORDER_A');
  assert.equal(await win(ids[0]).locator('.aldi-order-link').count(), 1);
  await open(ids[1]);
  await win(ids[1]).locator('#aldi-lekotes-week-select').selectOption('40');
  await page.waitForFunction(() => document.querySelector('#aldi-lekotes-week-select')?.value === '40');
  await open(ids[2]);
  await Promise.all([
    page.waitForResponse(r => r.url().includes(`/aldi-weekly-prices?year=${year - 1}`)),
    win(ids[2]).locator('#aldi-arak-year-select').selectOption(String(year - 1))
  ]);
  assert.equal(await win(ids[1]).locator('#aldi-lekotes-year-select').inputValue(), String(year));
  assert.equal(await win(ids[1]).locator('#aldi-lekotes-week-select').inputValue(), '40');
  await open(ids[3]);
  await win(ids[3]).locator('#aldi-komissio-filter-date').fill('2026-10-06');
  await win(ids[3]).locator('#aldi-komissio-filter-date').press('Tab');
  await page.waitForFunction(() => document.querySelector('#aldi-komissio-filter-date')?.value === '2026-10-06');

  const box = await win(ids[3]).boundingBox();
  await page.mouse.move(box.x + box.width - 3, box.y + box.height - 3);
  await page.mouse.down(); await page.mouse.move(box.x + box.width + 97, box.y + box.height + 57); await page.mouse.up();
  const resized = await win(ids[3]).boundingBox();
  assert.ok(resized.width >= box.width + 90 && resized.height >= box.height + 50, 'Native resize handle changes both dimensions');
  await win(ids[3]).locator('.maximize').click();
  assert.match(await win(ids[3]).getAttribute('class'), /maximized/);
  await win(ids[3]).locator('.maximize').click();

  for (const id of [...ids].reverse()) { await open(id); await win(id).locator('.minimize').click(); }
  assert.equal(await page.locator('.mdi-window:visible').count(), 0);
  assert.equal(await page.locator('.mdi-taskbar .taskbar-item:visible').count(), 4);
  await page.locator(`.taskbar-item[data-window-id^="${ids[0]}-"]`).click();
  assert.equal(await win(ids[0]).locator('#aldi-filter-order').inputValue(), 'ORDER_A');
  const requestCount = requests.length;
  await open(ids[0]);
  assert.equal(await page.locator('.mdi-window').count(), 4);
  assert.equal(requests.length, requestCount, 'Reopening focuses the same instance without reloading');
  await open(ids[3]);
  assert.equal(await win(ids[3]).locator('#aldi-komissio-filter-date').inputValue(), '2026-10-06');
  await open(ids[1]);
  assert.equal(await win(ids[1]).locator('#aldi-lekotes-week-select').inputValue(), '40');
  await win(ids[1]).locator('.close').click();
  assert.equal(await page.locator('.mdi-window').count(), 3);
  await open(ids[1]);
  await win(ids[1]).locator('#aldi-lekotes-week-select').waitFor();
  assert.equal(await page.locator('.mdi-window').count(), 4);
  assert.ok(requests.some(r => r.url.includes('commission-summary?date=2026-10-06')));
  assert.ok(requests.some(r => r.url === `/api/v1/aldi-weekly-commitments/${year}/40`));
  assert.ok(requests.filter(r => r.url.startsWith('/api/')).every(r => r.method === 'GET'), 'Opening and filtering do not save data');
  assert.deepEqual(errors, []);
});
