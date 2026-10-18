/* Paint the last chosen appearance before the app is shown. No personal records are read. */
(()=>{let theme='dark';try{const saved=localStorage.getItem('minimal.appearance.v1');if(saved==='dark'||saved==='light')theme=saved}catch{}document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme})();

try{const finish=localStorage.getItem('minimal.surface.v1');document.documentElement.dataset.surface=['paper','linen','smooth'].includes(finish)?finish:'paper'}catch{document.documentElement.dataset.surface='paper'}
