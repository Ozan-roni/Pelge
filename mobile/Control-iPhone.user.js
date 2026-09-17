// ==UserScript==
// @name         Control — iPhone
// @namespace    https://github.com/Ozan-roni/Pelge
// @version      1.2.0
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
    #control-native-loading .control-ig-outline{overflow:visible;border-radius:0}
    #control-native-loading .control-ig-outline i{inset:0;background:linear-gradient(110deg,transparent 25%,#fff 48%,transparent 70%);background-size:300% 100%;animation:control-outline-reflection 1.7s ease-in-out infinite;-webkit-mask:var(--control-ig-mask) center/contain no-repeat;mask:var(--control-ig-mask) center/contain no-repeat}
    @keyframes control-outline-reflection{from{background-position:150% 0}to{background-position:-50% 0}}
    #control-native-loading i{position:absolute;inset:-40%;background:linear-gradient(110deg,transparent 42%,#fff9 50%,transparent 58%);animation:control-logo-reflection 1.7s ease-in-out infinite;pointer-events:none}
    @keyframes control-logo-reflection{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
    @media(prefers-color-scheme:dark){#control-native-loading{background:#101014!important}}
    @media(prefers-reduced-motion:reduce){#control-native-loading{transition:none!important}#control-native-loading i{animation:none!important;display:none!important}}
    #control-snap-tabs{display:none}
    @media(max-width:700px){
      html[data-control-snap-view]{--control-snap-bottom:calc(68px + env(safe-area-inset-bottom,0px));color-scheme:light!important;background:#fff!important}
      html[data-control-snap-view] body{overflow-x:hidden!important;margin:0!important;background:#fff!important}
      [data-control-snap-shell]{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;height:calc(var(--control-snap-height,100dvh) - var(--control-snap-bottom))!important;position:relative!important;background:#fff!important}
      [data-control-snap-contacts],[data-control-snap-pane]{box-sizing:border-box!important;position:relative!important;inset:auto!important;transform:none!important;width:100%!important;max-width:none!important;min-width:0!important;flex:1 1 100%!important;height:calc(var(--control-snap-height,100dvh) - var(--control-snap-bottom))!important;max-height:none!important;overflow-y:auto!important;overscroll-behavior:contain}
      html[data-control-snap-view="messages"] [data-control-snap-pane],html[data-control-snap-view="snap"] [data-control-snap-contacts],html[data-control-snap-view="conversation"] [data-control-snap-contacts]{display:none!important}
      html[data-control-snap-view="snap"] [data-control-snap-pane]:not([data-control-snap-camera]),html[data-control-snap-view="conversation"] [data-control-snap-pane]:not([data-control-snap-conversation]){display:none!important}
      [data-control-snap-contacts]{background:#fff!important;color:#16181b!important;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;border:0!important;border-radius:0!important;box-shadow:none!important}
      [data-control-snap-contacts] :is(nav,[role="list"],[role="listbox"]){width:100%!important;min-width:0!important;max-width:none!important;background:#fff!important}
      [data-control-snap-list-flow]{width:100%!important;max-width:none!important;min-width:0!important;background:#fff!important;color:#16181b!important}
      [data-control-snap-text]{background:transparent!important}
      [data-control-snap-contacts] :is(header,[role="heading"],h1,h2){background:#fff!important;color:#16181b!important}
      [data-control-snap-row]{box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:14px!important;width:100%!important;min-width:0!important;max-width:none!important;min-height:84px!important;padding:12px 18px!important;background:#fff!important;color:#16181b!important;border:0!important;border-bottom:1px solid #f1f2f4!important;border-radius:0!important;text-decoration:none!important;text-align:left!important;overflow:visible!important}
      [data-control-snap-row]:active{background:#f4f5f7!important}
      [data-control-snap-row] [data-control-snap-text]{display:block!important;visibility:visible!important;opacity:1!important;width:auto!important;min-width:0!important;max-width:none!important;height:auto!important;max-height:none!important;overflow:visible!important;position:static!important;clip:auto!important;clip-path:none!important;transform:none!important;color:#17191c!important;font-size:18px!important;line-height:1.35!important;flex-shrink:1!important}
      [data-control-snap-row] :is(small,time,[data-testid*="status"]){color:#747b84!important;font-size:13px!important}
      [data-control-snap-avatar]{width:54px!important;height:54px!important;min-width:54px!important;object-fit:contain!important;flex-shrink:0!important}
      [data-control-snap-camera]{border-radius:0!important}
      [data-control-snap-pane]>div{min-width:0!important;max-width:100%!important}
      [data-control-snap-conversation]{background:#fff!important;color:#17191c!important}
      [data-control-snap-camera] video{max-width:100%!important;max-height:100%!important;object-fit:contain!important}
      #control-snap-tabs{box-sizing:border-box!important;position:fixed!important;z-index:2147483000!important;inset:auto 0 0!important;display:flex!important;align-items:stretch!important;height:var(--control-snap-bottom)!important;padding:6px 18px calc(6px + env(safe-area-inset-bottom,0px))!important;background:rgba(255,255,255,.96)!important;-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);border-top:1px solid #eceef1!important;font:12px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important}
      #control-snap-tabs button{appearance:none!important;border:0!important;border-radius:16px!important;background:transparent!important;color:#717780!important;display:flex!important;flex:1!important;align-items:center!important;justify-content:center!important;flex-direction:column!important;gap:3px!important;font:600 12px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;min-height:44px!important;cursor:pointer!important;transition:background .15s,color .15s!important}
      #control-snap-tabs button[aria-pressed="true"]{color:#111!important;background:#fffc00!important}
      #control-snap-tabs button:disabled{opacity:.4!important;cursor:default!important}
      #control-snap-tabs button:focus-visible{outline:2px solid #0084ff!important;outline-offset:-2px!important}
      #control-snap-tabs svg{height:25px!important;width:25px!important;fill:none!important;stroke:currentColor!important;stroke-width:2!important;stroke-linecap:round!important;stroke-linejoin:round!important}
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
    const ready=mode==='account'||mode==='media'||document.querySelector('a[href^="/direct/t/"],textarea,[contenteditable="true"],[data-control-snap-contacts],[data-testid="conversation-list"],[data-testid="chat-list"],[aria-label="Conversations"],input[type="password"],[aria-label="New message"],[aria-label="Nouveau message"]');
    if(ready){loadingStarted=true;finishLoading();return;}
    if(loadingStarted)return;
    loadingStarted=true;loader=document.createElement('div');loader.id='control-native-loading';loader.setAttribute('role','status');loader.setAttribute('aria-label','Chargement de '+app.id);
    const instagram='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><radialGradient id="ig-logo" gradientUnits="userSpaceOnUse" cx="4" cy="24" r="28"><stop stop-color="#ffdf00"/><stop offset=".25" stop-color="#ff8500"/><stop offset=".46" stop-color="#ff3500"/><stop offset=".66" stop-color="#ff007f"/><stop offset=".84" stop-color="#ec00ff"/><stop offset="1" stop-color="#743cff"/></radialGradient></defs><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2" fill="none" stroke="url(#ig-logo)" stroke-width="1.8"/><circle cx="12" cy="12" r="4.1" fill="none" stroke="url(#ig-logo)" stroke-width="1.8"/><circle cx="17.8" cy="6.4" r="1.15" fill="url(#ig-logo)"/></svg>';
    const snapchat='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#fffc00"/><path fill="white" stroke="#050505" stroke-linejoin="round" stroke-width="1.25" d="M12 3.2c-3.2 0-4.6 2.4-4.6 5.2 0 .7.1 1.4.2 2-1 .5-1.7-.4-2.3 0-.5.4.1 1.3 1.6 1.9-.4 1.4-1.4 2.7-3 3.6-.5.3-.3 1 .2 1.2.8.3 1.5.4 2.2.6.5.1.6.7.8 1.1.4.5 1.5.1 2.5.5.8.3 1.3 1.2 2.4 1.2s1.6-.9 2.4-1.2c1-.4 2.1 0 2.5-.5.3-.4.3-1 .8-1.1.7-.2 1.4-.3 2.2-.6.5-.2.7-.9.2-1.2-1.6-.9-2.6-2.2-3-3.6 1.5-.6 2.1-1.5 1.6-1.9-.6-.4-1.3.5-2.3 0 .1-.6.2-1.3.2-2 0-2.8-1.4-5.2-4.6-5.2Z"/></svg>';
    loader.innerHTML='<span aria-hidden="true">'+(app.id==='Instagram'?instagram:snapchat)+'<i></i></span>';
    if(app.id==='Instagram'){
      loader.firstElementChild.className='control-ig-outline';
      loader.firstElementChild.style.setProperty('--control-ig-mask','url("data:image/svg+xml,'+encodeURIComponent(instagram.replaceAll('url(#ig-logo)','#fff'))+'")');
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
    for(const row of rows){
      if(row.parentElement.closest(snapRows))continue;
      if(unwanted.test(signature(row))){hide(row);continue;}
      row.setAttribute('data-control-snap-row','');
      for(let parent=row.parentElement;parent&&parent!==contacts;parent=parent.parentElement)parent.setAttribute('data-control-snap-list-flow','');
      const avatar=row.querySelector('img');if(avatar)avatar.setAttribute('data-control-snap-avatar','');
      // Reveal existing text and its collapsed ancestors, retaining native listeners and identity.
      for(const leaf of row.querySelectorAll('span,div,p,strong,small,time')){
        if(![...leaf.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;
        for(let node=leaf;node&&node!==row;node=node.parentElement)node.setAttribute('data-control-snap-text','');
      }
      const fallback=row.querySelector('[data-control-snap-name]');
      const nativeText=[...row.childNodes].filter(n=>n!==fallback).some(n=>n.textContent.trim());
      if(nativeText){fallback?.remove();continue;}
      // Some narrow layouts omit the text node but keep the real name in accessibility metadata.
      const name=row.getAttribute('title')||row.getAttribute('aria-label');
      if(name&&!unwanted.test(name)){
        const label=fallback||document.createElement('span');
        label.setAttribute('data-control-snap-name','');label.setAttribute('data-control-snap-text','');
        if(label.textContent!==name)label.textContent=name;
        if(!fallback)row.append(label);
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
    if(snapCamera)snapCamera.setAttribute('data-control-snap-camera','');
    if(composer&&composer!==snapLastComposer){snapForceInbox=false;if(snapView!=='snap')snapView='messages';}
    snapLastComposer=composer||null;
    const open=!!composer&&!snapForceInbox&&snapView!=='snap';
    document.documentElement.toggleAttribute('data-control-snap-conversation-open',open);
    if(snapView==='snap'&&!snapCamera)snapView='messages';
    document.documentElement.setAttribute('data-control-snap-view',open?'conversation':snapView);
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
