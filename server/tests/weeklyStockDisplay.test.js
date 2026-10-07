const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../../Access UI/src/utils/weeklyCommitments.js'), 'utf8');
const helpers = import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const dates = ['2026-09-09','2026-09-10','2026-09-11','2026-09-12','2026-09-13','2026-09-14','2026-09-15'];

test('stock snapshot uses weekly closing for the entire week', async () => {
  const { stockAtDate } = await helpers;
  const closings = [900,800,700,600,500,400,300];
  assert.equal(stockAtDate(1000,dates,closings),300);
  assert.equal(stockAtDate(1000,[],[]),1000);
});

test('stock consumption uses fulfilled, then ordered, then estimated, including explicit zeros', async () => {
  const { dailyBalance } = await helpers;
  assert.equal(dailyBalance(1000,100,null,170).closing,930);
  assert.equal(dailyBalance(1000,100,120,170).closing,980);
  assert.equal(dailyBalance(1000,100,120,170,80).closing,1020);
  assert.equal(dailyBalance(1000,100,120,170,0).closing,1100);
  assert.equal(dailyBalance(1000,100,0,170,null).closing,1100);
  assert.equal(dailyBalance(1000,100,null,170,null).closing,930);
  assert.equal(dailyBalance(100,0,80,170,120).shortage,20);
  assert.equal(dailyBalance(100,0,80,170,0).shortage,0);
});

test('table fulfillment changes stock and subsequent shortage while estimates and KW remain intact', async () => {
  const util = await helpers;
  const ui = fs.readFileSync(path.join(__dirname, '../../Access UI/src/modules/aldi_rendelesek.js'), 'utf8');
  const start = ui.indexOf('  function renderHetiLekotesHtml()');
  const end = ui.indexOf('  async function fetchHetiLekotesWeeks()',start);
  const state = {
    hetiLekotesYear:2026, hetiLekotesSelectedWeek:37, hetiLekotesWeeks:[37],
    hetiLekotesData:{
      items:[{type:'normal',display_name:'530766',product_name:'Korte',total_forecast_cartons:1000}],
      stocks:[{article_number:'530766',initial_stock:1000}],daily_orders:[],week_dates:dates
    }
  };
  const render = vm.runInNewContext(ui.slice(start,end)+'\nrenderHetiLekotesHtml', {
    ...util,state,budapestToday:()=>dates[0],buildYearOptions:()=>''
  });
  const closing = html => Number(html.match(/class="lekotes-current-stock"[^>]*>(-?\d+)</)[1]);
  assert.equal(closing(render()),0);
  const order = {date:dates[0],article_number:'530766',total:120,fulfilled:null};
  state.hetiLekotesData.daily_orders.push(order);
  assert.equal(closing(render()),50);
  order.fulfilled=80;
  assert.equal(closing(render()),90);
  order.fulfilled=0;
  assert.equal(closing(render()),170);
  order.fulfilled=null;
  assert.equal(closing(render()),50);
  order.fulfilled=200;
  const html=render();
  assert.equal(closing(html),-30);
  assert.match(html,/>\s*-30\s*</);
  assert.match(html,/<span>1000<\/span>/);
  assert.match(html,/>170<\/td>/);
  assert.match(html,/>200<\/td>/);
  assert.equal(closing(render()),-30); // Rendering again does not deduct fulfillment twice.
});

test('actual stock cell changes with estimates, actual orders, zero and arrivals; opening remains editable', async () => {
  const util = await helpers;
  const ui = fs.readFileSync(path.join(__dirname, '../../Access UI/src/modules/aldi_rendelesek.js'), 'utf8');
  const start = ui.indexOf('  function renderHetiLekotesHtml()');
  const end = ui.indexOf('  async function fetchHetiLekotesWeeks()',start);
  const state = {
    hetiLekotesYear:2026, hetiLekotesSelectedWeek:37, hetiLekotesWeeks:[37],
    hetiLekotesData:{
      items:[{type:'normal',display_name:'530766',product_name:'Korte',total_forecast_cartons:1000}],
      stocks:[{article_number:'530766',initial_stock:1000,inc_fri:20,inc_sat:999}],
      daily_orders:[],week_dates:dates
    }
  };
  const render = vm.runInNewContext(ui.slice(start,end)+'\nrenderHetiLekotesHtml', {
    ...util, state, budapestToday:()=> '2026-09-11', buildYearOptions:()=>''
  });
  const displayed = () => {
    const html=render();
    assert.match(html,/data-field="initial_stock" value="1000"/);
    return Number(html.match(/class="lekotes-current-stock"[^>]*>(-?\d+)</)[1]);
  };
  assert.equal(displayed(),1019); // full week calculation
  state.hetiLekotesData.daily_orders=[
    {date:dates[0],article_number:'530766',total:100},
    {date:dates[1],article_number:'530766',total:0},
    {date:dates[2],article_number:'530766',total:50}
  ];
  assert.equal(displayed(),1379);
  assert.equal(displayed(),1379); // rerender does not subtract twice
  state.hetiLekotesData.stocks[0].inc_fri=120;
  assert.equal(displayed(),1479);
  state.hetiLekotesData.daily_orders[0].total=200;
  assert.equal(displayed(),1379);
});

test('shortage is displayed with negative sign and closing stock is at the end after tuesday', async () => {
  const util = await helpers;
  const ui = fs.readFileSync(path.join(__dirname, '../../Access UI/src/modules/aldi_rendelesek.js'), 'utf8');
  const start = ui.indexOf('  function renderHetiLekotesHtml()');
  const end = ui.indexOf('  async function fetchHetiLekotesWeeks()',start);
  const state = {
    hetiLekotesYear:2026, hetiLekotesSelectedWeek:37, hetiLekotesWeeks:[37],
    hetiLekotesData:{
      items:[{type:'normal',display_name:'530766',product_name:'Korte',total_forecast_cartons:1000}],
      stocks:[{article_number:'530766',initial_stock:0}],
      daily_orders:[],week_dates:dates
    }
  };
  const render = vm.runInNewContext(ui.slice(start,end)+'\nrenderHetiLekotesHtml', {
    ...util, state, budapestToday:()=> '2026-09-11', buildYearOptions:()=>''
  });
  const html = render();
  assert.match(html, />\s*-170\s*</);
  const keddIdx = html.indexOf('>Kedd</th>');
  const zaroHeaderIdx = html.indexOf('>Záró raktárkészlet</th>');
  assert.ok(zaroHeaderIdx > keddIdx, 'Záró raktárkészlet header should be after Kedd');
});
