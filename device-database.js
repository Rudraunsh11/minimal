/* Local database only. No network, credentials or telemetry. */
(function(root){
 'use strict';
 const DATABASE='minimal-device-v2',VERSION=1,MAX_BYTES=20000000,MAX_RECORDS=100000;
 const clone=x=>structuredClone(x);
 function conflict(){const e=new Error('Another tab changed these records. Export pending changes before reloading.');e.name='ConflictError';return e}
 function connect(factory=root.indexedDB,{name=DATABASE,onClose=()=>{}}={}){
  return new Promise((resolve,reject)=>{
   if(!factory){reject(new Error('This browser does not support the local database. Your old records have not been changed.'));return}
   let done=false;const req=factory.open(name,VERSION),timer=setTimeout(()=>{if(!done){done=true;reject(new Error('The database is busy. Close other Minimal tabs, then reload.'))}},8000);
   req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('records'))req.result.createObjectStore('records',{keyPath:'key'})};
   req.onerror=()=>{clearTimeout(timer);if(!done){done=true;reject(req.error||new Error('Database could not open.'))}};
   req.onsuccess=()=>{clearTimeout(timer);if(done){req.result.close();return}done=true;const db=req.result;db.onversionchange=()=>{db.close();onClose()};db.onclose=onClose;
    function transaction(mode,run){return new Promise((ok,no)=>{let result,failure;const tx=db.transaction('records',mode),store=tx.objectStore('records');tx.oncomplete=()=>ok(result);tx.onabort=()=>no(failure||tx.error||new Error('Database write was interrupted.'));tx.onerror=()=>{};try{run(store,x=>result=x,e=>{failure=e;tx.abort()})}catch(e){failure=e;tx.abort()}})}
    const read=key=>transaction('readonly',(store,set)=>{const r=store.get(key);r.onsuccess=()=>set(r.result||null)});
    const write=(key,data,expected,{previous=true,migratedFrom=null}={})=>transaction('readwrite',(store,set,fail)=>{
     const r=store.get(key);r.onsuccess=()=>{const old=r.result;if((old?.revision??null)!==expected){fail(conflict());return}const row={key,revision:(old?.revision||0)+1,data:clone(data),previous:previous&&old?.data?clone(old.data):null,updatedAt:Date.now(),deleted:false,migratedFrom:old?.migratedFrom||migratedFrom};store.put(row);set(row)};
    });
    const clear=keys=>transaction('readwrite',(store,set)=>{for(const key of keys){const r=store.get(key);r.onsuccess=()=>store.put({key,revision:(r.result?.revision||0)+1,data:null,previous:null,deleted:true,updatedAt:Date.now()})}set(true)});
    resolve({read,write,clear,close:()=>db.close()});
   };
  });
 }
 async function initialize(db,key,legacy,validate){
  let row=await db.read(key);if(row)return row;
  const original=legacy(),data=validate(clone(original.data));
  try{return await db.write(key,data,null,{previous:false,migratedFrom:original.source})}catch(e){if(e.name!=='ConflictError')throw e;row=await db.read(key);if(!row)throw e;return row}
 }
 /* Screens may update optimistically; only transaction completion means Saved.
    Failed drafts remain in memory, editing pauses, and export/retry stay available. */
 function writer({db,key,revision,validate,onStatus=()=>{},onSaved=()=>{}}){
  let rev=revision,pending=null,inflight=false,error=null,waiters=[];
  function status(){onStatus({pending:!!pending||inflight,busy:inflight,error,revision:rev})}
  function settle(){if(!pending&&!inflight){for(const f of waiters.splice(0))f(!error)}}
  async function flush(){if(inflight||error||!pending)return;const snapshot=pending;pending=null;inflight=true;status();
   try{const row=await db.write(key,snapshot,rev);rev=row.revision;onSaved(row)}catch(e){pending=pending||snapshot;error=e}finally{inflight=false;status();if(!error&&pending)void flush();else if(error){for(const f of waiters.splice(0))f(false)}else settle()}
  }
  return {stage(data){if(error)throw error;const next=validate(clone(data));pending=next;status();void flush();return true},retry(){if(error?.name==='ConflictError')return false;error=null;status();void flush();return true},idle(){return !pending&&!inflight&&!error},info(){return {revision:rev,pending:!!pending||inflight,error}},drain(){if(error)return Promise.resolve(false);if(!pending&&!inflight)return Promise.resolve(!error);return new Promise(resolve=>waiters.push(resolve))}};
 }
 root.MinimalDatabase={connect,initialize,writer,MAX_BYTES,MAX_RECORDS,DATABASE};
 if(typeof module!=='undefined'&&module.exports)module.exports=root.MinimalDatabase;
})(globalThis);
