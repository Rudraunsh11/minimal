import '../vercel-beta/test.mjs';
import {readFile,readdir,stat} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const out=new URL('dist/',import.meta.url),html=await readFile(new URL('index.html',out),'utf8');
assert.ok(html.includes('http-equiv="Content-Security-Policy"'));assert.ok(!html.includes('cloud.js?'));
for(const [,js] of html.matchAll(/<script>([\s\S]*?)<\/script>/g))assert.ok(html.includes("'sha256-"+createHash('sha256').update(js).digest('base64')+"'"));
for(const [,url] of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"#]+)"/g)){if(/^(https?:|data:)/.test(url))continue;assert.ok((await stat(new URL(url.split('?')[0],out))).isFile())}
const privacy=await readFile(new URL('privacy.html',out),'utf8');assert.ok(privacy.includes('Render serves the app'));assert.ok(!privacy.includes('Vercel'));
assert.ok(!(await readdir(out)).includes('cloud.js'));
for(const name of ['account-flow.js','account-ui.js','account-recovery.html','account-ui-preview.html'])assert.ok(!(await readdir(out)).includes(name),'Account UI must remain staged until public acceptance: '+name);
const headers=JSON.parse(await readFile(new URL('headers.json',import.meta.url),'utf8'));assert.ok(headers.some(h=>h.name==='Content-Security-Policy'&&h.path==='/*'));
// The frame guard must load in <head>, before any app script, and be part of the verified offline shell.
assert.ok(html.indexOf('<script src="frame-guard.js"></script>')>0&&html.indexOf('<script src="frame-guard.js"></script>')<html.indexOf('</head>'));assert.ok((await readFile(new URL('frame-guard.js',out),'utf8')).includes('window.top===window.self'));assert.ok(JSON.parse(await readFile(new URL('pwa-release.json',out),'utf8')).files.some(f=>f.path==='frame-guard.js'));
{const {default:vm}=await import('node:vm'),guard=await readFile(new URL('frame-guard.js',out),'utf8');const run=(top,origin)=>{const style={};const win={location:{origin:'https://app.example'}};win.self=win;win.top=top==='self'?win:top==='same'?{location:{origin:'https://app.example'}}:{get location(){throw Error('cross-origin')}};vm.runInNewContext(guard,{window:win,document:{documentElement:{style:{setProperty:(k,v,p)=>{style[k]=v+'|'+p}}}}});return {hidden:style.display==='none|important',flag:win.minimalFramed===true}};assert.deepEqual(run('self'),{hidden:false,flag:false});assert.deepEqual(run('same'),{hidden:false,flag:false});assert.deepEqual(run('cross'),{hidden:true,flag:true});}
console.log('PASS: Render output references, exact inline CSP, browser-only policies and header configuration; frame guard hides the app only inside a cross-origin frame.');

const schema=await readFile(new URL('schema.js',out),'utf8'),device=await readFile(new URL('beta-device.js',out),'utf8'),focus=await readFile(new URL('focus.js',out),'utf8');
assert.ok(schema.includes('MAX_BYTES=20000000'));assert.ok(!schema.includes('900 KB'));assert.ok(!schema.includes('20 MB account limit'));
assert.ok(html.includes('device-database.js?v=20261021-device-db1'));assert.ok(!html.includes('try{if(MinimalDevice.localOnly){'));
assert.ok(device.includes('MinimalDatabase.initialize'));assert.ok(device.includes('deviceSaveReady'));assert.ok(focus.includes('!deviceSaveReady()'));
assert.ok(!(await readdir(out)).includes('migration-fixture.html'));
console.log('PASS: 20 MB database integration, safe boot, durable focus celebration and no migration fixture shipped.');
assert.ok(html.includes("worker-src 'self'"));assert.ok(html.includes('apple-touch-icon'));assert.ok(html.includes('pwa-client.js?v='));
await import('../tests/pwa.mjs');
await import('../tests/pwa-client.mjs');
await import('../tests/install-guide.mjs');
const installation=await readFile(new URL('install.html',out),'utf8');
assert.ok(installation.includes("connect-src 'none'"));assert.ok(installation.includes('<noscript>'));
for(const [,path] of installation.matchAll(/(?:src|href)="([^"#]+)"/g)){if(path==='/'||/^https?:/.test(path))continue;assert.ok((await stat(new URL(path,out))).isFile())}
console.log('PASS: standalone install page, no-network CSP, no-script fallback and local asset references.');

await import('../tests/ux-regression.mjs');

await import('../supabase-foundation/crypto-store-test.mjs');

await import('../supabase-foundation/auth-client-test.mjs');
await import('../supabase-foundation/account-flow-test.mjs');

await import("../tests/custom-foods.mjs");
await import('../tests/food-diary.mjs');
