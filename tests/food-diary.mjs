import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const today='2026-11-04',listeners=[],box={window:{},structuredClone,Set,Map};
vm.runInNewContext(await readFile(new URL('../public/food-model.js',import.meta.url),'utf8'),box);
const base={id:'source-rice',name:'Rice <example>',unit:'g',source:'Synthetic reference',portions:[['1 bowl',150]],nutrients:{kcal:130,protein:2.7,carbs:28,fat:.3}};
box.window.MinimalPackagedFoods={fromCatalog:()=>[]};
Object.assign(box,{
 CATALOG:[base],REGIONAL:[],tourSteps:[],state:{foods:[{...structuredClone(base),id:'first',date:today,meal:'Lunch',amount:150},{...structuredClone(base),id:'second',date:today,meal:'Dinner',amount:100},{...structuredClone(base),id:'other-day',date:'2026-11-03',meal:'Lunch',amount:80}],library:[]},day:today,
 document:{addEventListener:(name,fn)=>{if(name==='click')listeners.push(fn)}},
 esc:v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'),
 fmt:(n,d=0)=>Number(n).toFixed(d),norm:s=>s.toLowerCase(),foodMatches:()=>true,
 foods:()=>box.state.foods.filter(f=>f.date===box.day),
 totals:rows=>Object.fromEntries(['kcal','protein','carbs','fat'].map(k=>[k,{value:rows.reduce((sum,f)=>sum+(f.nutrients[k]==null?0:f.nutrients[k]*f.amount/100),0),known:rows.filter(f=>f.nutrients[k]!=null).length,total:rows.length}])),
 header:()=>'',card:(title,body)=>title+body,button:(label,action,id='')=>`<button data-action="${action}" data-id="${id}">${label}</button>`,nutrientCards:()=>'',waterCard:()=>'',dateLabel:d=>d,dayKey:()=>today,defaultMeal:()=>'Snack',notify:()=>{},
 render:()=>{if(box.nutritionView)box.output=box.nutritionView()},
 commit:fn=>{if(box.failSave)return false;const next=structuredClone(box.state);fn(next);box.state=next;return true;}
});
vm.runInNewContext(await readFile(new URL('../public/simple-food.js',import.meta.url),'utf8'),box);
function click(action,id,meal){listeners[0]({target:{closest:()=>({dataset:{simpleFood:action,id,meal}})}})}
assert.ok(box.output.includes('Add food to breakfast'));assert.ok(box.output.includes('Add food to snack'));assert.ok(box.output.includes('Edit portion'));assert.ok(box.output.includes('Rice &lt;example&gt;'));assert.ok(!box.output.includes('Rice <example>'));
const before=JSON.stringify(box.state);box.failSave=true;click('remove-entry','first');assert.equal(JSON.stringify(box.state),before);assert.ok(!box.output.includes('data-simple-food="undo-remove"'));box.failSave=false;
click('remove-entry','other-day');assert.equal(JSON.stringify(box.state),before);
click('remove-entry','first');assert.equal(box.state.foods.length,2);assert.equal(box.state.foods[0].id,'second');assert.ok(box.output.includes('data-simple-food="undo-remove"'));assert.ok(box.output.includes('Remove'));
click('undo-remove');assert.equal(JSON.stringify(box.state),before);assert.ok(!box.output.includes('data-simple-food="undo-remove"'));click('undo-remove');assert.equal(JSON.stringify(box.state),before);
click('remove-entry','first');box.commit(s=>{s.tasks=[]});click('undo-remove');assert.equal(box.state.foods.length,2,'A later save must invalidate removal undo');assert.ok(!box.output.includes('data-simple-food="undo-remove"'));
click('remove-entry','second');assert.equal(box.state.foods.length,1);click('undo-remove');assert.equal(box.state.foods[0].id,'second');assert.equal(box.state.foods.length,2);
click('remove-entry','second');box.failSave=true;click('undo-remove');assert.equal(box.state.foods.length,1);box.failSave=false;click('undo-remove');assert.equal(box.state.foods.length,2,'Failed undo remains available for retry');
console.log('PASS: four meal add controls, escaped food labels, date-scoped removal, unchanged records on save failure, exact single-use undo, stale undo invalidation and failed-restore retry.');
let form,controls;
box.formDialog=(title,fields,onSave)=>{
 form={title,fields,onSave};
 controls={'#simple-serving':{value:fields.includes('<option value="weight" selected>')?'weight':'0'},'#simple-quantity':{value:fields.match(/id="simple-quantity"[^>]*value="([^"]+)"/)[1]},'#simple-portion-preview':{},'#portion-less':{},'#portion-more':{},'#quantity-label':{},'#editor button[type="submit"]':{}};
};
box.$=selector=>controls[selector];box.select=()=>'';box.field=()=>'';
box.portion(base,{...base,amount:100,date:today,meal:'Lunch'});
assert.equal(controls['#simple-serving'].value,'weight');assert.equal(controls['#simple-quantity'].value,'100');assert.match(controls['#simple-portion-preview'].innerHTML,/100(?:\.0)? g/);assert.match(form.title,/Edit Rice/);
box.portion(base,{...base,amount:75,date:today,meal:'Lunch'});
assert.equal(controls['#simple-serving'].value,'0');assert.equal(controls['#simple-quantity'].value,'0.5');
console.log('PASS: weighed historical entries open in grams, familiar half portions remain readable, and opening an editor preserves the original amount.');
