/* Honest release state and accessible support links. */
(()=>{
 'use strict';
 const previous=settingsView;settingsView=function(){return previous()+card('Privacy, help & release status',`<p>Minimal is currently a private preview. Nutrition is a reference estimate, rewards are virtual, reminders work while the app is open, and wearable sync is not connected.</p><div class="row"><a href="privacy.html" target="_blank" rel="noopener">Privacy & data</a><a href="support.html" target="_blank" rel="noopener">Help & contact</a><a href="release-status.html" target="_blank" rel="noopener">What is ready?</a><a href="DATA-LICENSES.md" target="_blank" rel="noopener">Data sources</a></div><p class="footnote">Ordinary account saving does not require regular exports. Optional full backups include online archives; the older JSON export includes active records only. A native app-store release has not been submitted.</p>`)};
 window.addEventListener('offline',()=>notify('You’re offline. Keep this tab open for unsynced changes. Temporary browser copies can be lost when the tab closes.'));
 if(!cloud.enabled||cloud.ready)render();
})();
