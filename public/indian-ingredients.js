/* Indian ingredient names point to named USDA records; product facts retain manufacturer links. */
(()=>{
 Object.assign(foodAlias,{gehun:'wheat',gehu:'wheat',aata:'wheat flour whole grain',bajra:'millet',ragi:'finger millet',nachni:'finger millet',makka:'corn',makai:'corn',chana:'chickpeas',kabuli:'chickpeas',lobia:'cowpeas',chawli:'cowpeas',vatana:'peas',mutter:'peas',batata:'potato',kanda:'onion',lasun:'garlic',lehsun:'garlic',lahsun:'garlic',dhaniya:'coriander',dhania:'coriander',kothimbir:'coriander',pudina:'spearmint',saunf:'fennel',ajwain:'carom',dalchini:'cinnamon',elaichi:'cardamom',laung:'cloves',lavang:'cloves',rai:'mustard',sarson:'mustard',hing:'asafoetida',mirchi:'pepper',mirch:'pepper',imli:'tamarind',shakkar:'sugars',shakarkand:'sweet potato',moongfali:'peanuts',singdana:'peanuts',badam:'almonds',kaju:'cashew',akhrot:'walnuts',kishmish:'raisins',khajoor:'dates',nimbu:'lemon',santra:'oranges',seb:'apples',amrud:'guavas',papita:'papayas',angoor:'grapes','चना':'chickpeas','राजमा':'kidney beans','मूंग':'mung beans','मसूर':'lentils','आटा':'wheat flour whole grain','भिंडी':'okra','घी':'butter oil anhydrous','पनीर':'paneer'});
 const indexedFoods=new WeakMap(),indexedQueries=new Map();
 foodMatches=function(food,query){
  let queryInfo=indexedQueries.get(query);if(!queryInfo){let text=norm(query);if(/\b(moong|mung|urad|toor|arhar|masoor|chana)\b/.test(text))text=text.replace(/\bdal\b/g,'').trim();
  const words=text.split(' ').filter(Boolean);queryInfo={words,expanded:words.flatMap(w=>(foodAlias[w]||w).split(' '))};if(indexedQueries.size>=64)indexedQueries.clear();indexedQueries.set(query,queryInfo)}
  let indexed=indexedFoods.get(food);if(!indexed){const haystack=norm(food.name+' '+(food.aliases||[]).join(' '));indexed={haystack,tokens:haystack.split(' ')};indexedFoods.set(food,indexed)}const {words,expanded}=queryInfo,{haystack,tokens}=indexed;
  // A known Indian name must match a word or its translated ingredient. For
  // example, "atta" must not match "cattail" or "Manhattan" chowder.
  return words.every(w=>foodAlias[w]?tokens.includes(w):haystack.includes(w))||expanded.every(w=>haystack.includes(w));
 };
 window.MINIMAL_LABEL_FOODS=[
  {id:'label-amul-paneer-dudhsagar',name:'Amul Fresh Paneer · Dudhsagar Dairy',aliases:['paneer','पनीर'],unit:'g',source:'Manufacturer nutrition table · checked 18 Oct 2026 · match your pack',sourceUrl:'https://dudhsagardairy.coop/dairy/products/amul-fresh-paneer/',nutrients:{kcal:312,protein:20,carbs:4,fat:24,sugar:0,sodium:24,calcium:480},portions:[['100 g paneer',100]],labelSource:true},
  {id:'label-amul-taaza-dudhsagar',name:'Amul Taaza toned milk · Dudhsagar Dairy',aliases:['doodh','दूध','milk'],unit:'ml',source:'Manufacturer nutrition table · checked 18 Oct 2026 · match your pack',sourceUrl:'https://dudhsagardairy.coop/dairy/products/amul-taaza/',nutrients:{kcal:58,protein:3,carbs:4.7,fat:3,sugar:4.7,sodium:40,calcium:110},portions:[['1 glass',200],['1 small pack',160]],labelSource:true}
 ];
})();
