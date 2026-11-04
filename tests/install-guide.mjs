import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../render-beta/pwa-client.js',import.meta.url),'utf8');
function browser({ua='',platform='',touch=0,standalone=false,copyFails=false}={}){
 const handlers={},elements=new Map(),copies=[],dialogs=[];let focused=false,selected=false;
 const element=id=>{if(!elements.has(id))elements.set(id,{value:'',textContent:'',innerHTML:'',focus(){focused=true},select(){selected=true}});return elements.get(id)};
 const records={foods:[{id:'must-stay'}]};
 const box=vm.createContext({navigator:{userAgent:ua,platform,maxTouchPoints:touch,standalone,clipboard:{writeText:async value=>{if(copyFails)throw Error('Denied');copies.push(value)}}},matchMedia:()=>({matches:standalone}),window:{addEventListener:(name,fn)=>handlers[name]=fn},document:{hidden:false,querySelector:s=>s==='.topbar'?null:element(s),getElementById:element,addEventListener:(name,fn)=>handlers[name]=fn},settingsView:()=>'',render(){},card:()=>'',dialog:(title,body)=>dialogs.push({title,body}),button:()=>'',state:records,isSecureContext:true,location:{search:'?demo=1&untrusted=do-not-copy'},Date});
 vm.runInContext(source,box);
 return {records,handlers,element,copies,dialogs,focus:()=>focused&&selected,click:async action=>handlers.click({target:{closest:()=>({dataset:{pwa:action}})}})};
}
const scenarios=[
 [{ua:'Mozilla iPhone Version/18.0 Mobile Safari/604.1',platform:'iPhone'},'iphone',/Add to Home Screen/],
 [{ua:'Mozilla iPhone CriOS/140.0 Mobile Safari/604.1',platform:'iPhone'},'iphone-chrome',/Share beside the address bar/],
 [{ua:'Mozilla Macintosh Version/18.0 Safari/605.1',platform:'MacIntel',touch:5},'iphone',/Open as Web App/],
 [{ua:'Mozilla Macintosh Version/18.0 Safari/605.1',platform:'MacIntel'},'mac',/File → Add to Dock/],
 [{ua:'Mozilla Android Chrome/140.0 Mobile Safari/537.36',platform:'Linux armv8'},'android',/Install and create shortcut/],
 [{ua:'Mozilla Macintosh Chrome/140.0 Safari/537.36',platform:'MacIntel'},'computer',/Cast, save, and share/],
 [{ua:'Mozilla iPhone GSA/300.0 Mobile Safari/604.1',platform:'iPhone'},'google',/Google search app is different/],
 [{ua:'Mozilla Android; wv) Chrome/140.0',platform:'Linux'},'google',/Open in browser/]
];
for(const [profile,key,pattern] of scenarios){const b=browser(profile);await b.click('install');assert.equal(b.element('pwa-install-platform').value,key);assert.match(b.element('pwa-install-steps').innerHTML,pattern);assert.ok(b.dialogs[0].body.includes('Already logged things'));assert.deepEqual(b.records,{foods:[{id:'must-stay'}]});}
const b=browser();await b.click('help');b.element('pwa-install-platform').value='iphone';b.element('pwa-install-platform').onchange();assert.match(b.element('pwa-install-steps').innerHTML,/square with an upward arrow/);b.element('pwa-install-platform').value='unknown';b.element('pwa-install-platform').onchange();assert.match(b.element('pwa-install-steps').innerHTML,/Chrome/);
await b.click('copy-link');assert.deepEqual(b.copies,['https://minimal-rudraunsh.onrender.com/']);assert.match(b.element('pwa-install-copy-status').textContent,/Link copied/);
const denied=browser({copyFails:true});await denied.click('help');await denied.click('copy-link');assert.equal(denied.focus(),true);assert.match(denied.element('pwa-install-copy-status').textContent,/Select and copy/);
const installed=browser({standalone:true});await installed.click('help');assert.match(installed.dialogs[0].body,/already using Minimal/);
const native=browser();let calls=0;native.handlers.beforeinstallprompt({preventDefault(){},prompt:async()=>{calls++},userChoice:Promise.resolve({outcome:'accepted'})});await native.click('install');assert.equal(calls,1);assert.equal(native.dialogs.length,0);
const dismissed=browser();dismissed.handlers.beforeinstallprompt({preventDefault(){},prompt:async()=>{},userChoice:Promise.resolve({outcome:'dismissed'})});await dismissed.click('install');assert.equal(dismissed.dialogs.length,1);
const failed=browser();failed.handlers.beforeinstallprompt({preventDefault(){},prompt:async()=>{throw Error('Unavailable')}});await failed.click('install');assert.equal(failed.dialogs.length,1);
console.log('PASS: Safari/iPhone/iPad/Mac, Chrome Android/iOS/desktop and in-app routing; explicit platform override; fixed public copy URL; clipboard-denied fallback; installed state; native prompt acceptance/dismissal/failure; no record changes.');
