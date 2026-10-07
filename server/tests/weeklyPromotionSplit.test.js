const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { defaultRates } = require('../src/utils/commitmentRates');
const { planForecast } = require('../src/utils/weeklyCommitmentExcel');
const source = fs.readFileSync(path.join(__dirname, '../../Access UI/src/utils/weeklyCommitments.js'), 'utf8');
const helpers = import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const dates = ['2026-09-02','2026-09-03','2026-09-04','2026-09-05','2026-09-06','2026-09-07','2026-09-08'];
const daily = { thu:681, fri:666, sat:609, sun:502, mon:83, tue:74, wed:70 };
const plan = { type:'action', display_name:'530766', product_name:'Körte', action_period:'03.09.-06.09.', total_forecast_cartons:2685, daily_values:daily };
const demand = total => ({ type:'normal', display_name:'530766', total_forecast_cartons:total });

test('original promotion and off-period quantities, percentages and shifted days are restored', async () => {
  const {buildWeeklyProducts} = await helpers;
  const product = buildWeeklyProducts([plan], dates)['530766'];
  assert.equal(product.actionTotal,2458);
  assert.equal(product.normalTotal,227);
  assert.equal(product.weeklyTotal,2685);
  assert.deepEqual(product.actionDays,['wed','thu','fri','sat']);
  assert.deepEqual(product.distribution,{wed:737,thu:737,fri:541,sat:442,sun:45,mon:68,tue:114});
});

test('weekly total uses the greater Excel forecast; excess demand increases the promotion base', async () => {
  const {buildWeeklyProducts} = await helpers;
  for (const total of [0,2000,2685]) {
    const product = buildWeeklyProducts([plan,demand(total)],dates)['530766'];
    assert.equal(product.weeklyTotal,2685);
    assert.equal(product.normalTotal,227);
  }
  const higher = buildWeeklyProducts([plan,demand(3000)],dates)['530766'];
  assert.equal(higher.weeklyTotal,3000);
  assert.equal(higher.actionTotal,2773);
  assert.equal(higher.defaultAction,2773);
  assert.equal(higher.normalTotal,227);
  assert.deepEqual(higher.distribution,{wed:832,thu:832,fri:610,sat:499,sun:45,mon:68,tue:114});
  const forecastColumn = buildWeeklyProducts([{...plan,total_forecast_cartons:2686}],dates)['530766'];
  assert.equal(forecastColumn.weeklyTotal,2686);
  assert.equal(forecastColumn.normalTotal,228);
});

test('2687 demand minus 1706 plan adds 981 to the 1568 promotion and keeps normal 138', async () => {
  const {buildWeeklyProducts} = await helpers;
  const example = {...plan,total_forecast_cartons:1706,daily_values:{thu:500,fri:500,sat:300,sun:268,mon:40,tue:40,wed:58}};
  const product = buildWeeklyProducts([example,demand(2687)],dates)['530766'];
  assert.equal(product.weeklyTotal,2687);
  assert.equal(product.actionTotal,2549);
  assert.equal(product.defaultAction,2549);
  assert.equal(product.normalTotal,138);
  assert.equal(product.defaultNormal,138);
  assert.deepEqual(product.distribution,{wed:765,thu:765,fri:561,sat:459,sun:28,mon:41,tue:69});
  const rates = defaultRates();
  rates.action_four = {wed:40,thu:20,fri:20,sat:20};
  const changed = buildWeeklyProducts([example,demand(2687)],dates,rates)['530766'];
  assert.deepEqual(changed.distribution,{wed:1020,thu:510,fri:510,sat:510,sun:28,mon:41,tue:69});
  const manual = buildWeeklyProducts([{...example,manual_action_demand:1000},demand(2687)],dates)['530766'];
  assert.equal(manual.actionTotal,1000); // A manual total already represents the complete promotion base.
  assert.equal(manual.normalTotal,138);
  assert.equal(manual.weeklyTotal,1138);
  const zeroPromotion = {...example,daily_values:{thu:0,fri:0,sat:0,sun:0,mon:500,tue:500,wed:706}};
  const excessOnly = buildWeeklyProducts([zeroPromotion,demand(2687)],dates)['530766'];
  assert.equal(excessOnly.actionTotal,981);
  assert.equal(excessOnly.normalTotal,1706);
  assert.deepEqual(['wed','thu','fri','sat'].map(day=>excessOnly.distribution[day]),[294,294,216,177]);
});

test('saved percentages apply to both original and manually edited quantities and selected days', async () => {
  const {buildWeeklyProducts} = await helpers;
  const rates = defaultRates();
  rates.action_four = {wed:40,thu:20,fri:20,sat:20};
  rates.off_three = {sun:50,mon:25,tue:25};
  const product = buildWeeklyProducts([{...plan,manual_action_demand:'1000',manual_normal_demand:'400'}],dates,rates)['530766'];
  assert.deepEqual(product.distribution,{wed:400,thu:200,fri:200,sat:200,sun:200,mon:100,tue:100});
  assert.equal(product.weeklyTotal,1400);
  assert.equal(product.defaultAction,2458);
  assert.equal(product.defaultNormal,227);
  const editedDays = buildWeeklyProducts([{...plan,manual_action_demand:1000,manual_normal_demand:400,action_days_json:['sat','fri']}],dates)['530766'];
  assert.deepEqual(editedDays.actionDays,['fri','sat']);
  assert.deepEqual(editedDays.distribution,{wed:100,thu:100,fri:700,sat:300,sun:60,mon:60,tue:80});
  const small = buildWeeklyProducts([{...plan,manual_action_demand:2,manual_normal_demand:0}],dates)['530766'];
  assert.ok(Object.values(small.distribution).every(value=>value>=0));
  const zero = buildWeeklyProducts([{...plan,manual_action_demand:0,manual_normal_demand:0}],dates)['530766'];
  assert.equal(zero.weeklyTotal,0);
  assert.ok(Object.values(zero.distribution).every(value=>value===0));
});

test('normal-only, no promotion in this week, explicit years and multiple periods preserve totals', async () => {
  const {buildWeeklyProducts} = await helpers;
  assert.deepEqual(buildWeeklyProducts([demand(1000)],dates)['530766'].distribution,
    {wed:170,thu:170,fri:170,sat:130,sun:140,mon:110,tue:110});
  const outside = buildWeeklyProducts([{...plan,action_period:'13.08.-16.08.'}],dates)['530766'];
  assert.equal(outside.actionTotal,0);
  assert.equal(outside.normalTotal,2685);
  assert.ok(Object.values(outside.distribution).every(value=>value>0));
  const outsideHigher = buildWeeklyProducts([{...plan,action_period:'13.08.-16.08.'},demand(3000)],dates)['530766'];
  assert.equal(outsideHigher.actionTotal,0);
  assert.equal(outsideHigher.normalTotal,3000);
  const explicit = buildWeeklyProducts([{...plan,action_period:'03.09.2026 – 06.09.2026'}],dates)['530766'];
  assert.deepEqual(explicit.distribution,buildWeeklyProducts([plan],dates)['530766'].distribution);
  const second = {...plan,action_period:'07.09.-09.09.',total_forecast_cartons:200,daily_values:{thu:0,fri:0,sat:0,sun:0,mon:100,tue:100,wed:0}};
  const forward = buildWeeklyProducts([plan,second],dates)['530766'];
  const reversed = buildWeeklyProducts([second,plan],dates)['530766'];
  assert.deepEqual(forward.distribution,reversed.distribution);
  assert.equal(forward.weeklyTotal,2885);
  assert.equal(forward.actionTotal,2658);
  const higherForward = buildWeeklyProducts([plan,second,demand(3000)],dates)['530766'];
  const higherReversed = buildWeeklyProducts([second,plan,demand(3000)],dates)['530766'];
  assert.deepEqual(higherForward.distribution,higherReversed.distribution);
  assert.equal(higherForward.actionTotal,2773);
  assert.equal(higherForward.normalTotal,227);
  assert.equal(higherForward.weeklyTotal,3000);
});

test('same-period warehouse rows are added without modifying imported data', async () => {
  const {buildWeeklyProducts} = await helpers;
  const items = [plan,{...plan,daily_values:JSON.stringify(daily)}];
  const before = JSON.stringify(items);
  const product = buildWeeklyProducts(items,dates)['530766'];
  assert.equal(product.weeklyTotal,5370);
  assert.equal(product.actionTotal,4916);
  assert.equal(product.normalTotal,454);
  assert.equal(JSON.stringify(items),before);
});

test('real table uses both period estimates, correct KW total and actual-order precedence', async () => {
  const util = await helpers;
  const ui = fs.readFileSync(path.join(__dirname,'../../Access UI/src/modules/aldi_rendelesek.js'),'utf8');
  const start = ui.indexOf('  function renderHetiLekotesHtml()'), end = ui.indexOf('  async function fetchHetiLekotesWeeks()',start);
  const state = {hetiLekotesYear:2026,hetiLekotesSelectedWeek:36,hetiLekotesWeeks:[36],hetiLekotesData:{
    items:[plan,demand(3000)],stocks:[{article_number:'530766',initial_stock:5000}],
    daily_orders:[{article_number:'530766',date:dates[0],total:0}],week_dates:dates
  }};
  const render = vm.runInNewContext(ui.slice(start,end)+'\nrenderHetiLekotesHtml',{...util,state,budapestToday:()=>dates[1],buildYearOptions:()=>''});
  const html = render();
  assert.match(html,/<span>3000<\/span>/);
  assert.match(html,/>832<\/td>/);
  assert.match(html,/>45<\/td>/);
  assert.equal(Number(html.match(/class="lekotes-current-stock"[^>]*>(-?\d+)</)[1]),2832); // Actual zero replaces Wednesday's increased promotion estimate.
});

test('plan import reads the forecast column even when rounded daily cells have a different sum', () => {
  const headers = ['Display','Értékesítési előrejelzés (kartonokban) 03.09. - 09.09.'];
  assert.equal(planForecast(headers,['530766',2686],2685),2686);
  assert.equal(planForecast(headers,['530766','2 686,5'],2685),2686.5);
  assert.equal(planForecast(headers,['530766',0],2685),0);
  assert.equal(planForecast(headers,['530766',null],2685),2685);
  assert.equal(planForecast(['Display'],['530766'],2685),2685);
  assert.throws(()=>planForecast(headers,['530766',-1],2685));
  assert.throws(()=>planForecast(headers,['530766','hibás'],2685));
});
