/* Bounded active records and non-destructive food/water archival. */
(function(root){
 'use strict';
 const MAX_ARCHIVES=10;
 const bytes=x=>new TextEncoder().encode(JSON.stringify(x)).length;
 function usage(s){const used=bytes(s),limit=root.MinimalSchema.MAX_BYTES;return {used,limit,ratio:used/limit,level:used>=limit?'full':used>=limit*.85?'high':used>=limit*.7?'notice':'normal'}}
 function split(s,cutoff,today){
  if(!root.MinimalSchema.date(cutoff)||!root.MinimalSchema.date(today)||cutoff>today.slice(0,7)+'-01')throw Error('Choose a date before the current month.');
  const active=structuredClone(s),archive={version:1,foods:[],water:[]};
  for(const k of ['foods','water']){archive[k]=active[k].filter(x=>x.date<cutoff);active[k]=active[k].filter(x=>x.date>=cutoff)}
  const count=archive.foods.length+archive.water.length;
  return {active,archive,count,bytes:bytes(archive),freed:bytes(s)-bytes(active)};
 }
 root.MinimalStorage={bytes,usage,split,MAX_ARCHIVES};
})(globalThis);
