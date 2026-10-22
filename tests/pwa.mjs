import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
import vm from 'node:vm';
const out=new URL('../render-beta/dist/',import.meta.url),report=JSON.parse(await readFile(new URL('pwa-release.json',out),'utf8')),source=await readFile(new URL('sw.js',out),'utf8'),origin='https://minimal.test';
const bytes=new Map(await Promise.all(report.files.map(async x=>[x.path,await readFile(new URL(x.path,out))])));
for(const f of report.files)assert.equal(createHash('sha256').update(bytes.get(f.path)).digest('hex'),f.sha256);
assert.ok(report.bytes<10000000);assert.ok(!report.files.some(x=>/cloud|fixture|recovery-ui|launch-ui/.test(x.path)));
const manifest=JSON.parse(bytes.get('manifest.webmanifest'));assert.equal(manifest.scope,'/');assert.equal(manifest.start_url,'/');assert.equal(manifest.display,'standalone');
for(const icon of manifest.icons){const b=bytes.get(icon.src);assert.ok(b);assert.equal(b.readUInt32BE(16),Number(icon.sizes.split('x')[0]));assert.equal(b.readUInt32BE(20),Number(icon.sizes.split('x')[1]))}
const backing=new Map();function cacheAPI(){return {async open(name){if(!backing.has(name))backing.set(name,new Map());const c=backing.get(name);return {put:async(k,v)=>c.set(k,v.clone()),match:async k=>c.get(k)?.clone()}},async keys(){return [...backing.keys()]},async delete(name){return backing.delete(name)}}}
function worker({broken=null,corrupt=null,hang=null,pages=1}={}){
 const handlers={},requests=[];let skips=0,claims=0;
 const self={location:{origin},clients:{matchAll:async()=>Array.from({length:pages},(_,i)=>({id:String(i),url:origin+'/'})),claim:async()=>{claims++}},skipWaiting:async()=>{skips++},addEventListener:(n,f)=>handlers[n]=f};
 const box=vm.createContext({self,setTimeout:(fn,ms)=>setTimeout(fn,hang&&ms===45000?1:ms),clearTimeout,AbortController,caches:cacheAPI(),crypto:webcrypto,URL,Response,Uint8Array,Map,Promise,Error,fetch:async(url,options)=>{const p=new URL(url).pathname.slice(1);requests.push({p,options});if(p===broken)throw Error('Network down');if(p===hang)return new Promise((ok,no)=>{if(options.signal.aborted)no(Error('Timed out'));else options.signal.addEventListener('abort',()=>no(Error('Timed out')))});return new Response(p===corrupt?'wrong release':bytes.get(p),{status:200})}});vm.runInContext(source,box);
 async function event(name,extra={}){let work;handlers[name]({...extra,waitUntil:p=>work=p});if(work)await work}
 return {event,requests,get skips(){return skips},get claims(){return claims},fetch:async(url,method='GET')=>{let response;handlers.fetch({request:{url,method},respondWith:p=>response=p});return response?await response:null}};
}
backing.set('unrelated-product',new Map());backing.set('minimal-shell-old-working',new Map([['old',new Response('kept')]]));
let w=worker({broken:'focus.js'});await assert.rejects(w.event('install'));assert.ok(backing.has('minimal-shell-old-working'));assert.ok(!backing.has('minimal-shell-'+report.release));
w=worker({hang:'focus.js'});await assert.rejects(w.event('install'));assert.ok(backing.has('minimal-shell-old-working'));
w=worker({corrupt:'schema.js'});await assert.rejects(w.event('install'));assert.ok(backing.has('minimal-shell-old-working'));
w=worker();await w.event('install');assert.equal(w.skips,0);assert.equal(w.requests.length,report.files.length);assert.ok(w.requests.every(x=>x.options.credentials==='omit'&&x.options.redirect==='error'));
let status;await w.event('message',{data:{type:'STATUS'},ports:[{postMessage:v=>status=v}]});assert.equal(status.offline,true);
assert.equal(await (await w.fetch(origin+'/?demo=1')).text(),bytes.get('index.html').toString());assert.equal(await (await w.fetch(origin+'/focus.js?v=previous-query')).text(),bytes.get('focus.js').toString());
assert.equal(await w.fetch(origin+'/api/private'),null);assert.equal(await w.fetch('https://world.openfoodfacts.org/api/v2/product/123'),null);assert.equal(await w.fetch(origin+'/schema.js','POST'),null);assert.equal(await w.fetch(origin+'/sw.js'),null);
const cache=backing.get('minimal-shell-'+report.release);cache.delete(origin+'/focus.js');
const down=worker({broken:'focus.js'});assert.equal((await down.fetch(origin+'/focus.js')).status,503);await w.event('message',{data:{type:'STATUS'},ports:[{postMessage:v=>status=v}]});assert.equal(status.offline,false);
let repair;await down.event('message',{data:{type:'REPAIR'},ports:[{postMessage:v=>repair=v}]});assert.equal(repair.ok,false);assert.ok(cache.has(origin+'/index.html'));
await w.event('message',{data:{type:'REPAIR'},ports:[{postMessage:v=>repair=v}]});assert.equal(repair.ok,true);assert.equal((await w.fetch(origin+'/focus.js')).status,200);
cache.delete(origin+'/focus.js');assert.equal((await w.fetch(origin+'/focus.js')).status,200);assert.ok(cache.has(origin+'/focus.js'));
cache.delete(origin+'/index.html');const mismatch=worker({corrupt:'index.html'}),recovery=await mismatch.fetch(origin+'/');assert.equal(recovery.status,200);assert.match(await recovery.text(),/Repair &amp; reopen/);assert.match(recovery.headers.get('Content-Security-Policy'),/script-src 'nonce-/);assert.ok(!cache.has(origin+'/index.html'));
await w.event('message',{data:{type:'REPAIR'},ports:[{postMessage:v=>repair=v}]});assert.equal(repair.ok,true);
let reply;const event={data:{type:'APPLY_UPDATE'},source:{url:origin+'/'},ports:[{postMessage:v=>reply=v}]};
const other=worker({pages:2});await other.event('message',event);assert.equal(reply.ok,false);assert.equal(other.skips,0);
await w.event('message',event);assert.equal(reply.ok,true);assert.equal(w.skips,1);await w.event('activate');assert.equal(w.claims,1);assert.ok(backing.has('unrelated-product'));assert.ok(backing.has('minimal-shell-old-working'));
console.log(JSON.stringify({result:'PASS',release:report.release,publicFiles:report.files.length,bytes:report.bytes,checks:['PNG dimensions and manifest','asset SHA-256 integrity','failed, timed-out and mismatched installs preserve old cache','no forced activation','offline root/query/asset routing','no API/third-party/POST caching','missing asset fails closed without mixing releases','offline readiness detects missing files','missing-file repair restores the shell','failed repair retains available files','missing opening page has isolated recovery screen','multi-tab activation guard','only owned shell caches touched']},null,2));
