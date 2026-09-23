// Run with Playwright installed, or set PLAYWRIGHT_MODULE to its package path.
// Set PDA_TEST_BROWSER to a Chromium executable if no Playwright browser is installed.
// Serves local UI files only; every API call is mocked (no database or printer writes).
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const uiRoot = path.resolve(__dirname, '..');
const sscc = '012345678901234560';
const targets = [{ id: 1, name: '1. sor' }];
const apiCalls = [];
let failPrint = false;

const server = http.createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(uiRoot, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(uiRoot + path.sep)) { res.writeHead(403).end(); return; }
  try {
    const data = await fs.readFile(file);
    res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' })[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  } catch { res.writeHead(404).end(); }
});

async function run() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true, ...(process.env.PDA_TEST_BROWSER ? { executablePath: process.env.PDA_TEST_BROWSER } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 810 } });
    page.setDefaultTimeout(6000);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('dialog', dialog => dialog.accept());
    await page.addInitScript(() => {
      localStorage.setItem('pda_token', 'ui-test');
      localStorage.setItem('pda_user', JSON.stringify({ name: 'Teszt Elek' }));
    });
    await page.route('**/api/**', async route => {
      const req = route.request();
      const url = new URL(req.url()).pathname;
      const body = req.postDataJSON();
      apiCalls.push({ url, body, method: req.method() });
      let status = 200;
      let json = [];
      if (url.endsWith('/trucks-for-consolidation')) json = [{ id: 2, truck_number: 'AL02', target_locations: JSON.stringify(targets) }];
      else if (url.includes('/consolidation-member')) {
        const urlObj = new URL(req.url());
        const s = urlObj.searchParams.get('sscc') || '';
        const id = Number(s.slice(-1));
        if (id === 1 || id === 2 || id === 3) {
           if (id === 3) { status = 400; json = { error: 'Nincs hozzá lokációs készletsor.' }; }
           else json = { success: true, label: { id, sscc: s, product_name: 'Nektarin 7kg', picked_cartons: 10, truck_id: 2, truck_number: 'AL02', target_locations: JSON.stringify(targets) } };
        } else {
           status = 404; json = { error: 'Not found' };
        }
      }
      else if (url.endsWith('/consolidation-preview') || url.endsWith('/generate-pallet-label')) json = { success: true, label: { id: 99, sscc } };
      else if (url.endsWith('/print-pallet-label')) { status = failPrint ? 400 : 200; json = failPrint ? { error: 'Ismeretlen nyomtató' } : { success: true }; }
      else if (url.endsWith('/consolidation-validate-location') || url.endsWith('/validate-location')) {
        const barcode = body.locationInput || body.barcode;
        const allowed = barcode === 'S01010000';
        status = allowed ? 200 : 400;
        json = allowed ? { success: true, locationId: 10, locationName: '1. sor / 1', resolved_barcode: 'S01010000' } : {
          error: barcode === 'S01010199' ? 'A céllokáció megtelt. Kapacitás: 1, foglalt: 0, érkező raklapok: 2.' : 'Nem engedélyezett célsor.'
        };
      }
      else if (url.endsWith('/consolidation') || url.endsWith('/pick-and-assign')) json = { success: true };
      else if (url.endsWith('/packaging-types')) json = [{ id: 3, name: 'Doboz', tare_weight_kg: 0.5 }, { id: 4, name: 'EU Raklap', tare_weight_kg: 23 }];
      else if (url.endsWith('/origin-countries')) json = [{ name: 'Magyarország' }];
      else if (url.includes('/commission-lines')) json = [{ id: 5, termek: 'Nektarin 7kg', kartonszam: 100, komissziozott_kartonszam: 0, kamionszam: 'AL02', target_locations: targets, celraktar: 'ALDI', plt: 10 }];
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(json) });
    });

    const activate = name => page.evaluate(async name => (await import('/js/app.js')).showView(name), name);
    const visible = id => page.locator('#' + id).waitFor({ state: 'visible' });
    const commits = () => apiCalls.filter(c => /\/(consolidation|pick-and-assign)$/.test(c.url));
    async function checkLayout(id) {
      await visible(id);
      const layout = await page.evaluate(id => {
        const pane = document.getElementById(id);
        const nav = pane.querySelector('.pda-bottom-nav').getBoundingClientRect();
        const rect = pane.getBoundingClientRect();
        return {
          parent: pane.parentElement.id,
          direction: getComputedStyle(pane).flexDirection,
          visiblePanes: [...document.querySelectorAll('.pda-pane')].filter(p => getComputedStyle(p).display !== 'none').length,
          width: rect.width, height: rect.height, viewportWidth: innerWidth, viewportHeight: innerHeight,
          overflow: pane.scrollWidth > pane.clientWidth,
          navBottom: nav.bottom, navTop: nav.top,
          bodyBottom: pane.querySelector('.pda-form-body').getBoundingClientRect().bottom,
        };
      }, id);
      assert.equal(layout.parent, 'pda-app-root');
      assert.equal(layout.direction, 'column');
      assert.equal(layout.visiblePanes, 1);
      assert.equal(layout.overflow, false);
      assert.equal(layout.width, layout.viewportWidth);
      assert.equal(layout.height, layout.viewportHeight);
      assert.ok(layout.navBottom <= layout.viewportHeight + 1);
      assert.ok(layout.bodyBottom <= layout.navTop + 1);
    }
    async function consolidationToPrint() {
      await activate('consolidation');
      await page.locator('#member-barcode').fill('012345678901234563');
      await page.waitForFunction(() => document.getElementById('member-scan-error').style.display !== 'none');
      assert.match(await page.locator('#member-scan-error').textContent(), /készletsor/);
      
      await page.locator('#member-barcode').fill('012345678901234561');
      await page.waitForFunction(() => document.querySelectorAll('.remove-member-btn').length === 1);
      
      await page.locator('#member-barcode').fill('012345678901234562');
      await page.waitForFunction(() => document.querySelectorAll('.remove-member-btn').length === 2);
      
      await page.locator('#btn-scan-next').click();
      await checkLayout('pane-print');
    }
    await page.goto(base);
    await consolidationToPrint();
    failPrint = true;
    await page.locator('#print-printer-barcode').fill('PRN-001');
    // Várjuk meg az automatikus nyomtatás befejezését (300ms timeout + hálózati kérés)
    await page.waitForFunction(() => document.getElementById('print-printer-barcode').disabled === false);
    await visible('pane-print');
    failPrint = false;
    // Újra triggereljük az inputot
    await page.locator('#print-printer-barcode').fill('PRN-002');
    await page.waitForFunction(() => document.getElementById('pane-dest').classList.contains('active'));
    await checkLayout('pane-dest');
    assert.match(await page.locator('#allowed-rows-box').textContent(), /AL02.*1\. sor/s);
    assert.equal(commits().length, 0);
    await page.locator('#btn-dest-save').click();
    await page.locator('#dest-error').waitFor({ state: 'visible' });
    await page.locator('#dest-vonalkod').fill('S02010000');
    await page.locator('#btn-dest-save').click();
    await page.waitForFunction(() => document.getElementById('dest-error').textContent.includes('Nem engedélyezett'));
    await visible('pane-dest');
    await page.locator('#dest-vonalkod').fill('S01010199');
    await page.locator('#dest-vonalkod').press('Enter');
    await page.waitForFunction(() => document.getElementById('dest-error').textContent.includes('céllokáció megtelt'));
    await visible('pane-dest');
    assert.equal(await page.locator('#pane-sscc').isVisible(), false);
    assert.equal(commits().length, 0);
    assert.deepEqual(apiCalls.filter(c => c.url.endsWith('/consolidation-validate-location')).at(-1).body.labelIds, [1, 2]);
    await page.locator('#dest-vonalkod').fill('S01010000');
    await page.locator('#btn-dest-save').click();
    await checkLayout('pane-sscc');
    assert.match(await page.locator('#test-sscc-hint').textContent(), new RegExp(sscc));
    assert.equal(commits().length, 0);
    await page.locator('#sscc-vonalkod').fill('999999999999999999');
    await page.locator('#btn-sscc-save').click();
    await page.locator('#scan-error').waitFor({ state: 'visible' });
    assert.equal(commits().length, 0);
    // The actual hardware bridge must move back exactly one screen.
    await page.evaluate(() => window.postMessage({ action: 'hw-back' }, '*'));
    await visible('pane-dest');
    await page.locator('#dest-vonalkod').press('Enter');
    await visible('pane-sscc');
    await page.locator('#sscc-vonalkod').fill('(00)' + sscc);
    await page.locator('#btn-sscc-save').click();
    await page.locator('.pda-dashboard').waitFor({ state: 'visible' });
    assert.equal(commits().length, 1);
    assert.deepEqual(commits()[0].body.labelIds, [1, 2]);
    assert.equal(commits()[0].body.locationId, 10);
    console.log('PASS consolidation: print failure, location validation, hardware back, final-only commit');

    for (const viewport of [{ width: 320, height: 480 }, { width: 390, height: 810 }]) {
      await page.setViewportSize(viewport);
      await consolidationToPrint();
      await page.locator('#print-printer-barcode').fill('PRN-001');
      await page.locator('#print-printer-barcode').press('Enter');
      await checkLayout('pane-dest');
      await page.screenshot({ path: path.join(require('node:os').tmpdir(), `pda-destination-${viewport.width}.png`) });
      await page.locator('#dest-vonalkod').fill('S01010000');
      await page.locator('#dest-vonalkod').press('Enter');
      await checkLayout('pane-sscc');
      await page.locator('#pane-sscc .pda-nav-back-btn').click();
      await checkLayout('pane-dest');
      await page.locator('#pane-dest .pda-nav-back-btn').click();
      await checkLayout('pane-print');
      await page.locator('#pane-print .pda-nav-back-btn').click();
      await visible('pane-labels');

      await activate('commission');
      await page.locator('#pda-comm-tbody tr').first().click();
      await page.locator('#form-karton').fill('10');
      await page.locator('#form-brutto').fill('100');
      await page.locator('#form-gongyoleg').selectOption('Doboz');
      await page.locator('#form-orszag').selectOption('Magyarország');
      await page.locator('#form-lot').fill('TEST-LOT');
      await page.locator('#form-raklap').selectOption('4');
      await page.locator('#form-submit').click();
      await checkLayout('pane-print');
      await page.locator('#print-printer-barcode').fill('PRN-001');
      await page.waitForFunction(() => document.getElementById('pane-dest').classList.contains('active'));
      await checkLayout('pane-dest');
      await page.locator('#dest-vonalkod').fill('S01010000');
      await page.locator('#btn-dest-save').click();
      await checkLayout('pane-sscc');
      const before = commits().length;
      await page.locator('#sscc-vonalkod').fill(sscc);
      await page.locator('#btn-sscc-save').click();
      await visible('pane-list');
      assert.equal(commits().length, before + 1);
      assert.equal(commits().at(-1).body.barcode, 'S01010000');
      console.log(`PASS both workflows: shared layout and navigation at ${viewport.width}x${viewport.height}`);
    }
    assert.deepEqual(errors, []);
    console.log('PASS no browser script errors; all APIs mocked');
  } finally { await browser.close(); }
}
run().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => server.close());
