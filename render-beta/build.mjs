/* Render adapter for the already-tested device-only beta. No package dependencies. */
import '../vercel-beta/build.mjs';
import {readFile,writeFile,cp,rm,mkdir} from 'node:fs/promises';
import {buildPWA} from './pwa-build.mjs';
const out=new URL('dist/',import.meta.url),source=new URL('../vercel-beta/dist/',import.meta.url);
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});await cp(source,out,{recursive:true});
const config=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));
const headers=config.headers[0].headers.map(({key,value})=>({path:'/*',name:key,value:key==='Content-Security-Policy'?value.replace("worker-src 'none'","worker-src 'self'"):value}));
await writeFile(new URL('headers.json',import.meta.url),JSON.stringify(headers,null,2)+'\n');
// The HTTP header remains recommended; this in-document policy protects scripts
// even before provider-specific headers have been configured. frame-ancestors
// must be applied as an HTTP header and is intentionally omitted from meta.
const csp=headers.find(h=>h.name==='Content-Security-Policy').value.replace(/frame-ancestors [^;]+; /,'');
for(const file of ['index.html','privacy.html','support.html','release-status.html']){
 let html=await readFile(new URL(file,out),'utf8');
 html=html.replaceAll('Vercel','Render').replace('Deployment status must be verified in Render','Deployment status must be verified in Render');
 if(file==='support.html')html=html.replace('<h2>Limits</h2>','<h2>Install &amp; offline</h2><p>Open Settings → Install &amp; offline. Wait for Offline access is ready before disconnecting. Install through your browser menu, Safari Share → Add to Home Screen on iPhone/iPad, or Safari File → Add to Dock on supported Macs. Built-in tools and device saving work offline after the complete app download. Barcode lookup and external websites still need internet. Use Check for updates while online, then Update &amp; reopen after saving and closing other Minimal tabs. Updates keep records in the same device database. Installation does not add cloud backup or closed-app alarms.</p><h2>Limits</h2>');
 if(file==='release-status.html')html=html.replace('pending-save warnings and JSON backup/restore.','pending-save warnings, JSON backup/restore, browser installation, offline built-in tools and user-controlled app updates.');
 if(file==='privacy.html')html=html.replace('<h2>External requests</h2>','<h2>Offline app files</h2><p>A service worker caches a verified version of public app files on this device. It does not cache your personal records, barcode responses or external websites. This app-file cache uses extra browser space separately from the personal-record budget. Browser clearing or eviction can remove the offline files.</p><h2>External requests</h2>');
 html=html.replace('<head>','<head><meta http-equiv="Content-Security-Policy" content="'+csp.replaceAll('&','&amp;').replaceAll('"','&quot;')+'"><meta name="referrer" content="strict-origin-when-cross-origin">');
 await writeFile(new URL(file,out),html);
}
const deviceFile=new URL('beta-device.js',out);await writeFile(deviceFile,(await readFile(deviceFile,'utf8')).replace('Barcode lookup and reopening offline are not supported yet.','Barcode lookup needs internet. Reopening offline works after Settings confirms offline access is ready.'));
await buildPWA(out);
console.log('Built Render device-only beta; custom response headers are listed in render-beta/headers.json.');
