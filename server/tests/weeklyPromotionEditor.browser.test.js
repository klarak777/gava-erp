const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');

test('weekly editor shows Excel quantities and original days; only edits persist and rates still apply', async t => {
  const root = path.resolve(__dirname,'../../Access UI');
  const puts = [], errors = [];
  const item = {type:'action',display_name:'530766',product_name:'Körte',action_period:'03.09.-06.09.',total_forecast_cartons:1706,
    daily_values:{thu:500,fri:500,sat:300,sun:268,mon:40,tue:40,wed:58},manual_action_demand:null,manual_normal_demand:null,action_days_json:null};
  const demand = {type:'normal',display_name:'530766',total_forecast_cartons:2687};
  const server = http.createServer(async (req,res) => {
    const url = new URL(req.url,'http://localhost');
    if (url.pathname.startsWith('/api/')) {
      let data = [];
      if (req.method === 'PUT') {
        const chunks=[];for await(const chunk of req) chunks.push(chunk);
        const body=JSON.parse(Buffer.concat(chunks).toString()); puts.push(body); Object.assign(item,body); data={success:true};
      } else if (/\/aldi-weekly-commitments\/weeks\//.test(url.pathname)) data=[36];
      else if (/\/aldi-weekly-commitments\/\d+\/36$/.test(url.pathname)) data={
        items:[item,demand],stocks:[],daily_orders:[],week_dates:['2026-09-02','2026-09-03','2026-09-04','2026-09-05','2026-09-06','2026-09-07','2026-09-08']
      };
      res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(data));return;
    }
    if(url.pathname==='/'){
      res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});
      res.end('<!doctype html><body><div id="target"></div><script type="module">import {renderAldiRendelesek} from "/src/modules/aldi_rendelesek.js";renderAldiRendelesek(document.querySelector("#target"),{},"heti");</script>');return;
    }
    const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
    res.writeHead(200,{'Content-Type':'text/javascript;charset=utf-8'});res.end(fs.readFileSync(file));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));});
  const browser=await chromium.launch({headless:true});t.after(()=>browser.close());
  const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const edit=()=>page.locator('.lekotes-edit-btn[data-article="530766"]');
  await edit().waitFor();
  const checkDays=async expected=>assert.deepEqual(await page.locator('.aldi-edit-day-cb:checked').evaluateAll(nodes=>nodes.map(n=>n.value).sort()),[...expected].sort());
  const kw=()=>edit().locator('..').locator('span').innerText();
  const estimates=()=>page.locator('#target table').first().locator('tbody tr').first().locator('td').evaluateAll(cells=>[5,8,11,14,17,20,23].map(index=>Number(cells[index].textContent.trim())));
  assert.deepEqual(await estimates(),[765,765,561,459,28,41,69]);
  await edit().click();
  assert.equal(await page.locator('#aldi-edit-normal').inputValue(),'138');
  assert.equal(await page.locator('#aldi-edit-action').inputValue(),'2549');
  await checkDays(['wed','thu','fri','sat']);
  await page.locator('#aldi-edit-modal-cancel').click();assert.equal(puts.length,0);
  await edit().click();await page.locator('#aldi-edit-modal-save').click();
  assert.equal(puts.length,0);assert.equal(await kw(),'2687');

  await edit().click();await page.locator('#aldi-edit-normal').fill('400');await page.locator('#aldi-edit-modal-save').click();
  await page.waitForFunction(()=>document.querySelector('.lekotes-edit-btn')?.parentElement.querySelector('span').textContent==='2949');
  assert.deepEqual(puts.at(-1),{manual_action_demand:null,manual_normal_demand:400,action_days_json:null});
  await edit().click();assert.equal(await page.locator('#aldi-edit-normal').inputValue(),'400');
  assert.equal(await page.locator('#aldi-edit-action').inputValue(),'2549');await checkDays(['wed','thu','fri','sat']);
  await page.locator('#aldi-edit-action').fill('1000');await page.locator('#aldi-edit-modal-save').click();
  await page.waitForFunction(()=>document.querySelector('.lekotes-edit-btn')?.parentElement.querySelector('span').textContent==='1400');
  assert.deepEqual(puts.at(-1),{manual_action_demand:1000,manual_normal_demand:400,action_days_json:null});
  assert.deepEqual(await estimates(),[300,300,220,180,80,120,200]);

  await edit().click();await page.locator('.aldi-edit-day-cb[value="wed"]').uncheck();await page.locator('.aldi-edit-day-cb[value="thu"]').uncheck();
  await page.locator('#aldi-edit-modal-save').click();
  await page.waitForFunction(()=>document.querySelector('#aldi-lekotes-edit-modal')===null && document.querySelector('#target table tbody tr td:nth-child(12)')?.textContent.trim()==='700');
  assert.deepEqual(puts.at(-1),{manual_action_demand:1000,manual_normal_demand:400,action_days_json:['fri','sat']});
  assert.deepEqual(await estimates(),[100,100,700,300,60,60,80]);
  await edit().click();await checkDays(['fri','sat']);
  const count=puts.length;await page.locator('#aldi-edit-modal-save').click();assert.equal(puts.length,count);
  assert.deepEqual(errors,[]);
});
