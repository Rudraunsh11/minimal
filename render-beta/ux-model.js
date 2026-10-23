/* Shared, side-effect-free rules for actual activity and linked history. */
(function(root){
 'use strict';
 function activityChanges(before,after,today){
  for(const name of ['water','foods','workouts','timedActivities','learning','stepLogs','focusSessions']){
   const old=new Map((before[name]||[]).map(x=>[x.id,x]));
   for(const x of after[name]||[]){
    if(x.date>today&&JSON.stringify(old.get(x.id))!==JSON.stringify(x))throw Error('Record completed activity on today or a past day. Future dates are for planning.');
   }
  }
  for(const [date,ids] of Object.entries(after.checks||{}))if(date>today&&ids.some(id=>!(before.checks?.[date]||[]).includes(id)))throw Error('Check off habits after you have completed them. Choose today or a past day.');
 }
 function removeHistory(s,kind,id){
  if(!['focus','learning'].includes(kind))throw Error('Unknown history type');
  const focusId=kind==='focus'?id:(s.focusSessions||[]).find(x=>'focus-'+x.id===id)?.id;
  if(focusId){s.focusSessions=(s.focusSessions||[]).filter(x=>x.id!==focusId);s.learning=(s.learning||[]).filter(x=>x.id!=='focus-'+focusId)}
  else s.learning=(s.learning||[]).filter(x=>x.id!==id);
 }
 root.MinimalUX={activityChanges,removeHistory};
})(globalThis);
