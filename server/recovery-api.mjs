import '../public/recovery-model.js';
import {MAX_INITIAL_ACCOUNTS} from './limits.mjs';
const model=globalThis.MinimalRecovery;
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff'}});
export async function recoveryApi(request,db,userId,readBounded){
 if(request.method==='GET'){
  // A transactional read returns active state and archives from the same moment.
  const [states,archives]=await db.batch([db.prepare('SELECT payload FROM minimal_user_states WHERE user_id=?').bind(userId),db.prepare('SELECT archive_id,payload,cutoff,created_at FROM minimal_archives WHERE user_id=? ORDER BY created_at,archive_id LIMIT 10').bind(userId)]);
  const row=states.results?.[0];if(!row?.payload)return json({error:'Save at least one account record before creating a full backup.'},422);
  const bundle=model.validate({kind:'minimal-account-backup',version:1,createdAt:new Date().toISOString(),active:JSON.parse(row.payload),archives:(archives.results||[]).map(a=>({id:a.archive_id,cutoff:a.cutoff,createdAt:a.created_at,data:JSON.parse(a.payload)}))});return json({accountId:userId,bundle});
 }
 if(request.method!=='POST')return json({error:'Method not allowed.'},405);
 const match=request.headers.get('if-match');if(!/^(0|[1-9]\d*)$/.test(match||'')||!Number.isSafeInteger(Number(match)))return json({error:'A valid revision is required.'},428);
 if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')||''))return json({error:'Use application/json.'},415);
 let bundle;try{bundle=model.validate(JSON.parse(await readBounded(request,model.MAX_BYTES)))}catch(e){return json({error:'Invalid, damaged or oversized full-account backup.'},e.status===413?413:400)}
 const revision=Number(match),now=Date.now(),operation=crypto.randomUUID();
 // Use a revision-qualified marker on the state row. Subsequent archive changes
 // execute only when the same transaction successfully advanced that row.
 const statements=[db.prepare('INSERT INTO minimal_user_states(user_id,payload,revision,previous_payload,updated_at,restore_token) SELECT ?,?,1,NULL,?,? WHERE ?=0 AND ((SELECT COUNT(*) FROM minimal_user_states)<? OR EXISTS(SELECT 1 FROM minimal_user_states WHERE user_id=?)) ON CONFLICT(user_id) DO UPDATE SET previous_payload=minimal_user_states.payload,payload=excluded.payload,revision=minimal_user_states.revision+1,updated_at=excluded.updated_at,restore_token=excluded.restore_token WHERE minimal_user_states.revision=? RETURNING revision').bind(userId,JSON.stringify(bundle.active),now,operation,revision,MAX_INITIAL_ACCOUNTS,userId,revision)];
 // A separate conditional UPDATE is needed when revision is nonzero: INSERT SELECT
 // with a false WHERE does not execute its ON CONFLICT clause in SQLite.
 if(revision!==0)statements[0]=db.prepare('UPDATE minimal_user_states SET previous_payload=payload,payload=?,revision=revision+1,updated_at=?,restore_token=? WHERE user_id=? AND revision=? RETURNING revision').bind(JSON.stringify(bundle.active),now,operation,userId,revision);
 // A unique transaction marker prevents even same-millisecond stale requests from changing archives.
 const condition='EXISTS(SELECT 1 FROM minimal_user_states WHERE user_id=? AND revision=? AND restore_token=?)';
 statements.push(db.prepare('DELETE FROM minimal_archives WHERE user_id=? AND '+condition).bind(userId,userId,revision+1,operation));
 for(const a of bundle.archives)statements.push(db.prepare('INSERT INTO minimal_archives(user_id,archive_id,payload,cutoff,created_at,byte_count,record_count) SELECT ?,?,?,?,?,?,? WHERE '+condition).bind(userId,a.id,JSON.stringify(a.data),a.cutoff,a.createdAt,new TextEncoder().encode(JSON.stringify(a.data)).length,a.data.foods.length+a.data.water.length,userId,revision+1,operation));
 const result=await db.batch(statements);const saved=result[0]?.results?.[0];if(!saved)return json({error:'Records changed. Check sync before restoring.'},409);
 return json({accountId:userId,revision:saved.revision,data:bundle.active,restoredArchives:bundle.archives.length});
}
