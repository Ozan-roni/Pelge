/* Mobile presentation only. Native nodes, handlers, identities and media remain Snapchat-owned. */
(() => {
 'use strict';
 if(globalThis.ControlSnapMobileUI||!/(^|\.)snapchat\.com$/.test(location.hostname))return;
 const paths={search:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',bell:'M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3m5 3h4',add:'M17 3v6m-3-3h6M3 21v-2a6 6 0 0 1 12 0v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',more:'M5 12h.1M12 12h.1M19 12h.1',user:'M4 22v-2a8 8 0 0 1 16 0v2M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10',camera:'M3 6h4l2-3h6l2 3h4v15H3ZM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8',view:'m8 4 12 8-12 8V4Z',chat:'M20 11a8 8 0 0 1-8 8H4v-7a8 8 0 1 1 16-1ZM8 9h8M8 13h5',friends:'M2 21v-2a6 6 0 0 1 12 0v2M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M17 4a4 4 0 0 1 0 8m0 3a5 5 0 0 1 5 5v1'};
 paths.settings='M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1 1-3M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8';
 const icon=kind=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+paths[kind]+'"/></svg>';
 const label=n=>(n.getAttribute('aria-label')||n.getAttribute('title')||n.textContent||'').trim();
 const own=(tag,kind)=>{const n=document.createElement(tag);n.dataset.controlSnapOwned=kind;return n;};
 const tag=(n,key,value='')=>{if(n.getAttribute(key)!==value)n.setAttribute(key,value);};
 function create(){
  const style=own('style','mobile-ui'),headers=new Map(),labels=new Map(),abort=new AbortController();
  style.textContent=`
  @media(max-width:700px),(max-width:950px) and (max-height:600px) and (pointer:coarse){
   html[data-control-snap] [data-csm-header]{display:block!important;position:sticky!important;top:0!important;z-index:8!important;box-sizing:border-box!important;min-height:0!important;height:auto!important;padding:calc(8px + env(safe-area-inset-top,0px)) 12px 8px!important;margin:0!important;background:#fff!important}
   [data-csm-header] > :not([data-control-snap-owned="mobile-toolbar"]):not([data-control-snap-owned="search"]){display:none!important}
   [data-csm-header-source]{display:none!important}
   [data-control-snap-owned="mobile-toolbar"]{display:flex!important;position:relative;align-items:center;justify-content:space-between;height:48px;gap:8px;font-family:system-ui}
   .csm-left,.csm-right{display:flex;gap:5px;align-items:center}
   .csm-left [data-kind="profile"]{order:0}.csm-left [data-kind="search"]{order:1}
   .csm-title{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font:700 clamp(24px,7.2vw,30px)/1.2 system-ui;color:#16181b;pointer-events:none;margin:0}
   [data-control-snap-owned="mobile-toolbar"] button{appearance:none;position:relative;display:grid;place-items:center;flex:0 0 40px;width:40px;height:44px;padding:8px;border:0;border-radius:50%;background:#f1f3f4;color:#333b42;cursor:pointer}
   [data-control-snap-owned="mobile-toolbar"] button[data-kind="add"]{background:#fffc00;color:#111}
   [data-control-snap-owned="mobile-toolbar"] .csm-left button{width:44px;height:48px;flex-basis:44px}
   [data-control-snap-owned="mobile-toolbar"] .csm-right button{width:clamp(32px,9.7vw,44px);height:44px;flex-basis:clamp(32px,9.7vw,44px)}
   [data-control-snap-owned="mobile-toolbar"] button:disabled{opacity:.45;cursor:default}
   [data-control-snap-owned="mobile-toolbar"] svg{width:25px;height:25px}
   [data-control-snap-owned="mobile-toolbar"] img{width:32px;height:36px;object-fit:contain;border-radius:50%}
   html [data-csm-header] [data-control-snap-owned="search"]{display:none!important;padding:8px 0 0!important;order:0!important}
   html [data-csm-header][data-csm-search-open] [data-control-snap-owned="search"]{display:flex!important;align-items:center!important;gap:8px!important;animation:csm-in .15s ease-out}
   html [data-csm-header] [data-control-snap-owned="search"] input{width:100%!important;flex:1!important;min-width:0!important;height:40px!important;margin:0!important;padding:0 14px!important;font:16px system-ui!important}
   .csm-cancel{border:0;background:transparent;color:#424b54;padding:10px 0;font:500 13px system-ui;min-height:44px}
   html[data-control-snap] [data-csm-row]{box-sizing:border-box!important;display:grid!important;grid-template-columns:58px minmax(0,1fr) 44px!important;grid-template-rows:1fr!important;align-items:center!important;gap:12px!important;padding:8px 16px!important;min-height:var(--control-row-height,84px)!important;height:var(--control-row-height,84px)!important;overflow:hidden!important}
   html[data-control-snap] [data-csm-row] [data-csm-flat]{display:contents!important}
   html[data-control-snap] [data-csm-row] [data-control-snap-avatar-slot]{grid-column:1!important;grid-row:1 / 3!important;width:58px!important;min-width:58px!important;max-width:58px!important;height:58px!important;min-height:58px!important;max-height:58px!important;isolation:isolate;overflow:hidden!important;background:#f1f3f4!important;border-radius:50%!important}
   html[data-control-snap] [data-csm-row] [data-control-snap-text-slot]{grid-column:2!important;grid-row:1 / 3!important;min-width:0!important;align-self:center!important}
   html[data-control-snap] [data-csm-row]{grid-template-rows:1fr 1fr!important;row-gap:0!important}
   html[data-control-snap] [data-csm-row] [data-csm-name]{grid-column:2!important;grid-row:1!important;align-self:end!important}
   html[data-control-snap] [data-csm-row] [data-csm-status]{grid-column:2!important;grid-row:2!important;align-self:start!important}
   html[data-control-snap] [data-csm-row] [data-control-snap-name-line]{font:500 clamp(20px,5.2vw,22px)/26px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif!important;min-height:26px!important;max-height:26px!important}
   html[data-control-snap] [data-csm-row] [data-control-snap-status-line]{display:flex!important;flex-wrap:nowrap!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;font:400 16px/22px system-ui!important;color:#6e7783!important;max-height:22px!important;min-height:22px!important}
   html[data-control-snap] [data-csm-row] [data-control-snap-status-line] :is(span,div,time){min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;font:inherit!important;color:inherit!important}
   html[data-control-snap] [data-csm-row] [data-control-snap-status-line] svg{width:20px!important;height:20px!important;min-width:20px!important;flex:0 0 20px!important;overflow:visible!important}
   html[data-control-snap] [data-csm-row] [data-csm-action]{display:grid!important;grid-column:3!important;grid-row:1!important;position:static!important;inset:auto!important;transform:none!important;place-items:center!important;width:44px!important;min-width:44px!important;max-width:44px!important;height:44px!important;max-height:44px!important;padding:7px!important;margin:0!important;background:transparent!important;border:0!important;border-radius:12px!important;font-size:0!important;color:#303840!important;cursor:pointer!important}
   html[data-control-snap] [data-csm-action]>:not([data-control-snap-owned="row-icon"]){display:none!important}
   html[data-control-snap] [data-csm-action] [data-control-snap-owned="row-icon"],html[data-control-snap] [data-csm-action] [data-control-snap-owned="row-icon"] svg{display:block!important;width:28px!important;height:28px!important}
   html[data-control-snap] :is([data-csm-action-secondary],[data-csm-action-caption]){display:none!important}
   html[data-control-snap] [data-csm-row] [data-csm-action]{grid-row:1 / 3!important}
   html[data-control-snap-view="messages"] [data-control-snap-contacts]{padding-bottom:calc(16px + env(safe-area-inset-bottom,0px))!important}
   html[data-control-snap] [data-csm-row] [data-csm-flat]{position:static!important;inset:auto!important;transform:none!important;clip-path:none!important;overflow:visible!important;padding:0!important;margin:0!important}
   html[data-control-snap] [data-csm-row] [data-csm-action]::before,html[data-control-snap] [data-csm-row] [data-csm-action]::after{content:none!important;display:none!important}
   @keyframes csm-in{from{opacity:0}to{opacity:1}}
   @media(prefers-reduced-motion:reduce){[data-csm-header] *{animation:none!important}}
  }
  @media(min-width:701px){[data-control-snap-owned="mobile-toolbar"]{display:none}}

  @media(max-width:700px),(max-width:950px) and (max-height:600px) and (pointer:coarse){
   html[data-control-snap] [data-csm-header]{padding:calc(6px + env(safe-area-inset-top,0px)) 10px 10px!important}
   .csm-title{font:600 22px/28px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif!important}
   [data-control-snap-owned="mobile-toolbar"]{height:48px!important}
   [data-control-snap-owned="mobile-toolbar"] button{width:40px!important;height:40px!important;flex-basis:40px!important;background:#f0f1f3!important}
   [data-control-snap-owned="mobile-toolbar"] svg{width:23px!important;height:23px!important}
   html[data-control-snap] [data-csm-row]{position:relative!important;grid-template-columns:48px minmax(0,1fr)!important;grid-template-rows:24px 18px!important;align-content:center!important;column-gap:9px!important;row-gap:1px!important;padding:7px 10px!important;min-height:var(--control-row-height,66px)!important;height:var(--control-row-height,66px)!important;overflow:visible!important}
   html[data-control-snap] [data-csm-row][data-csm-virtual]{position:absolute!important}
   html[data-control-snap] [data-csm-row] [data-control-snap-avatar-slot]{width:48px!important;min-width:48px!important;max-width:48px!important;height:48px!important;min-height:48px!important;max-height:48px!important;overflow:visible!important;background:#f0f1f3!important;border-radius:50%!important;position:relative!important;align-self:center!important}
   html[data-control-snap] [data-csm-row] [data-control-snap-name-line]{font:400 19px/24px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif!important;min-height:24px!important;max-height:24px!important;min-width:0!important;width:100%!important;margin:0!important;padding:0!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;color:#171a1c!important}
   html[data-control-snap] [data-csm-row] [data-csm-status]{display:flex!important;align-items:center!important;gap:7px!important;min-width:0!important;width:100%!important;height:18px!important;min-height:18px!important;max-height:18px!important;padding:0!important;margin:0!important;font:400 13px/18px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif!important;color:#727a86!important;pointer-events:none!important;overflow:visible!important}
   .csm-status-text{display:block!important;min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
   .csm-status-icon,.csm-status-icon svg{display:block!important;width:14px!important;height:14px!important;min-width:14px!important;flex:0 0 14px!important;overflow:visible!important}
   html[data-control-snap] [data-csm-original-status]{position:absolute!important;width:1px!important;height:1px!important;clip-path:inset(50%)!important;overflow:hidden!important;white-space:nowrap!important}
   html[data-control-snap] [data-csm-row] [data-csm-action]{display:block!important;position:absolute!important;grid-column:1 / -1!important;grid-row:1 / -1!important;inset:auto 0 0 57px!important;transform:none!important;width:auto!important;min-width:0!important;max-width:none!important;height:24px!important;max-height:24px!important;padding:0!important;margin:0!important;opacity:0!important;z-index:3!important;cursor:pointer!important;clip-path:none!important;overflow:visible!important;pointer-events:auto!important}
   html[data-control-snap] [data-csm-row] [data-csm-action]>*{display:none!important}
   html[data-control-snap] [data-csm-row] [data-control-snap-row-camera],html[data-control-snap] [data-csm-distraction]{display:none!important}
   html[data-control-snap] [data-csm-row] [data-control-snap-group] [data-control-snap-member="0"]{position:absolute!important;inset:auto auto 0 8%!important;width:84%!important;height:94%!important;z-index:3!important;opacity:1!important;object-fit:contain!important}
   html[data-control-snap] [data-csm-row] [data-control-snap-group] [data-control-snap-member="1"]{position:absolute!important;inset:4% auto auto -2%!important;width:58%!important;height:82%!important;z-index:1!important;opacity:.4!important;object-fit:contain!important}
   html[data-control-snap] [data-csm-row] [data-control-snap-group] [data-control-snap-member="2"]{position:absolute!important;inset:4% -2% auto auto!important;width:58%!important;height:82%!important;z-index:1!important;opacity:.4!important;object-fit:contain!important}
   html[data-control-snap] [data-csm-row] [data-control-snap-badge]{position:absolute!important;inset:auto auto -2px -2px!important;display:grid!important;place-items:center!important;width:17px!important;height:17px!important;min-width:17px!important;max-width:17px!important;font:14px/17px system-ui!important;z-index:5!important;background:#fff!important;border-radius:50%!important;overflow:visible!important}
  }
`;document.documentElement.append(style);
  function header(list){
   list.querySelectorAll('[data-csm-header-source]').forEach(n=>n.removeAttribute('data-csm-header-source'));
   const h=list.querySelector('[data-control-snap-toolbar]');if(!h)return;tag(h,'data-csm-header');
   let entry=headers.get(h);
   if(!entry){const bar=own('div','mobile-toolbar');bar.innerHTML='<div class="csm-left"></div><h1 class="csm-title">Chat</h1><div class="csm-right"></div>';h.prepend(bar);entry={bar,buttons:new Map()};headers.set(h,entry);}
   for(const id of ['control-snap-brand','control-iphone','control-snap-tabs','control-snap-new-chat'])document.getElementById(id)?.remove();
   for(const n of document.querySelectorAll('[data-testid="bottom-navigation"],[data-testid="bottom-nav"],[data-testid="chat-tabs"],[role="tablist"]'))if(!n.closest('[role="dialog"],[role="menu"],[data-control-snap-conversation],[data-csx-chat]'))tag(n,'data-csm-distraction');
   const excluded='[data-control-snap-owned],[data-control-snap-row],[role="menu"],[role="dialog"],[data-csx-settings]';
   const candidates=[...list.querySelectorAll('button,[role="button"],a,[tabindex]')].filter(n=>!n.closest(excluded));
   const description=n=>[label(n),n.getAttribute('data-testid'),...([...n.querySelectorAll('[aria-label],[title],img')].map(x=>x.getAttribute('aria-label')||x.getAttribute('title')||x.getAttribute('alt')||''))].join(' ');
   // Snapchat sometimes renders the account entry as an unlabelled image/div,
   // separate from its native header. Use the real pre-list avatar, not a fake identity.
   const firstRow=list.querySelector('[data-control-snap-row]');
   const accountImage=[...list.querySelectorAll('img')].find(n=>!n.closest(excluded)&&firstRow&&(n.compareDocumentPosition(firstRow)&Node.DOCUMENT_POSITION_FOLLOWING)&&!n.closest('a[href*="/chat/"]'));
   const accountTarget=accountImage&&(accountImage.closest('button,[role="button"],a,[tabindex]')||accountImage);
   if(accountTarget){tag(accountTarget,'data-csm-header-source');for(let parent=accountTarget.parentElement;parent&&parent!==h&&parent!==list&&!parent.querySelector('[data-control-snap-row],input,[role="menu"],[role="dialog"]');parent=parent.parentElement)tag(parent,'data-csm-header-source');}
   const specs=[['search',null,'Rechercher','search'],['settings',/settings|paramètre|options|more|menu|plus|profil|account|compte/i,'Paramètres','settings']];
   for(const [kind,pattern,title,graphic] of specs){
    const target=pattern?(candidates.find(n=>/settings|paramètre/i.test(description(n)))||candidates.find(n=>pattern.test(description(n)))||accountTarget):null;
    let record=entry.buttons.get(kind);
    if(!record){const button=own('button','header-action');button.type='button';button.dataset.kind=kind;button.setAttribute('aria-label',title);button.innerHTML=icon(graphic);record={button,target};entry.buttons.set(kind,record);entry.bar.querySelector(kind==='profile'||kind==='search'?'.csm-left':'.csm-right').append(button);
     button.addEventListener('click',()=>{if(kind==='search'){h.toggleAttribute('data-csm-search-open');const input=h.querySelector('[data-control-snap-owned="search"] input');if(h.hasAttribute('data-csm-search-open'))input?.focus();button.setAttribute('aria-expanded',String(h.hasAttribute('data-csm-search-open')));}else if(record.target?.isConnected)record.target.click();},{signal:abort.signal});
    }record.target=target;record.button.disabled=kind!=='search'&&!target;
    record.button.title=record.button.disabled?'Action indisponible dans cette page Snapchat Web':'';
    if(target){if(!target.querySelector('[role="menu"],[role="dialog"]'))tag(target,'data-csm-header-source');for(let p=target.parentElement;p&&p!==h&&p!==list&&!p.querySelector('[data-control-snap-row],input,[role="menu"],[role="dialog"]');p=p.parentElement)tag(p,'data-csm-header-source');}
    const portrait=target?.matches('img')?target:target?.querySelector('img');
    if(kind==='profile'&&portrait){const src=portrait.getAttribute('src');if(src&&record.src!==src){record.src=src;record.button.replaceChildren(portrait.cloneNode());}}
   }
   for(const target of candidates.filter(n=>/notification|alert|add friend|ajout.*ami|more|options|menu|profil|account|compte|settings|paramètre/i.test(description(n)))){
    if(!target.querySelector('[role="menu"],[role="dialog"]'))tag(target,'data-csm-header-source');
    for(let parent=target.parentElement;parent&&parent!==h&&parent!==list&&!parent.querySelector('[data-control-snap-row],input,[role="menu"],[role="dialog"]');parent=parent.parentElement)tag(parent,'data-csm-header-source');
   }
   const box=h.querySelector('[data-control-snap-owned="search"]'),input=box?.querySelector('input');
   if(input){input.placeholder='Rechercher';input.setAttribute('aria-label','Rechercher dans les conversations');}
   if(box&&!box.querySelector('.csm-cancel')){const cancel=own('button','cancel-search');cancel.className='csm-cancel';cancel.textContent='Annuler';cancel.onclick=()=>{h.removeAttribute('data-csm-search-open');input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));entry.buttons.get('search')?.button.focus();};box.append(cancel);}
  }
  function statusGraphic(text,source){
   if(!/reçu|received|ouvert|opened|remis|delivered|envoyé|sent|nouveau|new |non lu|unread|réagi|reacted|enregistr|saved|appel|call|en attente|pending|capture|screenshot|rejou|replay/i.test(text)){
    const native=source?.querySelector('svg,img')?.cloneNode(true);if(native){native.removeAttribute('id');native.removeAttribute('data-csx-icon-replaced');}return native?.outerHTML||'';
   }
   const description=(source?.textContent||'')+' '+(source?.getAttribute('aria-label')||'');
   const paints=[...(source?.querySelectorAll('svg,path')||[])].flatMap(n=>{const c=getComputedStyle(n);return[c.color,c.fill,c.stroke]}).map(c=>c.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)?.slice(1).map(Number)).filter(Boolean);
   const nativePurple=paints.some(([r,g,b])=>r>110&&r<210&&g<170&&b>170),nativeRed=paints.some(([r,g,b])=>r>210&&g<110&&b<180),nativeBlue=paints.some(([r,g,b])=>r<70&&g>100&&b>180);
   const purple=nativePurple||/purple|violet|audio|avec son|vidéo|video/i.test(description);
   const snap=/snap/i.test(text)||nativePurple||nativeRed,saved=/enregistr|saved/i.test(text),unread=/nouveau|new |non lu|unread/i.test(text),sent=/remis|envoyé|delivered|sent/i.test(text),reacted=/réagi|reacted/i.test(text),call=/appel|call/i.test(text);
   const pending=/en attente|pending/i.test(text),capture=/capture|screenshot/i.test(text),replay=/rejou|replay/i.test(text);
   const ink=pending?'#9ca3ab':!reacted&&!call&&(snap||saved)&&!nativeBlue?(purple?'#a45bda':'#ff315c'):'#0eaeed';
   let shape=call?'M6 3 3 5c-1 7 6 14 13 15l3-3-5-4-3 2c-3-1-5-3-6-6l2-3-1-3ZM15 3h6v6m0-6-7 7':snap&&!sent&&!reacted? 'M4 4h16v16H4Z':sent||reacted?'m4 3 17 9-17 9 4-9-4-9Z':'M5 3h14a2 2 0 0 1 2 2v16l-5-4H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z';
   if(saved)shape+='M12 6v8m-4-4 4 4 4-4';
   if(capture)shape='M3 8h12m-8-4-4 4 4 4M21 16H9m8-4 4 4-4 4';
   if(replay)shape='M20 10a8 8 0 1 0-1 7M20 3v7h-7';
   const filled=!call&&!saved&&!capture&&!replay&&(unread||sent)&&!reacted;
   return '<svg viewBox="0 0 24 24" fill="'+(filled?ink:'none')+'" stroke="'+ink+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+shape+'"/></svg>';
  }
  function rows(list){
   for(const row of list.querySelectorAll('[data-control-snap-row]')){
    if(row.closest('[role="menu"],[role="dialog"],[data-csx-settings]'))continue;
    tag(row,'data-csm-row');row.toggleAttribute('data-csm-virtual',!!row.style.getPropertyValue('--control-row-height'));const name=row.querySelector('[data-control-snap-name-line]');if(!name)continue;
    row.querySelectorAll('[data-csm-action],[data-csm-action-secondary],[data-csm-flat],[data-csm-name],[data-csm-status]').forEach(n=>{for(const a of ['data-csm-action','data-csm-action-secondary','data-csm-flat','data-csm-name','data-csm-status'])n.removeAttribute(a);});
    const actionLabel=/^(voir|view|ouvrir|open|répondre|repondre|reply|appareil photo|caméra|camera)(\s+.*)?$/i;
    const actions=[...row.querySelectorAll('button,[role="button"],a,[tabindex],div[aria-label],span[aria-label]')].filter(n=>n!==row&&!n.contains(name)&&!n.closest('[data-control-snap-avatar-slot],[data-control-snap-owned]')&&actionLabel.test(label(n)));
    for(const wrapper of row.querySelectorAll('div,span')){
     if(wrapper.contains(name)||wrapper.closest('[data-control-snap-avatar-slot],[data-control-snap-owned]')||!actionLabel.test(wrapper.textContent.trim()))continue;
     const buttons=wrapper.querySelectorAll('button,[role="button"],a,[tabindex]');
     if(buttons.length===1&&!actions.includes(buttons[0])){actions.push(buttons[0]);for(const caption of wrapper.querySelectorAll('span'))if(!buttons[0].contains(caption)&&actionLabel.test(caption.textContent.trim()))tag(caption,'data-csm-action-caption');}
     else if(!buttons.length&&!wrapper.hasAttribute('data-csm-action-caption')&&!actions.some(n=>n.contains(wrapper)||wrapper.contains(n))&&!wrapper.closest('button,[role="button"],a,[tabindex]'))actions.push(wrapper);
    }
    const action=actions.find(n=>/voir|view|open|ouvrir/i.test(label(n)))||actions.find(n=>/répondre|repondre|reply/i.test(label(n)))||actions.find(n=>n.parentElement.querySelector('[data-csm-action-caption]'));
    for(const n of actions)tag(n,n===action?'data-csm-action':'data-csm-action-secondary');
    row.querySelectorAll('[data-control-snap-owned="row-icon"]').forEach(n=>n.remove());
    if(action&&!action.getAttribute('aria-label')){if(!labels.has(action))labels.set(action,null);action.setAttribute('aria-label',label(action));}
    const sources=[...row.querySelectorAll('[data-control-snap-status-line]')].filter(n=>!n.closest('[data-control-snap-owned]'));
    const read=n=>{const copy=n.cloneNode(true);copy.querySelectorAll('[data-control-snap-owned],svg,img').forEach(n=>n.remove());copy.querySelectorAll('button,[role="button"],a').forEach(n=>{if(!/^(reçu|received|nouveau|new |remis|delivered|envoyé|sent|ouvert|opened|enregistr|saved)/i.test(n.textContent.trim()))n.remove();});return copy.textContent.replace(/\s+/g,' ').trim();};
    let text=sources.map(read).filter(Boolean).join(' ').replace(/(?:\s*[·•]\s*)+/g,' · ').trim();
    let line=row.querySelector('[data-control-snap-owned="status"]');
    if(text){
     if(!line){line=own('span','status');line.innerHTML='<span class="csm-status-icon"></span><span class="csm-status-text"></span>';row.append(line);}
     const content=line.querySelector('.csm-status-text');if(content.textContent!==text)content.textContent=text;
     const graphic=statusGraphic(text,sources[0]),picture=line.querySelector('.csm-status-icon');if(picture.dataset.graphic!==graphic){picture.dataset.graphic=graphic;picture.innerHTML=graphic;}
     // Keep the original status accessible; the visual copy never intercepts a tap.
     line.setAttribute('aria-hidden','true');tag(line,'data-csm-status');sources.forEach(n=>tag(n,'data-csm-original-status'));
    }else{line?.remove();line=null;sources.forEach(n=>n.removeAttribute('data-csm-original-status'));}
    tag(name,'data-csm-name');
    const avatar=row.querySelector('[data-control-snap-avatar-slot]');
    const leaves=[avatar,name,action,...(!line?sources:[])].filter(Boolean);
    for(const leaf of leaves)for(let parent=leaf.parentElement;parent&&parent!==row;parent=parent.parentElement)if(!leaves.includes(parent))tag(parent,'data-csm-flat');
    if(!line)for(const source of sources)tag(source,'data-csm-status');
   }
  }
  function refresh(){if(!matchMedia('(max-width:700px),(max-width:950px) and (max-height:600px) and (pointer:coarse)').matches)return;for(const list of document.querySelectorAll('[data-control-snap-contacts]')){header(list);rows(list);}}
  function dispose(){abort.abort();style.remove();for(const {bar}of headers.values())bar.remove();for(const [n,value]of labels)if(value===null)n.removeAttribute('aria-label');else n.setAttribute('aria-label',value);for(const n of document.querySelectorAll('[data-control-snap-owned="row-icon"],[data-control-snap-owned="cancel-search"],[data-control-snap-owned="status"]'))n.remove();for(const n of document.querySelectorAll('*'))for(const a of n.getAttributeNames())if(a.startsWith('data-csm-'))n.removeAttribute(a);}
  return{refresh,dispose};
 }
 function inspect(){
  const shape=n=>{const r=n.getBoundingClientRect(),c=getComputedStyle(n);return{tag:n.tagName,rect:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)},display:c.display,visibility:c.visibility,opacity:c.opacity,overflow:c.overflow,position:c.position,zIndex:c.zIndex,transform:c.transform,controlPane:n.hasAttribute('data-control-snap-pane'),viewer:n.hasAttribute('data-control-snap-viewer')};};
  return{viewport:{width:innerWidth,height:innerHeight,visualHeight:visualViewport?.height},view:document.documentElement.getAttribute('data-control-snap-view'),media:[...document.querySelectorAll('video,canvas,[data-csx-media]')].slice(0,12).map(n=>{const parents=[];for(let p=n.parentElement;p&&parents.length<8;p=p.parentElement)parents.push(shape(p));const r=n.getBoundingClientRect();return{...shape(n),hasSource:!!(n.currentSrc||n.getAttribute('src')||n.srcObject),readyState:n.readyState,paused:n.paused,errorCode:n.error?.code,videoWidth:n.videoWidth,videoHeight:n.videoHeight,centerStack:document.elementsFromPoint(Math.max(0,r.x+r.width/2),Math.max(0,r.y+r.height/2)).slice(0,6).map(shape),parents};})};
 }
 globalThis.ControlSnapMobileUI={create,inspect};
})();
