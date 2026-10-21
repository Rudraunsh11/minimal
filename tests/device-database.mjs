import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {performance} from 'node:perf_hooks';
// Test-only dependency. Never copied into the shipped static app.
const require=createRequire(import.meta.url),{IDBFactory}=require(process.env.MINIMAL_IDB_TEST_PACKAGE||'fake-indexeddb');
const box=vm.createContext({structuredClone,setTimeout,clearTimeout,TextEncoder,URL,console});
vm.runInContext(await readFile(new URL('../public/device-database.js',import.meta.url),'utf8'),box);
vm.runInContext(await readFile(new URL('../render-beta/dist/schema.js',import.meta.url),'utf8'),box);
const model=box.MinimalDatabase,validate=s=>box.MinimalSchema.validateState(s),factory=new IDBFactory();
const empty=()=>validate({version:1,tasks:[],notes:[],events:[],foods:[],library:[],water:[],workouts:[],habits:[],checks:{},settings:{name:'',waterGoal:2000}});
const db=await model.connect(factory,{name:'migration-tests'}),other=await model.connect(factory,{name:'migration-tests'});
const legacy=empty();legacy.tasks.push({id:'old-task',text:'Keep my existing task',done:true,date:'2026-10-21',priority:'Normal',steps:[]});
const original=JSON.stringify(legacy);let reads=0;
let row=await model.initialize(db,'real',()=>{reads++;return {data:legacy,source:'minimal.life.v1'}},validate);
assert.equal(reads,1);assert.equal(JSON.stringify(legacy),original);assert.equal(row.migratedFrom,'minimal.life.v1');assert.equal(row.revision,1);
await model.initialize(db,'real',()=>{throw Error('Legacy must not be reread')},validate);
await model.initialize(db,'practice',()=>({data:empty(),source:'practice'}),validate);
assert.equal((await db.read('practice')).data.tasks.length,0);
await assert.rejects(model.initialize(db,'bad',()=>({data:{version:99},source:'broken'}),validate));assert.equal(await db.read('bad'),null);
const concurrent=await Promise.all([model.initialize(db,'race',()=>({data:empty(),source:'one'}),validate),model.initialize(other,'race',()=>({data:empty(),source:'two'}),validate)]);assert.equal(concurrent[0].revision,1);assert.equal(concurrent[1].revision,1);
const first=structuredClone(row.data);first.settings.name='First';const r2=await db.write('real',first,1);
assert.equal(r2.previous.tasks[0].text,legacy.tasks[0].text);
await assert.rejects(other.write('real',empty(),1),e=>e.name==='ConflictError');assert.equal((await db.read('real')).data.settings.name,'First');
const restored=await db.write('real',validate(structuredClone(r2.previous)),r2.revision);assert.equal(restored.data.settings.name,'');assert.equal(restored.previous.settings.name,'First');
// An aborted real IndexedDB transaction must preserve the earlier committed row.
const native=await new Promise((ok,no)=>{const r=factory.open('migration-tests',1);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
await new Promise(ok=>{const tx=native.transaction('records','readwrite');tx.objectStore('records').put({...restored,data:{broken:true}});tx.onabort=ok;tx.abort()});assert.equal((await db.read('real')).revision,restored.revision);
const status=[],saved=[];let failOnce=true;
const unreliable={write:async(...args)=>{if(failOnce){failOnce=false;const e=Error('Device storage is full');e.name='QuotaExceededError';throw e}return db.write(...args)}};
const w=model.writer({db:unreliable,key:'real',revision:restored.revision,validate,onStatus:x=>status.push(x),onSaved:r=>saved.push(r)});
const pending=structuredClone(restored.data);pending.settings.name='Pending';w.stage(pending);assert.equal(await w.drain(),false);assert.equal(saved.length,0);assert.equal(w.info().error.name,'QuotaExceededError');assert.equal((await db.read('real')).data.settings.name,'');assert.throws(()=>w.stage(empty()));
assert.equal(w.retry(),true);assert.equal(await w.drain(),true);assert.equal((await db.read('real')).data.settings.name,'Pending');assert.ok(status.some(x=>x.pending&&!x.error));
// Multiple rapid updates keep the newest cumulative snapshot after an active write.
let release;const gate=new Promise(ok=>release=ok);let gated=true;
const queued=model.writer({db:{write:async(...args)=>{if(gated){gated=false;await gate}return db.write(...args)}},key:'real',revision:w.info().revision,validate});
for(let i=1;i<=30;i++){const next=structuredClone(pending);next.settings.name='Update '+i;queued.stage(next)}release();assert.equal(await queued.drain(),true);assert.equal((await db.read('real')).data.settings.name,'Update 30');
const stale=model.writer({db:other,key:'real',revision:1,validate});stale.stage(empty());assert.equal(await stale.drain(),false);assert.equal(stale.retry(),false);assert.equal((await db.read('real')).data.settings.name,'Update 30');
await db.clear(['real']);const tombstone=await db.read('real');assert.equal(tombstone.deleted,true);assert.equal(tombstone.previous,null);
const afterClear=await model.initialize(db,'real',()=>{throw Error('Old data must not resurrect after clear')},validate);assert.equal(afterClear.deleted,true);assert.equal((await db.read('practice')).deleted,false);
await assert.rejects(other.write('real',pending,queued.info().revision),e=>e.name==='ConflictError');
// Ten years of daily meal/water history, plus 30,000 tasks, beyond the old caps.
const years=empty(),food={name:'Reference banana',source:'USDA reference',unit:'g',nutrients:{kcal:89,protein:1.09,carbs:22.84,fat:.33},amount:118,meal:'Breakfast'};
for(let d=0;d<3650;d++){const date=new Date(Date.UTC(2016,0,1+d)).toISOString().slice(0,10);for(let n=0;n<6;n++)years.foods.push({...food,id:`food-${d}-${n}`,date});for(let n=0;n<4;n++)years.water.push({id:`water-${d}-${n}`,date,amount:250})}
for(let n=0;n<30000;n++)years.tasks.push({id:'task-'+n,text:'Recorded priority '+n,done:n%2===0,date:'2026-10-21',priority:'Normal',steps:[]});
if(process.env.MINIMAL_DB_FIXTURE_OUT)await writeFile(process.env.MINIMAL_DB_FIXTURE_OUT,JSON.stringify(years));
const bytes=new TextEncoder().encode(JSON.stringify(years)).length;assert.ok(bytes>900000&&bytes<model.MAX_BYTES);
const start=performance.now();validate(years);const large=await db.write('large',years,null);const readback=await other.read('large');assert.equal(JSON.stringify(readback.data),JSON.stringify(years));
assert.equal(readback.data.foods[123].nutrients.kcal*readback.data.foods[123].amount/100,105.02);
const tooBig=empty();for(let n=0;n<410;n++)tooBig.notes.push({id:'note-'+n,title:'Long note',body:'x'.repeat(50000),updated:'2026-10-21T00:00:00Z'});assert.throws(()=>validate(tooBig),/20 MB/);
const report={result:'PASS',databaseEngine:'fake-indexeddb 6.2.4 (test only)',historyYears:10,foodLogs:years.foods.length,waterLogs:years.water.length,tasks:years.tasks.length,bytes,validationWriteReadMilliseconds:Math.round(performance.now()-start),checks:['legacy unchanged and migrate once','practice separation','invalid migration fail closed','concurrent migration','revision conflicts','interrupted transaction rollback','previous-save restore','quota failure and retry','rapid update queue','clear tombstone prevents resurrection','large history exact roundtrip','size guard'],limits:['Not real-device speed or browser eviction certification']};
console.log(JSON.stringify(report,null,2));native.close();db.close();other.close();
