import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { stateApi } from '../../../server/state-api.mjs';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const headers={'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff'};
 try{const user=await getChatGPTUser();if(!user)return Response.json({healthy:false},{status:401,headers});const url=new URL('/api/state?session=1',request.url);const result=await stateApi(new Request(url,{headers:{'X-Minimal-Account':user.userId}}),env.DB,user.userId);return Response.json({healthy:result.ok},{status:result.ok?200:result.status,headers:{...headers,...(result.headers.get('Retry-After')?{'Retry-After':result.headers.get('Retry-After')!}:{})}})}catch{return Response.json({healthy:false},{status:503,headers})}
}
