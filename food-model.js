/* Portion calculations use unrounded per-100 g/ml source values. */
(()=>{
 const KEYS=['kcal','protein','carbs','fat','fiber','sugar','sodium','calcium','iron','potassium','vitc','vitd','b12','vita','magnesium'];
 const presets={Idli:['1 idli',40],Dosa:['1 plain dosa',100],Roti:['1 roti',40],Rotli:['1 rotli',40],Thepla:['1 thepla',50],'Moong chilla':['1 chilla',80],Pesarattu:['1 pesarattu',100],'Aloo paratha':['1 paratha',100],'Vegetable momos':['1 momo',35],'Medu vada':['1 vada',50],Litti:['1 litti',70],Uttapam:['1 uttapam',120],'Jowar bhakri':['1 bhakri',70],'Jolada rotti':['1 rotti',70],'Jonna rotte':['1 rotte',70],'Makki di roti':['1 roti',70]};
 function portions(food){
  const rows=(food.portions||[]).filter(p=>Array.isArray(p)&&typeof p[0]==='string'&&Number.isFinite(p[1])&&p[1]>=.1&&p[1]<=10000).map(p=>[p[0],p[1]]);
  // Prefer a familiar whole serving over an ounce or a spoon when the source supplies one.
  const score=label=>/medium/i.test(label)&&!/extra/.test(label)?0:/large/i.test(label)&&!/extra/.test(label)?1:/^1 (?:piece|slice|egg)|^slice\b/i.test(label)?2:/^1 cup|^cup\b/i.test(label)?3:4;
  const snackScore=label=>/\bbar\b/i.test(label)&&!/miniature|snack size/i.test(label)?0:/package|serving|cookie/i.test(label)?1:/piece|miniature/i.test(label)?2:/\boz\b/i.test(label)?3:4;
  if(!food.labelSource)rows.sort((a,b)=>(food.packaged?snackScore(a[0])-snackScore(b[0]):score(a[0])-score(b[0])));
  if(!rows.length)rows.push(['100 '+food.unit,100]);
  return rows;
 }
 function calculate(food,quantity,basis){
  if(!Number.isFinite(quantity)||quantity<=0||!Number.isFinite(basis)||basis<=0)throw Error('Choose a quantity greater than zero.');
  const amount=quantity*basis;if(!Number.isFinite(amount)||amount<.1||amount>10000)throw Error('Choose a portion between 0.1 and 10,000 '+food.unit+'.');
  return {amount,nutrients:Object.fromEntries(KEYS.map(k=>[k,Number.isFinite(food.nutrients[k])?food.nutrients[k]*amount/100:null]))};
 }
 function regionalFoods(index,catalog){
  const source=new Map(catalog.map(f=>[f.id,f]));
  return index.flatMap(d=>{
   const b=d.blueprint;if(!b||!Number.isFinite(b.yieldG)||b.yieldG<=0)return [];
   // The Foundation sunflower-oil record has no nutrition values. These fixed
   // example profiles explicitly use the complete SR Legacy linoleic sunflower oil.
   const ingredients=b.ingredients.map(([id,,amount])=>({food:source.get('usda-'+(id===1750349?171025:id)),amount}));
   if(!ingredients.length||ingredients.some(x=>!x.food||!Number.isFinite(x.amount)||x.amount<=0))return [];
   const nutrients=Object.fromEntries(KEYS.map(k=>[k,ingredients.every(x=>Number.isFinite(x.food.nutrients[k]))?ingredients.reduce((sum,x)=>sum+x.food.nutrients[k]*x.amount/100,0)*100/b.yieldG:null]));
   if(KEYS.slice(0,4).some(k=>nutrients[k]===null))return [];
   const serving=presets[d.name]||[/rice|pulao|biryani|khichdi|poha|pongal|puttu/i.test(d.name)?'1 bowl':'1 serving',/rice|pulao|biryani|khichdi|poha|pongal|puttu/i.test(d.name)?200:150];
   return [{id:'dish-'+d.id,name:d.name,unit:'g',source:'Minimal Indian dish estimate · USDA ingredients',sourceUrl:'https://fdc.nal.usda.gov/',nutrients,portions:[serving],aliases:d.aliases||[],regions:d.states,estimated:true}];
  });
 }
 window.MinimalFood={portions,calculate,regionalFoods};
})();
