// ==UserScript==
// @name         Control — iPhone
// @namespace    https://github.com/Ozan-roni/Pelge
// @version      1.3.0
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
    #control-native-loading{position:fixed!important;inset:0!important;display:grid!important;place-items:center!important;z-index:2147483647!important;background:#fafafa!important;pointer-events:none!important;transition:opacity .32s ease-out!important}
    #control-native-loading[data-network="Snapchat"]{background:#fff!important}
    #control-native-loading .control-snap-mark{border-radius:0;overflow:visible}
    #control-native-loading .control-snap-mark i{inset:0;background:linear-gradient(110deg,transparent 25%,#fff 48%,transparent 70%);background-size:300% 100%;animation:control-outline-reflection 1.8s ease-in-out infinite;-webkit-mask:var(--control-snap-mask) center/contain no-repeat;mask:var(--control-snap-mask) center/contain no-repeat}
    html[data-control-snap] body{transition:opacity .3s ease-out!important}
    html[data-control-snap] #ControlUsageTimer{display:none!important}
    #control-native-loading>span{display:block;width:68px;height:68px;position:relative;overflow:hidden;border-radius:16px}
    #control-native-loading svg{width:68px;height:68px;display:block}
    #control-native-loading .control-ig-outline{overflow:visible;border-radius:0}
    #control-native-loading .control-ig-outline i{inset:0;background:linear-gradient(110deg,transparent 25%,#fff 48%,transparent 70%);background-size:300% 100%;animation:control-outline-reflection 1.7s ease-in-out infinite;-webkit-mask:var(--control-ig-mask) center/contain no-repeat;mask:var(--control-ig-mask) center/contain no-repeat}
    @keyframes control-outline-reflection{from{background-position:150% 0}to{background-position:-50% 0}}
    #control-native-loading i{position:absolute;inset:-40%;background:linear-gradient(110deg,transparent 42%,#fff9 50%,transparent 58%);animation:control-logo-reflection 1.7s ease-in-out infinite;pointer-events:none}
    @keyframes control-logo-reflection{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
    @media(prefers-color-scheme:dark){#control-native-loading{background:#101014!important}}
    @media(prefers-reduced-motion:reduce){#control-native-loading{transition:none!important}#control-native-loading i{animation:none!important;display:none!important}}
    #control-snap-tabs{display:none}
    #control-snap-tabs{min-height:0!important;max-height:var(--control-snap-bottom)!important;margin:0!important;line-height:normal!important}
    @media(max-width:700px){
      html[data-control-snap-view]{--control-snap-bottom:calc(64px + env(safe-area-inset-bottom,0px));color-scheme:light!important;background:#fff!important}
      html[data-control-snap-view] body{overflow-x:hidden!important;margin:0!important;background:#fff!important}
      [data-control-snap-shell]{display:block!important;box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;height:calc(var(--control-snap-height,100dvh) - var(--control-snap-bottom))!important;position:relative!important;background:#fff!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;overflow:hidden!important}
      [data-control-snap-contacts],[data-control-snap-pane]{box-sizing:border-box!important;position:relative!important;inset:auto!important;transform:none!important;width:100%!important;max-width:none!important;min-width:0!important;flex:1 1 100%!important;height:calc(var(--control-snap-height,100dvh) - var(--control-snap-bottom))!important;max-height:none!important;overflow-y:auto!important;overscroll-behavior:contain}
      html[data-control-snap-view="messages"] [data-control-snap-pane],html[data-control-snap-view="snap"] [data-control-snap-contacts],html[data-control-snap-view="conversation"] [data-control-snap-contacts]{display:none!important}
      html[data-control-snap-view="snap"] [data-control-snap-pane]:not([data-control-snap-camera]),html[data-control-snap-view="conversation"] [data-control-snap-pane]:not([data-control-snap-conversation]){display:none!important}
      [data-control-snap-contacts]{background:#fff!important;color:#16181b!important;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;border:0!important;border-radius:0!important;box-shadow:none!important}
      [data-control-snap-contacts] :is(nav,[role="list"],[role="listbox"]){width:100%!important;min-width:0!important;max-width:none!important;background:#fff!important}
      [data-control-snap-list-flow]{width:100%!important;max-width:none!important;min-width:0!important;background:#fff!important;color:#16181b!important}
      [data-control-snap-contacts] :is(header,[role="heading"],h1,h2){background:#fff!important;color:#16181b!important}
      [data-control-snap-row]{box-sizing:border-box!important;display:block!important;width:100%!important;min-width:0!important;max-width:none!important;min-height:var(--control-row-height,80px)!important;height:var(--control-row-height,80px)!important;padding:0!important;background:#fff!important;color:#16181b!important;border:0!important;border-bottom:1px solid #f1f2f4!important;border-radius:0!important;text-decoration:none!important;text-align:left!important;overflow:hidden!important}
      [data-control-snap-row]:active{background:#f4f5f7!important}
      [data-control-snap-row-shell]{display:block!important;position:relative!important;inset:auto!important;transform:none!important;width:100%!important;height:100%!important;min-width:0!important;margin:0!important;padding:0!important;background:transparent!important}
      [data-control-snap-row] [data-control-snap-row-layout],[data-control-snap-row][data-control-snap-row-layout]{box-sizing:border-box!important;display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-start!important;gap:14px!important;width:100%!important;height:100%!important;min-width:0!important;padding:10px 16px!important;margin:0!important;background:transparent!important;text-align:left!important}
      [data-control-snap-row][data-control-snap-row-layout]{height:var(--control-row-height,80px)!important}
      [data-control-snap-viewport]{margin:0!important;padding:0!important;min-width:0!important;max-width:100%!important;width:100%!important;border-radius:0!important}
      [data-control-snap-avatar-slot]:is(img,svg){object-fit:contain!important}
      [data-control-snap-avatar-slot]{position:relative!important;inset:auto!important;transform:none!important;width:54px!important;min-width:54px!important;max-width:54px!important;height:54px!important;min-height:54px!important;max-height:54px!important;flex:0 0 54px!important;margin:0!important;padding:0!important;border-radius:50%!important;overflow:hidden!important;background:#f0f2f4!important;box-shadow:none!important}
      [data-control-snap-avatar-slot] img{position:absolute!important;inset:0!important;transform:none!important;width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important}
      [data-control-snap-badge]{box-sizing:border-box!important;position:absolute!important;inset:auto 0 0 auto!important;display:grid!important;place-items:center!important;width:19px!important;min-width:19px!important;max-width:19px!important;height:19px!important;max-height:19px!important;margin:0!important;padding:0!important;border:1px solid #fff!important;border-radius:50%!important;box-shadow:none!important;background:#fff!important;font:13px/1 sans-serif!important;transform:none!important;z-index:1!important}
      [data-control-snap-avatar-slot] [data-control-snap-avatar-wrap]{width:100%!important;height:100%!important;min-width:0!important;max-width:100%!important;max-height:100%!important;inset:0!important;margin:0!important;padding:0!important;transform:none!important;border-radius:50%!important;box-shadow:none!important}
      [data-control-snap-text-slot]{display:flex!important;flex-direction:column!important;justify-content:center!important;position:static!important;inset:auto!important;transform:none!important;flex:1 1 0%!important;min-width:0!important;width:auto!important;max-width:none!important;height:auto!important;max-height:none!important;overflow:hidden!important;visibility:visible!important;opacity:1!important;clip:auto!important;clip-path:none!important;margin:0!important;padding:0!important;background:transparent!important;color:#17191c!important;text-align:left!important}
      [data-control-snap-text-flow]{display:block!important;position:static!important;transform:none!important;width:auto!important;height:auto!important;max-width:100%!important;visibility:visible!important;opacity:1!important;overflow:hidden!important;clip:auto!important;clip-path:none!important;color:#17191c!important;font:500 17px/1.35 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;white-space:nowrap!important;text-overflow:ellipsis!important;background:transparent!important;margin:0!important;padding:0!important}
      [data-control-snap-text-slot] :is(small,time,[data-testid*="status"]){color:#747b84!important;font-size:13px!important;font-weight:400!important}
      [data-control-snap-camera]{border-radius:0!important;margin:0!important;padding:0!important;overflow:hidden!important}
      [data-control-snap-camera-fill]{box-sizing:border-box!important;width:100%!important;max-width:none!important;min-width:0!important;height:100%!important;max-height:none!important;min-height:0!important;flex:1 1 auto!important;align-self:stretch!important;margin:0!important;padding:0!important;border-radius:0!important;aspect-ratio:auto!important}
      [data-control-snap-camera-surface]{position:relative!important;inset:auto!important;transform:none!important;display:flex!important;align-items:center!important;justify-content:center!important}
      [data-control-snap-camera-trigger]{max-width:100%!important;max-height:100%!important}
      [data-control-snap-camera-large-trigger]{box-sizing:border-box!important;position:relative!important;inset:auto!important;transform:none!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;margin:0!important;border-radius:0!important;aspect-ratio:auto!important;flex:1!important}
      html[data-control-snap-view="snap"] [data-control-snap-camera] video{display:block!important;position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:cover!important}
      @keyframes control-snap-enter{from{opacity:0}to{opacity:1}}
      [data-control-snap-enter]{animation:control-snap-enter .22s ease-out both!important}
      [data-control-snap-pane]>div{min-width:0!important;max-width:100%!important}
      [data-control-snap-conversation]{background:#fff!important;color:#17191c!important}
      [data-control-snap-camera] video{max-width:100%!important;max-height:100%!important;object-fit:contain!important}
      #control-snap-tabs{box-sizing:border-box!important;position:fixed!important;z-index:2147483000!important;inset:auto 0 0!important;display:flex!important;align-items:stretch!important;height:var(--control-snap-bottom)!important;padding:6px 18px calc(6px + env(safe-area-inset-bottom,0px))!important;background:rgba(255,255,255,.96)!important;-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);border-top:1px solid #eceef1!important;font:12px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important}
      #control-snap-tabs button{appearance:none!important;border:0!important;border-radius:16px!important;background:transparent!important;color:#717780!important;display:flex!important;flex:1!important;align-items:center!important;justify-content:center!important;flex-direction:column!important;gap:3px!important;font:600 12px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;min-height:44px!important;cursor:pointer!important;transition:background .15s,color .15s!important}
      #control-snap-tabs button[aria-pressed="true"]{color:#111!important;background:transparent!important}
      #control-snap-tabs button svg{padding:5px!important;box-sizing:content-box!important;border-radius:12px!important;transition:background .18s ease-out!important}
      #control-snap-tabs button[aria-pressed="true"] svg{background:#fffc00!important}
      #control-snap-tabs button:active{transform:scale(.97)!important}
      #control-snap-tabs button:disabled{opacity:.4!important;cursor:default!important}
      #control-snap-tabs button:focus-visible{outline:2px solid #0084ff!important;outline-offset:-2px!important}
      #control-snap-tabs svg{height:25px!important;width:25px!important;fill:none!important;stroke:currentColor!important;stroke-width:2!important;stroke-linecap:round!important;stroke-linejoin:round!important}
    }
    @media(prefers-reduced-motion:reduce){html[data-control-snap] body,#control-snap-tabs button,#control-snap-tabs svg{transition:none!important}[data-control-snap-enter]{animation:none!important}}`;
  const visible=el=>el instanceof HTMLElement && el.getClientRects().length>0 && getComputedStyle(el).visibility!=='hidden';
  function hide(el){if(el&&!el.hasAttribute(hiddenAttr))el.setAttribute(hiddenAttr,'');}
  const signature=el=>[el.getAttribute('aria-label'),el.getAttribute('title'),el.getAttribute('data-testid')].filter(Boolean).join(' ');
  const unwanted=/spotlight|discover|découvrir|stories|story|my[ _-]?ai|près de moi|nearby|snap[ _-]?map|snapchat\+|lens_home_page/i;
  let loadingStarted=false,loader=null,loadingDeadline=0;
  function finishLoading(){
    document.documentElement.removeAttribute('data-control-mobile-loading');
    clearTimeout(loadingDeadline);
    if(!loader)return;
    const node=loader;loader=null;requestAnimationFrame(()=>node.style.setProperty('opacity','0','important'));setTimeout(()=>node.remove(),360);
  }
  function loading(mode){
    if(!['Instagram','Snapchat'].includes(app.id))return;
    const ready=mode==='account'||mode==='media'||document.querySelector('a[href^="/direct/t/"],textarea,[contenteditable="true"],[data-control-snap-contacts],[data-testid="conversation-list"],[data-testid="chat-list"],[aria-label="Conversations"],input[type="password"],[aria-label="New message"],[aria-label="Nouveau message"]');
    if(ready){loadingStarted=true;finishLoading();return;}
    if(loadingStarted)return;
    loadingStarted=true;loader=document.createElement('div');loader.id='control-native-loading';loader.setAttribute('role','status');loader.setAttribute('aria-label','Chargement de '+app.id);
    loader.dataset.network=app.id;
    const instagram='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><radialGradient id="ig-logo" gradientUnits="userSpaceOnUse" cx="4" cy="24" r="28"><stop stop-color="#ffdf00"/><stop offset=".25" stop-color="#ff8500"/><stop offset=".46" stop-color="#ff3500"/><stop offset=".66" stop-color="#ff007f"/><stop offset=".84" stop-color="#ec00ff"/><stop offset="1" stop-color="#743cff"/></radialGradient></defs><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2" fill="none" stroke="url(#ig-logo)" stroke-width="1.8"/><circle cx="12" cy="12" r="4.1" fill="none" stroke="url(#ig-logo)" stroke-width="1.8"/><circle cx="17.8" cy="6.4" r="1.15" fill="url(#ig-logo)"/></svg>';
    const snapchat='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fffc00" d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/></svg>';
    loader.innerHTML='<span aria-hidden="true">'+(app.id==='Instagram'?instagram:snapchat)+'<i></i></span>';
    if(app.id==='Instagram'){
      loader.firstElementChild.className='control-ig-outline';
      loader.firstElementChild.style.setProperty('--control-ig-mask','url("data:image/svg+xml,'+encodeURIComponent(instagram.replaceAll('url(#ig-logo)','#fff'))+'")');
    }else{
      loader.firstElementChild.className='control-snap-mark';
      loader.firstElementChild.style.setProperty('--control-snap-mask','url("data:image/svg+xml,'+encodeURIComponent(snapchat)+'")');
    }
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
  let snapView='messages',snapForceInbox=false,snapLastComposer=null,snapTabs=null,snapContacts=null,snapCamera=null;
  const snapRows='[role="listitem"],[role="option"],a[href*="/chat/"],[data-testid*="conversation-item"],[data-testid*="friend-item"]';
  function snapNavigation(){
    if(snapTabs?.isConnected)return;
    snapTabs=document.createElement('nav');snapTabs.id='control-snap-tabs';snapTabs.setAttribute('aria-label','Navigation Snapchat');
    snapTabs.innerHTML='<button type="button" data-view="messages" aria-label="Messages"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-8 8H4v-7a8 8 0 1 1 16-1Z"/><path d="M8 9h8M8 13h5"/></svg><span>Messages</span></button><button type="button" data-view="snap" aria-label="Snap"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h3l2-3h6l2 3h3v14H4Z"/><circle cx="12" cy="12" r="4"/></svg><span>Snap</span></button>';
    snapTabs.addEventListener('click',event=>{
      const button=event.target.closest('button[data-view]');if(!button||button.disabled)return;
      snapView=button.dataset.view;snapForceInbox=snapView==='messages';
      // Reveal the native camera only. Never trigger permission, capture or sending automatically.
      refresh();
    });
    document.documentElement.append(snapTabs);
  }
  function snapContactRows(contacts){
    let rows=[...contacts.querySelectorAll(snapRows)];
    if(!rows.length)rows=[...contacts.querySelectorAll('button,[role="button"]')].filter(el=>el.querySelector('img')&&!el.closest('header')&&!unwanted.test(signature(el)));
    const words=text=>/\p{L}/u.test(text||'');
    for(const row of rows){
      if(row.parentElement.closest(snapRows))continue;
      if(unwanted.test(signature(row))){hide(row);continue;}
      // Virtual lists own their row offsets: keep their measured height and transform.
      if(!row.hasAttribute('data-control-snap-row')&&getComputedStyle(row).position==='absolute'){
        const height=row.getBoundingClientRect().height;if(height>0)row.style.setProperty('--control-row-height',height+'px');
      }
      row.setAttribute('data-control-snap-row','');
      for(let parent=row.parentElement;parent&&parent!==contacts;parent=parent.parentElement)parent.setAttribute('data-control-snap-list-flow','');
      for(const element of [row,...row.querySelectorAll('*')])for(const attr of ['data-control-snap-row-layout','data-control-snap-row-shell','data-control-snap-avatar-slot','data-control-snap-avatar-wrap','data-control-snap-text-slot','data-control-snap-text-flow'])element.removeAttribute(attr);
      const avatar=row.querySelector('img')||row.querySelector('[data-testid*="avatar" i],[class*="avatar" i],svg');
      let avatarGroup=avatar;
      while(avatarGroup?.parentElement&&avatarGroup.parentElement!==row&&!words(avatarGroup.parentElement.textContent))avatarGroup=avatarGroup.parentElement;
      const leaves=[...row.querySelectorAll('span,div,p,strong,small,time')].filter(el=>!avatarGroup?.contains(el)&&!el.closest('svg')&&[...el.childNodes].some(n=>n.nodeType===3&&words(n.textContent)));
      let name=leaves.find(el=>!el.matches('small,time,[data-testid*="status"]')&&!el.hasAttribute('data-control-snap-name'))||leaves.find(el=>!el.hasAttribute('data-control-snap-name'));
      let fallback=row.querySelector('[data-control-snap-name]');
      if(name){fallback?.remove();}
      else{
        const label=row.getAttribute('title')||row.getAttribute('aria-label');
        if(label&&!unwanted.test(label)){
          fallback=fallback||document.createElement('span');fallback.setAttribute('data-control-snap-name','');
          if(fallback.textContent!==label)fallback.textContent=label;
          if(!fallback.isConnected)row.append(fallback);name=fallback;
        }
      }
      if(!name)continue; // No invented identity, and no flattening of an unrecognized row.
      let layout=avatar?.parentElement||row;
      while(layout!==row&&!layout.contains(name))layout=layout.parentElement;
      // If an avatar wrapper includes the name, only its media branch becomes the avatar slot.
      layout.setAttribute('data-control-snap-row-layout','');
      for(let node=layout;node!==row;node=node.parentElement){if(node!==layout)node.setAttribute('data-control-snap-row-shell','');}
      const childOf=(node,parent)=>{while(node&&node.parentElement!==parent)node=node.parentElement;return node;};
      const avatarSlot=avatar?childOf(avatar,layout):null;
      if(avatarSlot){
        avatarSlot.setAttribute('data-control-snap-avatar-slot','');
        for(let node=avatar.parentElement;node&&node!==avatarSlot&&avatarSlot.contains(node);node=node.parentElement)node.setAttribute('data-control-snap-avatar-wrap','');
        for(const badge of avatarSlot.querySelectorAll('span,div'))if([...badge.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()&&!words(n.textContent)))badge.setAttribute('data-control-snap-badge','');
      }
      for(const leaf of [...leaves,name]){
        if(!leaf.isConnected||avatarSlot?.contains(leaf))continue;
        const slot=childOf(leaf,layout);if(!slot)continue;
        slot.setAttribute('data-control-snap-text-slot','');
        for(let node=leaf;node&&node!==slot;node=node.parentElement)node.setAttribute('data-control-snap-text-flow','');
        if(leaf===slot)leaf.setAttribute('data-control-snap-text-flow','');
      }
    }
  }
  function snapCameraLayout(pane){
    if(!pane)return;
    const controls=[...pane.querySelectorAll('video,canvas,[data-testid="camera-view"],[data-testid="camera-panel"],button,[role="button"]')].filter(el=>
      el.matches('video,canvas,[data-testid="camera-view"],[data-testid="camera-panel"]')||/camera|appareil photo|envoyer des snaps|send snaps/i.test(signature(el)+' '+el.textContent));
    for(const control of controls){
      if(control.matches('button,[role="button"]')){
        control.setAttribute('data-control-snap-camera-trigger','');
        const css=getComputedStyle(control),bounds=control.getBoundingClientRect();
        if((bounds.height>180||parseFloat(css.height)>180)&&/envoyer des snaps|send (?:a )?snaps/i.test(control.textContent))control.setAttribute('data-control-snap-camera-large-trigger','');
      }
      // Only resize wrappers on the path to the actual camera, not every div/icon/control.
      for(let node=control.parentElement;node&&node!==pane;node=node.parentElement){
        node.setAttribute('data-control-snap-camera-fill','');
        if(getComputedStyle(node).position!=='absolute')node.setAttribute('data-control-snap-camera-surface','');
      }
    }
  }
  function snapchat(){
    document.documentElement.setAttribute('data-control-snap','');
    for(const el of document.querySelectorAll('aside,section,[role="region"],iframe'))if(unwanted.test(signature(el))||(el.tagName==='IFRAME'&&/\/(spotlight|discover|stories)\b/i.test(el.getAttribute('src')||'')))hide(el);
    for(const el of document.querySelectorAll('nav button,nav [role="tab"],[role="navigation"] button,[role="tablist"] [role="tab"]'))if(unwanted.test(signature(el)+' '+el.textContent.trim()))hide(el);
    for(const el of document.querySelectorAll('button,[role="button"],[role="tab"]'))if(unwanted.test(signature(el)))hide(el);
    for(const el of document.querySelectorAll('.tCfts.n_KES'))if(el.querySelector('.OwWqx[title*="stories" i],.OwWqx[title*="spotlight" i]'))hide(el);
    for(const el of document.querySelectorAll('.S4e9r.UnaIb'))if(el.querySelector('.FDMBo .swiper.swiper-vertical,.FDMBo video.nauoE'))hide(el);
    let root=document.querySelector('main > div,[role="main"] > div');
    let contacts=document.querySelector('[data-control-snap-contacts],[data-testid="conversation-list"],[data-testid="chat-list"],[aria-label="Conversations"],[aria-label="Chat list"],[aria-label="Liste des conversations"]');
    if(!contacts&&root)contacts=[...root.children].find(el=>{const r=el.getBoundingClientRect();return r.x<28&&r.width>=40&&r.width<=460&&r.height>=280&&(el.querySelectorAll(snapRows).length>=2||el.querySelectorAll('nav img').length>=3);});
    if(!contacts){snapTabs?.remove();document.documentElement.removeAttribute('data-control-snap-view');return;}
    if(root!==contacts&&root?.contains(contacts))while(contacts.parentElement!==root&&contacts.parentElement)contacts=contacts.parentElement;
    // The common parent is a better shell than a fixed depth when Snapchat adds wrappers.
    let branch=contacts;
    while(branch.parentElement&&branch.parentElement!==document.body&&branch.parentElement.children.length===1)branch=branch.parentElement;
    if(branch.parentElement&&branch.parentElement!==document.body)root=branch.parentElement;
    if(!root||!root.contains(contacts))return;
    contacts.setAttribute('data-control-snap-contacts','');root.setAttribute('data-control-snap-shell','');snapContactRows(contacts);
    for(let parent=root.parentElement;parent&&parent!==document.body&&parent.children.length===1;parent=parent.parentElement)parent.setAttribute('data-control-snap-viewport','');
    if(snapContacts!==contacts){
      snapContacts=contacts;
      contacts.addEventListener('click',event=>{if(event.target.closest('[data-control-snap-row]')){snapForceInbox=false;snapView='messages';snapLastComposer=null;schedule();}});
    }
    const panes=[...root.children].filter(el=>el!==branch&&el!==contacts&&!el.contains(contacts)&&!el.hasAttribute(hiddenAttr));
    for(const pane of panes)pane.setAttribute('data-control-snap-pane','');
    const conversation=document.querySelector('[data-testid="conversation-panel"],[data-testid="chat-panel"],[aria-label="Conversation"]')||panes.find(el=>el.querySelector('textarea,[contenteditable="true"],[role="textbox"]'));
    const composer=conversation?.querySelector('textarea,[contenteditable="true"],[role="textbox"]');
    const paneFor=el=>panes.find(p=>p===el||p.contains(el));
    for(const pane of panes){pane.removeAttribute('data-control-snap-conversation');pane.removeAttribute('data-control-snap-camera');}
    if(conversation){conversation.removeAttribute(hiddenAttr);paneFor(conversation)?.setAttribute('data-control-snap-conversation','');}
    const previousCamera=snapCamera;
    snapCamera=panes.find(el=>el.matches('[data-testid="camera-panel"],[data-testid="camera-view"]')||el.querySelector('[data-testid="camera-panel"],[data-testid="camera-view"],button[aria-label*="camera" i],button[aria-label*="appareil photo" i]')||/send (?:a )?snaps|envoyer des snaps|cliquez sur l.appareil photo/i.test(el.textContent));
    // Capture/preview replaces the initial camera prompt; do not bounce back to the contacts.
    if(!snapCamera&&panes.includes(previousCamera)&&(!composer||!previousCamera.contains(composer)))snapCamera=previousCamera;
    if(snapCamera){snapCamera.setAttribute('data-control-snap-camera','');snapCameraLayout(snapCamera);}
    if(composer&&composer!==snapLastComposer){snapForceInbox=false;if(snapView!=='snap')snapView='messages';}
    snapLastComposer=composer||null;
    const open=!!composer&&!snapForceInbox&&snapView!=='snap';
    document.documentElement.toggleAttribute('data-control-snap-conversation-open',open);
    if(snapView==='snap'&&!snapCamera)snapView='messages';
    const nextView=open?'conversation':snapView;
    if(document.documentElement.getAttribute('data-control-snap-view')!==nextView){
      document.querySelectorAll('[data-control-snap-enter]').forEach(el=>el.removeAttribute('data-control-snap-enter'));
      (nextView==='messages'?contacts:nextView==='snap'?snapCamera:paneFor(conversation))?.setAttribute('data-control-snap-enter','');
      document.documentElement.setAttribute('data-control-snap-view',nextView);
    }
    document.documentElement.style.setProperty('--control-snap-height',(window.visualViewport?.height||innerHeight)+'px');
    snapNavigation();
    for(const button of snapTabs.querySelectorAll('button')){button.setAttribute('aria-pressed',String(button.dataset.view===snapView));button.disabled=button.dataset.view==='snap'&&!snapCamera;const title=button.disabled?'La caméra Snapchat n’est pas disponible sur cette page.':'';if(button.title!==title)button.title=title;}
    finishLoading();
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
    if(mode==='account'){snapTabs?.remove();document.documentElement.removeAttribute('data-control-snap-view');return;}
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
  new MutationObserver(schedule).observe(document,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-label','title','data-testid','href']});
  window.addEventListener('popstate',refresh);window.addEventListener('pageshow',refresh);window.addEventListener('resize',schedule);
  window.visualViewport?.addEventListener('resize',schedule);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();else finishLoading();});
  setInterval(()=>{if(lastUrl!==location.href||(grant&&grant.expires<=Date.now())){if(grant?.expires<=Date.now()){grant=null;try{sessionStorage.removeItem(tokenKey);}catch{}}refresh();}},200);
  refresh();
})();
