/* Render adapter for the already-tested device-only beta. No package dependencies. */
import '../vercel-beta/build.mjs';
import {readFile,writeFile,cp,rm,mkdir} from 'node:fs/promises';
const out=new URL('dist/',import.meta.url),source=new URL('../vercel-beta/dist/',import.meta.url);
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});await cp(source,out,{recursive:true});
const config=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));
const headers=config.headers[0].headers.map(({key,value})=>({path:'/*',name:key,value}));
await writeFile(new URL('headers.json',import.meta.url),JSON.stringify(headers,null,2)+'\n');
// The HTTP header remains recommended; this in-document policy protects scripts
// even before provider-specific headers have been configured. frame-ancestors
// must be applied as an HTTP header and is intentionally omitted from meta.
const csp=headers.find(h=>h.name==='Content-Security-Policy').value.replace(/frame-ancestors [^;]+; /,'');
for(const file of ['index.html','privacy.html','support.html','release-status.html']){
 let html=await readFile(new URL(file,out),'utf8');
 html=html.replaceAll('Vercel','Render').replace('Deployment status must be verified in Render','Deployment status must be verified in Render');
 html=html.replace('<head>','<head><meta http-equiv="Content-Security-Policy" content="'+csp.replaceAll('&','&amp;').replaceAll('"','&quot;')+'"><meta name="referrer" content="strict-origin-when-cross-origin">');
 await writeFile(new URL(file,out),html);
}
console.log('Built Render device-only beta; custom response headers are listed in render-beta/headers.json.');
