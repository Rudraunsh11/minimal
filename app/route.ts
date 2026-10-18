import html from '../app-shell.html?raw';
export const dynamic='force-dynamic';
export async function GET(){
 const inline=html.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'';
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(inline));
 const hash=btoa(String.fromCharCode(...new Uint8Array(digest)));
 return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Strict-Transport-Security':'max-age=31536000','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()','Content-Security-Policy':`default-src 'self'; script-src 'self' 'sha256-${hash}'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://avatars.githubusercontent.com; connect-src 'self' https://world.openfoodfacts.org; object-src 'none'; frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com https://chat.openai.com; frame-src 'none'; worker-src 'none'; manifest-src 'self'; base-uri 'none'; form-action 'self'`}});
}
