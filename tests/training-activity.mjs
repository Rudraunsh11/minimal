import assert from 'node:assert/strict';
import '../public/schema.js';
const base=()=>({version:1,tasks:[],notes:[],events:[],foods:[],library:[],water:[],workouts:[],habits:[],checks:{},settings:{name:'',waterGoal:2000}});
const activity={id:'walk-1',date:'2026-10-20',name:'Walk',seconds:1500,distanceKm:2,exerciseId:''};
// Optional ratings preserve old backups. Import rejects non-integer/out-of-range data.
for(const effort of [undefined,null,1,7,10]){const s=base();s.timedActivities=[{...activity,...(effort===undefined?{}:{effort})}];MinimalSchema.validateState(s);assert.equal(s.timedActivities[0].effort,effort)}
for(const effort of [0,11,-1,7.5,'7',NaN,Infinity,{}]){const s=base();s.timedActivities=[{...activity,effort}];assert.throws(()=>MinimalSchema.validateState(s),/timed activity/)}
for(const count of [0,500,1000,100000]){const s=base();s.stepLogs=[{id:'steps-1',date:'2026-10-20',count}];MinimalSchema.validateState(s)}
for(const count of [-1,.5,100001,'1000']){const s=base();s.stepLogs=[{id:'steps-1',date:'2026-10-20',count}];assert.throws(()=>MinimalSchema.validateState(s),/step day/)}
const duplicate=base();duplicate.stepLogs=[{id:'steps-1',date:'2026-10-20',count:1000},{id:'steps-2',date:'2026-10-20',count:500}];assert.throws(()=>MinimalSchema.validateState(duplicate),/duplicate step day/);
console.log('PASS: optional effort ratings preserve older records, invalid ratings are rejected, daily steps are bounded integers and duplicate step dates are rejected.');
