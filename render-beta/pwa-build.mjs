import {readFile,writeFile,readdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export async function buildPWA(out){
 const here=new URL('./',import.meta.url),sha=x=>createHash('sha256').update(x).digest('hex');
 const clientSource=await readFile(new URL('pwa-client.js',here),'utf8'),workerSource=await readFile(new URL('service-worker.js',here),'utf8');
 await copyFile(new URL('pwa-home.css',here),new URL('pwa-home.css',out));
 for(const name of ['install-guide.js','install-guide.css','install.html','install-page.js','install-page.css'])await copyFile(new URL(name,here),new URL(name,out));
 for(const n of [180,192,512])await copyFile(new URL(`icons/icon-${n}.png`,here),new URL(`icon-${n}.png`,out));
 const manifest={id:'/',name:'Minimal',short_name:'Minimal',description:'Your daily space for plans, nourishment, movement and focus.',start_url:'/',scope:'/',display:'standalone',background_color:'#101710',theme_color:'#101710',icons:[{src:'icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},{src:'icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'},{src:'icon-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}]};
 await writeFile(new URL('manifest.webmanifest',out),JSON.stringify(manifest)+'\n');
 const names=(await readdir(out,{withFileTypes:true})).filter(x=>x.isFile()).map(x=>x.name).sort(),base=[];for(const name of names)base.push([name,sha(await readFile(new URL(name,out)))]);
 const release=sha(JSON.stringify(base)+clientSource+workerSource).slice(0,16);
 await writeFile(new URL('pwa-client.js',out),clientSource.replaceAll('__APP_RELEASE__',release));
 let html=await readFile(new URL('index.html',out),'utf8');html=html.replace('</head>',`<link rel="stylesheet" href="pwa-home.css?v=${release}"><link rel="stylesheet" href="install-guide.css?v=${release}"><link rel="apple-touch-icon" href="icon-180.png"><meta name="apple-mobile-web-app-title" content="Minimal"></head>`).replace('</body>',`<script src="install-guide.js?v=${release}"></script><script src="pwa-client.js?v=${release}"></script></body>`);await writeFile(new URL('index.html',out),html);
 const files=[];for(const path of [...names,'pwa-client.js'].sort())files.push({path,sha256:sha(await readFile(new URL(path,out)))});
 const worker=workerSource.replace('__RELEASE__',JSON.stringify(release)).replace('__FILES__',JSON.stringify(files));await writeFile(new URL('sw.js',out),worker);
 await writeFile(new URL('pwa-release.json',out),JSON.stringify({release,files,bytes:(await Promise.all(files.map(async x=>(await readFile(new URL(x.path,out))).length))).reduce((a,b)=>a+b,0)},null,2)+'\n');
 console.log(`Built offline shell ${release}: ${files.length} integrity-checked public files.`);
}
