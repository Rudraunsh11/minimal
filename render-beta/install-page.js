/* Shareable installation page; never reads or changes Minimal records. */
(()=>{
 'use strict';
 const dialog=(title,body)=>{const main=document.getElementById('installation-page');const heading=document.createElement('h1');heading.textContent=title;const section=document.createElement('section');section.innerHTML=body;main.replaceChildren(heading,section)};
 MinimalInstallGuide.open({dialog,button:()=>'<a class="install-return" href="/">Open Minimal →</a>'});
 document.addEventListener('click',e=>{if(e.target.closest('[data-pwa="copy-link"]'))void MinimalInstallGuide.copy()});
})();
