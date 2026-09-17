// ==UserScript==
// @name         Control — iPhone
// @namespace    https://github.com/Ozan-roni/Pelge
// @version      1.1.0
// @description  Messageries natives sans menu Control. Vidéos reçues Instagram sans enchaînement. Snapchat chat et galerie.
// @match        https://*.instagram.com/*
// @match        https://*.snapchat.com/*
// @match        https://*.facebook.com/*
// @match        https://*.messenger.com/*
// @match        https://*.reddit.com/*
// @match        https://*.x.com/*
// @match        https://*.twitter.com/*
// @run-at       document-start
// @inject-into  content
// @grant        none
// @noframes
// ==/UserScript==

/* Safari only. No server or message collection; cannot modify native apps.
   Replace the old script, then reload all affected tabs. */
(() => {
  'use strict';
  if(window.top!==window.self || globalThis.__controlIPhone)return;
  const networks=[
    {id:'Instagram',domains:['instagram.com'],url:'https://www.instagram.com/direct/inbox/'},
    {id:'Snapchat',domains:['snapchat.com'],url:'https://web.snapchat.com/'},
    {id:'Facebook',domains:['facebook.com','messenger.com'],url:'https://www.facebook.com/messages/'},
    {id:'Reddit',domains:['reddit.com'],url:'https://www.reddit.com/message/inbox/'},
    {id:'X',domains:['x.com','twitter.com'],url:'https://x.com/messages'}
  ];
  const networkFor=host=>networks.find(n=>n.domains.some(d=>host===d||host.endsWith('.'+d)));
  const app=networkFor(location.hostname);
  if(!app)return;
  globalThis.__controlIPhone=true;
  const mediaPath=url=>/^\/(?:p|reel|reels)\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)?url.pathname.replace(/\/$/,''):'';
  const tokenKey='ControlReceivedMedia.v1';
  let grant=null;
  try{grant=JSON.parse(sessionStorage.getItem(tokenKey));}catch{}
  const permits=url=>app.id==='Instagram' && networkFor(url.hostname)?.id==='Instagram' && mediaPath(url) && grant?.path===mediaPath(url) && grant.expires>Date.now();
  function kind(network,url){
    const p=url.pathname.toLowerCase();
    if(network.id==='Instagram'){
      if(/^\/direct(?:\/|$)/.test(p))return 'messages';
      if(/^\/(accounts|challenge|oauth)(\/|$)/.test(p))return 'account';
      if(permits(url))return 'media';
    }
    if(network.id==='Snapchat'){
      if(url.hostname==='accounts.snapchat.com'||/^\/(accounts|login|logout|oauth|consent|challenge)(\/|$)/.test(p))return 'account';
      if(/^\/(spotlight|discover|stories|story|map|lens|lenses|plus|add|@)/.test(p))return 'blocked';
      if((url.hostname==='web.snapchat.com' && (p==='/'||/^\/(chat|chats|conversation|conversations|camera|memories|gallery|snap)(\/|$)/.test(p)))||/^\/web(?:\/|$)/.test(p))return 'messages';
    }
    if(network.id==='X'){
      if(/^\/(messages|i\/chat)(\/|$)/.test(p))return 'messages';
      if(/^\/(settings|login|logout|account|i\/flow)(\/|$)/.test(p))return 'account';
    }
    if(network.id==='Reddit'){
      if(url.hostname==='chat.reddit.com'||/^\/(message|chat)(\/|$)/.test(p))return 'messages';
      if(/^\/(settings|prefs|account|login|logout|register|password|verify|verification|auth)(\/|$)/.test(p))return 'account';
    }
    if(network.id==='Facebook'){
      if(url.hostname==='messenger.com'||url.hostname.endsWith('.messenger.com')||/^\/messages(\/|$)/.test(p))return 'messages';
      if(/^\/(settings|login|logout|recover|checkpoint|two_step_verification|confirmemail|privacy|help|reg)(\.php)?(\/|$)/.test(p))return 'account';
    }
    return 'blocked';
  }
  const hiddenAttr='data-control-mobile-hidden';
  let scheduled=false,lastUrl='',redirecting=false;
  const style=document.createElement('style');style.id='control-iphone-rules';
  style.textContent=`
    [data-control-mobile-hidden]{display:none!important}
    html[data-control-redirecting] body{visibility:hidden!important}
    html[data-control-single-media],html[data-control-single-media] body{overflow:hidden!important;overscroll-behavior:none!important}
    html[data-control-single-media] :is(main,[role="main"],[role="dialog"]){overscroll-behavior:none!important;scroll-snap-type:none!important}
    html[data-control-single-media] video{max-height:80dvh!important;object-fit:contain!important}
    [data-control-inbox-scroll]{overflow-y:auto!important;overscroll-behavior-y:contain!important;max-height:100dvh!important;min-height:0!important}
    [data-control-inbox-flow]{position:relative!important;inset:auto!important;transform:none!important;overflow-y:visible!important;height:auto!important;max-height:none!important;flex:0 0 auto!important;box-shadow:none!important;border-block:0!important}
    [data-control-inbox-notes]{position:relative!important;inset:auto!important;transform:none!important;height:auto!important;max-height:none!important;overflow-x:auto!important;border:0!important;box-shadow:none!important;margin-block:0!important}
    html[data-control-mobile-loading] body{opacity:0!important}
    #control-native-loading{position:fixed!important;inset:0!important;display:grid!important;place-items:center!important;z-index:2147483647!important;background:#fafafa!important;pointer-events:none!important;transition:opacity .18s ease-out!important}
    #control-native-loading>span{display:block;width:68px;height:68px;position:relative;overflow:hidden;border-radius:16px}
    #control-native-loading svg{width:68px;height:68px;display:block}
    #control-native-loading i{position:absolute;inset:-40%;background:linear-gradient(110deg,transparent 42%,#fff9 50%,transparent 58%);animation:control-logo-reflection 1.7s ease-in-out infinite;pointer-events:none}
    @keyframes control-logo-reflection{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
    @media(prefers-color-scheme:dark){#control-native-loading{background:#101014!important}}
    @media(prefers-reduced-motion:reduce){#control-native-loading{transition:none!important}#control-native-loading i{animation:none;display:none}}
    @media(max-width:700px){
      html[data-control-snap] body{overflow-x:hidden!important}
      [data-control-snap-shell]{width:100%!important;max-width:100%!important;min-width:0!important}
      [data-control-snap-contacts]{width:100%!important;max-width:100%!important;min-width:0!important;flex:1 1 100%!important;height:100dvh!important;overflow-y:auto!important;overscroll-behavior:contain}
      [data-control-snap-contacts] :is([role="listitem"],a[href*="/chat/"]){min-height:72px!important}
      [data-control-snap-conversation]{width:100%!important;max-width:100%!important;min-width:0!important;flex:1 1 100%!important}
      html[data-control-snap-conversation-open] [data-control-snap-contacts]{display:none!important}
    }`;
  const visible=el=>el instanceof HTMLElement && el.getClientRects().length>0 && getComputedStyle(el).visibility!=='hidden';
  function hide(el){if(el&&!el.hasAttribute(hiddenAttr))el.setAttribute(hiddenAttr,'');}
  const signature=el=>[el.getAttribute('aria-label'),el.getAttribute('title'),el.getAttribute('data-testid')].filter(Boolean).join(' ');
  const unwanted=/spotlight|discover|découvrir|stories|story|my[ _-]?ai|près de moi|nearby|snap[ _-]?map|snapchat\+|lens_home_page/i;
  let loadingStarted=false,loader=null,loadingDeadline=0;
  function finishLoading(){
    document.documentElement.removeAttribute('data-control-mobile-loading');
    clearTimeout(loadingDeadline);
    if(!loader)return;
    const node=loader;loader=null;node.style.setProperty('opacity','0','important');setTimeout(()=>node.remove(),200);
  }
  function loading(mode){
    if(!['Instagram','Snapchat'].includes(app.id))return;
    const ready=mode==='account'||mode==='media'||document.querySelector('a[href^="/direct/t/"],textarea,[contenteditable="true"],[data-testid="conversation-list"],[data-testid="chat-list"],[aria-label="Conversations"],input[type="password"],[aria-label="New message"],[aria-label="Nouveau message"]');
    if(ready){loadingStarted=true;finishLoading();return;}
    if(loadingStarted)return;
    loadingStarted=true;loader=document.createElement('div');loader.id='control-native-loading';loader.setAttribute('role','status');loader.setAttribute('aria-label','Chargement de '+app.id);
    const instagram='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="ig-logo" x2="1" y2="1"><stop stop-color="#ffb32d"/><stop offset=".5" stop-color="#ed258f"/><stop offset="1" stop-color="#823bff"/></linearGradient></defs><rect x="1" y="1" width="22" height="22" rx="6" fill="url(#ig-logo)"/><rect x="5" y="5" width="14" height="14" rx="4" fill="none" stroke="white" stroke-width="1.6"/><circle cx="12" cy="12" r="3.4" fill="none" stroke="white" stroke-width="1.6"/><circle cx="17" cy="7" r="1" fill="white"/></svg>';
    const snapchat='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#fffc00"/><path fill="white" stroke="#050505" stroke-linejoin="round" stroke-width="1.25" d="M12 3.2c-3.2 0-4.6 2.4-4.6 5.2 0 .7.1 1.4.2 2-1 .5-1.7-.4-2.3 0-.5.4.1 1.3 1.6 1.9-.4 1.4-1.4 2.7-3 3.6-.5.3-.3 1 .2 1.2.8.3 1.5.4 2.2.6.5.1.6.7.8 1.1.4.5 1.5.1 2.5.5.8.3 1.3 1.2 2.4 1.2s1.6-.9 2.4-1.2c1-.4 2.1 0 2.5-.5.3-.4.3-1 .8-1.1.7-.2 1.4-.3 2.2-.6.5-.2.7-.9.2-1.2-1.6-.9-2.6-2.2-3-3.6 1.5-.6 2.1-1.5 1.6-1.9-.6-.4-1.3.5-2.3 0 .1-.6.2-1.3.2-2 0-2.8-1.4-5.2-4.6-5.2Z"/></svg>';
    loader.innerHTML='<span aria-hidden="true">'+(app.id==='Instagram'?instagram:snapchat)+'<i></i></span>';
    document.documentElement.setAttribute('data-control-mobile-loading','');document.documentElement.append(loader);
    loadingDeadline=setTimeout(finishLoading,6000);
  }
  function instagramInbox(){
    const first=document.querySelector('a[href^="/direct/t/"]');
    if(!first)return;
    const notesSelector='[data-control-ig-notes],[data-testid="notes"],[aria-label="Notes"],[aria-label="Statuts"]';
    const searchSelector='input[type="search"],input[placeholder*="Search" i],input[placeholder*="Recherch" i],input[aria-label*="Search" i],input[aria-label*="Recherch" i]';
    let inbox=first.parentElement;
    while(inbox&&inbox!==document.body){
      if(inbox.querySelector(notesSelector)&&inbox.querySelector(searchSelector))break;
      inbox=inbox.parentElement;
    }
    if(!inbox||inbox===document.body||inbox.querySelector('[role="log"],[contenteditable="true"],textarea'))return;
    inbox.setAttribute('data-control-inbox-scroll','');
    // Keep the actual nodes/listeners. Only remove nested vertical scrolling and sticky positioning.
    const targets=[first,inbox.querySelector(searchSelector),inbox.querySelector(notesSelector)];
    for(const target of targets)for(let node=target?.parentElement;node&&node!==inbox;node=node.parentElement)node.setAttribute('data-control-inbox-flow','');
    const notes=inbox.querySelector(notesSelector);notes.setAttribute('data-control-inbox-notes','');
  }
  function snapchat(){
    document.documentElement.setAttribute('data-control-snap','');
    for(const el of document.querySelectorAll('aside,section,[role="region"],iframe'))if(unwanted.test(signature(el))||(el.tagName==='IFRAME'&&/\/(spotlight|discover|stories)\b/i.test(el.getAttribute('src')||'')))hide(el);
    for(const el of document.querySelectorAll('nav button,nav [role="tab"],[role="navigation"] button,[role="tablist"] [role="tab"]'))if(unwanted.test(signature(el)+' '+el.textContent.trim()))hide(el);
    for(const el of document.querySelectorAll('.tCfts.n_KES'))if(el.querySelector('.OwWqx[title*="stories" i],.OwWqx[title*="spotlight" i]'))hide(el);
    for(const el of document.querySelectorAll('.S4e9r.UnaIb'))if(el.querySelector('.FDMBo .swiper.swiper-vertical,.FDMBo video.nauoE'))hide(el);
    const root=document.querySelector('main > div');
    let contacts=document.querySelector('[data-testid="conversation-list"],[data-testid="chat-list"],[aria-label="Conversations"],[aria-label="Chat list"],[aria-label="Liste des conversations"]');
    if(!contacts&&root)contacts=[...root.children].find(el=>{const r=el.getBoundingClientRect();return r.x<24&&r.width>=240&&r.width<=460&&r.height>=400&&el.querySelector('nav,[role="list"],[role="listitem"]');});
    if(contacts){contacts.setAttribute('data-control-snap-contacts','');if(root&&root.contains(contacts))root.setAttribute('data-control-snap-shell','');}
    const conversation=document.querySelector('[data-testid="conversation-panel"],[data-testid="chat-panel"],[aria-label="Conversation"]');
    if(conversation){conversation.setAttribute('data-control-snap-conversation','');conversation.removeAttribute(hiddenAttr);}
    const composer=conversation?.querySelector('textarea,[contenteditable="true"],[role="textbox"]');
    const open=!!(visible(conversation)&&visible(composer));
    document.documentElement.toggleAttribute('data-control-snap-conversation-open',open);
    for(const el of document.querySelectorAll('[data-testid="empty-conversation"],[data-testid="chat-placeholder"]')){if(innerWidth<=700&&contacts&&!open)hide(el);else el.removeAttribute(hiddenAttr);}
  }
  function singleMedia(){
    for(const el of document.querySelectorAll('button,[role="button"],a[href]')){
      if(/^(next|previous|next reel|previous reel|suivant|suivante|précédent|précédente)(\b|$)/i.test(signature(el).trim()))hide(el);
      if(el.matches('a[href]'))try{const u=new URL(el.href,location.href);if(networkFor(u.hostname)?.id==='Instagram'&&mediaPath(u)&&!permits(u))hide(el);}catch{}
    }
    const videos=[...document.querySelectorAll('main video,[role="main"] video,[role="dialog"] video')],first=videos.find(visible);
    if(first){first.controls=true;const article=first.closest('article');if(article)for(const other of article.parentElement.children)if(other!==article&&other.matches('article'))hide(other);for(const other of videos)if(other!==first){other.pause();hide(other);}}
    for(const region of document.querySelectorAll('section,aside,[role="region"]'))if(/suggested|recommended|suggestions|recommand/i.test(signature(region)))hide(region);
  }
  function refresh(){
    scheduled=false;lastUrl=location.href;if(!document.documentElement)return;
    if(!style.isConnected)document.documentElement.append(style);
    document.getElementById('control-iphone')?.remove();
    document.documentElement.removeAttribute('data-control-mobile-covered');
    const mode=kind(app,new URL(location.href));
    document.documentElement.toggleAttribute('data-control-single-media',mode==='media');
    if(mode==='blocked'){document.documentElement.setAttribute('data-control-redirecting','');if(!redirecting){redirecting=true;location.replace(app.url);}return;}
    redirecting=false;document.documentElement.removeAttribute('data-control-redirecting');
    if(refresh.mode!==mode){document.querySelectorAll('['+hiddenAttr+']').forEach(el=>el.removeAttribute(hiddenAttr));refresh.mode=mode;}
    loading(mode);
    if(mode==='account')return;
    for(const link of document.querySelectorAll('nav a[href],[role="navigation"] a[href]'))try{const url=new URL(link.href,location.href),n=networkFor(url.hostname);if(n?.id===app.id&&kind(n,url)==='blocked')hide(link);}catch{}
    if(mode==='media')singleMedia();if(app.id==='Snapchat')snapchat();
    if(app.id==='Instagram'&&mode==='messages')instagramInbox();
  }
  document.addEventListener('click',event=>{
    const link=event.target instanceof Element?event.target.closest('a[href]'):null;if(!link)return;
    let url;try{url=new URL(link.href,location.href);}catch{return;}
    if(networkFor(url.hostname)?.id!==app.id)return;
    if(app.id==='Instagram'&&kind(app,new URL(location.href))==='messages'&&mediaPath(url)&&!link.closest('nav,[role="navigation"]')&&event.isTrusted){
      grant={path:mediaPath(url),expires:Date.now()+10*60*1000};try{sessionStorage.setItem(tokenKey,JSON.stringify(grant));}catch{}
      link.target='_self';return;
    }
    if(kind(app,url)==='blocked'){event.preventDefault();event.stopImmediatePropagation();}
  },true);
  function stopContinuation(event){
    if(kind(app,new URL(location.href))!=='media')return;
    if(event.type==='keydown'&&!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','PageDown','PageUp','Home','End',' '].includes(event.key))return;
    if(event.target instanceof Element&&event.target.closest('input,textarea,[contenteditable="true"]'))return;
    event.preventDefault();event.stopImmediatePropagation();
  }
  document.addEventListener('wheel',stopContinuation,{capture:true,passive:false});
  document.addEventListener('touchmove',stopContinuation,{capture:true,passive:false});
  document.addEventListener('keydown',stopContinuation,true);
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(refresh);}}
  new MutationObserver(schedule).observe(document,{childList:true,subtree:true});
  window.addEventListener('popstate',refresh);window.addEventListener('pageshow',refresh);window.addEventListener('resize',schedule);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();else finishLoading();});
  setInterval(()=>{if(lastUrl!==location.href||(grant&&grant.expires<=Date.now())){if(grant?.expires<=Date.now()){grant=null;try{sessionStorage.removeItem(tokenKey);}catch{}}refresh();}},200);
  refresh();
})();
