/* Client-side encrypted account snapshots. The passphrase/key is never persisted. */
(function(root){
 'use strict';
 const MAX_BYTES=20000000,MAX_CIPHER=MAX_BYTES+16,ITERATIONS=600000;
 const encoder=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true});
 function context(project,user){if(!/^[a-z]{20}$/.test(project)||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user))throw Error('Invalid account context.');return encoder.encode('minimal-cloud-v1|'+project+'|'+user.toLowerCase())}
 function base64(value){let s='';for(let i=0;i<value.length;i+=16384)s+=String.fromCharCode(...value.subarray(i,i+16384));return btoa(s)}
 function bytes(value,limit){if(typeof value!=='string'||value.length>4*Math.ceil(limit/3)||!/^[A-Za-z0-9+/]+={0,2}$/.test(value)||value.length%4)throw Error('Invalid encrypted data.');let raw;try{raw=atob(value)}catch{throw Error('Invalid encrypted data.')}if(raw.length>limit)throw Error('Encrypted data is too large.');return Uint8Array.from(raw,c=>c.charCodeAt(0))}
 function inspect(box){
  if(!box||Object.keys(box).sort().join(',')!=='ciphertext,format,iterations,iv,kdf,salt,version'||box.format!=='minimal-encrypted-state'||box.version!==1||box.kdf!=='PBKDF2-SHA256'||box.iterations!==ITERATIONS)throw Error('Unsupported encrypted data.');
  const salt=bytes(box.salt,16),iv=bytes(box.iv,12),cipher=bytes(box.ciphertext,MAX_CIPHER);if(salt.length!==16||iv.length!==12||cipher.length<16)throw Error('Invalid encryption parameters.');return {salt,iv,cipher};
 }
 async function key(pass,salt){if(typeof pass!=='string'||pass.length<12||pass.length>1024)throw Error('Use a private passphrase of 12–1,024 characters.');const material=await crypto.subtle.importKey('raw',encoder.encode(pass),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:ITERATIONS,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
 async function encrypt(data,pass,project,user,validate){
  if(typeof validate!=='function')throw Error('A record validator is required.');validate(structuredClone(data));const plain=encoder.encode(JSON.stringify(data));if(plain.length>MAX_BYTES)throw Error('Records exceed the 20 MB cloud snapshot budget.');
  const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),aad=context(project,user);const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad},await key(pass,salt),plain);
  return {format:'minimal-encrypted-state',version:1,kdf:'PBKDF2-SHA256',iterations:ITERATIONS,salt:base64(salt),iv:base64(iv),ciphertext:base64(new Uint8Array(cipher))};
 }
 async function decrypt(box,pass,project,user,validate){
  if(typeof validate!=='function')throw Error('A record validator is required.');const {salt,iv,cipher}=inspect(box),k=await key(pass,salt);let plain;
  try{plain=await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:context(project,user)},k,cipher)}catch{throw Error('The passphrase is incorrect, the account differs or the snapshot is damaged.');}
  if(plain.byteLength>MAX_BYTES)throw Error('Decrypted records are too large.');return validate(JSON.parse(decoder.decode(plain)));
 }
 root.MinimalCloudCrypto={MAX_BYTES,ITERATIONS,inspect,encrypt,decrypt};
})(globalThis);
