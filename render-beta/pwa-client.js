/* Installation and offline shell controls. Personal records stay in the device database. */
(()=>{
 'use strict';
 let registration=null,installPrompt=null,offlineReady=false,updating=false,reloading=false,lastCheck=0;
 let message='Preparing offline access. Keep Minimal open and online for the first download.';
 const installed=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 const ios=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const panel=()=>card('Install & offline',`<p><strong>${installed()?'Minimal is running as an app.':'Your daily space, on your home screen.'}</strong></p><p id="pwa-status" role="status" aria-live="polite"></p><div class="row"><button type="button" data-pwa="install">${installed()?'Installation help':'Install Minimal'}</button><button type="button" data-pwa="check">Check for updates</button><button type="button" data-pwa="apply" hidden>Update & reopen</button></div><p class="footnote">Once offline access is ready, reopen Minimal and log tasks, food from the built-in library, water, workouts and focus sessions without internet. Barcode lookup and external links need a connection. The first visit must be online. Installing does not add cloud backup, more record storage or closed-app alarms.</p><p class="footnote">App version <span id="pwa-release"></span>. Keep using this same website address to access your records. If an installed app opens a separate storage space, export from this browser and restore in the app before clearing anything.</p>`);
 const originalSettings=settingsView;settingsView=function(){return originalSettings()+panel()};
 const originalRender=render;render=function(){originalRender();paint()};
 function paint(){const status=document.getElementById('pwa-status');if(!status)return;status.textContent=message;document.getElementById('pwa-release').textContent='__APP_RELEASE__';const apply=document.querySelector('[data-pwa="apply"]');apply.hidden=!registration?.waiting;apply.disabled=updating;document.querySelector('[data-pwa="check"]').disabled=updating}
 function tell(text){message=text;paint()}
 function request(worker,type){return new Promise((resolve,reject)=>{if(!worker){reject(Error('No offline worker available.'));return}const channel=new MessageChannel(),timer=setTimeout(()=>{channel.port1.close();reject(Error('The app did not respond. Try again while online.'))},type==='REPAIR'?120000:12000);channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();resolve(e.data)};worker.postMessage({type},[channel.port2])})}
 async function status(){try{const result=await request(registration?.active,'STATUS');offlineReady=result.offline;tell(registration?.waiting?'An update is downloaded. Finish your work, then choose Update & reopen.':offlineReady?(navigator.onLine?'Offline access is ready. Your records still save only on this device.':'You’re offline. Built-in tools and local saving are available.'): 'Offline files are not ready. Stay online and check for updates.')}catch(e){tell(e.message)}}
 function watch(worker){if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='installed'){if(registration?.waiting)tell('An update is downloaded. Finish your work, then choose Update & reopen.');else void status()}if(worker.state==='activated')void status();if(worker.state==='redundant')tell('The offline download did not finish. Your existing version and records are unchanged. Check again while online.')})}
 async function check(){if(!registration){await setup();return}if(!navigator.onLine){await status();return}tell('Checking for an update…');try{lastCheck=Date.now();await registration.update();if(registration.installing){watch(registration.installing);tell('Downloading a complete offline version. Keep this app open and online.')}else {await status();if(!offlineReady&&registration.active&&!registration.waiting){tell('Repairing offline files. Keep Minimal open and online.');const repair=await request(registration.active,'REPAIR');if(repair.ok)await status();else tell('Offline files could not be repaired. Stay online and check again for the latest version. Your records have not changed.')}}}catch{tell('Could not check for updates. Your current version and saved records are unchanged. Try again while online.')}}
 async function setup(){if(!('serviceWorker' in navigator)||!isSecureContext){tell('Offline installation is unavailable in this browser. You can still use Minimal online; try Safari or Chrome.');return}try{registration=await navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'});registration.addEventListener('updatefound',()=>{watch(registration.installing);tell('Downloading offline app files. Your records stay on this device.')});watch(registration.installing);if(registration.active)await status();else tell('Downloading offline app files. Keep Minimal open and online until Offline access is ready appears.');lastCheck=Date.now()}catch{tell('Offline access could not be prepared. The app and local saving still work while open. Check again while online.')}}
 async function apply(){
  if(updating||!registration?.waiting)return;
  if(!deviceSaveReady()||document.getElementById('modal')?.open){tell('Finish or close the open form and wait for Saved before updating.');return}
  updating=true;storageOK=false;tell('Opening the downloaded version…');
  try{const result=await request(registration.waiting,'APPLY_UPDATE');if(!result.ok)throw Error(result.reason)}catch(e){updating=false;storageOK=!deviceFailed&&!deviceCleared;tell(e.message)}
 }
 navigator.serviceWorker?.addEventListener('controllerchange',()=>{if(updating&&!reloading){reloading=true;location.reload()}else void status()});
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;paint()});
 window.addEventListener('appinstalled',()=>{installPrompt=null;tell('Minimal is installed. Open it from your home screen or applications.');paint()});
 document.addEventListener('click',async e=>{const action=e.target.closest('[data-pwa]')?.dataset.pwa;if(!action)return;
  if(action==='check')await check();if(action==='apply')await apply();
  if(action==='install'){
   if(installPrompt){const prompt=installPrompt;installPrompt=null;try{await prompt.prompt();await prompt.userChoice}catch{tell('Use your browser menu to install Minimal.')}return}
   dialog('Keep Minimal close',`<p>${installed()?'Minimal is already running in its own app window.':ios()?'In Safari, tap Share, then Add to Home Screen. Enable Open as Web App if it is shown, then tap Add.':'In Chrome or Edge, open the browser menu and choose Install Minimal or Install page as app. In Safari on a supported Mac, choose File → Add to Dock.'}</p><p class="footnote">If your browser does not offer installation, open this same address in Safari, Chrome or Edge. After the first complete download, Settings shows Offline access is ready. Browser and installed-app storage can vary; keep a backup before moving.</p><div class="row">${button('Got it','close')}</div>`)
  }
 });
 window.addEventListener('online',()=>void check());window.addEventListener('offline',()=>void status());
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastCheck>1800000)void check()});
 void setup();
})();
