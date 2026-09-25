/* Mobile presentation only. Native nodes, handlers, identities and media remain Snapchat-owned. */
(() => {
 'use strict';
 if(globalThis.ControlSnapMobileUI||!/(^|\.)snapchat\.com$/.test(location.hostname))return;
 const paths={search:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',bell:'M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3m5 3h4',add:'M17 3v6m-3-3h6M3 21v-2a6 6 0 0 1 12 0v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',more:'M5 12h.1M12 12h.1M19 12h.1',user:'M4 22v-2a8 8 0 0 1 16 0v2M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10',camera:'M3 6h4l2-3h6l2 3h4v15H3ZM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8',view:'m8 4 12 8-12 8V4Z',chat:'M20 11a8 8 0 0 1-8 8H4v-7a8 8 0 1 1 16-1ZM8 9h8M8 13h5',friends:'M2 21v-2a6 6 0 0 1 12 0v2M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M17 4a4 4 0 0 1 0 8m0 3a5 5 0 0 1 5 5v1'};
 const icon=kind=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+paths[kind]+'"/></svg>';
 const label=n=>(n.getAttribute('aria-label')||n.getAttribute('title')||n.textContent||'').trim();
 const own=(tag,kind)=>{const n=document.createElement(tag);n.dataset.controlSnapOwned=kind;return n;};
 const tag=(n,key,value='')=>{if(n.getAttribute(key)!==value)n.setAttribute(key,value);};
 function create(){
  const style=own('style','mobile-ui'),headers=new Map(),labels=new Map(),abort=new AbortController();let nav,currentList;
  style.textContent=`
  @media(max-width:700px),(max-width:950px) and (max-height:600px) and (pointer:coarse){
   html[data-control-snap] [data-csm-header]{display:block!important;position:sticky!important;top:0!important;z-index:8!important;box-sizing:border-box!important;min-height:0!important;height:auto!important;padding:calc(8px + env(safe-area-inset-top,0px)) 12px 8px!important;margin:0!important;background:#fff!important}
   [data-csm-header] > :not([data-control-snap-owned="mobile-toolbar"]):not([data-control-snap-owned="search"]){display:none!important}
   [data-csm-header-source]{display:none!important}
   [data-control-snap-owned="mobile-toolbar"]{display:flex!important;position:relative;align-items:center;justify-content:space-between;height:48px;gap:8px;font-family:system-ui}
   .csm-left,.csm-right{display:flex;gap:5px;align-items:center}
   .csm-left [data-kind="profile"]{order:0}.csm-left [data-kind="search"]{order:1}
   .csm-title{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font:650 21px/1.2 system-ui;color:#16181b;pointer-events:none;margin:0}
   [data-control-snap-owned="mobile-toolbar"] button{appearance:none;position:relative;display:grid;place-items:center;flex:0 0 40px;width:40px;height:44px;padding:8px;border:0;border-radius:50%;background:#f1f3f4;color:#333b42;cursor:pointer}
   [data-control-snap-owned="mobile-toolbar"] button[data-kind="add"]{background:#fffc00;color:#111}
   [data-control-snap-owned="mobile-toolbar"] svg{width:25px;height:25px}
   [data-control-snap-owned="mobile-toolbar"] img{width:32px;height:36px;object-fit:contain;border-radius:50%}
   html [data-csm-header] [data-control-snap-owned="search"]{display:none!important;padding:8px 0 0!important;order:0!important}
   html [data-csm-header][data-csm-search-open] [data-control-snap-owned="search"]{display:flex!important;align-items:center!important;gap:8px!important;animation:csm-in .15s ease-out}
   html [data-csm-header] [data-control-snap-owned="search"] input{width:100%!important;flex:1!important;min-width:0!important;height:40px!important;margin:0!important;padding:0 14px!important;font:16px system-ui!important}
   .csm-cancel{border:0;background:transparent;color:#424b54;padding:10px 0;font:500 13px system-ui;min-height:44px}
   html[data-control-snap] [data-csm-row]{box-sizing:border-box!important;display:grid!important;grid-template-columns:58px minmax(0,1fr) 44px!important;grid-template-rows:1fr!important;align-items:center!important;gap:12px!important;padding:8px 16px!important;min-height:var(--control-row-height,84px)!important;height:var(--control-row-height,84px)!important;overflow:hidden!important}
   html[data-control-snap] [data-csm-row] [data-csm-flat]{display:contents!important}
   html[data-control-snap] [data-csm-row] [data-control-snap-avatar-slot]{grid-column:1!important;grid-row:1!important;width:58px!important;min-width:58px!important;max-width:58px!important;height:58px!important;min-height:58px!important;max-height:58px!important;isolation:isolate;overflow:hidden!important;background:#f1f3f4!important;border-radius:50%!important}
   html[data-control-snap] [data-csm-row] [data-control-snap-text-slot]{grid-column:2!important;grid-row:1!important;min-width:0!important;align-self:center!important}
   html[data-control-snap] [data-csm-row] [data-control-snap-name-line]{font:500 clamp(19px,5vw,21px)/26px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif!important;min-height:26px!important;max-height:26px!important}
   html[data-control-snap] [data-csm-row] [data-control-snap-status-line]{display:flex!important;flex-wrap:nowrap!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;font:400 13px/20px system-ui!important;color:#6e7783!important;max-height:20px!important;min-height:20px!important}
   html[data-control-snap] [data-csm-row] [data-control-snap-status-line] :is(span,div){min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;font:inherit!important;color:inherit!important}
   html[data-control-snap] [data-csm-row] [data-control-snap-status-line] svg{width:20px!important;height:20px!important;flex:0 0 20px!important}
   html[data-control-snap] [data-csm-row] [data-csm-action]{display:grid!important;grid-column:3!important;grid-row:1!important;position:static!important;inset:auto!important;transform:none!important;place-items:center!important;width:44px!important;min-width:44px!important;max-width:44px!important;height:44px!important;max-height:44px!important;padding:7px!important;margin:0!important;background:transparent!important;border:0!important;border-radius:12px!important;font-size:0!important;color:#303840!important;cursor:pointer!important}
   html[data-control-snap] [data-csm-action]>:not([data-control-snap-owned="row-icon"]){display:none!important}
   html[data-control-snap] [data-csm-action] [data-control-snap-owned="row-icon"],html[data-control-snap] [data-csm-action] [data-control-snap-owned="row-icon"] svg{display:block!important;width:28px!important;height:28px!important}
   html[data-control-snap] [data-csm-action-secondary]{display:none!important}
   [data-control-snap-owned="mobile-nav"]{box-sizing:border-box;position:fixed;bottom:0;left:0;right:0;height:calc(58px + env(safe-area-inset-bottom,0px));padding:6px 18px calc(6px + env(safe-area-inset-bottom,0px));display:flex;justify-content:space-evenly;align-items:center;background:#fffffff2;border-top:1px solid #eceef1;backdrop-filter:blur(16px);z-index:9}
   [data-control-snap-owned="mobile-nav"] button{border:0;background:transparent;color:#41474d;width:52px;height:44px;padding:9px;cursor:pointer}
   [data-control-snap-owned="mobile-nav"] svg{width:27px;height:27px}
   [data-control-snap-owned="mobile-nav"] button[aria-current]{color:#111}
   html[data-control-snap-view="messages"] [data-control-snap-contacts]{padding-bottom:calc(68px + env(safe-area-inset-bottom,0px))!important}
   html:not([data-control-snap-view="messages"]) [data-control-snap-owned="mobile-nav"],html:has([data-control-snap-viewer]) [data-control-snap-owned="mobile-nav"]{display:none!important}
   @keyframes csm-in{from{opacity:0}to{opacity:1}}
   @media(prefers-reduced-motion:reduce){[data-csm-header] *{animation:none!important}}
  }
  @media(min-width:701px){[data-control-snap-owned="mobile-toolbar"],[data-control-snap-owned="mobile-nav"]{display:none}}
  `;document.documentElement.append(style);
  function header(list){
   currentList=list;
   const h=list.querySelector('[data-control-snap-toolbar]');if(!h)return;tag(h,'data-csm-header');
   let entry=headers.get(h);
   if(!entry){const bar=own('div','mobile-toolbar');bar.innerHTML='<div class="csm-left"></div><h1 class="csm-title">Chat</h1><div class="csm-right"></div>';h.prepend(bar);entry={bar,buttons:new Map()};headers.set(h,entry);}
   document.getElementById('control-snap-brand')?.remove();
   const candidates=[...list.querySelectorAll('button,[role="button"],a')].filter(n=>!n.closest('[data-control-snap-owned],[data-control-snap-row],[role="menu"],[role="dialog"]'));
   const specs=[['profile',/profil|account|compte|settings|paramètre/i,'Mon compte','user'],['search',null,'Rechercher','search'],['bell',/notification|alert/i,'Notifications','bell'],['add',/add friend|ajout.*ami/i,'Ajouter un ami','add'],['more',/more|options|menu|plus/i,'Options','more']];
   for(const [kind,pattern,title,graphic] of specs){
    const target=pattern?candidates.find(n=>pattern.test(label(n))):null;
    if(kind!=='search'&&!target){entry.buttons.get(kind)?.button.remove();entry.buttons.delete(kind);continue;}
    let record=entry.buttons.get(kind);
    if(!record){const button=own('button','header-action');button.type='button';button.dataset.kind=kind;button.setAttribute('aria-label',title);button.innerHTML=icon(graphic);record={button,target};entry.buttons.set(kind,record);entry.bar.querySelector(kind==='profile'||kind==='search'?'.csm-left':'.csm-right').append(button);
     button.addEventListener('click',()=>{if(kind==='search'){h.toggleAttribute('data-csm-search-open');const input=h.querySelector('[data-control-snap-owned="search"] input');if(h.hasAttribute('data-csm-search-open'))input?.focus();button.setAttribute('aria-expanded',String(h.hasAttribute('data-csm-search-open')));}else if(record.target?.isConnected)record.target.click();},{signal:abort.signal});
    }record.target=target;
    if(target){tag(target,'data-csm-header-source');for(let p=target.parentElement;p&&p!==h&&p!==list&&!p.querySelector('[data-control-snap-row],input');p=p.parentElement)tag(p,'data-csm-header-source');}
    if(kind==='profile'&&target?.querySelector('img')){const src=target.querySelector('img').getAttribute('src');if(src&&record.src!==src){record.src=src;record.button.replaceChildren(target.querySelector('img').cloneNode());}}
   }
   const box=h.querySelector('[data-control-snap-owned="search"]'),input=box?.querySelector('input');
   if(input){input.placeholder='Rechercher';input.setAttribute('aria-label','Rechercher dans les conversations');}
   if(box&&!box.querySelector('.csm-cancel')){const cancel=own('button','cancel-search');cancel.className='csm-cancel';cancel.textContent='Annuler';cancel.onclick=()=>{h.removeAttribute('data-csm-search-open');input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));entry.buttons.get('search')?.button.focus();};box.append(cancel);}
   if(!nav){nav=own('nav','mobile-nav');nav.setAttribute('aria-label','Navigation Snapchat');const chat=own('button','nav-chat');chat.innerHTML=icon('chat');chat.setAttribute('aria-label','Chat');chat.setAttribute('aria-current','page');chat.onclick=()=>currentList?.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});nav.append(chat);document.documentElement.append(nav);}
   const add=entry.buttons.get('add');let friends=nav.querySelector('[data-control-snap-owned="nav-friends"]');
   if(add&&!friends){friends=own('button','nav-friends');friends.innerHTML=icon('friends');friends.setAttribute('aria-label','Ajouter des amis');friends.onclick=()=>entry.buttons.get('add')?.target?.click();nav.append(friends);}else if(!add)friends?.remove();
  }
  function rows(list){
   for(const row of list.querySelectorAll('[data-control-snap-row]')){
    if(row.closest('[role="menu"],[role="dialog"],[data-csx-settings]'))continue;
    tag(row,'data-csm-row');const name=row.querySelector('[data-control-snap-name-line]');if(!name)continue;
    for(const n of row.querySelectorAll('[data-csm-action]'))if(labels.has(n)){const text=n.textContent.trim();if(text&&text!==n.getAttribute('aria-label'))n.setAttribute('aria-label',text);}
    row.querySelectorAll('[data-csm-action],[data-csm-action-secondary],[data-csm-flat]').forEach(n=>{n.removeAttribute('data-csm-action');n.removeAttribute('data-csm-action-secondary');n.removeAttribute('data-csm-flat');});
    const actions=[...row.querySelectorAll('button,[role="button"],a,[tabindex],div,span')].filter(n=>!n.contains(name)&&!n.closest('[data-control-snap-avatar-slot],[data-control-snap-text-slot],[data-control-snap-owned]')&&/^(voir|view|ouvrir|open|répondre|repondre|reply|appareil photo|camera)(\s+(le|au|to|the|pour)\b.*)?$/i.test(label(n))).filter(n=>!n.parentElement?.closest('[data-csm-action]'));
    const unique=actions.filter(n=>!actions.some(parent=>parent!==n&&parent.contains(n)));
    const action=unique.find(n=>/voir|view|open|ouvrir/i.test(label(n)))||unique.find(n=>/répondre|repondre|reply/i.test(label(n)))||unique[0]||row.querySelector('[data-control-snap-row-camera]');
    for(const n of unique)if(n!==action)tag(n,'data-csm-action-secondary');
    if(action){tag(action,'data-csm-action');if(!action.getAttribute('aria-label')){labels.set(action,action.getAttribute('aria-label'));action.setAttribute('aria-label',label(action)||'Répondre');}let picture=action.querySelector('[data-control-snap-owned="row-icon"]');if(!picture){picture=own('span','row-icon');action.append(picture);}const graphic=/voir|view|open|ouvrir/i.test(label(action))?'view':'camera';if(picture.dataset.graphic!==graphic){picture.dataset.graphic=graphic;picture.innerHTML=icon(graphic);}}
    const leaves=[row.querySelector('[data-control-snap-avatar-slot]'),...row.querySelectorAll('[data-control-snap-text-slot]'),action].filter(Boolean);
    for(const leaf of leaves)for(let p=leaf.parentElement;p&&p!==row;p=p.parentElement)if(!leaves.includes(p))tag(p,'data-csm-flat');
   }
  }
  function refresh(){if(!matchMedia('(max-width:700px),(max-width:950px) and (max-height:600px) and (pointer:coarse)').matches)return;for(const list of document.querySelectorAll('[data-control-snap-contacts]')){header(list);rows(list);}}
  function dispose(){abort.abort();style.remove();nav?.remove();for(const {bar}of headers.values())bar.remove();for(const [n,value]of labels)if(value===null)n.removeAttribute('aria-label');else n.setAttribute('aria-label',value);for(const n of document.querySelectorAll('[data-control-snap-owned="row-icon"],[data-control-snap-owned="cancel-search"]'))n.remove();for(const n of document.querySelectorAll('*'))for(const a of n.getAttributeNames())if(a.startsWith('data-csm-'))n.removeAttribute(a);}
  return{refresh,dispose};
 }
 function inspect(){
  const shape=n=>{const r=n.getBoundingClientRect(),c=getComputedStyle(n);return{tag:n.tagName,rect:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)},display:c.display,visibility:c.visibility,opacity:c.opacity,overflow:c.overflow,position:c.position,zIndex:c.zIndex,transform:c.transform,controlPane:n.hasAttribute('data-control-snap-pane'),viewer:n.hasAttribute('data-control-snap-viewer')};};
  return{viewport:{width:innerWidth,height:innerHeight,visualHeight:visualViewport?.height},view:document.documentElement.getAttribute('data-control-snap-view'),media:[...document.querySelectorAll('video,canvas,[data-csx-media]')].slice(0,12).map(n=>{const parents=[];for(let p=n.parentElement;p&&parents.length<8;p=p.parentElement)parents.push(shape(p));const r=n.getBoundingClientRect();return{...shape(n),hasSource:!!(n.currentSrc||n.getAttribute('src')||n.srcObject),readyState:n.readyState,paused:n.paused,errorCode:n.error?.code,videoWidth:n.videoWidth,videoHeight:n.videoHeight,centerStack:document.elementsFromPoint(Math.max(0,r.x+r.width/2),Math.max(0,r.y+r.height/2)).slice(0,6).map(shape),parents};})};
 }
 globalThis.ControlSnapMobileUI={create,inspect};
})();
