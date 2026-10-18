import '../public/schema.js';
import {archiveApi} from './archive-api.mjs';
const schema=globalThis.MinimalSchema;
const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff',...extra}});
class BodyError extends Error{constructor(status){super('Invalid body');this.status=status}}
async function readBounded(request,max){
 const declared=request.headers.get('content-length');if(declared!==null&&(!/^\d+$/.test(declared)||Number(declared)>max))throw new BodyError(413);
 const reader=request.body?.getReader();if(!reader)throw new BodyError(400);
 let timer;const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{reject(new BodyError(408));reader.cancel().catch(()=>{})},10000)});
 const read=async()=>{const parts=[];let size=0;for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){reader.cancel().catch(()=>{});throw new BodyError(413)}parts.push(value)}const out=new Uint8Array(size);let offset=0;for(const p of parts){out.set(p,offset);offset+=p.length}return new TextDecoder('utf-8',{fatal:true}).decode(out)};
 try{return await Promise.race([read(),timeout])}finally{clearTimeout(timer)}
}
async function allow(db,bucket,windowStart,limit){
 // A single atomic statement is shared across Worker instances. Existing counters
 // reset in place; no per-request rows, in-memory-only gates, or runtime DDL.
 const row=await db.prepare('INSERT INTO minimal_api_limits(bucket,window_start,hits) VALUES (?,?,1) ON CONFLICT(bucket) DO UPDATE SET hits=CASE WHEN minimal_api_limits.window_start=excluded.window_start THEN minimal_api_limits.hits+1 ELSE 1 END,window_start=excluded.window_start WHERE minimal_api_limits.window_start<>excluded.window_start OR minimal_api_limits.hits<? RETURNING hits').bind(bucket,windowStart,limit).first();
 return !!row;
}
export async function stateApi(request,db,userId){
 if(!userId)return json({error:'Sign in to save your records.'},401);
 if(!db)return json({error:'Account storage is unavailable.'},503);
 const method=request.method,url=new URL(request.url);
 const archival=url.searchParams.has('archive');
 if(!['GET','PUT','DELETE'].includes(method)&&!(method==='POST'&&archival))return json({error:'Method not allowed.'},405,{Allow:'GET, PUT, DELETE'});
 const write=method!=='GET';
 if(write&&(request.headers.get('origin')!==url.origin||request.headers.get('sec-fetch-site')==='cross-site'))return json({error:'Only same-origin writes are allowed.'},403);
 // The authenticated identity remains the only database key. The client header
 // is a consistency check so an old tab cannot submit one account's state after
 // the browser signs into another account with a coincidentally equal revision.
 const expectedAccount=request.headers.get('x-minimal-account');
 if(expectedAccount!==null&&expectedAccount!==userId)return json({error:'The signed-in account changed. Reload to continue.',code:'ACCOUNT_CHANGED'},409);
 if(write&&!expectedAccount)return json({error:'Confirm the account before changing records.',code:'ACCOUNT_REQUIRED'},428);
 const now=Date.now(),windowStart=Math.floor(now/60000),kind=write?'write':'read';
 if(!await allow(db,'global:'+kind,windowStart,write?300:1200)||!await allow(db,'user:'+userId+':'+kind,windowStart,write?60:120))return json({error:'Too many requests. Wait briefly before trying again.'},429,{'Retry-After':String(60-Math.floor(now/1000)%60)});
 if(archival)return archiveApi(request,db,userId,readBounded);
 if(method==='GET'){
  if(url.searchParams.get('session')==='1')return json({accountId:userId,signedIn:true});
  const row=await db.prepare('SELECT payload,revision,previous_payload,updated_at FROM minimal_user_states WHERE user_id=?').bind(userId).first();
  const payload=url.searchParams.get('previous')==='1'?row?.previous_payload:row?.payload;
  return json({accountId:userId,revision:row?.revision||0,data:payload?JSON.parse(payload):null,updatedAt:row?.updated_at||0});
 }
 const revision=request.headers.get('if-match'),expected=Number(revision);if(revision===null||! /^(0|[1-9]\d*)$/.test(revision)||!Number.isSafeInteger(expected))return json({error:'A valid revision is required.'},428);
 if(method==='DELETE'){
  const batch=await db.batch([db.prepare('DELETE FROM minimal_archives WHERE user_id=? AND EXISTS(SELECT 1 FROM minimal_user_states WHERE user_id=? AND revision=?)').bind(userId,userId,expected),db.prepare('UPDATE minimal_user_states SET payload=NULL,previous_payload=NULL,revision=revision+1,updated_at=? WHERE user_id=? AND revision=? RETURNING revision').bind(now,userId,expected)]);const result=batch[1]?.results?.[0];
  if(!result)return json({error:'Records changed elsewhere. Reload before deleting.'},409);
  return json({accountId:userId,revision:result.revision,deleted:true});
 }
 if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')||''))return json({error:'Use application/json.'},415);
 const existing=await db.prepare('SELECT revision FROM minimal_user_states WHERE user_id=?').bind(userId).first();
 if((existing?.revision||0)!==expected)return json({error:'Records changed on another device.'},409);
 let payload;try{const text=await readBounded(request,schema.MAX_BYTES);payload=JSON.stringify(schema.validateState(JSON.parse(text)))}catch(e){const status=e instanceof BodyError?e.status:400;return json({error:status===413?'Request exceeds the account size limit.':status===408?'Request body took too long.':'Invalid records. Check the backup format and field limits.'},status)}
 // Conditional upsert prevents stale devices from overwriting a newer revision.
 const result=await db.prepare('INSERT INTO minimal_user_states (user_id,payload,revision,previous_payload,updated_at) VALUES (?,?,1,NULL,?) ON CONFLICT(user_id) DO UPDATE SET previous_payload=minimal_user_states.payload,payload=excluded.payload,revision=minimal_user_states.revision+1,updated_at=excluded.updated_at WHERE minimal_user_states.revision=? RETURNING revision').bind(userId,payload,Date.now(),expected).first();
 if(!result)return json({error:'Records changed on another device. Your local copy is preserved.'},409);
 return json({accountId:userId,revision:result.revision});
}
