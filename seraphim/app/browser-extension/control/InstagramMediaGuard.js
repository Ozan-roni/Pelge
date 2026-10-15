/* One deliberately opened Instagram media item. No message collection or media copies. */
(() => {
 'use strict';
 if(!/(^|\.)instagram\.com$/.test(location.hostname)||globalThis.ControlInstagramMediaGuard)return;
 let enabled=false,scope=null,chosen=null,lockPath='',frame=0,observer=null,style=null,lastPointer=null;
 const positions=new Map(),extras=new Set(),key='ControlInstagramReceivedMedia.v2';
 const mediaPath=raw=>{try{const u=new URL(raw,location.href);return /(^|\.)instagram\.com$/.test(u.hostname)&&/^\/(?:p|reels?)\/[^/]+\/?$/.test(u.pathname)?u.pathname.replace(/\/$/,''):'';}catch{return '';}};
 let grant=null;try{grant=JSON.parse(sessionStorage.getItem(key));}catch{}
 const permits=raw=>{const path=mediaPath(raw);return !!(path&&grant?.path===path&&grant.expires>Date.now());};
 const visible=n=>{if(!n?.isConnected||n.hidden||n.closest('[hidden],[aria-hidden="true"]'))return false;const r=n.getBoundingClientRect(),s=getComputedStyle(n);return r.width>40&&r.height>40&&s.display!=='none'&&s.visibility!=='hidden';};
 const videoCall=n=>n.srcObject||n.closest('[data-testid*="call" i],[aria-label*="video call" i],[aria-label*="appel vidéo" i]');
 function dialog(){
  const videos=[...document.querySelectorAll('video')].filter(n=>visible(n)&&!videoCall(n));
  for(const v of videos){let root=v.closest('[role="dialog"],[aria-modal="true"]');if(root&&!root.querySelector('[aria-label*="hang up" i],[aria-label*="raccrocher" i]'))return root;
   for(let n=v.parentElement;n&&n!==document.body;n=n.parentElement){const s=getComputedStyle(n),r=n.getBoundingClientRect();if(s.position==='fixed'&&r.width>=innerWidth*.7&&r.height>=innerHeight*.65&&n.querySelector('button[aria-label*="close" i],button[aria-label*="fermer" i],[role="button"][aria-label*="close" i]'))return n;}
  }return null;
 }
 function desiredScope(){if(!enabled)return null;const overlay=dialog();if(overlay)return overlay;if(mediaPath(location.href))return document.querySelector('main,[role="main"]')||document.body;return null;}
 function clear(){for(const n of positions.keys())n.removeAttribute('data-control-ig-guard-scroll');positions.clear();for(const n of extras)n.removeAttribute('data-control-ig-guard-extra');extras.clear();scope?.removeAttribute('data-control-ig-guard-scope');document.documentElement.removeAttribute('data-control-ig-guard-active');scope=chosen=null;lockPath='';lastPointer=null;}
 function markExtra(n){if(!n||n===chosen||n.contains(chosen)||n.closest('[data-control-ig-guard-extra]'))return;if(!n.hasAttribute('data-control-ig-guard-extra')){n.setAttribute('data-control-ig-guard-extra','');extras.add(n);}}
 function refresh(){frame=0;const next=desiredScope();if(next!==scope){clear();scope=next;lockPath=mediaPath(location.href)||grant?.path||'';}if(!scope)return;
  document.documentElement.setAttribute('data-control-ig-guard-active','');scope.setAttribute('data-control-ig-guard-scope','');
  const videos=[...scope.querySelectorAll('video')].filter(v=>!videoCall(v));
  if(!chosen?.isConnected||!scope.contains(chosen)){chosen=videos.filter(visible).map(v=>{const r=v.getBoundingClientRect();return {v,area:Math.max(0,Math.min(innerWidth,r.right)-Math.max(0,r.left))*Math.max(0,Math.min(innerHeight,r.bottom)-Math.max(0,r.top))};}).sort((a,b)=>b.area-a.area)[0]?.v||null;}
  for(const v of videos)if(chosen&&v!==chosen){v.pause();markExtra(v.closest('article')||v);}
  for(const n of [document.documentElement,document.body,scope,...scope.querySelectorAll('div,section,main,[role="main"],[role="dialog"]')]){
   if(!n||n.closest('[data-control-ig-guard-extra]'))continue;const s=getComputedStyle(n);if(n===scope||n===document.body||n===document.documentElement||n.scrollHeight>n.clientHeight+1&&/auto|scroll|hidden/.test(s.overflowY)){
    if(!positions.has(n))positions.set(n,{top:n.scrollTop,left:n.scrollLeft});n.setAttribute('data-control-ig-guard-scroll','');
   }
  }
  for(const n of scope.querySelectorAll('button,[role="button"],a[href]')){const label=[n.getAttribute('aria-label'),n.getAttribute('title')].filter(Boolean).join(' ');if(/^(next|previous|suivant|suivante|précédent|précédente)(\b|\s)/i.test(label))markExtra(n);}
 }
 function schedule(){if(!frame&&enabled)frame=requestAnimationFrame(refresh);}
 function restoreScroll(event){if(!enabled||!scope)return;const n=event.target===document?document.scrollingElement:event.target,p=positions.get(n);if(p&&(Math.abs(n.scrollTop-p.top)>1||Math.abs(n.scrollLeft-p.left)>1)){n.scrollTop=p.top;n.scrollLeft=p.left;}}
 function stop(event){if(!enabled)return;if(!scope)refresh();if(!scope)return;
  if(event.type==='pointermove'){if(!lastPointer||event.pointerId!==lastPointer.id||Math.abs(event.clientY-lastPointer.y)<6&&Math.abs(event.clientX-lastPointer.x)<6)return;if(event.target instanceof Element&&event.target.closest('input[type="range"],[role="slider"]'))return;if(event.target===chosen&&event.clientY>=chosen.getBoundingClientRect().bottom-48)return;}
  if(event.type==='keydown'){if(!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','PageDown','PageUp','Home','End',' '].includes(event.key))return;
   if(event.target instanceof Element&&event.target.closest('input,textarea,[contenteditable="true"],video,button,[role="button"]')){event.stopImmediatePropagation();return;}
  }
  if(event.cancelable)event.preventDefault();event.stopImmediatePropagation();
 }
 function trustedClick(event){if(!enabled||!event.isTrusted||!/^\/direct(?:\/|$)/.test(location.pathname))return;const link=event.target instanceof Element?event.target.closest('a[href]'):null;if(!link||link.closest('nav,[role="navigation"]'))return;const path=mediaPath(link.href);if(!path)return;grant={path,expires:Date.now()+600000};try{sessionStorage.setItem(key,JSON.stringify(grant));}catch{}link.target='_self';}
 window.addEventListener('click',trustedClick,true);
 window.addEventListener('pointerdown',e=>{lastPointer={id:e.pointerId,x:e.clientX,y:e.clientY};},{capture:true,passive:true});
 window.addEventListener('pointerup',()=>lastPointer=null,true);window.addEventListener('pointercancel',()=>lastPointer=null,true);
 for(const type of ['wheel','touchmove','pointermove'])window.addEventListener(type,stop,{capture:true,passive:false});window.addEventListener('keydown',stop,true);window.addEventListener('scroll',restoreScroll,true);window.addEventListener('popstate',schedule);window.addEventListener('resize',schedule);
 const originalPush=history.pushState,originalReplace=history.replaceState;
 function historyCall(original,self,args){if(enabled&&scope&&args[2]){const path=mediaPath(args[2]);if(path&&(!lockPath||path!==lockPath))return;}const result=original.apply(self,args);schedule();return result;}
 history.pushState=function(...args){return historyCall(originalPush,this,args);};history.replaceState=function(...args){return historyCall(originalReplace,this,args);};
 function update(options){const next=!!options.enabled;if(next&&!document.documentElement){document.addEventListener('readystatechange',()=>update(options),{once:true});return;}if(next===enabled){schedule();return;}enabled=next;if(!enabled){observer?.disconnect();observer=null;cancelAnimationFrame(frame);frame=0;clear();style?.remove();style=null;return;}
  style=document.createElement('style');style.dataset.controlInstagramMediaGuard='';style.textContent='html[data-control-ig-guard-active],html[data-control-ig-guard-active] body,[data-control-ig-guard-scroll]{overflow:hidden!important;overscroll-behavior:none!important;scroll-behavior:auto!important;scroll-snap-type:none!important;touch-action:pinch-zoom!important}[data-control-ig-guard-scope]{overscroll-behavior:none!important;scroll-snap-type:none!important;touch-action:pinch-zoom!important}[data-control-ig-guard-extra]{display:none!important}';
  (document.documentElement||document).append(style);observer=new MutationObserver(schedule);observer.observe(document,{childList:true,subtree:true,attributes:true,attributeFilter:['role','aria-modal','aria-hidden','hidden','src','class','style']});refresh();
 }
 globalThis.ControlInstagramMediaGuard={update,permits,schedule};
})();
