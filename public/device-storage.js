/* Device-copy policy. No credentials or auth tokens are stored here.
   Temporary copies reduce persistence; neither Web Storage option is encryption. */
(function(root){
 'use strict';
 const ACCOUNT='minimal.life.v1.user.',MODE='minimal.device-mode.v1.';
 function create({local,session,localOnly=false}){
  let accountKey=null;
  const modeKey=()=>accountKey?MODE+accountKey.slice(ACCOUNT.length):null;
  const remembered=()=>{if(localOnly)return true;try{return !!(accountKey&&local().getItem(modeKey())==='remember')}catch{return false}};
  const active=()=>remembered()?local():session();
  const recordStore={getItem:k=>active().getItem(k),setItem:(k,v)=>active().setItem(k,v),removeItem:k=>active().removeItem(k)};
  const keys=store=>Array.from({length:store.length},(_,i)=>store.key(i)).filter(Boolean);
  function clear(scope='all'){
   const errors=[];for(const get of [local,session])try{const store=get();for(const k of keys(store))if(scope==='practice'?(k==='minimal.practice.v1'||k==='minimal.practice.v1.sync'):k.startsWith('minimal.'))try{store.removeItem(k)}catch{errors.push(k)}}catch{errors.push('storage')}
   if(errors.length)throw Error('Some browser copies could not be removed. Clear this site’s data in browser settings.');
  }
  function purgeAccount(){if(!accountKey)return;let failed=false;for(const get of [local,session])try{for(const key of [accountKey,accountKey+'.sync',modeKey()])get().removeItem(key)}catch{failed=true}if(failed)throw Error('The account copy could not be fully cleared. Clear this site’s data in browser settings.');}
  function setRemember(keep){
   if(localOnly||!accountKey)throw Error('Device mode applies to a signed-in hosted account.');
   const before=active(),target=keep?local():session(),data=before.getItem(accountKey),meta=before.getItem(accountKey+'.sync');
   // Copy before changing policy. A failed copy leaves the old mode intact.
   if(data!==null)target.setItem(accountKey,data);if(meta!==null)target.setItem(accountKey+'.sync',meta);
   local().setItem(modeKey(),keep?'remember':'temporary');
   if(before!==target){before.removeItem(accountKey);before.removeItem(accountKey+'.sync')}
  }
  function legacy(){if(localOnly||!accountKey)return null;const kind=remembered()?'session':'local',store=kind==='local'?local():session(),raw=store.getItem(accountKey);return raw===null?null:{raw,meta:store.getItem(accountKey+'.sync'),kind}}
  function retireLegacy(snapshot){if(!snapshot||!accountKey)return;const store=snapshot.kind==='session'?session():local();if(store===active())return;if(store.getItem(accountKey)===snapshot.raw&&store.getItem(accountKey+'.sync')===snapshot.meta){store.removeItem(accountKey);store.removeItem(accountKey+'.sync')}}
  function olderCopies(){const store=local();return keys(store).filter(k=>k==='minimal.life.v1'||k==='minimal.tasks.v1'||k==='minimal.quickNote.v1'||(k.startsWith(ACCOUNT)&&!k.endsWith('.sync')&&k!==accountKey)).length}
  return {recordStore,localOnly,bindAccount(key){if(!key.startsWith(ACCOUNT))throw Error('Invalid account storage key.');accountKey=key},remembered,setRemember,purgeAccount,clear,legacy,retireLegacy,olderCopies,modeKey};
 }
 root.MinimalDeviceFactory={create};
 if(typeof window!=='undefined'){
  const loopback=['127.0.0.1','localhost','::1'].includes(location.hostname)&&location.port==='8765';
  root.MinimalDevice=create({local:()=>localStorage,session:()=>sessionStorage,localOnly:new URLSearchParams(location.search).get('demo')==='1'||loopback||location.protocol==='file:'});
 }
})(globalThis);
