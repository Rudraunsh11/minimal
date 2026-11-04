import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import vm from 'node:vm';
const ctx={URL};vm.runInNewContext(await readFile(new URL('auth-client.js',import.meta.url),'utf8'),ctx);let options,request,malicious=false,signedOut=false;
const client={auth:{signInWithOAuth:async x=>{request=x;return {data:{url:malicious?'https://example.invalid/steal':'https://drdunpstvvotmxdvgolv.supabase.co/auth/v1/authorize?provider=google'}}},getUser:async()=>({data:{user:{id:'synthetic',email_confirmed_at:'2026-10-24',is_anonymous:false}}}),signOut:async x=>{assert.equal(x.scope,'global');signedOut=true;return {}}}};
const sdk={createClient:(url,key,opts)=>{assert.equal(url,'https://drdunpstvvotmxdvgolv.supabase.co');options=opts;return client}},storage={};
const auth=ctx.MinimalCloudAuth.create(sdk,'sb_publishable_synthetic',storage);assert.equal(options.auth.flowType,'pkce');assert.equal(options.auth.storage,storage);assert.equal(options.auth.storageKey,'minimal.supabase.session.v1');assert.equal((await auth.user()).id,'synthetic');await auth.google();assert.equal(request.options.redirectTo,'https://minimal-rudraunsh.onrender.com/');assert.equal(request.options.skipBrowserRedirect,true);malicious=true;await assert.rejects(()=>auth.google(),/destination/);await auth.signOut();assert.ok(signedOut);assert.throws(()=>ctx.MinimalCloudAuth.create(sdk,'secret',storage),/publishable/);console.log('PASS: pinned-client adapter, PKCE, tab-scoped sessions, fixed production redirect, trusted Auth destination and global sign-out.');
let authEvent,confirmed=true,call,autoconfirm=false,fail=false,accountId="verified-account",failSignOut=false;
const emailClient={auth:{
 onAuthStateChange:cb=>{authEvent=cb;return {data:{subscription:{unsubscribe(){}}}}},
 getSession:async()=>({data:{session:null}}),
 getUser:async()=>({data:{user:{id:accountId,email_confirmed_at:confirmed?'2026-10-29':null,is_anonymous:false}}}),
 signUp:async x=>{call=x;return {data:autoconfirm?{session:{access_token:'synthetic'}}:{session:null},error:fail?Error('provider detail'):null}},
 signInWithPassword:async x=>{call=x;return {error:fail?Error('provider detail'):null}},
 resend:async x=>{call=x;return {}},resetPasswordForEmail:async(e,o)=>{call={email:e,options:o};return {}},
 updateUser:async x=>{assert.equal(x.current_password,undefined,"SDK expects currentPassword, not the wire field");call=x;return {}},signOut:async x=>{signedOut=x.scope;return {error:failSignOut?Error("offline"):null}}
}};
const emails=ctx.MinimalCloudAuth.create({createClient:()=>emailClient},'sb_publishable_synthetic',storage);
await emails.signUp(' person@example.invalid ','Synthetic user password');assert.equal(call.email,'person@example.invalid');assert.equal(call.options.emailRedirectTo,'https://minimal-rudraunsh.onrender.com/');
await assert.rejects(emails.signUp('invalid','Synthetic user password'));await assert.rejects(emails.signUp('a@example.invalid','short'));
autoconfirm=true;await assert.rejects(emails.signUp('a@example.invalid','Synthetic user password'),/verification/);assert.equal(signedOut,'local');autoconfirm=false;
assert.equal((await emails.signIn('person@example.invalid','Synthetic user password')).id,'verified-account');confirmed=false;await assert.rejects(emails.signIn('person@example.invalid','Synthetic user password'),/Confirm/);confirmed=true;
fail=true;await assert.rejects(emails.signIn('person@example.invalid','Synthetic user password'),/Sign-in failed/);fail=false;
await emails.resendConfirmation('person@example.invalid');assert.equal(call.type,'signup');
assert.match((await emails.requestReset('person@example.invalid')).message,/If an account exists/);assert.equal(call.options.redirectTo,'https://minimal-rudraunsh.onrender.com/account-recovery.html');
await assert.rejects(emails.updatePassword('New synthetic password'),/current password/);authEvent('PASSWORD_RECOVERY',{user:{id:accountId}});assert.equal(await emails.canRecover(),true);await emails.updatePassword('New synthetic password');assert.equal(call.password,'New synthetic password');assert.equal(call.currentPassword,undefined);assert.equal(signedOut,'global');assert.equal(await emails.canRecover(),false);
await emails.updatePassword('Another synthetic password','current synthetic password');assert.equal(call.currentPassword,'current synthetic password');
authEvent('PASSWORD_RECOVERY',{user:{id:accountId}});accountId='another-account';await assert.rejects(emails.updatePassword('New synthetic password'),/current password/);assert.equal(await emails.canRecover(),false);accountId='verified-account';
authEvent('PASSWORD_RECOVERY',{user:{id:accountId}});authEvent('SIGNED_IN',{user:{id:accountId}});assert.equal(await emails.canRecover(),false);
authEvent('PASSWORD_RECOVERY',{user:{id:accountId}});authEvent('TOKEN_REFRESHED',{user:{id:accountId}});assert.equal(await emails.canRecover(),true);
failSignOut=true;const partial=await emails.updatePassword('Another synthetic password');assert.equal(partial.signedOut,false);assert.match(partial.message,/was updated/);assert.equal(await emails.canRecover(),false);failSignOut=false;emails.dispose();
console.log('PASS: email signup/signin, confirmation enforcement, generic identity responses, fixed resend/reset URLs, recovery-only password update, current-password check and session revocation; passwords never enter project storage.');
