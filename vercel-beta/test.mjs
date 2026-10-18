import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const out=new URL('dist/',import.meta.url),read=name=>readFile(new URL(name,out),'utf8'),html=await read('index.html'),config=JSON.parse(await readFile(new URL('vercel.json',import.meta.url),'utf8'));
assert.equal(config.framework,null);assert.equal(config.outputDirectory,'dist');
assert.ok(!/<script src="(?:cloud|recovery-ui|storage-ui|launch-ui)\.js/.test(html));
assert.ok(html.includes('beta-device.js'));assert.ok(html.includes('There is no account sync or automatic server backup.'));
assert.ok((await read('device-storage.js')).includes('localOnly:true'));
assert.ok(!(await read('beta-device.js')).includes('fetch('));
const headers=config.headers[0].headers,csp=headers.find(x=>x.key==='Content-Security-Policy').value;
for(const [,script] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)){new vm.Script(script);assert.ok(csp.includes("'sha256-"+createHash('sha256').update(script).digest('base64')+"'"))}
for(const [,ref] of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"#]+)"/g)){if(/^(https?:|data:)/.test(ref))continue;assert.ok((await stat(new URL(ref.split('?')[0],out))).isFile(),ref)}
const files=await readdir(out,{recursive:true});for(const name of files){assert.ok(!/(?:^|\/)(?:node_modules|\.env|server|\.git|\.wrangler)(?:\/|$)/.test(name));if(name.endsWith('.js'))new vm.Script(await read(name),{filename:name})}
for(const p of ['privacy.html','support.html','release-status.html']){const body=await read(p);assert.ok(body.includes('browser'));assert.ok(!body.includes('Saved to your account'));for(const [,href] of body.matchAll(/href="([^"#]+)"/g)){if(/^(https?:|mailto:|\/)/.test(href))continue;await stat(new URL(href,out))}}
assert.ok(!files.includes('cloud.js'));assert.ok(!files.includes('recovery-ui.js'));assert.ok(!files.includes('storage-ui.js'));
console.log('PASS: dependency-free static beta, explicit browser-only saving, no account scripts/API calls, exact CSP hashes, asset/link integrity, script syntax and no server/credential files.');
