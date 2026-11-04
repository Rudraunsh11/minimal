/* Browser installation guidance. No records, account SDK or network requests. */
(function(root){
 'use strict';
 const installed=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 const ios=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const installURL='https://minimal-rudraunsh.onrender.com/';
 function suggestedGuide(){
  const ua=navigator.userAgent;
  if(/GSA\/|GoogleApp|FBAN|FBAV|Instagram|; wv\)/i.test(ua))return 'google';
  if(ios())return /CriOS\//.test(ua)?'iphone-chrome':'iphone';
  if(/Android/i.test(ua))return 'android';
  if(/Mac/.test(navigator.platform)&&/Safari\//.test(ua)&&!/Chrome\/|Chromium\/|Edg\//.test(ua))return 'mac';
  return 'computer';
 }
 const guides={
  iphone:{label:'iPhone / iPad · Safari',path:['Safari','Share','Home Screen'],steps:[['Open Minimal in Safari','Use the website address below.'],['Tap Share','Look for the square with an upward arrow. If it is hidden, open the page menu first.'],['Add to Home Screen','Scroll through the share options. If missing, open Edit Actions and add this option. Turn on Open as Web App if shown, then tap Add.']],help:'The Minimal icon will appear on your Home Screen.',url:'https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios'},
  'iphone-chrome':{label:'iPhone / iPad · Chrome',path:['Chrome','Share','Home Screen'],steps:[['Open Minimal in Chrome','Use the website address below.'],['Tap Share beside the address bar','Find Add to Home Screen in the share options.'],['Choose Add to Home Screen','Check the name Minimal and tap Add. If this option is missing, open the same address in Safari and use its guide.']],help:'Depending on your browser version, this may create a web app or a shortcut.',url:'https://support.google.com/chrome/answer/9658361?hl=en&co=GENIE.Platform%3DiOS'},
  android:{label:'Android · Chrome',path:['Chrome','Menu ⋮','Install'],steps:[['Open Minimal in Chrome','If you arrived through Google search, open the result in Chrome first.'],['Open the three-dot menu','Choose Install and create shortcut → Install. Some versions call this Install app or Add to Home screen.'],['Confirm Install or Add','Follow Chrome’s prompt, then open Minimal from your Home Screen or app list.']],help:'If the option is missing, update Chrome, use a normal browsing tab and try again.',url:'https://support.google.com/chrome/answer/9658361?hl=en&co=GENIE.Platform%3DAndroid'},
  mac:{label:'Mac · Safari',path:['Safari','File','Add to Dock'],steps:[['Open Minimal in Safari','Requires macOS Sonoma 14 or later.'],['Choose File → Add to Dock','You can also use Safari’s Share button → Add to Dock.'],['Keep the name Minimal and click Add','Open Minimal from your Dock, Applications or Spotlight.']],help:'On an older Mac, use Chrome’s installation option or keep using the website.',url:'https://support.apple.com/en-us/104996'},
  computer:{label:'Computer · Chrome',path:['Chrome','Menu ⋮','Install app'],steps:[['Open Minimal in Chrome','Use the website address below on your Mac, Windows PC or Linux computer.'],['Choose the install option','Use the install icon near the address bar, or menu ⋮ → Cast, save, and share → Install page as app.'],['Confirm the browser prompt','Open Minimal from your apps, desktop or Dock afterward.']],help:'If Chrome offers no install option, update it and try a normal browsing window.',url:'https://support.google.com/chrome/answer/9658361?hl=en&co=GENIE.Platform%3DDesktop'},
  google:{label:'Google app / another in-app browser',path:['Copy link','Safari / Chrome','Install'],steps:[['Copy the Minimal link below','The Google search app is different from Google Chrome.'],['Open the link in your browser','Use the page menu’s Open in browser option if available. Otherwise open Safari on iPhone/Mac or Chrome on Android/computer, then paste the link.'],['Follow your browser’s guide','Choose Safari or Chrome from the list above for the final Home Screen or Dock steps.']],help:'An in-app browser may not offer installation. The website cannot force another browser to open.'}
 };
 function installationHelp({dialog,button,installAvailable=false}){
  dialog('Install Minimal',`<div class="install-guide"><p class="install-intro">A little closer. Add Minimal to your Home Screen or Dock.</p>${installed()?'<p class="install-current">You’re already using Minimal in an app window.</p>':''}<label class="field" for="pwa-install-platform">Your device & browser<select id="pwa-install-platform">${Object.entries(guides).map(([key,g])=>`<option value="${key}">${g.label}</option>`).join('')}</select></label><div id="pwa-install-steps"></div><div class="install-link"><label for="pwa-install-url">Minimal website address</label><div><input id="pwa-install-url" type="url" readonly value="${installURL}" spellcheck="false"><button type="button" data-pwa="copy-link">Copy link</button></div><p id="pwa-install-copy-status" role="status" aria-live="polite"></p></div><details class="install-data"><summary>Already logged things in your browser?</summary><p>Installing does not move records between browsers or create cloud backup. If the installed app opens an empty workspace, export a backup from your original browser and restore it in the app before clearing anything. Wait for Settings → Offline access is ready before using it without internet.</p></details><p class="footnote">Your browser controls the final Add or Install step. No App Store download is needed.</p><div class="dialog-footer">${installAvailable?'<button type="button" class="primary" data-pwa="install">Install now</button>':''}${button('Done','close')}</div></div>`);
  const selector=document.getElementById('pwa-install-platform');selector.value=suggestedGuide();
  const show=()=>{const g=guides[selector.value]||guides.computer;document.getElementById('pwa-install-steps').innerHTML=`<div class="install-path" aria-hidden="true">${g.path.map(x=>`<span>${x}</span>`).join('<i>→</i>')}</div><ol class="install-steps">${g.steps.map(([title,body],i)=>`<li><span class="install-step-number" aria-hidden="true">${i+1}</span><b>${title}</b><p>${body}</p></li>`).join('')}</ol><p class="install-tip">${g.help}</p>${g.url?`<a class="install-official" href="${g.url}" target="_blank" rel="noopener noreferrer">Official browser instructions ↗</a>`:''}`;};
  selector.onchange=show;show();
 }
 async function copyInstallLink(){
  const status=document.getElementById('pwa-install-copy-status');if(!status)return;
  try{await navigator.clipboard.writeText(installURL);status.textContent='Link copied. Paste it into Safari or Chrome.';}
  catch{const input=document.getElementById('pwa-install-url');input?.focus();input?.select();status.textContent='Select and copy the website address above, then paste it into your browser.';}
 }
 root.MinimalInstallGuide={open:installationHelp,copy:copyInstallLink};
})(globalThis);
