import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {stateApi} from '../server/state-api.mjs';
const sql=new DatabaseSync(':memory:');for(const f of ['0000_sad_ultimates.sql','0001_open_power_man.sql','0002_common_joystick.sql','0003_sleepy_wallop.sql'])sql.exec(readFileSync(new URL('../drizzle/'+f,import.meta.url),'utf8'));
const db={prepare(q){return {bind(...args){return {q,args,async first(){return sql.prepare(q).get(...args)||null},async all(){return {results:sql.prepare(q).all(...args)}}}}}},async batch(list){sql.exec('BEGIN');try{const r=list.map(s=>({results:sql.prepare(s.q).all(...s.args)}));sql.exec('COMMIT');return r}catch(e){sql.exec('ROLLBACK');throw e}}};
const state={version:1,tasks:[],notes:[],events:[],foods:[],library:[],water:[],workouts:[],habits:[],checks:{},settings:{name:'Test',waterGoal:2000}};
const req=(actor,method='GET',rev=0,path='')=>new Request('https://minimal.test/api/state'+path,{method,headers:{Origin:'https://minimal.test','Content-Type':'application/json','X-Minimal-Account':actor,'If-Match':String(rev)},...(method==='PUT'?{body:JSON.stringify(state)}:{})});
for(let i=0;i<20;i++)assert.equal((await stateApi(req('user-'+i,'PUT'),db,'user-'+i)).status,200);
assert.equal((await stateApi(req('full','PUT'),db,'full')).status,503);assert.equal((await stateApi(req('user-0','PUT',1),db,'user-0')).status,200);
const day=Math.floor(Date.now()/86400000);sql.prepare('UPDATE minimal_api_limits SET hits=5000,window_start=? WHERE bucket=?').run(day,'global:daily');let r=await stateApi(req('user-0'),db,'user-0');assert.equal(r.status,429);assert.ok(Number(r.headers.get('Retry-After'))>=1);assert.ok(Number(r.headers.get('Retry-After'))<=86400);sql.prepare('UPDATE minimal_api_limits SET window_start=? WHERE bucket=?').run(day-1,'global:daily');assert.equal((await stateApi(req('user-0'),db,'user-0')).status,200);
for(let i=0;i<3;i++)assert.equal((await stateApi(req('user-0','GET',0,'?backup=1'),db,'user-0')).status,200);assert.equal((await stateApi(req('user-0','GET',0,'?backup=1'),db,'user-0')).status,429);
console.log('PASS: private-preview account admission cap, continued existing-account writes, shared daily request budget/reset/Retry-After and full-backup rate limits. These do not guarantee provider billing limits.');

// One account must not be able to spend the budgets shared by every account.
{
 const iso=new DatabaseSync(':memory:');for(const f of ['0000_sad_ultimates.sql','0001_open_power_man.sql','0002_common_joystick.sql','0003_sleepy_wallop.sql'])iso.exec(readFileSync(new URL('../drizzle/'+f,import.meta.url),'utf8'));
 const idb={prepare(q){return {bind(...args){return {q,args,async first(){return iso.prepare(q).get(...args)||null},async all(){return {results:iso.prepare(q).all(...args)}}}}}},async batch(list){iso.exec('BEGIN');try{const r=list.map(s=>({results:iso.prepare(s.q).all(...s.args)}));iso.exec('COMMIT');return r}catch(e){iso.exec('ROLLBACK');throw e}}};
 const hits=bucket=>iso.prepare('SELECT hits FROM minimal_api_limits WHERE bucket=?').get(bucket)?.hits||0;
 let served=0,refused=0;for(let i=0;i<400;i++){const status=(await stateApi(req('noisy','GET',0,'?session=1'),idb,'noisy')).status;if(status===200)served++;else{assert.equal(status,429);refused++}}
 assert.ok(served>=120&&refused>0);
 // Refused requests never reach a shared counter.
 assert.equal(hits('global:daily'),served);
 assert.equal((await stateApi(req('victim','GET',0,'?session=1'),idb,'victim')).status,200);
 for(let i=0;i<8;i++)await stateApi(req('noisy','GET',0,'?backup=1'),idb,'noisy');assert.ok(hits('global:recovery')<=3);
 // The per-account daily cap stops one account before the shared daily budget.
 assert.equal((await stateApi(req('capped','GET',0,'?session=1'),idb,'capped')).status,200);
 const today=Math.floor(Date.now()/86400000),before=hits('global:daily');iso.prepare('UPDATE minimal_api_limits SET hits=1500,window_start=? WHERE bucket=?').run(today,'user:capped:daily');
 const capped=await stateApi(req('capped','GET',0,'?session=1'),idb,'capped');assert.equal(capped.status,429);assert.ok(Number(capped.headers.get('Retry-After'))>=1&&Number(capped.headers.get('Retry-After'))<=86400);
 assert.equal(hits('global:daily'),before);
 assert.equal((await stateApi(req('victim','GET',0,'?session=1'),idb,'victim')).status,200);
 console.log('PASS: per-account limits are charged before shared budgets; refused requests leave shared counters untouched; per-account daily cap; other accounts stay served.');
}
