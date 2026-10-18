import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { stateApi } from '../../../server/state-api.mjs';
export const dynamic='force-dynamic';
async function handle(request:Request){try{const user=await getChatGPTUser();return await stateApi(request,env.DB,user?.userId)}catch{return Response.json({error:'Account storage could not be reached. Your device copy is preserved.'},{status:503,headers:{'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff'}})}}
export const POST=handle;export const GET=handle;export const PUT=handle;export const DELETE=handle;
