import '../public/storage-model.js';
const model=globalThis.MinimalStorage;
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff'}});
export async function archiveApi(request,db,userId,readBounded){
 const url=new URL(request.url),key=url.searchParams.get('archive');
 if(request.method==='GET'){
  if(key==='1'){const list=await db.prepare('SELECT archive_id,cutoff,created_at,byte_count,record_count FROM minimal_archives WHERE user_id=? ORDER BY created_at DESC,archive_id LIMIT 10').bind(userId).all();return reply({accountId:userId,archives:list.results||[],limit:model.MAX_ARCHIVES})}
  if(!/^[a-f0-9-]{36}$/.test(key||''))return reply({error:'Invalid archive identifier.'},400);
  const row=await db.prepare('SELECT payload,cutoff,created_at FROM minimal_archives WHERE user_id=? AND archive_id=?').bind(userId,key).first();
  return row?reply({accountId:userId,archiveId:key,cutoff:row.cutoff,createdAt:row.created_at,data:JSON.parse(row.payload)}):reply({error:'Archive not found.'},404);
 }
 if(request.method!=='POST'||key!=='1')return reply({error:'Method not allowed.'},405);
 const revision=request.headers.get('if-match');if(!/^(0|[1-9]\d*)$/.test(revision||'')||!Number.isSafeInteger(Number(revision)))return reply({error:'A valid revision is required.'},428);
 if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')||''))return reply({error:'Use application/json.'},415);
 let cutoff,split;try{const body=JSON.parse(await readBounded(request,1024));cutoff=body.cutoff;if(Object.keys(body).some(k=>k!=='cutoff'))throw Error();if(!globalThis.MinimalSchema.date(cutoff)||cutoff>new Date().toISOString().slice(0,7)+'-01')throw Error()}catch{return reply({error:'Choose a valid archive date before the current month.'},400)}
 const row=await db.prepare('SELECT payload,revision FROM minimal_user_states WHERE user_id=?').bind(userId).first();
 if(!row?.payload||row.revision!==Number(revision))return reply({error:'Records changed. Check sync before archiving.'},409);
 const state=globalThis.MinimalSchema.validateState(JSON.parse(row.payload));split=model.split(state,cutoff,new Date().toISOString().slice(0,10));
 if(!split.count)return reply({error:'No food or water logs before that date.'},422);
 const id=crypto.randomUUID(),now=Date.now(),payload=JSON.stringify(split.active),archived=JSON.stringify(split.archive);
 // D1 batch is transactional. Both statements are revision-bound; the active
 // copy is reduced only if this exact archive was inserted in this transaction.
 const result=await db.batch([
  db.prepare('INSERT INTO minimal_archives(user_id,archive_id,payload,cutoff,created_at,byte_count,record_count) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM minimal_user_states WHERE user_id=? AND revision=?) AND (SELECT COUNT(*) FROM minimal_archives WHERE user_id=?)<?').bind(userId,id,archived,cutoff,now,model.bytes(split.archive),split.count,userId,Number(revision),userId,model.MAX_ARCHIVES),
  db.prepare('UPDATE minimal_user_states SET previous_payload=payload,payload=?,revision=revision+1,updated_at=? WHERE user_id=? AND revision=? AND EXISTS(SELECT 1 FROM minimal_archives WHERE user_id=? AND archive_id=?) RETURNING revision').bind(payload,now,userId,Number(revision),userId,id)
 ]);
 const saved=result[1]?.results?.[0];
 if(!saved)return reply({error:'Archive limit reached or records changed. Nothing was removed. Check sync and your archive list.'},409);
 return reply({accountId:userId,revision:saved.revision,data:split.active,archiveId:id,count:split.count});
}
