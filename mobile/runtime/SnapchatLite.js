/* BEGIN CONTROL SNAPCHAT MOBILE */
/* Snapchat Web as two sliding screens on a phone: conversations, then one conversation.
   Built on what the real page provides: #root nav (the conversation rail), its large sibling
   (conversation or camera), span[id^="title-"] / span[id^="status-"] (names already in the DOM,
   hidden by Snapchat at narrow widths) and the address (/web/<id> while a conversation is open).
   No class names (they change with every Snapchat build), no cloned content, nothing rewritten. */
(() => {
'use strict';
if(window.top!==window.self||globalThis.ControlSnapLite||!/(^|\.)snapchat\.com$/.test(location.hostname))return;
const inApp=()=>location.hostname==='web.snapchat.com'||/^\/web(?:\/|$)/.test(location.pathname);
const idPath=/\/[0-9a-f]{8}-[0-9a-f-]{20,}\/?$/i;
const style=document.createElement('style');style.id='control-snap-lite';
style.textContent=`
html[data-cs],html[data-cs] body{overflow:hidden!important;overscroll-behavior:none!important;background:#0e0e0f!important;-webkit-text-size-adjust:100%;text-size-adjust:100%}
html[data-cs] [data-cs-shell]{display:block!important;position:fixed!important;inset:var(--cs-top,0px) 0 auto 0!important;width:100vw!important;height:var(--cs-height,100dvh)!important;max-width:none!important;margin:0!important;overflow:hidden!important}
html[data-cs] :is([data-cs-side],[data-cs-pane]){position:absolute!important;inset:0!important;width:100%!important;height:100%!important;min-width:0!important;max-width:none!important;margin:0!important;box-sizing:border-box!important;transition:transform .34s cubic-bezier(.22,.8,.24,1)!important;will-change:transform;backface-visibility:hidden;-webkit-backface-visibility:hidden}
html[data-cs] [data-cs-pane]{transform:translate3d(100%,0,0);z-index:2;background:#0e0e0f!important;box-shadow:-10px 0 28px #0000005c}
html[data-cs] [data-cs-side]{transform:translate3d(0,0,0);z-index:1}
html:is([data-cs="chat"],[data-cs="camera"]) [data-cs-pane]{transform:translate3d(0,0,0)}
html:is([data-cs="chat"],[data-cs="camera"]) [data-cs-side]{transform:translate3d(-24%,0,0)}
html[data-cs-drag] :is([data-cs-side],[data-cs-pane]){transition:none!important}
html[data-cs] [data-cs-side] [role="listitem"] div:has(>span[id^="title-"]){display:flex!important;flex-direction:column!important;justify-content:center!important;gap:2px!important;min-width:0!important;flex:1 1 0%!important}
html[data-cs] [data-cs-side] [role="listitem"] span[id^="title-"]{overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
html[data-cs] [data-cs-side] [role="listitem"]>[role="button"]{-webkit-tap-highlight-color:transparent;touch-action:pan-y}
html[data-cs] [data-cs-side]>div:first-child{position:relative!important}
html[data-cs] [data-cs-side]>div:first-child::after{content:"Chat";position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font:600 18px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:inherit;pointer-events:none}
html[data-cs] [data-cs-header-action]{right:12px!important}
html[data-cs] [data-cs-backdrop]{display:none!important}
html[data-cs] :is(button,a,[role="button"]):is([title*="Spotlight" i],[aria-label*="Spotlight" i],[title*="Stories" i],[aria-label*="Stories" i],[href*="/spotlight" i]){display:none!important}
#control-snap-camera,#control-snap-back{all:unset;box-sizing:border-box;position:fixed;z-index:2147483000;display:none;place-items:center;border-radius:50%;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .16s ease-out,opacity .2s ease-out}
#control-snap-camera{right:18px;bottom:calc(22px + env(safe-area-inset-bottom,0px));width:56px;height:56px;background:#fffc00;color:#111;box-shadow:0 6px 18px #00000059}
#control-snap-back{left:12px;top:calc(12px + env(safe-area-inset-top,0px));width:40px;height:40px;background:#000000a6;color:#fff}
html[data-cs="list"] #control-snap-camera,html[data-cs="camera"] #control-snap-back{display:grid}
:is(#control-snap-camera,#control-snap-back):active{transform:scale(.92)}
:is(#control-snap-camera,#control-snap-back) svg{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
@media(prefers-reduced-motion:reduce){html[data-cs] :is([data-cs-side],[data-cs-pane]){transition:none!important}}
`;
let side=null,pane=null,cameraWanted=false,leavingUntil=0,view='',drag=null,cameraButton=null,backButton=null;
const compact=()=>Math.min(window.innerWidth,screen.width||window.innerWidth)<=760;
function icon(d){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
 const path=document.createElementNS(ns,'path');path.setAttribute('d',d);svg.append(path);return svg;
}
function button(id,label,d,action){
 const node=document.createElement('button');node.id=id;node.type='button';node.setAttribute('aria-label',label);node.append(icon(d));
 node.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();action();});return node;
}
function locate(){
 if(side?.isConnected&&pane?.isConnected&&side.parentElement===pane.parentElement)return true;
 side=pane=null;
 const nav=document.querySelector('#root nav')||document.querySelector('main nav');if(!nav)return false;
 const big=node=>node.offsetWidth*node.offsetHeight;
 let candidate=nav;
 while(candidate.parentElement&&candidate.parentElement!==document.body&&![...candidate.parentElement.children].some(other=>other!==candidate&&other.offsetHeight>window.innerHeight*.5&&other.offsetWidth>80))candidate=candidate.parentElement;
 if(!candidate.parentElement||candidate.parentElement===document.body)return false;
 const other=[...candidate.parentElement.children].filter(node=>node!==candidate).sort((a,b)=>big(b)-big(a))[0];
 if(!other||!big(other))return false;
 side=candidate;pane=other;return true;
}
const closeButton=()=>pane&&([...pane.querySelectorAll('button[title="Close Chat"],button[title*="Close" i],button[title*="Fermer" i],button[aria-label*="Close" i],button[aria-label*="Fermer" i],button[aria-label*="Back" i],button[aria-label*="Retour" i]')].find(node=>node.getBoundingClientRect().top<90)||[...pane.querySelectorAll('button')].find(node=>{const box=node.getBoundingClientRect();return box.width>0&&box.top<70&&box.left<70;}));
const conversationOpen=()=>idPath.test(location.pathname)||!!pane?.querySelector('[role="textbox"],textarea,[contenteditable="true"]');
function clear(){
 const root=document.documentElement;
 if(!root.hasAttribute('data-cs'))return;
 root.removeAttribute('data-cs');root.removeAttribute('data-cs-drag');view='';
 for(const node of document.querySelectorAll('[data-cs-shell],[data-cs-side],[data-cs-pane],[data-cs-backdrop]'))for(const name of ['data-cs-shell','data-cs-side','data-cs-pane','data-cs-backdrop'])node.removeAttribute(name);
 cameraButton?.remove();backButton?.remove();
}
function refresh(){
 const root=document.documentElement;if(!root)return;
 if(!inApp()||!compact()||!locate()){clear();return;}
 if(style.parentNode!==root)root.append(style);
 if(matchMedia('(pointer:coarse)').matches){
  let meta=document.querySelector('meta[name="viewport"]');
  if(!meta){meta=document.createElement('meta');meta.name='viewport';(document.head||root).append(meta);}
  const content='width=device-width, initial-scale=1, viewport-fit=cover';if(meta.content!==content)meta.content=content;
 }
 const shell=side.parentElement;
 for(const [node,name] of [[shell,'data-cs-shell'],[side,'data-cs-side'],[pane,'data-cs-pane']])if(!node.hasAttribute(name))node.setAttribute(name,'');
 const open=conversationOpen();
 if(open)cameraWanted=false;
 const next=Date.now()<leavingUntil?'list':open?'chat':cameraWanted?'camera':'list';
 /* The decorative photo behind the camera prompt: any image that fills the screen outside a conversation. */
 if(!open){const area=pane.offsetWidth*pane.offsetHeight;for(const image of pane.querySelectorAll('img:not([data-cs-backdrop])'))if(image.offsetWidth*image.offsetHeight>area*.55)image.setAttribute('data-cs-backdrop','');}
 /* Snapchat hangs the new-chat button over the edge of its narrow rail; keep it inside the screen. */
 for(const node of side.firstElementChild?.querySelectorAll('button')||[]){const holder=node.parentElement;if(holder&&!holder.hasAttribute('data-cs-header-action')&&getComputedStyle(holder).position==='absolute'&&parseFloat(getComputedStyle(holder).right)<0)holder.setAttribute('data-cs-header-action','');}
 if(!cameraButton){
  cameraButton=button('control-snap-camera','Caméra','M3 8h4l2-3h6l2 3h4v12H3ZM12 17a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2',()=>{cameraWanted=true;refresh();});
  backButton=button('control-snap-back','Retour aux conversations','m15 5-7 7 7 7',()=>{cameraWanted=false;refresh();});
 }
 if(cameraButton.parentNode!==root)root.append(cameraButton,backButton);
 if(view!==next){view=next;root.setAttribute('data-cs',next);}
 const viewport=window.visualViewport;
 root.style.setProperty('--cs-height',Math.round(viewport?.height||window.innerHeight)+'px');
 root.style.setProperty('--cs-top',Math.round(viewport?.offsetTop||0)+'px');
}
/* Leave a conversation with the slide first, then let Snapchat close it. */
function leave(){
 if(view==='camera'){cameraWanted=false;refresh();return;}
 leavingUntil=Date.now()+900;refresh();
 setTimeout(()=>{
  const close=closeButton();
  if(close){close.setAttribute('data-cs-pass','');close.click();close.removeAttribute('data-cs-pass');}
  else if(idPath.test(location.pathname))history.back();
  setTimeout(()=>{leavingUntil=0;refresh();},260);
 },330);
}
document.addEventListener('click',event=>{
 if(!view||!(event.target instanceof Element))return;
 const target=event.target.closest('button');
 if(view==='chat'&&target&&target===closeButton()&&!target.hasAttribute('data-cs-pass')&&event.isTrusted){event.preventDefault();event.stopImmediatePropagation();leave();return;}
 if(event.target.closest('[data-cs-side] [role="listitem"]'))for(const delay of [40,120,240,420,700])setTimeout(refresh,delay);
},true);
/* Swipe right from a conversation (or the camera) drags the screen back to the list, like the app. */
const horizontalScroller=node=>{for(let el=node;el&&el!==pane;el=el.parentElement)if(el.scrollWidth>el.clientWidth+4&&/auto|scroll/.test(getComputedStyle(el).overflowX))return true;return false;};
window.addEventListener('touchstart',event=>{
 drag=null;
 if(!['chat','camera'].includes(view)||event.touches.length!==1||!(event.target instanceof Element)||!pane?.contains(event.target))return;
 if(event.target.closest('input,textarea,[contenteditable="true"],[role="textbox"],[role="slider"],video')||horizontalScroller(event.target))return;
 const touch=event.touches[0];drag={x:touch.clientX,y:touch.clientY,dx:0,active:false,time:Date.now()};
},{capture:true,passive:true});
window.addEventListener('touchmove',event=>{
 if(!drag)return;
 const touch=event.touches[0],dx=touch.clientX-drag.x,dy=touch.clientY-drag.y;
 if(!drag.active){
  if(Math.abs(dy)>10&&Math.abs(dy)>=Math.abs(dx)){drag=null;return;}
  if(dx<12||dx<Math.abs(dy)*1.4)return;
  drag.active=true;document.documentElement.setAttribute('data-cs-drag','');
 }
 drag.dx=Math.max(0,dx);
 const width=window.innerWidth||1,progress=Math.min(1,drag.dx/width);
 pane.style.setProperty('transform','translate3d('+drag.dx+'px,0,0)','important');
 side.style.setProperty('transform','translate3d('+(-24*(1-progress))+'%,0,0)','important');
 if(event.cancelable)event.preventDefault();event.stopPropagation();
},{capture:true,passive:false});
function release(){
 if(!drag)return;
 const done=drag.active&&(drag.dx>window.innerWidth*.33||drag.dx>48&&drag.dx/Math.max(1,Date.now()-drag.time)>.45),active=drag.active;drag=null;
 if(!active)return;
 document.documentElement.removeAttribute('data-cs-drag');
 pane?.style.removeProperty('transform');side?.style.removeProperty('transform');
 if(done)leave();
}
window.addEventListener('touchend',release,{capture:true,passive:true});
window.addEventListener('touchcancel',release,{capture:true,passive:true});
for(const type of ['popstate','pageshow','resize','orientationchange'])window.addEventListener(type,refresh);
window.visualViewport?.addEventListener('resize',refresh);window.visualViewport?.addEventListener('scroll',refresh);
setInterval(refresh,220);
globalThis.ControlSnapLite={refresh,state:()=>({view,side:!!side,pane:!!pane,open:!!pane&&conversationOpen()})};
refresh();
})();
/* END CONTROL SNAPCHAT MOBILE */
