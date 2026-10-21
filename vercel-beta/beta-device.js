/* Device-only IndexedDB saving. No account API requests. */
'use strict';
const cloud={enabled:false,ready:false,locked:true,verifying:false};
let deviceDB=null,deviceWriter=null,deviceRow=null,deviceFailed=false,deviceCleared=false,deviceChannel=null;
const deviceBanner=document.createElement('div');deviceBanner.className='save-banner';deviceBanner.setAttribute('role','status');deviceBanner.setAttribute('aria-live','polite');document.querySelector('.topbar').after(deviceBanner);
function deviceDownload(value,name){const url=URL.createObjectURL(new Blob([JSON.stringify(value)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)}
function deviceMessage(info){
 const failed=info.error,waiting=info.pending;
 $('#save-state').textContent=failed?'Not saved — keep this tab open':waiting?'Saving on this device…':deviceCleared?'Device copy cleared':'Saved on this device';
 deviceBanner.replaceChildren();const text=document.createElement('p');text.style.margin='0';text.textContent=failed?'Saving paused. '+failed.message:waiting?'Saving your changes. Keep this tab open until Saved appears.':DEMO?'Practice demo · saved separately on this device':'Saved on this device · larger local database · no account sync or automatic server backup.';deviceBanner.append(text);
 deviceBanner.setAttribute('role',failed?'alert':'status');
 if(failed)for(const [label,action] of [['Export pending records','pending-export'],...(failed.name==='ConflictError'?[]:[['Retry save','retry']])]){const b=document.createElement('button');b.type='button';b.dataset.device=action;b.textContent=label;deviceBanner.append(b)}
}
function lockDevice(message){storageOK=false;deviceFailed=true;cloud.locked=true;deviceMessage({pending:false,error:new Error(message)})}
function deviceSaveReady(){return !!deviceWriter&&deviceWriter.idle()&&!deviceFailed&&!deviceCleared}
function makeWriter(row){return MinimalDatabase.writer({db:deviceDB,key:KEY,revision:row.revision,validate,onStatus:deviceMessage,onSaved:r=>{deviceRow=r;if(tab==='focus')setTimeout(()=>{if(deviceSaveReady())render()},0);deviceChannel?.postMessage({key:KEY,revision:r.revision})}})}
commit=function(fn){
 if(!storageOK||!deviceWriter||deviceFailed||deviceCleared){notify('Editing is paused to protect your records. Check the saving message above.');return false}
 if(deviceWriter.info().error){notify('Resolve the failed save above before editing more.');return false}
 try{const next=structuredClone(state);fn(next);validate(next);deviceWriter.stage(next);state=next;return true}catch(e){notify('Not saved: '+e.message);return false}
};
const deviceSettings=settingsView;
settingsView=function(){const u=MinimalStorage.usage(state);return deviceSettings()+card('Device storage',`<p><strong>${fmt(u.used/1000000,2)} MB</strong> of a <strong>20 MB record budget</strong> used.</p><progress aria-label="Personal record storage" max="${u.limit}" value="${Math.min(u.used,u.limit)}" style="width:100%"></progress><p>Up to 100,000 records per collection, within the 20 MB budget. Records use an IndexedDB database on this device. This is 22 times the previous budget, not unlimited storage.</p><p class="footnote">Actual space depends on your browser and device. One previous save is kept for recovery and uses additional space. A retained pre-migration copy may remain in browser storage. History is never automatically deleted.</p><p id="device-space" class="footnote">Checking browser storage…</p><div class="row"><button type="button" data-device="space">Check available space</button><button type="button" data-device="persist">Request persistent storage</button><button type="button" data-device="recover">Review previous save</button></div><p class="footnote">Persistence reduces automatic eviction if granted. Clearing site data, private mode or losing the device can still remove records. No cloud backup or cross-device sync. Records and JSON downloads are unencrypted; use a trusted device.</p><p><a href="privacy.html" target="_blank" rel="noopener">Privacy</a> · <a href="support.html" target="_blank" rel="noopener">Help</a> · <a href="release-status.html" target="_blank" rel="noopener">Release status</a></p>`)};
async function deviceSpace(request=false){const el=$('#device-space');try{if(!navigator.storage?.estimate){if(el)el.textContent='This browser does not report storage quota.';return}const estimate=await navigator.storage.estimate(),persisted=request?await navigator.storage.persist?.():await navigator.storage.persisted?.();if(el?.isConnected)el.textContent=`Browser reports ${fmt((estimate.usage||0)/1000000,1)} MB used of about ${fmt((estimate.quota||0)/1000000,0)} MB for this website, including app files and recovery copies. Persistent storage: ${persisted?'granted':'not granted'}. Space can change; it is not reserved capacity.`}catch{if(el?.isConnected)el.textContent='Storage estimate unavailable. Your records have not been changed.'}}
const deviceRender=render;render=function(){deviceRender();if(deviceWriter)deviceMessage(deviceFailed?{error:new Error('Editing paused. Export pending changes before reloading.')}:deviceWriter.info());if(tab==='settings')void deviceSpace()};
async function bootDevice(){
 try{
  deviceDB=await MinimalDatabase.connect(indexedDB,{onClose:()=>lockDevice('The database connection closed. Export pending changes before reloading.')});
  deviceRow=await MinimalDatabase.initialize(deviceDB,KEY,()=>{
   const raw=localStorage.getItem(KEY);if(raw!==null)return {data:JSON.parse(raw),source:KEY};
   const initial=DEMO?practiceState():defaults();
   if(!DEMO){const old=localStorage.getItem('minimal.tasks.v1');if(old!==null){const tasks=JSON.parse(old);if(!Array.isArray(tasks))throw Error('Older tasks need recovery.');initial.tasks=tasks.filter(t=>t&&typeof t.text==='string').map(t=>({id:uid(),text:t.text,done:!!t.done,date:day,priority:'Normal',steps:[]}))}const note=localStorage.getItem('minimal.quickNote.v1');if(note)initial.notes.push({id:uid(),title:'My first notes',body:note,updated:new Date().toISOString()})}
   return {data:initial,source:DEMO?'practice-seed':'initial'};
  },validate);
  state=validate(structuredClone(deviceRow.deleted?defaults():deviceRow.data));
  const verified=await deviceDB.read(KEY);if(!verified||verified.revision!==deviceRow.revision)throw Error('Records changed during startup. Reload to open the current save.');
  deviceWriter=makeWriter(deviceRow);storageOK=true;cloud.ready=true;cloud.locked=false;
  if(typeof BroadcastChannel!=='undefined'){deviceChannel=new BroadcastChannel('minimal-device-v2-events');deviceChannel.onmessage=async e=>{if(e.data?.key!==KEY||e.data.revision<=deviceWriter.info().revision)return;try{if(!deviceWriter.idle()||$('#modal').open){lockDevice('Records changed in another tab. Export pending changes, then reload.');return}const row=await deviceDB.read(KEY);if(row?.deleted){deviceCleared=true;state=validate(defaults());close();lockDevice('Device data was cleared in another tab. Reload to continue.');render();return}if(!deviceWriter.idle()||$('#modal').open){lockDevice('Records changed while editing. Export pending changes before reloading.');return}if(row&&row.revision>deviceWriter.info().revision){state=validate(structuredClone(row.data));deviceRow=row;deviceWriter=makeWriter(row);render()}}catch{lockDevice('The latest save could not be read. Export pending changes before reloading.')}}}
  document.body.classList.remove('booting');document.getElementById('boot-message')?.remove();render();
 }catch(e){storageOK=false;deviceFailed=true;cloud.locked=true;document.body.classList.remove('booting');document.getElementById('boot-message')?.remove();deviceMessage({error:e,pending:false});$('#storage-error').innerHTML='<div class="banner"><p>Your records could not be opened. Editing is paused; no existing records were replaced.</p><button type="button" data-device="legacy-export">Export old browser copy</button> <button type="button" data-device="raw-export">Export database recovery file</button> <button type="button" data-device="recover">Review previous save</button></div>';render()}
}
async function previousSave(){
 if(!deviceDB){notify('Database unavailable. Try exporting the old browser copy.');return}
 if(deviceWriter&&!deviceWriter.idle()){notify('Resolve pending saves before recovering a previous save.');return}
 try{const row=await deviceDB.read(KEY);if(!row?.previous){notify('No previous snapshot is available. Nothing changed.');return}const previous=validate(structuredClone(row.previous));dialog('Review the previous save',`<p>This snapshot contains ${previous.tasks.length} tasks, ${previous.notes.length} notes and ${previous.foods.length} food logs. Restoring replaces current records and may undo your most recent changes.</p><p>Export current records first if you want to keep them.</p><div class="row"><button type="button" data-action="export">Export current records</button><button type="button" id="device-restore-previous">Restore previous save</button>${button('Cancel','close')}</div>`);$('#device-restore-previous').onclick=async()=>{try{const r=await deviceDB.write(KEY,previous,row.revision);state=previous;deviceRow=r;deviceWriter=makeWriter(r);storageOK=true;deviceFailed=false;cloud.locked=false;cloud.ready=true;$('#storage-error').replaceChildren();deviceChannel?.postMessage({key:KEY,revision:r.revision});close();render();notify('Previous save restored.')}catch(e){notify('Recovery did not replace records: '+e.message)}}}catch(e){notify('Previous save could not be read: '+e.message)}
}
document.addEventListener('click',async e=>{
 const action=e.target.closest('[data-device]')?.dataset.device;
 if(action==='pending-export'){deviceDownload(state,'minimal-pending-'+dayKey()+'.json');return}
 if(action==='retry'){if(deviceFailed){notify('Export pending changes, then reload to reopen the database.');return}deviceWriter?.retry();return}
 if(action==='space'||action==='persist'){await deviceSpace(action==='persist');return}
 if(action==='recover'){await previousSave();return}
 if(action==='legacy-export'){try{const raw=localStorage.getItem(KEY);if(raw===null){notify('No old browser copy is present.');return}const url=URL.createObjectURL(new Blob([raw],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='minimal-legacy-recovery.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)}catch{notify('The old browser copy could not be read.')}return}
 if(action==='raw-export'){try{const row=await deviceDB?.read(KEY);if(row)deviceDownload({kind:'minimal-device-recovery',version:1,row},'minimal-database-recovery.json');else notify('No database record is available.')}catch{notify('Database recovery file could not be read.')}return}
 const clearing=e.target.closest('[data-cloud]')?.dataset.cloud;
 if(clearing==='clear-device')dialog('Clear this device copy?',`<p>This permanently clears ${DEMO?'practice records only':'Minimal records, previous saves, retained migration copies and preferences'} from this browser. No server backup exists. Downloaded backups remain untouched.</p><label class="field">Type CLEAR<input id="beta-clear-word" autocomplete="off"></label><div class="dialog-footer">${button('Cancel','close')}<button type="button" data-cloud="confirm-clear-device" class="danger">Clear this device</button></div>`);
 else if(clearing==='confirm-clear-device'){
  if($('#beta-clear-word')?.value!=='CLEAR'){notify('Type CLEAR to confirm.');return}
  if(!deviceDB||!deviceWriter?.idle()){notify('Resolve pending saves before clearing this device.');return}
  const b=e.target;b.disabled=true;storageOK=false;
  try{const keys=DEMO?[KEY]:['minimal.life.v1','minimal.practice.v1'];await deviceDB.clear(keys);deviceCleared=true;for(const key of keys){const row=await deviceDB.read(key);deviceChannel?.postMessage({key,revision:row.revision})}try{MinimalDevice.clear(DEMO?'practice':'all')}catch{notify('Database cleared. Some older copies require clearing site data in browser settings.')}dismissFocusCelebration(true);state=validate(defaults());close();render();deviceMessage({pending:false});notify('Device copy cleared. Reload to start again.')}catch(err){storageOK=true;b.disabled=false;notify('Not cleared: '+err.message)}
 }
});
window.addEventListener('beforeunload',e=>{if(deviceWriter&&!deviceWriter.idle()){e.preventDefault();e.returnValue=''}});
window.addEventListener('storage',e=>{if(e.key===null||e.key===KEY)lockDevice('Browser records changed or were cleared in another tab. Export pending changes before reloading.')});
window.addEventListener('offline',()=>notify('You’re offline. An open app can still save locally. Barcode lookup and reopening offline are not supported yet.'));
void bootDevice();
