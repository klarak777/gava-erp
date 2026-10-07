const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),xlsx=require('xlsx');
const daily={thu:681,fri:666,sat:609,sun:502,mon:83,tue:74,wed:70};
function workbook(count=1){
  const book=xlsx.utils.book_new();
  const header=['DC','Display','Terméknév','Akciós időszak','Értékesítési előrejelzés 03.09.2026 - 09.09.2026','Csütörtök','Péntek','Szombat','Vasárnap','Hétfő','Kedd','Szerda'];
  const row=['DC','530766','Körte','03.09.-06.09.',2686,...['thu','fri','sat','sun','mon','tue','wed'].map(day=>daily[day])];
  xlsx.utils.book_append_sheet(book,xlsx.utils.aoa_to_sheet([header,...Array.from({length:count},()=>row)]),'Sheet1');
  return xlsx.write(book,{type:'buffer',bookType:'xlsx'});
}
function load(tables,buffer=workbook()){
  const handlers={},writes=[];
  function db(table){
    let filters=[],first=false;
    const rows=()=> (tables[table]||[]).filter(row=>filters.every(fn=>fn(row)));
    const query={
      where(key,value){if(typeof key==='object') for(const [k,v] of Object.entries(key)) filters.push(row=>String(row[k])===String(v));else filters.push(row=>String(row[key])===String(value));return this;},
      whereNull(key){filters.push(row=>row[key]==null);return this;},whereNotNull(key){filters.push(row=>row[key]!=null);return this;},
      select(){return this;},join(){return this;},
      whereBetween(key,[start,end]){filters.push(row=>row[key]>=start&&row[key]<=end);return this;},
      orderBy(){return this;},first(){first=true;return this;},forUpdate(){return this;},
      async update(data){const found=rows();found.forEach(row=>Object.assign(row,data));return found.length;},
      async insert(data){const list=Array.isArray(data)?data:[data];tables[table] ||= [];tables[table].push(...list.map(row=>({...row})));return list.length;},
      then(resolve,reject){return Promise.resolve(first?rows()[0]:rows()).then(resolve,reject);}
    };return query;
  }
  db.fn={now:()=> 'now'};db.raw=async()=>{};db.commit=async()=>{};db.rollback=async()=>{};db.transaction=async cb=>cb?cb(db):db;
  const multer=()=>({single:()=>()=>{}});multer.memoryStorage=()=>({});
  const mocks={express:{Router:()=>Object.fromEntries(['get','post','put'].map(method=>[method,(url,...callbacks)=>{handlers[method+' '+url]=callbacks.at(-1);}]))},
    multer,'../db/db':db,fs:{existsSync:()=>true,readFileSync:()=>buffer,mkdirSync(){},writeFileSync(file){writes.push(file);}}};
  const file=path.resolve(__dirname,'../src/routes/aldi_weekly_commitments.js');
  vm.runInNewContext(fs.readFileSync(file,'utf8'),{require:name=>mocks[name]||require(name.startsWith('.')?path.resolve(path.dirname(file),name):name),module:{},process,console:{error(){},log(){}}});
  return {handlers,writes};
}
async function invoke(fn,req){const res={code:200,status(code){this.code=code;return this;},json(data){this.data=data;}};await fn(req,res);return res;}
const commitment={id:1,year:2026,week_number:36,action_file_path:'Rendelési terv KW36.xlsx'};
const params={year:'2026',week_number:'36',article_number:'530766'};

test('weekly API distinguishes missing fulfillment from zero and adds current-version fulfillment per product/day',async()=>{
  const products=[{chain:'ALDI',gtin:'G1',article_number:'530766',product_name:'Körte'}];
  const row=(date,ordered,fulfilled,status='current')=>({
    'o.delivery_date':date,'o.version_status':status,delivery_date:date,gtin:'G1',ordered_cartons:ordered,fulfilled_cartons:fulfilled
  });
  const {handlers}=load({
    aldi_weekly_commitments:[{...commitment}],chain_products:products,
    'aldi_daily_order_lines as l':[
      row('2026-09-02',100,null),row('2026-09-02',20,null),
      row('2026-09-03',120,'0.00'),row('2026-09-04',80,'50.00'),row('2026-09-04',40,'10.00'),
      row('2026-09-04',999,'999.00','superseded'),row('2026-09-20',999,'999.00')
    ]
  });
  const response=await invoke(handlers['get /:year/:week_number'],{params:{year:'2026',week_number:'36'}});
  assert.equal(response.code,200);
  assert.deepEqual(JSON.parse(JSON.stringify(response.data.daily_orders)),[
    {date:'2026-09-02',article_number:'530766',total:120,fulfilled:null},
    {date:'2026-09-03',article_number:'530766',total:120,fulfilled:0},
    {date:'2026-09-04',article_number:'530766',total:120,fulfilled:60}
  ]);
});

test('weekly GET restores legacy daily data from its archive: 2994 is split, manual values and stored rows remain untouched',async()=>{
  const original={id:21,commitment_id:1,type:'action',display_name:'530766',action_period:'03.09.-06.09.',
    total_forecast_cartons:2686,daily_values:null,manual_action_demand:null,manual_normal_demand:null};
  const demand={id:10,commitment_id:1,type:'normal',display_name:'530766',total_forecast_cartons:2994};
  const tables={aldi_weekly_commitments:[{...commitment}],aldi_weekly_commitment_items:[original,demand]};
  const before=JSON.stringify(tables);
  const {handlers}=load(tables);
  const response=await invoke(handlers['get /:year/:week_number'],{params:{year:'2026',week_number:'36'}});
  assert.equal(response.code,200);assert.equal(response.data.daily_data_restored,1);
  assert.deepEqual(JSON.parse(JSON.stringify(response.data.items[0].daily_values)),daily);
  assert.equal(JSON.stringify(tables),before);
  const source=fs.readFileSync(path.resolve(__dirname,'../../Access UI/src/utils/weeklyCommitments.js'),'utf8');
  const {buildWeeklyProducts}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  const product=buildWeeklyProducts(response.data.items,response.data.week_dates,response.data.rates)['530766'];
  assert.equal(product.weeklyTotal,2994);assert.equal(product.actionTotal,2766);assert.equal(product.normalTotal,228);
  assert.equal(product.splitComplete,true);
  assert.deepEqual(product.distribution,{wed:830,thu:830,fri:609,sat:498,sun:46,mon:68,tue:114});
  original.manual_action_demand=2994;original.manual_normal_demand=0;
  const manualResponse=await invoke(handlers['get /:year/:week_number'],{params:{year:'2026',week_number:'36'}});
  const manualProduct=buildWeeklyProducts(manualResponse.data.items,manualResponse.data.week_dates,manualResponse.data.rates)['530766'];
  assert.equal(manualProduct.actionTotal,2994);assert.equal(manualProduct.normalTotal,0);
  assert.equal(manualProduct.defaultAction,2766);assert.equal(manualProduct.defaultNormal,228);
});

test('unavailable or unmatched archive leaves unknown split explicit, not a full promotion and false zero',async()=>{
  const original={id:21,commitment_id:1,type:'action',display_name:'530766',action_period:'03.09.-06.09.',total_forecast_cartons:2994,daily_values:null};
  const tables={aldi_weekly_commitments:[{...commitment}],aldi_weekly_commitment_items:[original]};
  const {handlers}=load(tables);
  const response=await invoke(handlers['get /:year/:week_number'],{params:{year:'2026',week_number:'36'}});
  assert.equal(response.code,200);assert.equal(response.data.daily_data_restored,0);assert.equal(response.data.warnings.length,1);
  const source=fs.readFileSync(path.resolve(__dirname,'../../Access UI/src/utils/weeklyCommitments.js'),'utf8');
  const {buildWeeklyProducts}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  const product=buildWeeklyProducts(response.data.items,response.data.week_dates)['530766'];
  assert.equal(product.weeklyTotal,2994);assert.equal(product.actionTotal,null);assert.equal(product.normalTotal,null);assert.equal(product.splitComplete,false);
  tables.aldi_weekly_commitments[0].action_file_path=null;
  const missing=await invoke(handlers['get /:year/:week_number'],{params:{year:'2026',week_number:'36'}});
  assert.equal(missing.code,200);assert.equal(missing.data.warnings.length,1);
});

test('archive restoration aggregates warehouses, preserves valid daily data and rejects incomplete archives',()=>{
  const {restoreArchivedDailyPlans}=require('../src/utils/weeklyCommitmentExcel');
  const original={id:21,type:'action',display_name:'530766',action_period:'03.09.-06.09.',total_forecast_cartons:5372,daily_values:null};
  const restored=restoreArchivedDailyPlans([original],workbook(2));
  assert.equal(restored.restored,1);
  assert.deepEqual(restored.items[0].daily_values,Object.fromEntries(Object.entries(daily).map(([key,value])=>[key,value*2])));
  const populated={...original,daily_values:restored.items[0].daily_values};
  assert.equal(restoreArchivedDailyPlans([populated],workbook(2)).items[0],populated);
  const ambiguous=restoreArchivedDailyPlans([{...original,id:1},{...original,id:2}],workbook());
  assert.equal(ambiguous.restored,0);
  const book=xlsx.utils.book_new();xlsx.utils.book_append_sheet(book,xlsx.utils.aoa_to_sheet([['Display','Akciós időszak'],['530766','03.09.-06.09.']]),'Sheet1');
  assert.throws(()=>restoreArchivedDailyPlans([original],xlsx.write(book,{type:'buffer',bookType:'xlsx'})),/napi oszlopai hiányosak/);
  const wrongWeek=['2026-08-12','2026-08-13','2026-08-14','2026-08-15','2026-08-16','2026-08-17','2026-08-18'];
  assert.throws(()=>restoreArchivedDailyPlans([original],workbook(2),wrongWeek),/másik hétre vonatkozik/);
});

test('actual upload saves forecast column, daily bases and week-local defaults',async()=>{
  const tables={aldi_weekly_commitments:[{...commitment}],aldi_weekly_commitment_items:[]};
  const {handlers,writes}=load(tables);const buffer=workbook();
  const response=await invoke(handlers['post /upload'],{body:{},file:{originalname:'KW36 HLA.xlsx',buffer}});
  assert.equal(response.code,200);assert.equal(writes.length,1);
  const item=tables.aldi_weekly_commitment_items[0];
  assert.equal(item.total_forecast_cartons,2686);assert.deepEqual(JSON.parse(item.daily_values),daily);
  assert.equal(item.manual_action_demand,null);assert.equal(item.manual_normal_demand,null);assert.equal(item.action_days_json,null);
});

test('manual API rejects bad quantities or days and partial changes preserve other overrides',async()=>{
  const item={commitment_id:1,display_name:'530766',manual_action_demand:100,manual_normal_demand:null,action_days_json:null};
  const {handlers}=load({aldi_weekly_commitments:[{...commitment}],aldi_weekly_commitment_items:[item]});
  const save=body=>invoke(handlers['put /weeks/:year/:week_number/article/:article_number'],{params,body});
  for(const body of [{manual_normal_demand:-1},{manual_action_demand:'abc'},{action_days_json:['bogus']},{action_days_json:['fri','fri']}]){
    assert.equal((await save(body)).code,400);assert.equal(item.manual_action_demand,100);assert.equal(item.manual_normal_demand,null);
  }
  assert.equal((await save({manual_normal_demand:20})).code,200);
  assert.equal(item.manual_normal_demand,20);assert.equal(item.manual_action_demand,100);
  assert.equal((await save({manual_normal_demand:null,manual_action_demand:0,action_days_json:['sat','fri']})).code,200);
  assert.equal(item.manual_action_demand,0);assert.equal(item.manual_normal_demand,null);assert.deepEqual(JSON.parse(item.action_days_json),['fri','sat']);
});

test('reprocess restores existing daily values and forecast only in selected week, preserving manual edits',async()=>{
  const original={commitment_id:1,type:'action',display_name:'530766',action_period:'03.09.-06.09.',total_forecast_cartons:0,daily_values:'{}',manual_action_demand:1000,manual_normal_demand:400};
  const items=[{...original,id:11},{...original,id:12},{...original,id:13,action_period:'13.08.-16.08.'},{...original,id:14,commitment_id:2}];
  const {handlers}=load({aldi_weekly_commitments:[{...commitment},{...commitment,id:2,week_number:37}],aldi_weekly_commitment_items:items},workbook(2));
  const response=await invoke(handlers['post /reprocess'],{body:{year:2026,week_number:36}});
  assert.equal(response.code,200);assert.equal(response.data.total_updated,2);
  for(const item of items.slice(0,2)){
    assert.equal(item.total_forecast_cartons,2686);assert.deepEqual(JSON.parse(item.daily_values),daily);
    assert.equal(item.manual_action_demand,1000);assert.equal(item.manual_normal_demand,400);
  }
  assert.equal(items[2].total_forecast_cartons,0);assert.equal(items[3].total_forecast_cartons,0);
});

test('reprocess combines source warehouse rows when the stored product is already aggregated',async()=>{
  const item={id:11,commitment_id:1,type:'action',display_name:'530766',action_period:'03.09.-06.09.',total_forecast_cartons:0,daily_values:null};
  const {handlers}=load({aldi_weekly_commitments:[{...commitment}],aldi_weekly_commitment_items:[item]},workbook(2));
  const response=await invoke(handlers['post /reprocess'],{body:{year:2026,week_number:36}});
  assert.equal(response.data.total_updated,1);assert.equal(item.total_forecast_cartons,5372);
  assert.deepEqual(JSON.parse(item.daily_values),Object.fromEntries(Object.entries(daily).map(([key,value])=>[key,value*2])));
});
