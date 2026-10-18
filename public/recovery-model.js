/* Versioned, bounded full-account recovery packages. No network or credentials. */
(function(root){
 'use strict';
 const MAX_BYTES=11000000,MAX_FILE_BYTES=16000000,ITERATIONS=210000;
 const bytes=x=>new TextEncoder().encode(JSON.stringify(x)).length;
 function validate(bundle){
  if(!bundle||bundle.kind!=='minimal-account-backup'||bundle.version!==1||typeof bundle.createdAt!=='string'||!Number.isFinite(Date.parse(bundle.createdAt))||!Array.isArray(bundle.archives)||bundle.archives.length>10||bytes(bundle)>MAX_BYTES)throw Error('Invalid or oversized account backup.');
  root.MinimalSchema.validateState(bundle.active);
  const ids=new Set();for(const a of bundle.archives){if(!a||typeof a.id!=='string'||!/^[a-f0-9-]{36}$/.test(a.id)||ids.has(a.id)||!root.MinimalSchema.date(a.cutoff)||!Number.isSafeInteger(a.createdAt)||a.createdAt<0||!a.data||a.data.version!==1||!Array.isArray(a.data.foods)||!Array.isArray(a.data.water)||Object.keys(a.data).some(k=>!['version','foods','water'].includes(k)))throw Error('Invalid archive in backup.');ids.add(a.id);root.MinimalSchema.validateState({version:1,tasks:[],notes:[],events:[],foods:a.data.foods,library:[],water:a.data.water,workouts:[],habits:[],checks:{},settings:{name:'',waterGoal:2000}});if([...a.data.foods,...a.data.water].some(x=>x.date>=a.cutoff))throw Error('Archive contains entries outside its cutoff.');}
  return bundle;
 }
 const b64=data=>{let s='';for(let i=0;i<data.length;i+=16384)s+=String.fromCharCode(...data.subarray(i,i+16384));return btoa(s)};
 function un64(s,max){if(typeof s!=='string'||s.length>4*Math.ceil(max/3)||!/^[A-Za-z0-9+/]*={0,2}$/.test(s))throw Error('Invalid encrypted backup.');let raw;try{raw=atob(s)}catch{throw Error('Invalid encrypted backup.')}if(raw.length>max)throw Error('Backup is too large.');return Uint8Array.from(raw,c=>c.charCodeAt(0))}
 async function key(pass,salt){if(typeof pass!=='string'||pass.length<12||pass.length>1024)throw Error('Use a passphrase of 12–1,024 characters.');const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(pass),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:ITERATIONS,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
 async function encrypt(bundle,pass){validate(bundle);const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(pass,salt),new TextEncoder().encode(JSON.stringify(bundle)));return {kind:'minimal-encrypted-backup',version:1,kdf:'PBKDF2-SHA256',iterations:ITERATIONS,salt:b64(salt),iv:b64(iv),ciphertext:b64(new Uint8Array(cipher))}}
 async function decrypt(box,pass){if(!box||box.kind!=='minimal-encrypted-backup'||box.version!==1||box.kdf!=='PBKDF2-SHA256'||box.iterations!==ITERATIONS)throw Error('Unsupported encrypted backup.');const salt=un64(box.salt,16),iv=un64(box.iv,12);if(salt.length!==16||iv.length!==12)throw Error('Invalid encrypted backup.');const cipher=un64(box.ciphertext,MAX_BYTES+16);let plain;try{plain=await crypto.subtle.decrypt({name:'AES-GCM',iv},await key(pass,salt),cipher)}catch{throw Error('The passphrase is incorrect or the backup was damaged.')}return validate(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(plain)))}
 root.MinimalRecovery={MAX_BYTES,MAX_FILE_BYTES,validate,encrypt,decrypt};
})(globalThis);
