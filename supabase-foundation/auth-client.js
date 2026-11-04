/* Account adapter. Enable public email/password only after verified SMTP and recovery acceptance. */
(function(root){
 'use strict';
 const ORIGIN='https://minimal-rudraunsh.onrender.com',PROJECT='drdunpstvvotmxdvgolv';
 function create(sdk,publishableKey,tabStorage){
  if(!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey))throw Error('A modern publishable key is required.');
  if(!tabStorage)throw Error('Tab session storage is unavailable.');
  const client=sdk.createClient('https://'+PROJECT+'.supabase.co',publishableKey,{auth:{flowType:'pkce',persistSession:true,storage:tabStorage,storageKey:'minimal.supabase.session.v1',autoRefreshToken:true,detectSessionInUrl:true}});
  async function google(){
   const {data,error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:ORIGIN+'/',skipBrowserRedirect:true}});
   if(error||!data?.url)throw Error('Google sign-in is unavailable. Please try again later.');
   const url=new URL(data.url);if(url.origin!=='https://'+PROJECT+'.supabase.co'||url.pathname!=='/auth/v1/authorize')throw Error('Unexpected sign-in destination.');return url.href;
  }
  async function user(){const {data,error}=await client.auth.getUser();if(error||!data?.user?.email_confirmed_at||data.user.is_anonymous)return null;return data.user}
  // Keep recovery permission in memory and bind it to the verified account.
  // A recovery event for one account must never authorize another account.
  let recoveryUser=null;
  const subscription=client.auth.onAuthStateChange?.((event,session)=>{
   if(event==='PASSWORD_RECOVERY')recoveryUser=session?.user?.id||null;
   else if(event==='SIGNED_OUT'||event==='SIGNED_IN'||(session?.user?.id&&session.user.id!==recoveryUser))recoveryUser=null;
  });
  async function ready(){const {error}=await client.auth.getSession();if(error)throw Error('The account session could not be opened. Request a new link.');}
  async function canRecover(){await ready();const verified=await user();return !!(verified&&recoveryUser===verified.id);}
  function email(value){const e=String(value||'').trim();if(e.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(e))throw Error('Enter a valid email address.');return e}
  function password(value){if(typeof value!=='string'||value.length<12||value.length>1024)throw Error('Use a password of 12–1,024 characters.');return value}
  function captcha(value){if(value==null)return {};if(typeof value!=='string'||value.length>4096)throw Error('Invalid security check.');return {captchaToken:value}}
  async function signUp(address,secret,captchaToken){
   const {data,error}=await client.auth.signUp({email:email(address),password:password(secret),options:{emailRedirectTo:ORIGIN+'/',...captcha(captchaToken)}});
   if(error)throw Error('Registration could not be completed. Please try again later or contact support.');
   if(data?.session){await client.auth.signOut({scope:'local'});throw Error('Email verification must be enabled before registration is opened.');}
   return {message:'If this address can be registered, check your email to confirm your account.'};
  }
  async function signIn(address,secret,captchaToken){
   if(typeof secret!=='string'||!secret||secret.length>1024)throw Error('Enter your password.');
   const {error}=await client.auth.signInWithPassword({email:email(address),password:secret,options:captcha(captchaToken)});
   if(error)throw Error('Sign-in failed. Check your email, password and verification message.');
   const verified=await user();if(!verified){await client.auth.signOut({scope:'local'});throw Error('Confirm your email before opening your account.');}return verified;
  }
  async function resendConfirmation(address,captchaToken){
   const {error}=await client.auth.resend({type:'signup',email:email(address),options:{emailRedirectTo:ORIGIN+'/',...captcha(captchaToken)}});
   if(error)throw Error('Unable to send a confirmation right now. Please wait and try again.');
   return {message:'If confirmation is needed for this address, check your email.'};
  }
  async function requestReset(address,captchaToken){
   const {error}=await client.auth.resetPasswordForEmail(email(address),{redirectTo:ORIGIN+'/account-recovery.html',...captcha(captchaToken)});
   if(error)throw Error('Unable to request a reset right now. Please wait and try again.');
   return {message:'If an account exists for this address, check your email for a reset link.'};
  }
  async function updatePassword(next,current){
   const verified=await user();if(!verified)throw Error('Open a valid recovery link or sign in first.');
   const recoverySession=recoveryUser===verified.id;
   if(!recoverySession&&(typeof current!=='string'||!current||current.length>1024))throw Error('Enter your current password or use a recovery link.');
   const {error}=await client.auth.updateUser({password:password(next),...(!recoverySession?{currentPassword:current}:{})});
   if(error)throw Error('The password was not updated. Reopen a valid reset link or check your current password.');
   recoveryUser=null;
   try{await signOut();return {message:'Password updated. Sign in again.',signedOut:true};}
   catch{return {message:'Your password was updated, but sign-out could not be confirmed. Retry sign-out before leaving this device.',signedOut:false};}
  }
  async function signOut(){const {error}=await client.auth.signOut({scope:'global'});if(error)throw Error('Sign-out was not confirmed. Please retry.');}
  return {client,google,user,ready,canRecover,signOut,signUp,signIn,resendConfirmation,requestReset,updatePassword,dispose(){recoveryUser=null;subscription?.data?.subscription?.unsubscribe?.()}};
 }
 root.MinimalCloudAuth={create};
})(globalThis);
