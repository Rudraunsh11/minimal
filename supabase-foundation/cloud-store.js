/* Adapter for a pinned Supabase client. No automatic uploads or local state mutations. */
(function(root){
 'use strict';
 function create(client,project,validate){
  const revision=x=>Number.isSafeInteger(x)&&x>=0;
  async function owner(){const {data,error}=await client.auth.getUser();if(error||!data?.user?.id||!data.user.email_confirmed_at||data.user.is_anonymous)throw Error('Sign in with a verified account first.');return data.user.id}
  async function read(){const user=await owner(),{data,error}=await client.from('minimal_cloud_state').select('user_id,revision,payload,previous_payload,deleted,updated_at').eq('user_id',user).maybeSingle();if(error)throw Error('Cloud records could not be read. Your device records were not changed.');if(data&&(!revision(data.revision)||data.user_id!==user))throw Error('Invalid cloud response.');return {user,row:data}}
  async function put(snapshot,pass,expected){
   if(!revision(expected))throw Error('Read the cloud revision before saving.');const user=await owner(),box=await root.MinimalCloudCrypto.encrypt(snapshot,pass,project,user,validate);
   const {data,error}=await client.rpc('minimal_put_state',{p_expected:expected,p_payload:box});
   if(error){if(error.code==='40001')throw Error('Cloud records changed on another device. Read and review them before saving.');throw Error('Cloud save was not confirmed. Keep your device copy; check the cloud revision before retrying.');}
   if(!data||data.revision!==expected+1)throw Error('Cloud save was not confirmed. Read cloud records before retrying.');return data;
  }
  async function restore(pass,{previous=false}={}){const {user,row}=await read();if(!row||row.deleted)throw Error('No cloud snapshot is available.');const payload=previous?row.previous_payload:row.payload;if(!payload)throw Error('No previous cloud snapshot is available.');return {data:await root.MinimalCloudCrypto.decrypt(payload,pass,project,user,validate),revision:row.revision,updatedAt:row.updated_at}}
  async function clear(expected){if(!revision(expected)||expected===0)throw Error('Read the cloud revision before deleting.');await owner();const {data,error}=await client.rpc('minimal_clear_state',{p_expected:expected});if(error||!data?.deleted||data.revision!==expected+1)throw Error('Cloud deletion was not confirmed. Read its current revision before retrying.');return data}
  return {read,put,restore,clear};
 }
 root.MinimalCloudStore={create};
})(globalThis);
