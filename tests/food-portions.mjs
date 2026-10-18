import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const box=vm.createContext({window:{},console,Map,Object,Number,Error});
for(const file of ['foods.js','indian-foods.js','food-model.js'])vm.runInContext(readFileSync(new URL('../public/'+file,import.meta.url),'utf8'),box);
const keys=['kcal','protein','carbs','fat','fiber','sugar','sodium','calcium','iron','potassium','vitc','vitd','b12','vita','magnesium'];
const catalog=box.window.MINIMAL_FOOD_ROWS.map(r=>({id:'usda-'+r[0],name:r[1],unit:'g',portions:r[4],source:'USDA',nutrients:Object.fromEntries(keys.map((key,i)=>[key,r[3][i]]))}));
const model=box.window.MinimalFood,banana=catalog.find(f=>f.id==='usda-173944'),egg=catalog.find(f=>f.id==='usda-173424'),rice=catalog.find(f=>f.id==='usda-168878');
const serving=model.portions(banana)[0];assert.match(serving[0],/medium/);assert.equal(serving[1],118);
const one=model.calculate(banana,1,118),two=model.calculate(banana,2,118),half=model.calculate(banana,.5,118);assert.equal(one.nutrients.kcal,105.02);for(const k of keys){assert.equal(two.nutrients[k],one.nutrients[k]*2);assert.equal(half.nutrients[k],one.nutrients[k]/2)}
assert.match(model.portions(egg)[0][0],/large/);assert.equal(model.portions(egg)[0][1],50);assert.equal(model.calculate(egg,1,50).nutrients.kcal,77.5);
assert.equal(model.calculate(rice,150,1).nutrients.kcal,195);assert.equal(model.calculate(rice,150,1).nutrients.protein,4.035);
const unknown={...banana,nutrients:{kcal:0,protein:null,carbs:10,fat:0}};assert.equal(model.calculate(unknown,2,100).nutrients.kcal,0);assert.equal(model.calculate(unknown,2,100).nutrients.protein,null);
for(const n of [0,-1,Infinity,NaN])assert.throws(()=>model.calculate(banana,n,100));assert.throws(()=>model.calculate(banana,10001,1));assert.throws(()=>model.calculate(banana,1,undefined));
const dishes=model.regionalFoods(box.window.MINIMAL_INDIAN_FOODS,catalog);assert.ok(dishes.length>45);for(const f of dishes){assert.ok(keys.slice(0,4).every(k=>Number.isFinite(f.nutrients[k])));assert.equal(f.estimated,true);assert.equal(model.calculate(f,2,model.portions(f)[0][1]).nutrients.kcal,model.calculate(f,1,model.portions(f)[0][1]).nutrients.kcal*2)}
const idli=dishes.find(f=>f.name==='Idli');assert.ok(idli);assert.equal(idli.portions[0][1],40);
assert.equal(model.regionalFoods([{name:'Missing',id:'missing',blueprint:{yieldG:200,ingredients:[[999999999,'missing',100]]}}],catalog).length,0);
const themeScript=readFileSync(new URL('../public/theme-init.js',import.meta.url),'utf8');for(const saved of [null,'dark','light','unexpected']){const root={dataset:{},style:{}};vm.runInNewContext(themeScript,{document:{documentElement:root},localStorage:{getItem:k=>k==='minimal.appearance.v1'?saved:null}});assert.equal(root.dataset.theme,saved==='light'?'light':'dark')}
console.log(`PASS: standard banana/egg portions, exact doubling/halving, grams, zero versus unknown, amount bounds, ${dishes.length} ready-to-log Indian estimates with complete macros, unresolved foods excluded, dark default and explicit-light persistence.`);
// Use the actual ingredient alias layer to verify common multi-word Indian searches.
const library=readFileSync(new URL('../public/libraries.js',import.meta.url),'utf8');
vm.runInContext(`const CATALOG=[];const state={library:[]};function quickAdd(){};function foodPicker(){};function addExercise(){};function trainingView(){};function nutritionView(){};const document={addEventListener(){}};`+library,box);
vm.runInContext(readFileSync(new URL('../public/indian-ingredients.js',import.meta.url),'utf8'),box);
box.testCatalog=catalog;
for(const [query,expected] of [['toor dal','pigeon peas'],['moong dal','mung beans'],['urad dal','mungo beans'],['atta','wheat flour'],['dhaniya','coriander'],['bhindi','okra']])assert.ok(vm.runInContext(`testCatalog.some(f=>foodMatches(f,${JSON.stringify(query)})&&f.name.toLowerCase().includes(${JSON.stringify(expected)}))`,box),query);
const products=box.window.MINIMAL_LABEL_FOODS;assert.equal(products.length,2);assert.ok(products.every(f=>f.sourceUrl.startsWith('https://dudhsagardairy.coop/')));assert.equal(model.calculate(products.find(f=>f.unit==='ml'),1,200).nutrients.kcal,116);assert.equal(model.calculate(products.find(f=>f.unit==='g'),.5,100).nutrients.protein,10);
console.log('PASS: common Indian ingredients and dal phrases resolve to named references; product-specific manufacturer records preserve grams/ml and scale accurately.');
for(const name of ['Cattail, Narrow Leaf Shoots','Soup, Manhattan clam chowder'])assert.equal(vm.runInContext(`foodMatches({name:${JSON.stringify(name)}},'atta')`,box),false);
console.log('PASS: ingredient aliases do not produce unrelated substring matches.');
