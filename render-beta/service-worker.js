/* Generated configuration contains public app files only, never personal records. */
'use strict';
const RELEASE=__RELEASE__,FILES=__FILES__,PREFIX='minimal-shell-',CACHE=PREFIX+RELEASE;
const origin=self.location.origin,known=new Map(FILES.map(x=>['/'+x.path,x]));
async function verifiedDownload(item){
 const url=new URL(item.path,origin+'/');url.searchParams.set('release',RELEASE);
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),45000);
 try{const response=await fetch(url,{cache:'reload',credentials:'omit',redirect:'error',signal:controller.signal});
  if(!response.ok)throw Error('App download failed: '+item.path);
  const bytes=await response.clone().arrayBuffer(),digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
  if(digest!==item.sha256)throw Error('App version mismatch: '+item.path);
  return response;
 }finally{clearTimeout(timeout)}
}
async function prepare(repair=false){
 const cache=await caches.open(CACHE);let next=0;
 async function download(){while(next<FILES.length){const item=FILES[next++],url=new URL(item.path,origin+'/');url.searchParams.set('release',RELEASE);
  if(repair&&await cache.match(new URL(item.path,origin+'/').href))continue;
  await cache.put(new URL(item.path,origin+'/').href,await verifiedDownload(item));
 }}
 const results=await Promise.allSettled(Array.from({length:4},download));
 if(results.some(x=>x.status==='rejected')){if(!repair)await caches.delete(CACHE);throw Error('Offline version incomplete; previous version retained.')}
}
async function ready(){const cache=await caches.open(CACHE);return (await Promise.all(FILES.map(x=>cache.match(new URL(x.path,origin+'/').href)))).every(Boolean)}
self.addEventListener('install',event=>event.waitUntil(prepare()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 // Keep the preceding shell during a user-requested transition. Never touch IndexedDB.
 const old=(await caches.keys()).filter(x=>x.startsWith(PREFIX)&&x!==CACHE);for(const name of old.slice(0,-1))await caches.delete(name);
 await self.clients.claim();
})()));
self.addEventListener('message',event=>{
 const reply=value=>event.ports[0]?.postMessage(value);
 if(event.data?.type==='STATUS')event.waitUntil(ready().then(offline=>reply({release:RELEASE,offline})).catch(()=>reply({release:RELEASE,offline:false})));
 if(event.data?.type==='REPAIR')event.waitUntil(prepare(true).then(()=>reply({ok:true})).catch(()=>reply({ok:false})));
 if(event.data?.type==='APPLY_UPDATE')event.waitUntil((async()=>{
  if(!event.source?.url||new URL(event.source.url).origin!==origin)return;
  const pages=(await self.clients.matchAll({type:'window',includeUncontrolled:true})).filter(c=>new URL(c.url).origin===origin);
  if(pages.length>1){reply({ok:false,reason:'Close other Minimal tabs and windows, then try again.'});return}
  if(!await ready()){reply({ok:false,reason:'The update download is incomplete. Stay online and check again.'});return}
  reply({ok:true});await self.skipWaiting();
 })());
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==origin)return;
 let path=url.pathname;if(path==='/')path='/index.html';
 // Exact public-file allowlist. No API, barcode, avatar or personal-data caching.
 if(!known.has(path))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),key=new URL(path,origin).href,cached=await cache.match(key);
  if(cached)return cached;
  // Repair evicted files only when their content matches this exact release.
  try{const fresh=await verifiedDownload(known.get(path));await cache.put(key,fresh.clone());return fresh}catch{}
  if(path==='/index.html')return recoveryPage();
  // Do not mix a newer network asset into an older running shell.
  return new Response('Minimal’s offline files are unavailable. Reconnect, close other Minimal tabs and check for an app update in Settings.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
 })());
});
function recoveryPage(){
 const nonce=Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('');
 const script=`document.getElementById('repair').onclick=async()=>{const status=document.getElementById('status');status.textContent='Checking app files. Keep this window online.';try{const reg=await navigator.serviceWorker.getRegistration('/');if(!reg)throw Error('No app registration. Close this window and reopen Minimal online.');await reg.update();if(reg.installing){status.textContent='Downloading the latest version. Wait a moment, then choose Repair & reopen again.';return}const worker=reg.waiting||reg.active,channel=new MessageChannel(),waiting=!!reg.waiting;const result=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Download still unavailable. Try again while online.')),120000);channel.port1.onmessage=e=>{clearTimeout(timer);resolve(e.data)};worker.postMessage({type:waiting?'APPLY_UPDATE':'REPAIR'},[channel.port2])});if(!result.ok)throw Error(result.reason||'Could not repair offline files. Try again while online.');if(!waiting)location.reload();else status.textContent='Opening the downloaded app…';}catch(e){status.textContent=e.message}};navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload());`;
 return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Restore offline access — Minimal</title><style>body{font:17px system-ui;line-height:1.7;background:#101710;color:#e4eddc;margin:0;padding:32px}main{max-width:560px;margin:12vh auto}button{font:inherit;background:#bed0ac;color:#101710;border:0;border-radius:12px;padding:14px 22px;cursor:pointer}</style></head><body><main><h1>Let’s reopen your space.</h1><p>Some offline app files are unavailable. Your saved records have not been changed. Reconnect to the internet, close other Minimal windows, then repair the app files.</p><button id="repair">Repair &amp; reopen</button><p id="status" role="status" aria-live="polite"></p></main><script nonce="${nonce}">${script}</script></body></html>`,{status:200,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':`default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; worker-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'`}});
}
