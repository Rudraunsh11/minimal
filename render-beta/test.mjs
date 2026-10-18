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
const headers=JSON.parse(await readFile(new URL('headers.json',import.meta.url),'utf8'));assert.ok(headers.some(h=>h.name==='Content-Security-Policy'&&h.path==='/*'));
console.log('PASS: Render output references, exact inline CSP, browser-only policies and header configuration.');
