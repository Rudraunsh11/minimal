/* Stable editing surfaces and deliberate date/history controls for the device app. */
(function(){
 'use strict';
 const modal=document.getElementById('modal');
 const save=commit;
 commit=function(fn){return save(next=>{fn(next);MinimalUX.activityChanges(state,next,dayKey())})};
 let locked=false,position=0,returnFocus=null,deferred=false;
 function lock(){
  if(locked)return;locked=true;position=window.scrollY;returnFocus=document.activeElement;
  document.body.style.setProperty('--locked-scroll',-position+'px');
  document.body.classList.add('editing-modal');
 }
 function unlock(){
  if(!locked)return;locked=false;document.body.classList.remove('editing-modal');
  modal.classList.remove('note-editor');document.body.style.removeProperty('--locked-scroll');
  window.scrollTo({top:position,behavior:'instant'});
  if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});
  if(deferred){deferred=false;render()}
 }
 const openDialog=dialog;
 dialog=function(title,body){if(!modal.open)lock();modal.classList.remove('note-editor');openDialog(title,body);modal.scrollTop=0};
 modal.addEventListener('close',unlock);
 // Keep the page inert even for custom delegated shortcuts and synthetic events.
 for(const type of ['click','pointerdown','keydown','input','change','submit'])window.addEventListener(type,e=>{
  if(!modal.open)return;
  if(!modal.contains(e.target)){e.stopImmediatePropagation();if(e.cancelable)e.preventDefault();return}
  if(type==='keydown'&&e.key!=='Escape'&&e.target.matches('input,textarea,select,[contenteditable=true]'))e.stopPropagation();
 },true);
 const draw=render;let route=tab,clockDay=dayKey();
 render=function(){
  if(modal.open){deferred=true;return}
  // A date chosen in a planner is local to that visit. Today always means today.
  if(route!==tab){day=dayKey();month=day.slice(0,7);route=tab}
  draw();
  const old=document.getElementById('selected-day-notice');old?.remove();
  if(day!==dayKey()){
   const notice=document.createElement('p');notice.id='selected-day-notice';notice.className='selected-day-notice';
   const text=document.createElement('span');text.textContent='Viewing '+dateLabel(day)+(day>dayKey()?' · Planning only. Completed activity cannot be logged in the future.':' · Past records.');
   const back=document.createElement('button');back.type='button';back.textContent='Back to today';back.onclick=()=>{day=dayKey();month=day.slice(0,7);render()};notice.append(text,back);document.querySelector('.topbar').after(notice);
  }
 };
 function newDay(){const now=dayKey();if(now!==clockDay){if(day===clockDay){day=now;month=now.slice(0,7)}clockDay=now;render()}}
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)newDay()});setInterval(newDay,30000);
 document.addEventListener('click',e=>{
  const b=e.target.closest('[data-history-delete]');if(!b)return;
  const kind=b.dataset.historyDelete,id=b.dataset.id;
  dialog('Delete this '+(kind==='focus'?'focus session':'learning entry')+'?',`<p>This removes the entry and any linked focus or learning record. Streaks, badges and points update to match your remaining history.</p><div class="dialog-footer"><button type="button" data-action="close">Keep it</button><button type="button" class="danger" id="delete-history-confirm">Delete entry</button></div>`);
  document.getElementById('delete-history-confirm').onclick=()=>{
   if(commit(s=>MinimalUX.removeHistory(s,kind,id))){dismissFocusCelebration(true);close();render();notify('Entry deleted. Progress recalculated.')}
  };
 });
 // The navigation belongs to the viewport, not a styled/animated sidebar ancestor.
 const nav=document.getElementById('nav'),slot=document.createComment('navigation home');nav.before(slot);
 const narrow=matchMedia('(max-width:800px)');
 function placeNav(){if(narrow.matches){document.body.append(nav);nav.classList.add('mobile-fixed-nav')}else{slot.after(nav);nav.classList.remove('mobile-fixed-nav')}}
 placeNav();narrow.addEventListener('change',placeNav);
 if(window.visualViewport){const size=()=>{modal.style.setProperty('--editor-height',Math.round(visualViewport.height)+'px');modal.style.setProperty('--editor-top',Math.round(visualViewport.offsetTop)+'px')};visualViewport.addEventListener('resize',size);visualViewport.addEventListener('scroll',size);size()}
 render();
})();
