import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const b=vm.createContext({window:{},console,Map,Set,Object,Number,TextEncoder,URL});
for(const file of ['foods.js','food-model.js','packaged-foods.js','schema.js'])vm.runInContext(fs.readFileSync(new URL('../public/'+file,import.meta.url),'utf8'),b);
const keys=['kcal','protein','carbs','fat','fiber','sugar','sodium','calcium','iron','potassium','vitc','vitd','b12','vita','magnesium'];const catalog=b.window.MINIMAL_FOOD_ROWS.map(r=>({id:'usda-'+r[0],name:r[1],unit:'g',source:'USDA',sourceUrl:'https://fdc.nal.usda.gov/food-details/'+r[0]+'/nutrients',portions:r[4],nutrients:Object.fromEntries(keys.map((k,i)=>[k,r[3][i]]))}));
const foods=b.window.MinimalPackagedFoods.fromCatalog(catalog),model=b.window.MinimalFood;
assert.ok(foods.length>=50);assert.equal(new Set(foods.map(f=>f.id)).size,foods.length);
for(const f of foods){assert.ok(keys.slice(0,4).every(k=>Number.isFinite(f.nutrients[k])&&f.nutrients[k]>=0),f.name);assert.ok(f.sourceUrl.startsWith('https://'));assert.ok(model.portions(f).length);const p=model.portions(f)[0],one=model.calculate(f,1,p[1]),two=model.calculate(f,2,p[1]);for(const k of keys.slice(0,4))assert.equal(two.nutrients[k],2*one.nutrients[k]);const state={version:1,tasks:[],notes:[],events:[],foods:[{...f,id:'test-food',amount:p[1],meal:'Snack',date:'2026-10-18'}],library:[],water:[],workouts:[],habits:[],checks:{},settings:{name:'',waterGoal:2000}};b.MinimalSchema.validateState(state)}
const maggi=foods.find(f=>f.id==='label-maggi-masala');assert.equal(model.calculate(maggi,1,75).nutrients.kcal,288);assert.equal(model.calculate(maggi,1,75).nutrients.carbs,44.7);assert.match(maggi.nutritionNote,/dry/);
const bhujia=foods.find(f=>f.id==='label-haldiram-aloo-bhujia-export');assert.ok(Math.abs(model.calculate(bhujia,1,35).nutrients.kcal-230)<1e-10);assert.equal(bhujia.market,'International');assert.match(bhujia.name,/international/);
const cadbury=foods.find(f=>f.id==='label-cadbury-dairy-milk-uk-110');assert.equal(cadbury.nutrients.kcal,2232/4.184);assert.match(cadbury.name,/UK/);
assert.ok(foods.some(f=>f.name.includes('SNICKERS')&&f.name.includes('US reference')));
assert.equal(new Set(foods.map(f=>f.category)).size,4);
console.log(`PASS: ${foods.length} unique packaged/reference foods, four categories, complete macros, source links, schema-valid records, portion doubling, dry MAGGI basis, 35 g serving normalization, kJ conversion and market labels.`);
