/* Small, traceable product-fact collection; USDA entries retain their FDC links.
   Manufacturer facts checked 18 October 2026. See DATA-LICENSES.md. */
(()=>{
 const make=(id,name,category,url,basis,nutrients,portions,market,note='')=>({id,name,unit:'g',packaged:true,category,labelSource:true,market,nutritionNote:note,source:'Published product nutrition · checked 18 Oct 2026 · match your pack',sourceUrl:url,nutrients:Object.fromEntries(Object.entries(nutrients).map(([k,v])=>[k,v*100/basis])),portions});
 const maggi='https://www.maggi.in/en/product/';
 const haldiram='https://international.haldiram.com/namkeen-and-savories/namkeens';
 const products=[
 make('label-maggi-masala','MAGGI 2-Minute Masala noodles · India','Ready meals',maggi+'maggi-2-minute-noodles-masala/',100,{kcal:384,protein:8.2,carbs:59.6,fat:12.5,sugar:1.8,sodium:1000,iron:6.9},[['1 manufacturer serving · dry noodles + seasoning',75]],'India','Use the dry product weight, before adding water. Added oil, vegetables or other ingredients are separate foods.'),
 make('label-maggi-special-masala','MAGGI Special Masala noodles · India','Ready meals',maggi+'maggi-2-minute-special-masala-instant-noodles/',100,{kcal:409,protein:9.6,carbs:60.3,fat:14.4,sugar:2.3,fiber:2.3,sodium:1072,iron:3.7},[['1 manufacturer serving · dry noodles + seasoning',70]],'India','Use the dry product weight, before adding water. Added ingredients are separate foods.'),
 make('label-haldiram-bhujia-masala-export','Haldiram Bhujia Masala · international label','Chips & namkeen',haldiram,35,{kcal:200,protein:7,carbs:11,fat:14,fiber:2,sodium:200},[['1 manufacturer serving',35]],'International'),
 make('label-haldiram-bhujia-plain-export','Haldiram Bhujia Plain · international label','Chips & namkeen',haldiram,35,{kcal:200,protein:7,carbs:11,fat:14,fiber:2,sodium:200},[['1 manufacturer serving',35]],'International'),
 make('label-haldiram-aloo-bhujia-export','Haldiram Aloo Bhujia · international label','Chips & namkeen',haldiram,35,{kcal:230,protein:2,carbs:14,fat:18,fiber:7,sodium:230},[['1 manufacturer serving',35]],'International'),
 make('label-haldiram-khatta-meetha-export','Haldiram Khatta Meetha · international label','Chips & namkeen',haldiram,35,{kcal:200,protein:4,carbs:14,fat:14,fiber:2,sugar:3,sodium:130},[['1 manufacturer serving',35]],'International'),
 make('label-haldiram-navrattan-export','Haldiram Navrattan · international label','Chips & namkeen',haldiram,35,{kcal:180,protein:7,carbs:14,fat:11,fiber:2,sodium:180},[['1 manufacturer serving',35]],'International'),
 make('label-cadbury-dairy-milk-uk-110','Cadbury Dairy Milk · UK 110 g recipe','Chocolate','https://www.cadburygiftsdirect.co.uk/cadbury-dairy-milk-110g.html',100,{kcal:2232/4.184,protein:7.3,carbs:57,fat:30,sugar:56,fiber:2.1},[['1 quarter bar',27.5],['1 whole 110 g bar',110]],'UK','Energy converted from the manufacturer’s 2232 kJ per 100 g. This UK product is not the Indian Dairy Milk recipe.')
 ];
 const ids=[167587,167992,169589,169677,167962,169682,167959,170246,167551,168014,172716,167542,167952,171177,171614,171615,171176,174289,170362,170758,170759];
 const category=f=>/^Candies,/i.test(f.name)?'Chocolate':/chips|popcorn/i.test(f.name)?'Chips & namkeen':/cookies|crackers|granola/i.test(f.name)?'Biscuits & bars':'Ready meals';
 const branded=/\bMARS\b|SNICKERS|KIT KAT|HERSHEY|DIGIORNO|CAMPBELL|M&M|REESE|NESTLE|KRACKEL|MR\. GOODBAR/i;
 const simpleName=f=>f.name.replace(/^Candies, (?:MARS SNACKFOOD US, |HERSHEY, )?/,'').replace(/^Snacks, /,'').replace(/^Soup, /,'');
 const makeReference=f=>({...f,name:simpleName(f)+(branded.test(f.name)?' · US reference':''),packaged:true,category:category(f),market:branded.test(f.name)?'US reference':'Generic reference',nutritionNote:'USDA reference food. Choose the matching preparation; branded products and recipes can differ. Reference serving weights are stated explicitly.'});
 window.MinimalPackagedFoods={products,fromCatalog(catalog){const selected=new Map();for(const id of ids){const f=catalog.find(f=>f.id==='usda-'+id);if(f)selected.set(f.id,f)}for(const f of catalog){if(selected.size>=65)break;if(/^Candies,/.test(f.name)&&/chocolate|SNICKERS|KIT KAT|M&M/i.test(f.name))selected.set(f.id,f)}return [...products,...[...selected.values()].filter(f=>['kcal','protein','carbs','fat'].every(k=>Number.isFinite(f.nutrients[k]))).map(makeReference)]}};
})();
