import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url),html=readFileSync(new URL('app-shell.html',root),'utf8');
for(const match of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"#]+)"/g)){const ref=match[1].split('?')[0];if(/^(https?:|data:|\/)/.test(ref))continue;assert.ok(existsSync(new URL('public/'+ref,root)),'Missing app asset: '+ref)}
for(const name of readdirSync(new URL('public/',root)).filter(x=>x.endsWith('.js')))new vm.Script(readFileSync(new URL('public/'+name,root),'utf8'),{filename:name});
for(const [,inline] of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(inline);
for(const name of ['privacy.html','support.html','release-status.html']){const body=readFileSync(new URL('public/'+name,root),'utf8');assert.ok(body.includes('<html lang="en">'));assert.ok(body.includes('name="viewport"'));assert.ok(body.includes('<main>'));for(const [,href] of body.matchAll(/href="([^"#]+)"/g)){if(/^(https?:|mailto:|\/)/.test(href))continue;assert.ok(existsSync(new URL('public/'+href,root)),'Broken information link: '+href)}}
const manifest=JSON.parse(readFileSync(new URL('public/manifest.webmanifest',root),'utf8'));assert.equal(manifest.start_url,'/');for(const icon of manifest.icons)assert.ok(existsSync(new URL('public/'+icon.src,root)));assert.ok(html.includes("setAttribute('aria-labelledby','dialog-title')"));assert.ok(html.includes("addEventListener('cancel',e=>{e.preventDefault();close()})"));assert.ok(readFileSync(new URL('public/experience.css',root),'utf8').includes('prefers-reduced-motion'));
console.log('PASS: referenced assets and information links exist, all frontend scripts parse, manifest icons resolve, modal labelling and reduced-motion support are present. This is not a screen-reader/device certification.');
