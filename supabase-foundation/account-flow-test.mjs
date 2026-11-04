import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const ctx={};vm.runInNewContext(await readFile(new URL('account-flow.js',import.meta.url),'utf8'),ctx);
let resolve,requests=0,updates=0,canRecover=false,signOutFails=false,partialUpdate=false,last,current;
const auth={
 signIn:async()=>{requests++;await new Promise(r=>{resolve=r});return {id:'synthetic-account',email:'test@example.invalid'}},
 signUp:async()=>{requests++;return {message:'Check your email.'}},
 requestReset:async()=>({message:'If an account exists, check your email.'}),
 resendConfirmation:async()=>({message:'Check your email.'}),
 canRecover:async()=>canRecover,
 updatePassword:async(p,c)=>{updates++;current=c;return {message:'Password updated.',signedOut:!partialUpdate}},
 signOut:async()=>{if(signOutFails)throw Error('provider details and secrets');}
};
const flow=ctx.MinimalAccountFlow.create(auth,s=>last=s);
const waiting=flow.submit({email:'test@example.invalid',password:'Never store this synthetic password'});
assert.equal(last.busy,true);assert.equal(flow.select('signup'),false);assert.equal(await flow.submit({}),false);assert.equal(requests,1);
resolve();await waiting;assert.equal(last.account.id,'synthetic-account');assert.ok(!JSON.stringify(last).includes('Never store'));
signOutFails=true;await flow.signOut();assert.equal(last.account.id,'synthetic-account');assert.ok(!last.error.includes('secrets'));
signOutFails=false;await flow.signOut();assert.equal(last.account,null);
flow.select('signup');const before=requests;await flow.submit({password:'synthetic long password',confirm:'wrong'});assert.equal(requests,before);assert.match(last.error,/must match/);
await flow.submit({email:'test@example.invalid',password:'synthetic long password',confirm:'synthetic long password'});assert.match(last.message,/email/);
flow.select('recover');await flow.submit({password:'new synthetic password',confirm:'new synthetic password'});assert.equal(updates,0);assert.match(last.error,/fresh link/);
canRecover=true;await flow.submit({password:'new synthetic password',confirm:'new synthetic password'});assert.equal(updates,1);assert.equal(current,undefined);assert.equal(last.mode,'signin');
flow.select('change');await flow.submit({password:'new synthetic password',confirm:'new synthetic password',current:'old synthetic password'});assert.equal(current,'old synthetic password');
assert.ok(!JSON.stringify(flow.snapshot()).includes('synthetic password'));
partialUpdate=true;flow.select('change');await flow.submit({password:'new synthetic password',confirm:'new synthetic password',current:'old synthetic password'});assert.equal(last.needsSignOut,true);assert.equal(flow.select('signin'),false);const count=updates;assert.equal(await flow.submit({}),false);assert.equal(updates,count);await flow.signOut();assert.equal(last.needsSignOut,false);
flow.select('reset');await flow.submit({email:'test@example.invalid'});assert.match(last.message,/If an account exists/);
flow.select('resend');await flow.submit({email:'test@example.invalid'});assert.match(last.message,/email/);
const previous=last;flow.dispose();assert.equal(flow.select('signin'),false);assert.equal(await flow.submit({}),false);assert.equal(last,previous);
console.log('PASS: duplicate-request guard, secret-free UI state, confirmation matching, recovery authorization, current-password forwarding and sign-out failure handling.');
new vm.Script(await readFile(new URL('account-ui.js',import.meta.url),'utf8'));
const ui=await readFile(new URL('account-ui.js',import.meta.url),'utf8');assert.ok(!ui.includes('innerHTML'));assert.ok(!ui.includes('localStorage'));assert.ok(!ui.includes('cloud-store'));
