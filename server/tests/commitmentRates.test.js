const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { RATE_PROFILES, defaultRates, validateRates } = require('../src/utils/commitmentRates');
const read = relative => fs.readFileSync(path.join(__dirname, relative), 'utf8');
const loadEsm = relative => import('data:text/javascript;base64,' + Buffer.from(read(relative)).toString('base64'));
const helper = loadEsm('../../Access UI/src/utils/weeklyCommitments.js');
const editor = loadEsm('../../Access UI/src/modules/commitmentRatesEditor.js');
const dates = ['2026-09-02','2026-09-03','2026-09-04','2026-09-05','2026-09-06','2026-09-07','2026-09-08'];
const daily = { thu:681, fri:666, sat:609, sun:502, mon:83, tue:74, wed:70 };

test('editor asks approval before saving and cancellation keeps the draft without requests', async () => {
  const { openCommitmentRatesEditor } = await editor;
  const handlers = {};
  const controls = Object.fromEntries(['data-body','data-error','data-save','data-reset','data-cancel'].map(key => [key, {
    style:{}, focus(){}, addEventListener(event, fn){handlers[key + ':' + event] = fn;}
  }]));
  controls['data-body'].querySelector = selector => {
    if (selector === 'input') return {focus(){}};
    if (selector.startsWith('[data-total')) return {style:{}};
    const [,id,day] = selector.match(/data-profile="([^"]+)".*data-day="([^"]+)"/);
    return {value:String(defaultRates()[id][day])};
  };
  let removed = false, approved = false, prompts = 0, requests = 0, saved = 0;
  const overlay = {style:{},isConnected:true,querySelector:s => controls[s.slice(1,-1)],querySelectorAll:()=>Object.values(controls),addEventListener(){},remove(){removed=true;}};
  const original = {document:global.document,window:global.window,fetch:global.fetch};
  global.document = {querySelector:()=>null,createElement:()=>overlay,body:{appendChild(){}},activeElement:null};
  global.window = {confirm:message=>{prompts++;assert.match(message,/2026 \/ KW36/);return approved;}};
  global.fetch = async (url, options) => {
    requests++;
    if (!options) return {ok:true,json:async()=>({commitment:{id:1},rate_profiles:RATE_PROFILES,rates:defaultRates(),rates_version:0})};
    assert.equal(options.method,'PUT');
    assert.equal(url,'/api/v1/aldi-weekly-commitments/2026/36/rates');
    return {ok:true,json:async()=>({rates:JSON.parse(options.body).rates,version:1})};
  };
  try {
    await openCommitmentRatesEditor({year:2026,week:36,onSaved:()=>saved++});
    await handlers['data-save:click']();
    assert.equal(prompts,1);
    assert.equal(requests,1);
    assert.equal(saved,0);
    assert.equal(removed,false);
    approved=true;
    await handlers['data-save:click']();
    assert.equal(requests,2);
    assert.equal(saved,1);
    assert.equal(removed,true);
  } finally { Object.assign(global,original); }
});

test('all seven defaults sum to 100; client and server reject invalid totals and entries', async () => {
  const { profileStatus, renderRateTables } = await editor;
  const defaults = defaultRates();
  assert.deepEqual(validateRates(defaults).errors, []);
  for (const profile of RATE_PROFILES) {
    assert.equal(profileStatus(defaults[profile.id], profile).valid, true);
    const key = Object.keys(profile.defaults)[0];
    const changed = defaultRates();
    changed[profile.id][key]--;
    assert.ok(validateRates(changed).errors.length);
    assert.equal(profileStatus(changed[profile.id], profile).valid, false);
    for (const value of [-1, 101, NaN, Infinity, '', null, 0.001]) {
      changed[profile.id][key] = value;
      assert.ok(validateRates(changed).errors.length);
      assert.equal(profileStatus(changed[profile.id], profile).valid, false);
    }
  }
  const tables = renderRateTables(RATE_PROFILES, defaults);
  assert.equal((tables.match(/<table /g) || []).length, 3);
  assert.equal((tables.match(/data-total=/g) || []).length, 7);
  assert.equal((tables.match(/type="number"/g) || []).length, 28);
});

test('decimal percentages total exactly 100 and zero is valid', () => {
  const rates = defaultRates();
  rates.action_four = { wed: 33.33, thu: 33.33, fri: 33.34, sat: 0 };
  assert.deepEqual(validateRates(rates).errors, []);
  rates.action_four.sat = 0.01;
  assert.ok(validateRates(rates).errors.length);
});

test('saved action, non-action and normal rates reach distribution and preserve actual order priority', async () => {
  const { estimatedDistribution: f, dailyBalance } = await helper;
  const rates = defaultRates();
  assert.deepEqual(f(2685,0,'03.09.-06.09.',dates,daily,rates),f(2685,0,'03.09.-06.09.',dates,daily));
  rates.action_four = { wed:40, thu:20, fri:20, sat:20 };
  rates.off_three = { sun:50, mon:25, tue:25 };
  rates.normal = { wed:50, thu:10, fri:10, sat:10, sun:10, mon:5, tue:5 };
  const estimate = f(2685,0,'03.09.-06.09.',dates,daily,rates).result;
  assert.deepEqual(estimate,{wed:983,thu:492,fri:492,sat:492,sun:114,mon:57,tue:57});
  assert.equal(f(0,1000,null,dates,null,rates).result.wed,500);
  assert.equal(dailyBalance(2000,0,100,estimate.wed).closing,1900);
  assert.equal(dailyBalance(2000,0,0,estimate.wed).closing,2000);
  assert.equal(dailyBalance(2000,0,null,estimate.wed).closing,1017);
  // Other two promotion patterns and their complementary non-action periods.
  rates.action_three = { sun:20,mon:30,tue:50 };
  rates.off_four = { wed:10,thu:20,fri:30,sat:40 };
  assert.deepEqual(f(2685,0,'07.09.-09.09.',dates,daily,rates).result,{wed:246,thu:492,fri:737,sat:983,sun:45,mon:68,tue:114});
  rates.action_two = { fri:50,sat:50 };
  rates.off_five = { wed:20,thu:20,sun:20,mon:20,tue:20 };
  assert.deepEqual(f(2685,0,'05.09.-06.09.',dates,daily,rates).result,{wed:315,thu:315,fri:556,sat:556,sun:315,mon:315,tue:315});
});

test('table rendering recalculates stock after rate save without changing opening or actual orders', async () => {
  const util = await helper;
  const ui = read('../../Access UI/src/modules/aldi_rendelesek.js');
  const start = ui.indexOf('  function renderHetiLekotesHtml()');
  const end = ui.indexOf('  async function fetchHetiLekotesWeeks()',start);
  const stock = { article_number:'530766',initial_stock:2000 };
  const actual = [{ date:dates[0],article_number:'530766',total:100 }];
  const state = { hetiLekotesYear:2026,hetiLekotesSelectedWeek:36,hetiLekotesWeeks:[36],hetiLekotesData:{
    items:[{type:'normal',display_name:'530766',product_name:'Korte',total_forecast_cartons:1000}],
    stocks:[stock],daily_orders:actual,week_dates:dates,rates:defaultRates()
  }};
  const render = vm.runInNewContext(ui.slice(start,end)+'\nrenderHetiLekotesHtml',{...util,state,budapestToday:()=>dates[1],buildYearOptions:()=>''});
  const displayed = () => Number(render().match(/class="lekotes-current-stock"[^>]*>(-?\d+)</)[1]);
  assert.equal(displayed(),1070); // Weekly closing: Wednesday's 170 estimate is replaced by actual 100.
  state.hetiLekotesData.rates.normal = {wed:10,thu:50,fri:10,sat:10,sun:10,mon:5,tue:5};
  assert.equal(displayed(),1000);
  assert.equal(displayed(),1000);
  assert.equal(stock.initial_stock,2000);
  assert.equal(actual[0].total,100);
});

test('rates API saves only selected week, rejects invalid totals and detects concurrent saves', async () => {
  const routes = {};
  const rows = [
    {id:1,year:2026,week_number:36,rates_version:0},
    {id:2,year:2026,week_number:37,rates_version:0}
  ];
  const trx = table => {
    assert.equal(table,'aldi_weekly_commitments');
    let where;
    return { where(value) {where=value;return this;},forUpdate(){return this;},
      async first(){return rows.find(row=>Object.entries(where).every(([key,value])=>row[key]===value));},
      async update(values){Object.assign(rows.find(row=>row.id===where.id),values);}
    };
  };
  trx.fn={now:()=> 'now'};
  const multer=()=>({single:()=>()=>{}});multer.memoryStorage=()=>({});
  const mocks={express:{Router:()=>({get(){},post(){},put(url,...handlers){routes[url]=handlers.at(-1);}})},multer,'../db/db':{transaction:fn=>fn(trx)}};
  vm.runInNewContext(read('../src/routes/aldi_weekly_commitments.js'),{
    require:name=>mocks[name]||require(name.startsWith('../')?path.join(__dirname,'../src/routes',name):name),
    process,module:{},console
  });
  async function save(body) {
    let status,result;
    await routes['/:year/:week_number/rates']({params:{year:'2026',week_number:'36'},body},{status(code){status=code;return this;},json(value){result=value;}});
    return {status,result};
  }
  const rates=defaultRates();
  rates.action_four.wed=20;
  assert.equal((await save({rates,version:0})).status,400);
  assert.equal(rows[0].rates_version,0);
  rates.action_four.thu=40;
  assert.equal((await save({rates,version:0})).status,200);
  assert.equal(rows[0].rates_version,1);
  assert.equal(JSON.parse(rows[0].distribution_rates).action_four.wed,20);
  assert.equal(rows[1].rates_version,0);
  assert.equal(rows[1].distribution_rates,undefined);
  assert.equal((await save({rates,version:0})).status,409);
});
