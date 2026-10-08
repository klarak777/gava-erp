const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');

test('weekly editor shows Excel quantities and original days; only edits persist and rates still apply', async t => {
  const root = path.resolve(__dirname,'../../Access UI');
  const puts = [], deletes = [], errors = [];
  const item = {type:'action',display_name:'530766',product_name:'Körte',action_period:'03.09.-06.09.',total_forecast_cartons:1706,
    daily_values:{thu:500,fri:500,sat:300,sun:268,mon:40,tue:40,wed:58},manual_action_demand:null,manual_normal_demand:null,action_days_json:null};
  const demand = {type:'normal',display_name:'530766',total_forecast_cartons:2687};
  const normalItem = {type:'normal',display_name:'3301',product_name:'Normál termék',total_forecast_cartons:1000};
  const outsideItem = {...item,display_name:'3302',product_name:'Másik hét akciója',action_period:'13.08.-16.08.',total_forecast_cartons:1706};
  const incompleteItem = {...item,display_name:'3303',product_name:'Hiányzó napi terv',total_forecast_cartons:2994,daily_values:null};
  const items = [item,demand,normalItem,outsideItem,incompleteItem];
  let releaseInitialData, dataRequests=0;
  const initialDataReady=new Promise(resolve=>{releaseInitialData=resolve;});
  const server = http.createServer(async (req,res) => {
    const url = new URL(req.url,'http://localhost');
    if (url.pathname.startsWith('/api/')) {
      let data = [];
      if (req.method === 'DELETE') {
        const article=decodeURIComponent(url.pathname.split('/').at(-1));deletes.push(article);
        for(let i=items.length-1;i>=0;i--) if(items[i].display_name===article) items.splice(i,1);
        data={success:true};
      } else if (req.method === 'PUT') {
        const chunks=[];for await(const chunk of req) chunks.push(chunk);
        const body=JSON.parse(Buffer.concat(chunks).toString()); puts.push(body);
        Object.assign(items.find(row=>row.display_name===decodeURIComponent(url.pathname.split('/').at(-1))),body); data={success:true};
      } else if (/\/aldi-weekly-commitments\/weeks\//.test(url.pathname)) data=[36];
      else if (/\/aldi-weekly-commitments\/\d+\/36$/.test(url.pathname)) {
        dataRequests++;
        await initialDataReady;
        data={
        items,stocks:[],daily_orders:[],week_dates:['2026-09-02','2026-09-03','2026-09-04','2026-09-05','2026-09-06','2026-09-07','2026-09-08']
        };
      }
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
  await page.clock.install();
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(()=>document.querySelector('#aldi-lekotes-week-select')?.value==='36');
  assert.equal(await page.locator('#aldi-lekotes-year-select').isVisible(),true);
  assert.equal(await page.locator('#aldi-lekotes-rates-btn').isVisible(),true);
  assert.equal(await page.getByRole('status').isVisible(),true);
  await page.clock.fastForward(10000);
  assert.equal(dataRequests,1,'Periodic refresh must wait for the initial data request');
  releaseInitialData();
  await page.clock.resume();
  const edit=()=>page.locator('.lekotes-edit-btn[data-article="530766"]');
  await edit().waitFor();
  assert.equal(await page.getByText('Egyes termékek napi tervadatai hiányoznak.',{exact:false}).count(),0);
  const checkDays=async expected=>assert.deepEqual(await page.locator('.aldi-edit-day-cb:checked').evaluateAll(nodes=>nodes.map(n=>n.value).sort()),[...expected].sort());
  const kw=()=>edit().locator('..').locator('span').innerText();
  const estimates=()=>edit().locator('xpath=ancestor::tr').locator('td').evaluateAll(cells=>[3,6,9,12,15,18,21].map(index=>Number(cells[index].textContent.trim())));
  assert.deepEqual(await estimates(),[470,470,345,282,224,336,560]);
  await edit().click();
  assert.equal(await page.getByLabel('Akciós időszak',{exact:true}).inputValue(),'1568');
  assert.equal(await page.getByLabel('Akciós időszakon kívüli',{exact:true}).inputValue(),'1119');
  assert.equal(await page.getByLabel('Normál',{exact:true}).count(),0);
  assert.equal(await page.locator('#aldi-lekotes-edit-modal input[type="number"]').count(),2);
  assert.equal(await page.locator('#aldi-edit-normal').inputValue(),'1119');
  assert.equal(await page.locator('#aldi-edit-action').inputValue(),'1568');
  await checkDays(['wed','thu','fri','sat']);
  await page.locator('#aldi-edit-modal-cancel').click();assert.equal(puts.length,0);
  await edit().click();await page.locator('#aldi-edit-modal-save').click();
  assert.equal(puts.length,0);assert.equal(await kw(),'2687');

  await edit().click();await page.locator('#aldi-edit-normal').fill('400');await page.locator('#aldi-edit-modal-save').click();
  await page.waitForFunction(()=>document.querySelector('.lekotes-edit-btn[data-article="530766"]')?.parentElement.querySelector('span').textContent==='1968');
  assert.deepEqual(puts.at(-1),{manual_action_demand:null,manual_normal_demand:400,action_days_json:null});
  await edit().click();assert.equal(await page.locator('#aldi-edit-normal').inputValue(),'400');
  assert.equal(await page.locator('#aldi-edit-action').inputValue(),'1568');await checkDays(['wed','thu','fri','sat']);
  await page.locator('#aldi-edit-action').fill('1000');await page.locator('#aldi-edit-modal-save').click();
  await page.waitForFunction(()=>document.querySelector('.lekotes-edit-btn[data-article="530766"]')?.parentElement.querySelector('span').textContent==='1400');
  assert.deepEqual(puts.at(-1),{manual_action_demand:1000,manual_normal_demand:400,action_days_json:null});
  assert.deepEqual(await estimates(),[300,300,220,180,80,120,200]);

  await edit().click();await page.locator('.aldi-edit-day-cb[value="wed"]').uncheck();await page.locator('.aldi-edit-day-cb[value="thu"]').uncheck();
  await page.locator('#aldi-edit-modal-save').click();
  await page.waitForFunction(()=>document.querySelector('#aldi-lekotes-edit-modal')===null && document.querySelector('.lekotes-edit-btn[data-article="530766"]')?.closest('tr').querySelector('td:nth-child(10)')?.textContent.trim()==='700');
  assert.deepEqual(puts.at(-1),{manual_action_demand:1000,manual_normal_demand:400,action_days_json:['fri','sat']});
  assert.deepEqual(await estimates(),[100,100,700,300,60,60,80]);
  await edit().click();await checkDays(['fri','sat']);
  const count=puts.length;await page.locator('#aldi-edit-modal-save').click();assert.equal(puts.length,count);

  const normalEdit=()=>page.locator('.lekotes-edit-btn[data-article="3301"]');
  const normalKw=()=>normalEdit().locator('..').locator('span').innerText();
  await normalEdit().click();
  assert.equal(await page.getByLabel('Normál',{exact:true}).inputValue(),'1000');
  assert.equal(await page.locator('#aldi-lekotes-edit-modal input[type="number"]').count(),1);
  assert.equal(await page.locator('#aldi-edit-action').count(),0);
  assert.equal(await page.locator('.aldi-edit-day-cb:visible').count(),0);
  await page.locator('#aldi-edit-modal-save').click();assert.equal(puts.length,count);
  await normalEdit().click();await page.getByLabel('Normál',{exact:true}).fill('500');
  await page.locator('#aldi-edit-modal-save').click();
  await page.waitForFunction(()=>document.querySelector('.lekotes-edit-btn[data-article="3301"]')?.parentElement.querySelector('span').textContent==='500');
  assert.deepEqual(puts.at(-1),{manual_normal_demand:500});
  assert.equal(await normalKw(),'500');
  assert.deepEqual(await normalEdit().locator('xpath=ancestor::tr').locator('td').evaluateAll(cells=>[3,6,9,12,15,18,21].map(index=>Number(cells[index].textContent.trim()))),[85,85,85,65,70,55,55]);
  await normalEdit().click();assert.equal(await page.getByLabel('Normál',{exact:true}).inputValue(),'500');
  await page.getByLabel('Normál',{exact:true}).fill('0');await page.locator('#aldi-edit-modal-save').click();
  await page.waitForFunction(()=>document.querySelector('.lekotes-edit-btn[data-article="3301"]')?.parentElement.querySelector('span').textContent==='0');
  assert.deepEqual(puts.at(-1),{manual_normal_demand:0});
  await normalEdit().click();await page.getByLabel('Normál',{exact:true}).fill('');await page.locator('#aldi-edit-modal-save').click();
  await page.waitForFunction(()=>document.querySelector('.lekotes-edit-btn[data-article="3301"]')?.parentElement.querySelector('span').textContent==='1000');
  assert.deepEqual(puts.at(-1),{manual_normal_demand:null});

  // A normal Excel row can use the same promotion editor, persist and return to normal.
  await normalEdit().click();
  await page.getByRole('switch',{name:'Akciós szerkesztés'}).check();
  assert.equal(await page.getByLabel('Akciós időszak',{exact:true}).inputValue(),'0');
  assert.equal(await page.getByLabel('Akciós időszakon kívüli',{exact:true}).inputValue(),'1000');
  await page.getByLabel('Akciós időszak',{exact:true}).fill('600');
  await page.getByLabel('Akciós időszakon kívüli',{exact:true}).fill('400');
  await page.locator('.aldi-edit-day-cb[value="fri"]').check();
  await page.locator('.aldi-edit-day-cb[value="sat"]').check();
  const beforeCancel=puts.length;
  await page.locator('#aldi-edit-modal-cancel').click();
  assert.equal(puts.length,beforeCancel);
  await normalEdit().click();
  assert.equal(await page.getByRole('switch',{name:'Akciós szerkesztés'}).isChecked(),false);
  await page.getByRole('switch',{name:'Akciós szerkesztés'}).check();
  await page.getByLabel('Akciós időszak',{exact:true}).fill('600');
  await page.getByLabel('Akciós időszakon kívüli',{exact:true}).fill('400');
  await page.locator('.aldi-edit-day-cb[value="fri"]').check();
  await page.locator('.aldi-edit-day-cb[value="sat"]').check();
  await page.locator('#aldi-edit-modal-save').click();
  await page.waitForFunction(()=>document.querySelector('.lekotes-edit-btn[data-article="3301"]')?.closest('tr').querySelector('td:nth-child(10)')?.textContent.trim()==='420');
  assert.deepEqual(puts.at(-1),{manual_normal_demand:400,manual_action_demand:600,action_days_json:['fri','sat']});
  await normalEdit().click();
  assert.equal(await page.getByRole('switch',{name:'Akciós szerkesztés'}).isChecked(),true);
  assert.equal(await page.getByLabel('Akciós időszak',{exact:true}).inputValue(),'600');
  await checkDays(['fri','sat']);
  const beforeUnchanged=puts.length;
  await page.locator('#aldi-edit-modal-save').click();
  assert.equal(puts.length,beforeUnchanged);
  await normalEdit().click();
  await page.getByRole('switch',{name:'Akciós szerkesztés'}).uncheck();
  assert.equal(await page.getByLabel('Normál',{exact:true}).inputValue(),'1000');
  await page.getByRole('switch',{name:'Akciós szerkesztés'}).check();
  assert.equal(await page.getByLabel('Akciós időszakon kívüli',{exact:true}).inputValue(),'400');
  await page.getByRole('switch',{name:'Akciós szerkesztés'}).uncheck();
  await page.locator('#aldi-edit-modal-save').click();
  await page.waitForFunction(()=>document.querySelector('.lekotes-edit-btn[data-article="3301"]')?.closest('tr').querySelector('td:nth-child(10)')?.textContent.trim()==='170');
  assert.deepEqual(puts.at(-1),{manual_normal_demand:1000,manual_action_demand:0,action_days_json:[]});

  // Field names follow the marked period, even when it belongs to another week.
  await page.locator('.lekotes-edit-btn[data-article="3302"]').click();
  assert.equal(await page.getByLabel('Akciós időszak',{exact:true}).inputValue(),'0');
  assert.equal(await page.getByLabel('Akciós időszakon kívüli',{exact:true}).inputValue(),'1706');
  assert.equal(await page.getByLabel('Normál',{exact:true}).count(),0);
  await page.locator('#aldi-edit-modal-cancel').click();

  await edit().click();
  assert.match(await page.locator('#aldi-lekotes-edit-modal').innerText(),/Kézi felülírás van érvényben/);
  assert.match(await page.locator('#aldi-lekotes-edit-modal').innerText(),/akciós 1568, akción kívüli 1119/);
  await page.getByLabel('Akciós időszak',{exact:true}).fill('');
  await page.getByLabel('Akciós időszakon kívüli',{exact:true}).fill('');
  await page.locator('#aldi-edit-modal-save').click();
  await page.waitForFunction(()=>document.querySelector('.lekotes-edit-btn[data-article="530766"]')?.parentElement.querySelector('span').textContent==='2687');
  assert.deepEqual(puts.at(-1),{manual_normal_demand:null,manual_action_demand:null,action_days_json:['fri','sat']});
  await edit().click();
  assert.equal(await page.getByLabel('Akciós időszak',{exact:true}).inputValue(),'1568');
  assert.equal(await page.getByLabel('Akciós időszakon kívüli',{exact:true}).inputValue(),'1119');
  await page.locator('#aldi-edit-modal-cancel').click();

  await page.locator('.lekotes-edit-btn[data-article="3303"]').click();
  assert.equal(await page.getByLabel('Akciós időszak',{exact:true}).inputValue(),'');
  assert.equal(await page.getByLabel('Akciós időszakon kívüli',{exact:true}).inputValue(),'');
  assert.equal(await page.locator('#aldi-lekotes-edit-modal [role="alert"]').count(),0);
  assert.equal(await page.getByText('Hiányoznak a napi tervadatok.',{exact:false}).count(),0);
  const beforeIncompleteSave=puts.length;
  await page.locator('#aldi-edit-modal-save').click();assert.equal(puts.length,beforeIncompleteSave);
  assert.equal(await page.locator('.lekotes-edit-btn[data-article="3303"]').locator('..').locator('span').innerText(),'2994');
  assert.deepEqual(await page.locator('.lekotes-edit-btn[data-article="3303"]').locator('xpath=ancestor::tr').locator('td').evaluateAll(cells=>[3,6,9,12,15,18,21].map(index=>cells[index].textContent.trim())),Array(7).fill('—'));
  // An original Excel promotion can become normal, persist, then become promotional again.
  await edit().click();
  await page.getByRole('switch',{name:'Akciós szerkesztés'}).uncheck();
  assert.equal(await page.getByLabel('Normál',{exact:true}).inputValue(),'2687');
  await page.locator('#aldi-edit-modal-save').click();
  await page.waitForFunction(()=>document.querySelector('.lekotes-edit-btn[data-article="530766"]')?.closest('tr').querySelector('td:nth-child(4)')?.textContent.trim()==='457');
  assert.deepEqual(puts.at(-1),{manual_normal_demand:2687,manual_action_demand:0,action_days_json:[]});
  await edit().click();
  assert.equal(await page.getByRole('switch',{name:'Akciós szerkesztés'}).isChecked(),false);
  const beforeNormalUnchanged=puts.length;
  await page.locator('#aldi-edit-modal-save').click();assert.equal(puts.length,beforeNormalUnchanged);
  await edit().click();
  await page.getByRole('switch',{name:'Akciós szerkesztés'}).check();
  await page.getByLabel('Akciós időszak',{exact:true}).fill('1500');
  await page.getByLabel('Akciós időszakon kívüli',{exact:true}).fill('1187');
  await page.locator('.aldi-edit-day-cb[value="fri"]').check();
  await page.locator('.aldi-edit-day-cb[value="sat"]').check();
  await page.locator('#aldi-edit-modal-save').click();
  await page.waitForFunction(()=>document.querySelector('.lekotes-edit-btn[data-article="530766"]')?.closest('tr').querySelector('td:nth-child(10)')?.textContent.trim()==='1050');

  // Both editors expose deletion; cancelling it sends no request.
  await edit().click();
  page.once('dialog',dialog=>dialog.dismiss());
  await page.getByRole('button',{name:'Törlés',exact:true}).click();
  assert.equal(deletes.length,0);assert.equal(await page.locator('#aldi-lekotes-edit-modal').count(),1);
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Törlés',exact:true}).click();
  await edit().waitFor({state:'detached'});
  assert.deepEqual(deletes,['530766']);
  assert.equal(items.some(row=>row.display_name==='530766'),false);
  await normalEdit().click();
  assert.equal(await page.getByRole('switch',{name:'Akciós szerkesztés'}).isChecked(),false);
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Törlés',exact:true}).click();
  await normalEdit().waitFor({state:'detached'});
  assert.deepEqual(deletes,['530766','3301']);
  assert.equal(await page.locator('.lekotes-edit-btn[data-article="3302"]').count(),1);
  assert.deepEqual(errors,[]);
});
