/* Device-only beta: never makes account API requests. */
'use strict';
const cloud={enabled:false,ready:true,locked:false,verifying:false};
const betaLocalCommit=commit;
let betaExpected=(()=>{try{return recordStorage.getItem(KEY)}catch{return null}})(),betaCleared=false;
commit=function(fn){
 if(betaCleared){notify('Device data was cleared. Reload to continue.');return false}
 try{if(recordStorage.getItem(KEY)!==betaExpected){notify('Another tab changed these records. Reload before editing.');return false}}catch{notify('Browser saving is unavailable.');return false}
 const ok=betaLocalCommit(fn);if(ok)try{betaExpected=recordStorage.getItem(KEY)}catch{}return ok;
};
const betaBanner=document.createElement('div');betaBanner.className='save-banner';betaBanner.setAttribute('role','status');betaBanner.textContent=DEMO?'Practice demo · sample records saved separately':'Device-only beta · saved in this browser. No account sync. Export before switching devices or clearing browser data.';document.querySelector('.topbar').after(betaBanner);
document.body.classList.remove('booting');document.getElementById('boot-message')?.remove();
const betaSettings=settingsView;
settingsView=function(){const u=MinimalStorage.usage(state);return betaSettings()+card('Device storage',`<p>${Math.ceil(u.used/1000)} KB of ${u.limit/1000} KB used. No online archives or server backups are available in this beta.</p><p class="footnote">Records are unencrypted in this browser. Clearing site data, private browsing or losing the device can remove them. JSON backup downloads are also unencrypted. Keep private copies somewhere safe.</p><p><a href="privacy.html" target="_blank" rel="noopener">Privacy</a> · <a href="support.html" target="_blank" rel="noopener">Help</a> · <a href="release-status.html" target="_blank" rel="noopener">Beta limitations</a> · <a href="DATA-LICENSES.md" target="_blank" rel="noopener">Data sources</a></p>`)};
document.addEventListener('click',e=>{const action=e.target.closest('[data-cloud]')?.dataset.cloud;if(action==='clear-device'){dialog('Clear this browser copy?',`<p>This removes ${DEMO?'practice records only':'Minimal records and preferences from this browser'}. There is no account copy to recover from in this beta. Export first if you need a copy. Downloaded backups are unaffected.</p><label class="field">Type CLEAR<input id="beta-clear-word" autocomplete="off"></label><div class="dialog-footer">${button('Cancel','close')}<button type="button" data-cloud="confirm-clear-device" class="danger">Clear this device</button></div>`)}else if(action==='confirm-clear-device'){if($('#beta-clear-word')?.value!=='CLEAR'){notify('Type CLEAR to confirm.');return}try{MinimalDevice.clear(DEMO?'practice':'all');betaCleared=true;dismissFocusCelebration(true);state=validate(defaults());close();render();notify('Browser copy cleared. Reload to start again.')}catch(err){notify(err.message)}}});
window.addEventListener('offline',()=>notify('You’re offline. Records still save in this browser; food barcode lookup needs an internet connection.'));
render();
