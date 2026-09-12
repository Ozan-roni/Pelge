// ==UserScript==
// @name         Control — iPhone
// @namespace    https://github.com/Ozan-roni/Pelge
// @version      1.0.0
// @description  Un menu local pour les messages Instagram, Facebook, Reddit et X. Bloque les fils et la découverte dans Safari.
// @match        https://*.instagram.com/*
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

/* Self-contained Safari edition. No server, Chrome API, analytics or message collection.
   It does not provide desktop usage limits or modify the native social-network apps. */
(() => {
  'use strict';
  if (window.top !== window.self || globalThis.__controlIPhone) return;
  const networks = [
    {id:'Instagram', name:'Instagram', domains:['instagram.com'], url:'https://www.instagram.com/direct/inbox/', mark:'◎', color:'#e63ca5'},
    {id:'Facebook', name:'Facebook', domains:['facebook.com','messenger.com'], url:'https://www.facebook.com/messages/', mark:'f', color:'#1877f2'},
    {id:'Reddit', name:'Reddit', domains:['reddit.com'], url:'https://www.reddit.com/message/inbox/', mark:'r', color:'#ff5700'},
    {id:'X', name:'X / Twitter', domains:['x.com','twitter.com'], url:'https://x.com/messages', mark:'𝕏', color:'#71717a'}
  ];
  const networkFor = host => networks.find(app => app.domains.some(domain => host === domain || host.endsWith('.'+domain)));
  const app = networkFor(location.hostname.toLowerCase());
  if (!app) return;
  globalThis.__controlIPhone = true;

  function routeKind(network, url) {
    const path = url.pathname.toLowerCase();
    if (network.id === 'Instagram') {
      if (/^\/direct(\/|$)/.test(path)) return 'messages';
      if (/^\/(accounts|challenge|oauth)(\/|$)/.test(path)) return 'account';
    }
    if (network.id === 'X') {
      if (/^\/(messages|i\/chat)(\/|$)/.test(path)) return 'messages';
      if (/^\/(settings|login|logout|account|i\/flow)(\/|$)/.test(path)) return 'account';
    }
    if (network.id === 'Reddit') {
      if (url.hostname === 'chat.reddit.com' || /^\/(message|chat)(\/|$)/.test(path)) return 'messages';
      if (/^\/(settings|prefs|account|login|logout|register|password|verify|verification|auth)(\/|$)/.test(path)) return 'account';
    }
    if (network.id === 'Facebook') {
      if (url.hostname === 'messenger.com' || url.hostname.endsWith('.messenger.com') || /^\/messages(\/|$)/.test(path)) return 'messages';
      if (/^\/(settings|login|logout|recover|checkpoint|two_step_verification|confirmemail|privacy|help|reg)(\.php)?(\/|$)/.test(path)) return 'account';
    }
    return 'blocked';
  }

  let menuOpen = new URL(location.href).searchParams.get('control') === 'home';
  let blocked = routeKind(app, new URL(location.href)) === 'blocked';
  let host, shadow, gate, scheduled = false, previousFocus = null;
  let lastUrl = location.href, renderedMode = '';

  function setCovered(covered) {
    if (!document.documentElement) return;
    document.documentElement.toggleAttribute('data-control-mobile-covered', covered);
  }
  // Apply the route gate before waiting for the native page to finish loading.
  setCovered(blocked || menuOpen);

  function mount() {
    if (!document.documentElement) return false;
    if (!gate) {
      gate = document.createElement('style');
      gate.id = 'control-iphone-gate';
      gate.textContent = 'html[data-control-mobile-covered]{overflow:hidden!important}html[data-control-mobile-covered] body{visibility:hidden!important;pointer-events:none!important}[data-control-mobile-hidden]{display:none!important}';
    }
    if (!gate.isConnected) document.documentElement.append(gate);
    if (host) {
      if (!host.isConnected) document.documentElement.append(host);
      return true;
    }
    host = document.createElement('div');
    host.id = 'control-iphone';
    host.style.cssText = 'all:initial!important;position:fixed!important;inset:0!important;z-index:2147483647!important;pointer-events:none!important;';
    shadow = host.attachShadow({mode:'open'});
    shadow.innerHTML = `
      <style>
        :host{--paper:#f7f7fb;--card:#fff;--ink:#22232c;--muted:#727381;--line:#e4e4ec;--accent:#7253df;color:var(--ink);font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        *{box-sizing:border-box} [hidden]{display:none!important}
        button,a{-webkit-tap-highlight-color:transparent;font:inherit}button{cursor:pointer}a{color:inherit;text-decoration:none}
        .toggle{position:fixed;right:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 82px);pointer-events:auto;border:1px solid var(--line);border-radius:24px;padding:10px 16px;min-height:44px;background:var(--card);color:var(--ink);box-shadow:0 4px 18px #0002;font-size:13px;font-weight:650}
        .screen{position:fixed;inset:0;overflow:auto;overscroll-behavior:contain;pointer-events:auto;background:var(--paper);padding:calc(env(safe-area-inset-top,0px) + 28px) 22px calc(env(safe-area-inset-bottom,0px) + 28px);display:flex;align-items:center;justify-content:center;animation:appear .28s ease-out both}
        .content{width:100%;max-width:440px;margin:auto}.heading{display:flex;align-items:center;justify-content:space-between;gap:12px}.brand{font-size:13px;font-weight:700;letter-spacing:.12em;color:var(--accent)}
        .close{border:1px solid var(--line);border-radius:50%;background:var(--card);color:var(--ink);width:44px;height:44px;font-size:24px}
        h1{font-size:clamp(27px,7vw,36px);line-height:1.15;letter-spacing:-.04em;margin:26px 0 12px}p{color:var(--muted);font-size:14px;margin:0 0 24px}
        .primary{display:block;text-align:center;border-radius:16px;padding:15px 18px;min-height:50px;background:var(--accent);color:white;font-weight:650;margin-bottom:22px}
        .networks{display:grid;gap:10px}.network{display:flex;align-items:center;gap:14px;border:1px solid var(--line);background:var(--card);padding:14px;border-radius:18px;min-height:76px}
        .mark{display:grid;place-items:center;width:42px;height:42px;flex-shrink:0;border-radius:13px;background:var(--brand-color);color:white;font-size:27px;font-weight:750}
        .network strong{display:block;font-size:15px}.network small{display:block;color:var(--muted);font-size:12px;margin-top:2px}.arrow{margin-left:auto;color:var(--muted)}
        .foot{font-size:12px;margin-top:22px;margin-bottom:0}.network:active,.primary:active{opacity:.78}a:focus-visible,button:focus-visible{outline:3px solid var(--accent);outline-offset:3px}
        @keyframes appear{from{opacity:0}to{opacity:1}}
        @media(prefers-color-scheme:dark){:host{--paper:#111116;--card:#1b1b23;--ink:#f4f3fa;--muted:#a4a2b4;--line:#30303c;--accent:#a48bf8}.primary{color:#171124}}
        @media(prefers-reduced-motion:reduce){.screen{animation:none}}
      </style>
      <button class="toggle" aria-label="Ouvrir Control" aria-expanded="false">Control</button>
      <section class="screen" role="dialog" aria-modal="true" aria-labelledby="control-title" hidden>
        <div class="content">
          <div class="heading"><span class="brand">CONTROL · SAFARI</span><button class="close" aria-label="Fermer Control">×</button></div>
          <h1 id="control-title"></h1><p class="description"></p>
          <a class="primary"></a>
          <nav class="networks" aria-label="Choisir un réseau"></nav>
          <p class="foot">Messages uniquement · Sur cet iPhone<br>Les réseaux restent soumis aux fonctions disponibles dans Safari.</p>
        </div>
      </section>`;
    for (const network of networks) {
      const link = document.createElement('a');
      link.className = 'network';link.href = network.url;
      link.innerHTML = `<span class="mark" aria-hidden="true"></span><span><strong></strong><small>Ouvrir les messages</small></span><span class="arrow" aria-hidden="true">›</span>`;
      link.querySelector('.mark').textContent = network.mark;
      link.style.setProperty('--brand-color',network.color);
      link.querySelector('strong').textContent = network.name;
      link.addEventListener('click', () => { menuOpen=false; });
      shadow.querySelector('.networks').append(link);
    }
    shadow.querySelector('.toggle').addEventListener('click', () => {
      previousFocus=shadow.activeElement || document.activeElement;menuOpen=true;render();shadow.querySelector('.close').focus();
    });
    const close = () => {
      if (blocked) return;
      menuOpen=false;render();
      if (previousFocus?.isConnected) previousFocus.focus();else shadow.querySelector('.toggle').focus();
    };
    shadow.querySelector('.close').addEventListener('click',close);
    shadow.querySelector('.primary').addEventListener('click',()=>{menuOpen=false;});
    shadow.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();close();}
      if(event.key==='Tab' && (blocked || menuOpen)){
        const visible=[...shadow.querySelectorAll('.screen a,.screen button')].filter(node=>!node.hidden);
        const first=visible[0],last=visible.at(-1),focused=shadow.activeElement;
        if(event.shiftKey && focused===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey && focused===last){event.preventDefault();first.focus();}
      }
    });
    document.documentElement.append(host);
    return true;
  }

  function render() {
    const covered = blocked || menuOpen;
    setCovered(covered);
    if (!shadow) return;
    const mode = blocked ? 'blocked' : menuOpen ? 'menu' : 'closed';
    if (mode === renderedMode) return;
    renderedMode = mode;
    shadow.querySelector('.toggle').hidden=covered;
    shadow.querySelector('.toggle').setAttribute('aria-expanded',String(covered));
    shadow.querySelector('.screen').hidden=!covered;
    shadow.querySelector('.close').hidden=blocked;
    shadow.querySelector('h1').textContent=blocked?'Le fil fait une pause.':'Tes conversations, simplement.';
    shadow.querySelector('.description').textContent=blocked?`Le fil et la découverte de ${app.name} sont bloqués. Tes messages et les pages de connexion restent accessibles.`:'Choisis un réseau. Control garde ses fils et sa découverte bloqués dans Safari.';
    const primary=shadow.querySelector('.primary');
    primary.hidden=!blocked;primary.href=app.url;primary.textContent=`Ouvrir les messages ${app.name}`;
    if(blocked) primary.focus();
  }

  function refresh() {
    scheduled=false;
    const url=new URL(location.href);
    if (lastUrl !== location.href) {lastUrl=location.href;menuOpen=url.searchParams.get('control')==='home';}
    const kind=routeKind(app,url);
    blocked=kind==='blocked';
    if (!mount()) return;
    render();
    // Only navigation links are filtered, never links or media inside conversations.
    const marked=[...document.querySelectorAll('[data-control-mobile-hidden]')];
    const unwanted=new Set();
    if(kind==='messages') for(const link of document.querySelectorAll('nav a[href],[role="navigation"] a[href]')){
      try{
        const target=new URL(link.getAttribute('href'),location.href),network=networkFor(target.hostname.toLowerCase());
        if(network?.id===app.id && routeKind(network,target)==='blocked') unwanted.add(link);
      }catch{/* Preserve non-URL native controls. */}
    }
    for(const link of marked) if(!unwanted.has(link)) link.removeAttribute('data-control-mobile-hidden');
    for(const link of unwanted) link.setAttribute('data-control-mobile-hidden','true');
  }
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(refresh);}}
  new MutationObserver(schedule).observe(document,{childList:true,subtree:true});
  window.addEventListener('popstate',refresh);
  window.addEventListener('pageshow',refresh);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  setInterval(()=>{if(lastUrl!==location.href)refresh();},200);
  refresh();
})();
