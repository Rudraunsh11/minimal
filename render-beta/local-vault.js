/* Optional local encryption. Keys stay in memory; no network or persistent secrets. */
(function(root){
 'use strict';
 const MAX=20000000,ITER=600000,enc=new TextEncoder(),dec=new TextDecoder('utf-8',{fatal:true});
 const profiles=new Set(['minimal.life.v1','minimal.practice.v1']);
 const random=n=>crypto.getRandomValues(new Uint8Array(n));
 const b64=b=>{let s='';for(let i=0;i<b.length;i+=16384)s+=String.fromCharCode(...b.subarray(i,i+16384));return btoa(s)};
 function un64(s,max){if(typeof s!=='string'||s.length>4*Math.ceil(max/3)||s.length%4||!/^[A-Za-z0-9+/]+={0,2}$/.test(s))throw Error('Invalid encrypted file.');const b=Uint8Array.from(atob(s),x=>x.charCodeAt(0));if(b.length>max)throw Error('Encrypted file is too large.');return b}
 function exact(o,keys){if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).sort().join(',')!==keys.split(',').sort().join(','))throw Error('Unsupported encrypted file.');}
 function packet(p,max){exact(p,'iv,ciphertext');const iv=un64(p.iv,12),cipher=un64(p.ciphertext,max);if(iv.length!==12||cipher.length<16)throw Error('Invalid encryption parameters.');return {iv,cipher}}
 function inspect(box){
  exact(box,'format,version,id,profile,iterations,pass,recovery,payload');
  if(box.format!=='minimal-local-vault'||box.version!==1||box.iterations!==ITER||!profiles.has(box.profile)||typeof box.id!=='string'||!/^[0-9a-f]{32}$/.test(box.id))throw Error('Unsupported encrypted file.');
  for(const wrap of [box.pass,box.recovery]){exact(wrap,'salt,iv,ciphertext');if(un64(wrap.salt,16).length!==16)throw Error('Invalid encryption salt.');packet({iv:wrap.iv,ciphertext:wrap.ciphertext},48);if(un64(wrap.ciphertext,48).length!==48)throw Error('Invalid wrapped key.');}
  packet(box.payload,MAX+16);return box;
 }
 const aad=(box,purpose)=>enc.encode('minimal-local-vault-v1|'+box.id+'|'+box.profile+'|'+purpose);
 async function passwordKey(secret,salt){if(typeof secret!=='string'||secret.length<12||secret.length>1024)throw Error('Use a passphrase of 12–1,024 characters.');const material=await crypto.subtle.importKey('raw',enc.encode(secret),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:ITER,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
 async function encryptBytes(bytes,key,context){const iv=random(12);const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:context},key,bytes);return {iv:b64(iv),ciphertext:b64(new Uint8Array(cipher))}}
 async function decryptBytes(p,key,context,max){const {iv,cipher}=packet(p,max);try{return new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:context},key,cipher))}catch{throw Error('Incorrect passphrase/recovery key or damaged encrypted data.')}}
 const recoverySecret=s=>{s=String(s||'').replace(/[\s-]/g,'').toLowerCase();if(!/^[0-9a-f]{64}$/.test(s))throw Error('Enter the complete recovery key.');return s};
 const recoveryCode=()=>Array.from(random(32),b=>b.toString(16).padStart(2,'0')).join('').match(/.{8}/g).join('-');
 function session(template,key,validate){
  let active=key;
  return {profile:template.profile,
   async seal(data){if(!active)throw Error('Your private storage is locked.');validate(structuredClone(data));const bytes=enc.encode(JSON.stringify(data));if(bytes.length>MAX)throw Error('Records exceed the 20 MB budget.');return {...structuredClone(template),payload:await encryptBytes(bytes,active,aad(template,'records'))}},
   async open(box){if(!active)throw Error('Your private storage is locked.');inspect(box);if(box.id!==template.id||box.profile!==template.profile)throw Error('Encrypted records belong to a different private storage setup.');const bytes=await decryptBytes(box.payload,active,aad(box,'records'),MAX+16);if(bytes.length>MAX)throw Error('Decrypted records are too large.');return validate(JSON.parse(dec.decode(bytes)))},
   lock(){active=null}
  };
 }
 async function create(profile,passphrase,recovery,validate){
  if(!profiles.has(profile)||typeof validate!=='function')throw Error('Invalid private storage context.');
  const code=recoverySecret(recovery),raw=random(32),box={format:'minimal-local-vault',version:1,id:Array.from(random(16),b=>b.toString(16).padStart(2,'0')).join(''),profile,iterations:ITER};
  try{for(const [purpose,secret] of [['pass',passphrase],['recovery',code]]){const salt=random(16),wrapped=await encryptBytes(raw,await passwordKey(secret,salt),aad(box,purpose));box[purpose]={salt:b64(salt),...wrapped}}const key=await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt','decrypt']);return session(box,key,validate)}finally{raw.fill(0)}
 }
 async function unlock(box,secret,method,validate){
  inspect(box);if(!['pass','recovery'].includes(method)||typeof validate!=='function')throw Error('Invalid unlock method.');
  const wrap=box[method],password=method==='recovery'?recoverySecret(secret):secret;
  const raw=await decryptBytes({iv:wrap.iv,ciphertext:wrap.ciphertext},await passwordKey(password,un64(wrap.salt,16)),aad(box,method),48);
  try{const key=await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt','decrypt']);const s=session(box,key,validate);await s.open(box);return s}finally{raw.fill(0)}
 }
 function isSealed(data){return !!data&&data.format==='minimal-local-vault'}
 function adapter(raw,key,validate){
  let current=null,protectedMode=false;
  async function decode(row){if(!row)return row;if(isSealed(row.data)){protectedMode=true;if(!current)throw Error('Private storage is locked.');return {...row,data:await current.open(row.data),previous:row.previous?await current.open(row.previous):null}}if(protectedMode&&!row.deleted)throw Error('Private storage unexpectedly changed. Reload before continuing.');return row}
  return {raw,read:async k=>decode(await raw.read(k)),
   async write(k,data,expected,options={}){if(k!==key)throw Error('Wrong storage profile.');const before=await raw.read(k);if(before&&isSealed(before.data)&&!current)throw Error('Private storage is locked.');if(protectedMode&&!isSealed(before?.data)&&!before?.deleted)throw Error('Private storage unexpectedly changed.');const payload=current?await current.seal(data):data;return decode(await raw.write(k,payload,expected,options))},
   clear:keys=>raw.clear(keys),close:()=>{current?.lock();current=null;raw.close()},
   isProtected:()=>protectedMode,
   async unlock(secret,method='pass'){const row=await raw.read(key);if(!isSealed(row?.data))throw Error('No protected records found.');if(row.data.profile!==key)throw Error('Wrong storage profile.');const next=await unlock(row.data,secret,method,validate);current?.lock();current=next;protectedMode=true;return decode(row)},
   async enable(data,expected,pass,recovery){if(current||protectedMode)throw Error('Private storage is already enabled.');const old=await raw.read(key);if(old?.revision!==expected||old.deleted||isSealed(old.data))throw Error('Records changed. Reload before enabling private storage.');const next=await create(key,pass,recovery,validate);try{const payload=await next.seal(data),previous=old.previous?await next.seal(old.previous):null;const row=await raw.write(key,payload,expected,{previousData:previous});const check=await raw.read(key);if(check?.revision!==row.revision)throw Error('Records changed during encryption. Reopen private storage.');await next.open(check.data);current=next;protectedMode=true;return decode(check)}catch(e){next.lock();throw e}},
   async sealBackup(data){if(!current)throw Error('Private storage is locked.');return current.seal(data)},
   async encryptedBackup(){const row=await raw.read(key);if(!isSealed(row?.data))throw Error('Enable private storage first.');return structuredClone(row.data)},
   lock(){current?.lock();current=null}
  };
 }
 root.MinimalLocalVault={create,unlock,inspect,isSealed,recoveryCode,adapter,MAX,ITER};
})(globalThis);
