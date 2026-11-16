/* Clickjacking guard for hosts where the frame-ancestors response header is not
   configured. An in-document CSP cannot express frame-ancestors, so refuse to
   render inside another site's frame. Same-origin framing stays allowed. This is
   defence in depth: the HTTP headers in render-beta/headers.json remain required. */
(function(){
 'use strict';
 if(window.top===window.self)return;
 var sameOrigin=false;
 try{sameOrigin=window.top.location.origin===window.location.origin}catch(e){}
 if(sameOrigin)return;
 document.documentElement.style.setProperty('display','none','important');
 window.minimalFramed=true;
})();
