import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../render-beta/pwa-client.js',import.meta.url),'utf8');
const handlers={},swHandlers={},messages=[],elements=new Map();let canSave=false,openForm=false,reloads=0,replyOK=false;
const element=id=>{if(!elements.has(id))elements.set(id,{textContent:'',hidden:true,disabled:false});return elements.get(id)};
class Channel{constructor(){this.port1={close(){},onmessage:null};this.port2={send:value=>this.port1.onmessage?.({data:value})}}}
const active={postMessage(data,ports){messages.push(data.type);queueMicrotask(()=>ports[0].send({release:'test-release',offline:true}))}};
const waiting={postMessage(data,ports){messages.push(data.type);queueMicrotask(()=>ports[0].send({ok:replyOK,reason:'Close other Minimal tabs and windows, then try again.'}))}};
const registration={active,waiting,addEventListener(){},update:async()=>{}};
const records={tasks:[{id:'keep-me'}],focusTimer:{deadline:12345}};
const box=vm.createContext({console,MessageChannel:Channel,setTimeout,clearTimeout,Date,isSecureContext:true,navigator:{onLine:true,userAgent:'Test',platform:'MacIntel',maxTouchPoints:0,serviceWorker:{register:async()=>registration,addEventListener:(n,f)=>swHandlers[n]=f}},window:{addEventListener:(n,f)=>handlers[n]=f},document:{hidden:false,addEventListener:(n,f)=>handlers[n]=f,getElementById:id=>id==='modal'?{open:openForm}:element(id),querySelector:s=>element(s)},matchMedia:()=>({matches:false}),settingsView:()=>'',render:()=>{},card:()=>'',deviceSaveReady:()=>canSave,storageOK:true,deviceFailed:false,deviceCleared:false,dialog(){},button(){},location:{reload:()=>reloads++},state:records});
vm.runInContext(source,box);await new Promise(resolve=>setImmediate(resolve));
const click=action=>handlers.click({target:{closest:()=>({dataset:{pwa:action}})}});
await click('apply');assert.equal(messages.filter(x=>x==='APPLY_UPDATE').length,0);assert.equal(box.storageOK,true);
canSave=true;openForm=true;await click('apply');assert.equal(messages.filter(x=>x==='APPLY_UPDATE').length,0);assert.equal(box.storageOK,true);
openForm=false;await click('apply');assert.equal(messages.filter(x=>x==='APPLY_UPDATE').length,1);assert.equal(box.storageOK,true);assert.match(element('pwa-status').textContent,/Close other/);
replyOK=true;await click('apply');assert.equal(box.storageOK,false);assert.equal(reloads,0);swHandlers.controllerchange();swHandlers.controllerchange();assert.equal(reloads,1);assert.deepEqual(records,{tasks:[{id:'keep-me'}],focusTimer:{deadline:12345}});
console.log('PASS: app update blocks pending saves and open forms; multi-tab refusal restores editing; confirmed activation reloads once and never mutates personal records.');
