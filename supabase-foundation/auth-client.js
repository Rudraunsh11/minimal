/* Wire to @supabase/supabase-js 2.118.0 after the Google provider is configured. */
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
  async function signOut(){const {error}=await client.auth.signOut({scope:'global'});if(error)throw Error('Sign-out was not confirmed. Please retry.');}
  return {client,google,user,signOut};
 }
 root.MinimalCloudAuth={create};
})(globalThis);
