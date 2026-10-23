import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const root=new URL('../',import.meta.url),model=await readFile(new URL('render-beta/ux-model.js',root),'utf8'),ctx={};vm.runInNewContext(model,ctx);const {activityChanges,removeHistory}=ctx.MinimalUX;
const before={water:[],foods:[],workouts:[],timedActivities:[],learning:[],stepLogs:[],focusSessions:[],checks:{},tasks:[],events:[],notes:[]};
for(const key of ['water','foods','workouts','timedActivities','learning','stepLogs','focusSessions']){
 const next=structuredClone(before);next[key].push({id:'new',date:'2026-10-24'});assert.throws(()=>activityChanges(before,next,'2026-10-23'),/completed activity/);
 next[key][0].date='2026-10-23';assert.doesNotThrow(()=>activityChanges(before,next,'2026-10-23'));
 next[key][0].date='2026-10-22';assert.doesNotThrow(()=>activityChanges(before,next,'2026-10-23'));
}
const legacy=structuredClone(before);legacy.water=[{id:'old',date:'2026-10-24',amount:100}];assert.doesNotThrow(()=>activityChanges(legacy,structuredClone(legacy),'2026-10-23'));const changed=structuredClone(legacy);changed.water[0].amount=200;assert.throws(()=>activityChanges(legacy,changed,'2026-10-23'));changed.water=[];assert.doesNotThrow(()=>activityChanges(legacy,changed,'2026-10-23'));
const plan=structuredClone(before);for(const k of ['tasks','events','notes'])plan[k].push({id:'plan',date:'2026-11-01'});assert.doesNotThrow(()=>activityChanges(before,plan,'2026-10-23'));
plan.checks['2026-10-24']=['habit'];assert.throws(()=>activityChanges(before,plan,'2026-10-23'),/habits/);
const history={focusSessions:[{id:'one'},{id:'two'}],learning:[{id:'focus-one'},{id:'focus-two'},{id:'manual'}]};removeHistory(history,'learning','focus-one');assert.equal(history.focusSessions.length,1);assert.equal(history.learning.length,2);removeHistory(history,'focus','two');assert.equal(history.focusSessions.length,0);assert.equal(history.learning[0].id,'manual');removeHistory(history,'learning','manual');assert.equal(history.learning.length,0);removeHistory(history,'learning','missing');assert.equal(history.learning.length,0);
const device=await readFile(new URL('vercel-beta/beta-device.js',root),'utf8');assert.ok(!device.includes("document.querySelector('.topbar').after(deviceBanner)"));assert.ok(device.includes("!$('#modal').open"));
const ui=await readFile(new URL('render-beta/ux-fixes.js',root),'utf8');assert.ok(ui.includes('if(modal.open){deferred=true;return}'));assert.ok(ui.includes('e.stopImmediatePropagation()'));assert.ok(ui.includes('returnFocus.focus({preventScroll:true})'));
const css=await readFile(new URL('render-beta/ux-fixes.css',root),'utf8');assert.ok(css.includes('touch-action:manipulation'));assert.ok(!css.includes('user-scalable'));assert.ok(css.includes('position:fixed!important'));assert.ok(css.includes('16px!important'));
console.log('PASS: seven future-activity guards, past logging, legacy preservation/removal, future planning, habit restrictions, linked focus/learning deletion, stable save placement and modal render isolation.');
