const reserved=new Set(['/signin-with-chatgpt','/signout-with-chatgpt','/callback']);
export function safeRelativeReturnPath(value){
 if(typeof value!=='string'||!value.startsWith('/')||value.startsWith('//')||/[\\\u0000-\u001f\u007f]/.test(value))return '/';
 let url;try{url=new URL(value,'https://app.local')}catch{return '/'}
 if(url.origin!=='https://app.local')return '/';
 // Reject encoded separators/control characters and reserved routes even after
 // decoding, so a callback cannot be sent back into an auth loop.
 let path=url.pathname;try{for(let i=0;i<3;i++){const decoded=decodeURIComponent(path);if(decoded===path)break;path=decoded}}catch{return '/'}
 if(/[\\\u0000-\u001f\u007f]/.test(path)||path.startsWith('//')||reserved.has(path.replace(/\/+$/,'').toLowerCase()))return '/';
 return url.pathname+url.search+url.hash;
}
