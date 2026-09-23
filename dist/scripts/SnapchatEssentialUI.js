/* Scoped presentation for existing Snapchat surfaces. No private API or media ownership. */
(() => {
'use strict';
if(globalThis.ControlSnapEssentialUI||!/(^|\.)snapchat\.com$/.test(location.hostname))return;
const paths={
user:'M20 21v-2a7 7 0 0 0-14 0v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
search:'M21 21l-5-5M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16',
bell:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
settings:'M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1 1-3M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
shield:'M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3',
blocked:'M16 4l5 5m0-5-5 5M3 21v-2a6 6 0 0 1 12 0v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
moon:'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11',
camera:'M3 7h4l2-3h6l2 3h4v13H3ZM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
mic:'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8',
help:'M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 3v.1M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20',
info:'M12 10v7m0-10v.1M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20',
add:'M19 3v6m-3-3h6M3 21v-2a6 6 0 0 1 12 0v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
more:'M5 12h.1M12 12h.1M19 12h.1',
back:'m15 5-7 7 7 7',
send:'m3 3 19 9-19 9 4-9-4-9m4 9h15',
emoji:'M8 14s1 3 4 3 4-3 4-3M8 9h.1M16 9h.1M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20',
gallery:'M3 3h18v18H3ZM3 17l6-6 4 4 3-3 5 5M16 8h.1',
hangup:'M3 16v-5c5-6 13-6 18 0v5l-5-1v-4M8 11v4l-5 1',
switchCamera:'M4 8h13l-4-4m7 12H7l4 4'
};
const svg=name=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+paths[name]+'"/></svg>';
const rules=[[/blocked|bloqu/i,'blocked','Privacy'],[/privacy|confidentialit|security|sécurité/i,'shield','Privacy'],[/notification/i,'bell','Account'],[/username|nom d.utilisateur|profile|profil|account|compte/i,'user','Account'],[/camera|caméra|appareil photo/i,'camera','App'],[/microphone|micro\b/i,'mic','App'],[/appearance|apparence|theme|thème|dark mode|mode sombre/i,'moon','App'],[/help|aide|assistance/i,'help','Support'],[/about|à propos|version/i,'info','Support']];
const settingsSelector='[data-testid="settings-panel"],[data-testid="settings-dialog"],[role="dialog"][aria-label*="settings" i],[role="dialog"][aria-label*="paramètres" i]';
const notificationsSelector='[data-testid="notifications-panel"],[role="dialog"][aria-label*="notification" i],[role="region"][aria-label*="notification" i]';
const label=node=>(node.getAttribute('aria-label')||node.getAttribute('title')||node.textContent||'').trim();
const normalize=text=>text.normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase();
function create(runtime){
 const abort=new AbortController(),observed=new Map(),searches=new Map(),icons=new Map(),marked=new Map(),portraitTracks=new Map();let disposed=false;
 const tag=(node,attr,value='')=>{if(node.getAttribute(attr)!==value)node.setAttribute(attr,value);if(!marked.has(node))marked.set(node,new Set());marked.get(node).add(attr);};
 const style=document.createElement('style');style.dataset.controlSnapOwned='essential-style';
 style.textContent="\n[data-csx-distraction],[data-csx-empty-rail]{display:none!important}\n[data-csx-camera-surface]{position:relative!important;display:flex!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important;background:#101010!important;background-image:none!important;overflow:hidden!important;min-width:0!important}\n[data-csx-camera-media]{object-fit:contain!important;max-width:100%!important;max-height:100%!important}\n[data-csx-camera-media][data-csx-mirror]{transform:scaleX(-1)!important}\n@media(min-width:701px){[data-csx-camera-surface]{width:min(100%,calc((100dvh - 24px)*9/16))!important;flex:0 1 auto!important;height:calc(100dvh - 24px)!important;max-height:100%!important;aspect-ratio:9/16!important;margin:12px auto!important;border-radius:18px!important}}\n[data-csx-overlay=\"call\"]{width:min(100vw,calc(var(--csx-height,100dvh)*9/16))!important;inset:0!important;margin:auto!important;box-shadow:0 0 0 100vmax #101010!important}\n[data-csx-call-local]{aspect-ratio:9/16!important;width:clamp(80px,18%,112px)!important;height:auto!important;max-height:28%!important;inset:14px 14px auto auto!important;object-fit:contain!important}\n[data-csx-call-controls] button{width:44px!important;min-width:44px!important;height:44px!important;border-radius:50%!important}\n[data-csx-native-header]{display:flex!important;align-items:center!important;gap:6px!important;flex-wrap:wrap!important;min-height:64px!important;padding:10px!important;box-sizing:border-box!important}\n[data-csx-native-header]>:is(h1,h2){flex:1;min-width:0;font:600 22px system-ui}\n[data-csx-toolbar-button]{min-width:40px!important;width:40px!important;height:40px!important;min-height:40px!important;box-sizing:border-box!important;padding:9px!important;border-radius:50%!important;position:relative!important}\n[data-control-snap-owned=\"semantic-icon\"]{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;flex:0 0 22px;color:inherit;pointer-events:none}\n[data-control-snap-owned=\"semantic-icon\"] svg{width:22px!important;height:22px!important}\n[data-csx-icon-replaced]{display:none!important}\n[data-csx-toolbar-button]>[data-control-snap-owned=\"semantic-icon\"]{position:absolute;inset:0;margin:auto}\n[data-control-snap-owned=\"search\"]{box-sizing:border-box;width:100%;flex:1 1 100%;order:20;position:relative;padding:4px 0 0;font:14px system-ui}\n[data-control-snap-owned=\"search\"] input{box-sizing:border-box;width:100%;height:40px;border:1px solid #85858535;border-radius:20px;padding:0 36px 0 14px;font:16px system-ui;background:#f2f3f5;color:#15171b}\n.csx-search-results{position:absolute;top:48px;left:0;right:0;max-height:min(55dvh,480px);overflow-y:auto;background:#fff;color:#14161a;border:1px solid #8883;border-radius:16px;box-shadow:0 8px 24px #0002;z-index:12;padding:6px}\n.csx-search-results[hidden]{display:none}\n.csx-search-results button{display:flex;width:100%;align-items:center;gap:12px;border:0;border-radius:10px;background:transparent;color:inherit;padding:12px;text-align:left;font:500 15px system-ui;cursor:pointer}\n.csx-search-results button:hover,.csx-search-results button:focus-visible{background:#85858515;outline:2px solid #fffc00;outline-offset:-2px}\n.csx-search-results p{padding:8px;font:13px/1.4 system-ui}\n[data-csx-settings],[data-csx-notifications]{box-sizing:border-box!important;width:min(100%,480px)!important;max-height:calc(100dvh - 24px)!important;overflow-y:auto!important;border-radius:18px!important;padding:16px!important;font-family:system-ui!important;box-shadow:0 12px 40px #0003}\n[data-csx-setting-row]{display:flex!important;align-items:center!important;gap:12px!important;width:100%!important;min-height:52px!important;padding:12px 8px!important;box-sizing:border-box!important;text-align:left!important;border:0!important;border-bottom:1px solid #8882!important;border-radius:0!important;background:transparent!important;font-size:15px!important}\n[data-csx-setting-group]{font:600 11px system-ui;letter-spacing:.08em;text-transform:uppercase;opacity:.65;margin:20px 8px 8px}\n[data-csx-notification-row]{box-sizing:border-box!important;min-height:68px!important;padding:12px 8px!important;border:0!important;border-bottom:1px solid #8882!important;border-radius:0!important;box-shadow:none!important;gap:12px!important}\n[data-csx-notification-row] img{width:42px!important;height:42px!important;object-fit:contain!important;border-radius:50%!important;flex-shrink:0!important}\n[data-csx-notification-row] time{font-size:12px!important;opacity:.65}\n[data-csx-notification-row][data-unread=\"true\"]{border-left:3px solid #ffdf00!important}\n[data-csx-settings],[data-csx-notifications]{animation:csx-surface-in 180ms ease-out}\n@keyframes csx-surface-in{from{opacity:0}to{opacity:1}}\n@media(prefers-reduced-motion:reduce){[data-csx-settings],[data-csx-notifications]{animation:none}}\n";
 style.textContent+='\n[data-csx-camera-surface][hidden],[data-csx-camera-surface][aria-hidden="true"],[data-csx-setting-row][hidden],[data-csx-toolbar-button][hidden]{display:none!important}\n[data-csx-native-header]{height:auto!important;flex-shrink:0!important}\n';
 style.textContent+='\n[data-csx-action-button]{font-size:0!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:40px!important;min-height:40px!important;padding:8px!important;border-radius:50%!important;box-sizing:border-box!important}\n[data-csx-action-button] [data-csx-icon]{width:22px;height:22px}\n[data-csx-hangup]{background:#eb3650!important;color:white!important;border:0!important}\n';
 style.textContent+='\n@media(max-width:700px),(max-width:950px) and (max-height:600px) and (pointer:coarse){[data-csx-camera-surface] video[data-csx-camera-media],html[data-control-snap-view="snap"] [data-control-snap-camera] video[data-csx-camera-media]{object-fit:cover!important;object-position:center!important;width:100%!important;height:100%!important}}\n';
  if(runtime.messagesOnly)style.textContent+='\n[data-csx-messages-hidden]{display:none!important}\n[data-csx-composer-controls]>[data-csx-send]{order:100!important;margin-left:auto!important}\n[data-csx-message-media]{max-width:100%!important;height:auto;object-fit:contain;display:block;margin-inline:auto}\n';
 document.documentElement.append(style);
  function messagesOnly(){
   if(!runtime.messagesOnly)return;
   for(const media of document.querySelectorAll('[data-csx-chat-log] img,[data-csx-chat-log] video')){
    if(media.closest(runtime.selectors.viewer+', [data-testid*="avatar" i],[class*="avatar" i],[data-testid*="emoji" i],[class*="emoji" i]'))continue;
    if(media.matches('video')||media.naturalWidth>96||media.getBoundingClientRect().width>96)tag(media,'data-csx-message-media');
   }
  for(const root of document.querySelectorAll('[data-testid="camera-panel"],[data-testid="camera-view"],[data-control-snap-camera]'))if(!root.querySelector('textarea,[contenteditable="true"],[role="textbox"]')&&!root.matches(runtime.selectors.conversation)&&!root.matches(runtime.selectors.viewer)&&!root.querySelector(runtime.selectors.viewer))tag(root,'data-csx-messages-hidden');
  for(const button of document.querySelectorAll('button,[role="button"],a[aria-label]')){
   if(button.closest(runtime.selectors.viewer+','+runtime.selectors.call+','+runtime.selectors.log))continue;
   const text=label(button);
   if(/^(camera|caméra|appareil photo|open camera|ouvrir la caméra|take (a )?snap|prendre un snap|new chat|new message|nouveau chat|nouveau message|nouvelle conversation|compose)(\b|$)/i.test(text))tag(button,'data-csx-messages-hidden');
   else if(/^(send|envoyer)( message| un chat)?$/i.test(text)&&button.closest(runtime.selectors.conversation))tag(button,'data-csx-send');
  }
  for(const node of document.querySelectorAll('[data-csx-messages-hidden]'))if(node.matches(runtime.selectors.conversation)||node.matches(runtime.selectors.viewer)||node.querySelector(runtime.selectors.viewer)||node.querySelector('textarea,[contenteditable="true"],[role="textbox"]'))node.removeAttribute('data-csx-messages-hidden');
 }
 function portraitCamera(video){
  if(!matchMedia('(max-width:700px) and (orientation:portrait)').matches)return;
  const track=video.srcObject?.getVideoTracks?.()[0];
  if(!track||portraitTracks.has(track)||typeof track.applyConstraints!=='function'||typeof track.getConstraints!=='function')return;
  const original=track.getConstraints(),requested={...original,width:{ideal:1080},height:{ideal:1920},aspectRatio:{ideal:9/16}};
  if(Array.isArray(original.advanced))requested.advanced=original.advanced.map(item=>{const next={...item};delete next.width;delete next.height;delete next.aspectRatio;return next;});
  portraitTracks.set(track,{original,requested});
  // Reconfigure only an already-open local camera. Never request another stream or rotate pixels.
  try{Promise.resolve(track.applyConstraints(requested)).catch(()=>{});}catch{}
 }
 function nativeActions(){
  const roots=document.querySelectorAll(runtime.selectors.conversation+','+runtime.selectors.call);
  for(const root of roots)for(const button of root.querySelectorAll('button')){
   if(button.closest('[data-control-snap-owned],'+runtime.selectors.log))continue;
   const text=label(button);let kind;
   if(/^(back|retour|go back)$/i.test(text))kind='back';
   else if(/hang up|hangup|raccrocher|end call/i.test(text))kind='hangup';
   else if(/switch camera|flip camera|changer.*caméra/i.test(text))kind='switchCamera';
   else if(/^(send|envoyer)( message| un chat)?$/i.test(text))kind='send';
   else if(/microphone|mute|unmute/i.test(text))kind='mic';
   else if(/^(camera|caméra|appareil photo|turn (on|off) camera)$/i.test(text))kind='camera';
   else if(/^(emoji|stickers)$/i.test(text))kind='emoji';
   else if(/^(gallery|galerie|attach media)$/i.test(text))kind='gallery';
   if(kind){replaceIcon(button,kind);tag(button,'data-csx-action-button');if(kind==='hangup')tag(button,'data-csx-hangup');}
  }
 }
 function replaceIcon(button,name,toolbar=false){
  if(!paths[name])return;if(toolbar)tag(button,'data-csx-toolbar-button');
  for(const original of button.querySelectorAll('svg,img[data-icon],[data-icon]'))if(!original.closest('[data-control-snap-owned]'))tag(original,'data-csx-icon-replaced');
  const entry=icons.get(button);if(entry?.name===name&&entry.node.isConnected)return;entry?.node.remove();
  const node=document.createElement('span');node.dataset.controlSnapOwned='semantic-icon';node.dataset.csxIcon=name;node.innerHTML=svg(name);button.prepend(node);icons.set(button,{node,name});
 }
 function filterDistractions(){
  const candidates=document.querySelectorAll('nav a,nav button,[role="tab"],[data-testid*="story" i],[data-testid*="stories" i],[data-testid*="spotlight" i],[data-testid*="discover" i],aside,[role="region"],section[aria-label]');
  for(const node of candidates){
   if(node.closest('[role="log"],[data-testid="chat-history"],[data-csx-chat-log],[data-csx-composer],[data-csx-overlay],[data-control-snap-owned]'))continue;
   const text=label(node),testid=node.getAttribute('data-testid')||'',href=node.getAttribute('href')||'';
   if(/^(my story|ma story|stories|story|discover|découvrir|spotlight)(\b|$)/i.test(text)||/(^|[-_])(story|stories|spotlight|discover)([-_]|$)/i.test(testid)||/\/(stories|story|spotlight|discover)(\/|$)/i.test(href))tag(node,'data-csx-distraction');
  }
  document.querySelectorAll('aside,[data-testid="stories-sidebar"],[data-testid="right-sidebar"]').forEach(rail=>{
   if(rail.querySelector('[data-csx-distraction]')&&[...rail.children].every(child=>child.hasAttribute('data-csx-distraction')||!child.textContent.trim()&&!child.querySelector('button,a,input,video')))tag(rail,'data-csx-empty-rail');
  });
 }
 function camera(){
  const current=new Set();
  for(const root of runtime.messagesOnly?[]:document.querySelectorAll('[data-testid="camera-panel"],[data-testid="camera-view"],[data-control-snap-camera]')){
   if(root.closest('[data-csx-overlay],[data-csx-chat]')||root.matches(runtime.selectors.conversation)||root.querySelector('textarea,[contenteditable="true"],[role="textbox"]')||root.parentElement?.closest('[data-csx-camera-surface]'))continue;
   current.add(root);
   tag(root,'data-csx-camera-surface');
   for(const control of root.querySelectorAll('button,[role="button"],[role="tab"],[data-testid*="lens" i],[data-testid*="story" i],[data-testid*="stories" i],[data-testid*="discover" i],[data-testid*="spotlight" i]')){
    const description=[label(control),control.getAttribute('data-testid'),control.querySelector('img')?.getAttribute('alt')].filter(Boolean).join(' ');
    if(/\b(story|stories|spotlight|discover|lenses|lens|effects|effets|filtres)\b/i.test(description)&&!/switch|flip|changer.*caméra/i.test(description))tag(control,'data-csx-distraction');
   }
   for(const video of root.querySelectorAll('video')){
    if(video.closest(runtime.selectors.viewer+','+runtime.selectors.call))continue;
    current.add(video);
    tag(video,'data-csx-camera-media');
    portraitCamera(video);
    const settings=video.srcObject?.getVideoTracks?.()[0]?.getSettings?.()||{};
    if(settings.facingMode==='environment')video.removeAttribute('data-csx-mirror');
    else if(settings.facingMode==='user'&&getComputedStyle(video).transform==='none')tag(video,'data-csx-mirror');
   }
  }
  for(const [node,attrs] of marked)if(!current.has(node))for(const attr of ['data-csx-camera-surface','data-csx-camera-media','data-csx-mirror']){node.removeAttribute(attr);attrs.delete(attr);}
 }
 function search(list,header){
  if(searches.has(list))return;
  const box=document.createElement('div');box.dataset.controlSnapOwned='search';
  box.innerHTML='<input type="search" aria-label="Search loaded conversations" placeholder="Search conversations" autocomplete="off"><div class="csx-search-results" hidden></div>';
  const input=box.querySelector('input'),results=box.querySelector('.csx-search-results');header.append(box);
  const render=()=>{
   const query=normalize(input.value.trim());results.replaceChildren();results.hidden=!query;if(!query)return;
   const rows=[...list.querySelectorAll(runtime.selectors.rows)].filter(row=>!row.closest('[data-control-snap-owned]')&&!row.hasAttribute('data-csx-distraction'));
   const matches=rows.map(row=>({row,identity:runtime.resolveIdentity(row)})).filter(({row,identity})=>normalize(identity.displayName+' '+(row.getAttribute('data-username')||row.querySelector('[data-username]')?.getAttribute('data-username')||'')).includes(query)).slice(0,50);
   for(const {row,identity} of matches){
    const result=document.createElement('button');result.type='button';result.innerHTML=svg('user');result.querySelector('svg').setAttribute('width','22');result.querySelector('svg').setAttribute('height','22');const name=document.createElement('span');name.textContent=identity.displayName;result.append(name);
    result.addEventListener('click',()=>{if(!row.isConnected)return;const target=row.matches('button,a,[role="button"]')?row:row.querySelector('button,a,[role="button"]')||row;input.value='';results.hidden=true;runtime.selectConversation(row);target.click();});results.append(result);
   }
   if(!matches.length){const empty=document.createElement('p');empty.textContent='No loaded conversation found. Use Snapchat search to find other people.';results.append(empty);}
  };
  input.addEventListener('input',render,{signal:abort.signal});input.addEventListener('keydown',event=>{if(event.key==='Escape'){input.value='';render();input.focus({preventScroll:true});}if(event.key==='ArrowDown'){event.preventDefault();results.querySelector('button')?.focus({preventScroll:true});}},{signal:abort.signal});
  searches.set(list,{box,render});
 }
 function topbars(){
  for(const list of document.querySelectorAll(runtime.selectors.contacts)){
   const header=list.querySelector('header,[data-testid="chat-header"],[data-testid="conversation-list-header"]');if(!header)continue;tag(header,'data-csx-native-header');
   for(const button of header.querySelectorAll('button,[role="button"],a')){
    if(button.closest('[data-control-snap-owned]'))continue;const text=label(button);
    const kind=/search|recherch/i.test(text)?'search':/notification/i.test(text)?'bell':/settings|paramètre/i.test(text)?'settings':/more|options|menu/i.test(text)?'more':/add friend|ajout/i.test(text)?'add':/profil|account|compte/i.test(text)?'user':null;
    if(kind&&!button.querySelector('img:not([data-icon])'))replaceIcon(button,kind,true);
   }
   search(list,header);
  }
  for(const [list,entry] of searches)if(!list.isConnected){entry.box.remove();searches.delete(list);}
 }
 function settings(root){
  tag(root,'data-csx-settings');let lastGroup='';
  for(const row of root.querySelectorAll('button,a,[role="menuitem"]')){
   if(row.closest('[data-control-snap-owned]')||row.parentElement?.closest('button,a,[role="menuitem"]'))continue;
   const rule=rules.find(([regex])=>regex.test(label(row)));if(!rule)continue;tag(row,'data-csx-setting-row');replaceIcon(row,rule[1]);
   if(rule[2]!==lastGroup){
    if(!row.previousElementSibling?.hasAttribute('data-csx-setting-group')){const heading=document.createElement('div');heading.dataset.controlSnapOwned='settings-group';heading.setAttribute('data-csx-setting-group','');heading.textContent=rule[2];row.before(heading);}
    lastGroup=rule[2];
   }
  }
 }
 function notifications(root){tag(root,'data-csx-notifications');root.querySelectorAll('[role="listitem"],[data-testid*="notification-item"]').forEach(row=>tag(row,'data-csx-notification-row'));}
 function watchPanels(){
  for(const root of document.querySelectorAll(settingsSelector+','+notificationsSelector)){
   if(observed.has(root))continue;
   const render=()=>{if(!disposed&&root.isConnected){if(root.matches(settingsSelector))settings(root);else notifications(root);}};let frame=0;
   const observer=new MutationObserver(records=>{if(records.some(record=>!record.target.parentElement?.closest('[data-control-snap-owned]')&&!record.target.closest?.('[data-control-snap-owned]')&&[...record.addedNodes,...record.removedNodes].some(node=>!(node instanceof Element)||!node.hasAttribute('data-control-snap-owned')))&&!frame)frame=requestAnimationFrame(()=>{frame=0;render();});});
   observer.observe(root,{childList:true,subtree:true,characterData:true});observed.set(root,{observer,stop:()=>cancelAnimationFrame(frame)});render();
  }
  for(const [root,entry] of observed)if(!root.isConnected){entry.observer.disconnect();entry.stop();observed.delete(root);}
 }
 function refresh(){if(disposed)return;for(const node of marked.keys())if(!node.isConnected)marked.delete(node);for(const [node,entry] of icons)if(!node.isConnected){entry.node.remove();icons.delete(node);}filterDistractions();messagesOnly();camera();topbars();nativeActions();watchPanels();}
 document.addEventListener('loadedmetadata',event=>{if(event.target instanceof HTMLVideoElement)camera();},{capture:true,signal:abort.signal});
 function dispose(){
  disposed=true;abort.abort();for(const entry of observed.values()){entry.observer.disconnect();entry.stop();}observed.clear();
  for(const [track,{original,requested}] of portraitTracks){try{if(track.readyState!=='ended'&&JSON.stringify(track.getConstraints())===JSON.stringify(requested))Promise.resolve(track.applyConstraints(original)).catch(()=>{});}catch{}}portraitTracks.clear();
  for(const entry of searches.values())entry.box.remove();searches.clear();for(const entry of icons.values())entry.node.remove();icons.clear();
  document.querySelectorAll('[data-control-snap-owned="settings-group"]').forEach(node=>node.remove());
  for(const [node,attrs] of marked)for(const attr of attrs)node.removeAttribute(attr);marked.clear();style.remove();
 }
 return {refresh,dispose};
}
globalThis.ControlSnapEssentialUI={create};
})();
