/* Shared browser/server record validation. No network access or DOM dependencies. */
(function(root){
 'use strict';
 const MAX_BYTES=900000,keys=['kcal','protein','carbs','fat','fiber','sugar','sodium','calcium','iron','potassium','vitc','vitd','b12','vita','magnesium'];
 const fail=m=>{throw Error(m)},obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x),str=(x,max=50000)=>typeof x==='string'&&x.length<=max,id=x=>str(x,100)&&/^[-a-zA-Z0-9]+$/.test(x),num=(x,min,max)=>Number.isFinite(x)&&x>=min&&x<=max;
 const date=x=>{if(!str(x,10)||!/^\d{4}-\d{2}-\d{2}$/.test(x))return false;const d=new Date(x+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===x};
 function safeTree(x,depth=0){if(depth>16)fail('Record nesting is too deep.');if(x&&typeof x==='object')for(const k of Object.keys(x)){if(['__proto__','prototype','constructor'].includes(k))fail('Unsafe backup field.');safeTree(x[k],depth+1)}}
 function foodFields(f,depth=0){
  if(depth>8||!obj(f)||!str(f.name,200)||!f.name.trim()||!['g','ml'].includes(f.unit)||!obj(f.nutrients)||!str(f.source,300))fail('Invalid food.');
  for(const k of keys)if(f.nutrients[k]!=null&&!num(f.nutrients[k],0,1e8))fail('Invalid nutrient.');
  if(f.sourceUrl){try{const u=new URL(f.sourceUrl);if(!str(f.sourceUrl,2048)||u.protocol!=='https:'||u.username||u.password)fail('Unsafe source URL.')}catch{fail('Unsafe source URL.')}}
  if(f.quick!==undefined&&typeof f.quick!=='boolean')fail('Invalid quick entry.');
  if(f.portions!==undefined&&(!Array.isArray(f.portions)||f.portions.length>200||f.portions.some(p=>!Array.isArray(p)||p.length!==2||!str(p[0],200)||!num(p[1],.001,100000))))fail('Invalid reference portion.');
  if(f.referenceRecipe!==undefined){const r=f.referenceRecipe;if(!obj(r)||!num(r.yieldG,.1,100000)||!Array.isArray(r.ingredients)||r.ingredients.length>200||r.ingredients.some(x=>!obj(x)||!id(x.id)||!str(x.name,200)||!num(x.grams,.001,100000)))fail('Invalid reference formulation.');}
  if(f.yieldG!==undefined&&!num(f.yieldG,.1,100000))fail('Invalid recipe yield.');
  if(f.ingredients!==undefined){if(!Array.isArray(f.ingredients)||f.ingredients.length>200)fail('Invalid recipe ingredients.');for(const x of f.ingredients){foodFields(x,depth+1);if(x.unit!=='g'||!num(x.amount,.1,100000))fail('Invalid ingredient amount.')}}
 }
 function validateState(s){
  if(!obj(s)||s.version!==1)fail('Unsupported backup version.');safeTree(s);if(new TextEncoder().encode(JSON.stringify(s)).length>MAX_BYTES)fail('Records exceed the 900 KB account limit. Export or archive older records before adding more.');
  for(const k of ['tasks','notes','events','foods','library','water','workouts','habits'])if(!Array.isArray(s[k])||s[k].length>20000)fail('Invalid '+k);
  for(const k of ['learning','stepLogs','routines','focusSessions','timedActivities']){if(s[k]===undefined)s[k]=[];if(!Array.isArray(s[k])||s[k].length>20000)fail('Invalid '+k)}
  for(const k of ['tasks','notes','events','foods','library','water','workouts','habits','learning','stepLogs','routines','focusSessions','timedActivities']){const seen=new Set();for(const x of s[k]){if(!obj(x)||!id(x.id)||seen.has(x.id))fail('Invalid or duplicate '+k+' ID.');seen.add(x.id)}}
  if(!obj(s.settings)||!str(s.settings.name,40)||!num(s.settings.waterGoal,250,10000)||!obj(s.checks))fail('Invalid settings.');
  if(s.settings.surfaceFinish!==undefined&&!['paper','linen','smooth'].includes(s.settings.surfaceFinish))fail('Invalid surface finish.');
  if(s.settings.theme!==undefined&&!['light','dark'].includes(s.settings.theme))fail('Invalid appearance preference.');
  if(s.settings.showHints!==undefined&&typeof s.settings.showHints!=='boolean')fail('Invalid hints preference.');
  for(const k of ['kcalGoal','proteinGoal','carbsGoal','fatGoal'])if(s.settings[k]!=null&&!num(s.settings[k],0,10000))fail('Invalid target.');
  for(const [d,ids] of Object.entries(s.checks))if(!date(d)||!Array.isArray(ids)||ids.length>500||ids.some(x=>!id(x)))fail('Invalid habit day.');
  for(const t of s.tasks)if(!str(t.text,160)||!t.text.trim()||!date(t.date)||typeof t.done!=='boolean'||!['Normal','High','Low'].includes(t.priority)||!Array.isArray(t.steps)||t.steps.length>200||t.steps.some(x=>!obj(x)||!str(x.text,500)||typeof x.done!=='boolean')||(t.category&&!['Personal','Academic','Work','Physical'].includes(t.category))||(t.completedOn&&!date(t.completedOn)))fail('Invalid task.');
  for(const n of s.notes)if(!str(n.title,160)||!str(n.body)||!str(n.updated,40)||!Number.isFinite(Date.parse(n.updated)))fail('Invalid note.');
  for(const e of s.events){if(!str(e.title,160)||!str(e.category,40)||typeof e.remind!=='boolean'||!str(e.start,16)||!str(e.end,16)||!date(e.start.slice(0,10))||!date(e.end.slice(0,10))||!/^\d{4}-\d\d-\d\dT([01]\d|2[0-3]):[0-5]\d$/.test(e.start)||!/^\d{4}-\d\d-\d\dT([01]\d|2[0-3]):[0-5]\d$/.test(e.end)||e.end<=e.start)fail('Invalid event time.')}
  for(const f of [...s.foods,...s.library])foodFields(f);
  for(const f of s.foods)if(!date(f.date)||!['Breakfast','Lunch','Dinner','Snack'].includes(f.meal)||!num(f.amount,.1,10000))fail('Invalid food portion.');
  for(const w of s.water)if(!date(w.date)||!num(w.amount,1,10000))fail('Invalid water entry.');
  for(const w of s.workouts)if(!date(w.date)||!str(w.name,160)||!Number.isInteger(w.sets)||!num(w.sets,1,100)||!Number.isInteger(w.reps)||!num(w.reps,1,1000)||!num(w.weight,0,2000)||(w.notes!==undefined&&!str(w.notes,500))||(w.sessionId&&!id(w.sessionId))||(w.sessionName!==undefined&&!str(w.sessionName,160)))fail('Invalid workout.');
  for(const h of s.habits)if(!str(h.name,100)||!h.name.trim())fail('Invalid habit.');
  for(const x of s.learning)if(!date(x.date)||!str(x.topic,160)||!x.topic.trim()||!Number.isInteger(x.minutes)||!num(x.minutes,1,1440))fail('Invalid learning session.');
  const stepDates=new Set();for(const x of s.stepLogs){if(!date(x.date)||!Number.isInteger(x.count)||!num(x.count,0,100000)||stepDates.has(x.date))fail('Invalid or duplicate step day.');stepDates.add(x.date)}
  function session(x){if(!obj(x)||!id(x.id)||!str(x.name,160)||!Array.isArray(x.exercises)||x.exercises.length>50)fail('Invalid workout session.');const ids=new Set();for(const e of x.exercises){if(!obj(e)||!id(e.id)||ids.has(e.id)||!str(e.name,160)||!e.name.trim()||!Array.isArray(e.rows)||e.rows.length>100)fail('Invalid exercise.');ids.add(e.id);const rows=new Set();for(const r of e.rows){if(!obj(r)||!id(r.id)||rows.has(r.id)||!num(r.weight,0,2000)||!Number.isInteger(r.reps)||!num(r.reps,1,1000)||typeof r.done!=='boolean')fail('Invalid set.');rows.add(r.id)}}}
  for(const r of s.routines)session(r);if(s.activeWorkout){session(s.activeWorkout);if(!date(s.activeWorkout.date)||!num(s.activeWorkout.startedAt,0,1e15))fail('Invalid workout date.')}
  if(s.noteDrafts===undefined)s.noteDrafts={};if(!obj(s.noteDrafts)||Object.keys(s.noteDrafts).length>20000)fail('Invalid note drafts.');for(const [k,n] of Object.entries(s.noteDrafts))if((k!=='new'&&!id(k))||!obj(n)||!str(n.title,160)||!str(n.body))fail('Invalid draft.');
  if(s.profile!==undefined){const p=s.profile;if(!obj(p)||!['Vegetarian','Vegan','Eggetarian','Omnivore'].includes(p.diet)||!['North Indian','South Indian','Mixed Indian'].includes(p.cuisine)||!['Beginner','Regular'].includes(p.experience)||!['Home','Gym'].includes(p.equipment)||!Number.isInteger(p.days)||!num(p.days,2,4)||typeof p.consent!=='boolean'||typeof p.adult!=='boolean'||typeof p.specialCare!=='boolean'||!Array.isArray(p.exclude)||p.exclude.length>12||p.exclude.some(x=>!['Dairy','Egg','Soy','Gluten','Peanut','Tree nut','Sesame'].includes(x)))fail('Invalid planning preferences.')}
  for(const a of s.timedActivities)if(!date(a.date)||!str(a.name,160)||!a.name.trim()||!Number.isInteger(a.seconds)||!num(a.seconds,1,86400)||(a.distanceKm!=null&&!num(a.distanceKm,0,1000))||(a.exerciseId!==undefined&&!str(a.exerciseId,200))||(a.effort!=null&&(!Number.isInteger(a.effort)||!num(a.effort,1,10))))fail('Invalid timed activity.');
  for(const f of s.focusSessions)if(!date(f.date)||!str(f.topic,160)||!str(f.method,50)||!num(f.seconds,60,10800)||!num(f.finishedAt,0,1e15))fail('Invalid focus session.');
  if(s.focusTimer){const t=s.focusTimer;if(!obj(t)||!id(t.id)||!str(t.topic,160)||!str(t.method,50)||!['focus','break'].includes(t.phase)||!['running','paused','review'].includes(t.status)||!num(t.seconds,60,10800)||!num(t.remaining,0,t.seconds)||!num(t.deadline,0,1e15))fail('Invalid focus timer.')}
  if(new TextEncoder().encode(JSON.stringify(s)).length>MAX_BYTES)fail('Records exceed the 900 KB account limit.');
  return s;
 }
 root.MinimalSchema={validateState,date,MAX_BYTES};
 if(typeof module!=='undefined'&&module.exports)module.exports=root.MinimalSchema;
})(globalThis);
