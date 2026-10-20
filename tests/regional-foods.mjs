import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';
const norm=s=>String(s||'').normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const box=vm.createContext({window:{},foodAlias:{},foodMatches:()=>true,norm});
for(const file of ['foods.js','indian-foods.js','food-model.js','indian-ingredients.js'])vm.runInContext(readFileSync(new URL('../public/'+file,import.meta.url),'utf8'),box);
const keys=['kcal','protein','carbs','fat','fiber','sugar','sodium','calcium','iron','potassium','vitc','vitd','b12','vita','magnesium'];
const catalog=box.window.MINIMAL_FOOD_ROWS.map(r=>({id:'usda-'+r[0],name:r[1],unit:'g',nutrients:Object.fromEntries(keys.map((k,i)=>[k,r[3][i]]))})),model=box.window.MinimalFood,index=box.window.MINIMAL_INDIAN_FOODS,ready=model.regionalFoods(index,catalog,box.window.MINIMAL_LABEL_FOODS);
assert.equal(new Set(index.map(x=>x.id)).size,index.length);assert.equal(new Set(index.map(x=>x.name)).size,index.length);assert.ok(ready.length>=190);assert.equal(box.window.MINIMAL_INDIAN_REGIONS.length,36);
for(const region of box.window.MINIMAL_INDIAN_REGIONS)assert.ok(ready.filter(x=>x.regions.includes(region)).length>=8,region);
const source=new Map([...catalog,...box.window.MINIMAL_LABEL_FOODS].map(f=>[f.id,f]));
for(const food of ready){const recipe=food.referenceRecipe;assert.ok(food.estimated);assert.ok(food.nutritionNote.length>15);for(const key of keys.slice(0,4)){const expected=recipe.ingredients.reduce((n,x)=>n+source.get(x.id).nutrients[key]*x.grams/100,0)*100/recipe.yieldG;assert.ok(Math.abs(expected-food.nutrients[key])<1e-9,food.name+' '+key);assert.ok(Number.isFinite(food.nutrients[key])&&food.nutrients[key]>=0)}const [label,grams]=model.portions(food)[0];assert.ok(grams>0&&label);const one=model.calculate(food,1,grams),two=model.calculate(food,2,grams);for(const k of keys.slice(0,4))assert.equal(two.nutrients[k],2*one.nutrients[k])}
// Missing references must never be replaced with a guessed nutrient profile.
assert.equal(model.regionalFoods([{id:'bad',name:'Unknown',states:[],blueprint:{yieldG:500,ingredients:[[99999999,'unknown',100]]}}],catalog).length,0);
assert.equal(model.regionalFoods([{id:'negative',name:'Invalid',states:[],blueprint:{yieldG:100,ingredients:[[2727569,'negative carbohydrate source',100]]}}],catalog).length,0);
// Updating the catalogue does not rewrite historic saved nutrition references.
const old={name:'Earlier idli',nutrients:{kcal:140.123456,protein:4,carbs:24,fat:2},unit:'g',portions:[['1 idli',40]]};const saved=JSON.stringify(old);model.regionalFoods(index,catalog);assert.equal(JSON.stringify(old),saved);
await import('../public/schema.js');
const base=()=>({version:1,tasks:[],notes:[],events:[],foods:[],library:[],water:[],workouts:[],habits:[],checks:{},settings:{name:'',waterGoal:2000}});
for(const f of ready){const s=base();s.foods=[{...JSON.parse(JSON.stringify(f)),date:'2026-10-20',meal:'Lunch',amount:150}];MinimalSchema.validateState(s)}
for(const referenceRecipe of [{yieldG:0,ingredients:[]},{yieldG:100,ingredients:[{id:'unsafe"',name:'test',grams:1}]},{yieldG:100,ingredients:[{id:'usda-1',name:'test',grams:-1}]}]){const s=base();s.library=[{...JSON.parse(JSON.stringify(ready[0])),referenceRecipe}];assert.throws(()=>MinimalSchema.validateState(s),/reference formulation/)}
console.log(`PASS: ${ready.length} source-traceable regional estimates; all 36 regions have at least 8; exact ingredient/yield calculations, portion scaling, missing/negative-reference rejection, historical preservation and schema-safe recipe metadata.`);
