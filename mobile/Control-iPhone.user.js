// ==UserScript==
// @name         Control — iPhone
// @namespace    https://github.com/Ozan-roni/Pelge
// @version      1.6.0
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

/* BEGIN SHARED SNAPCHAT EXPERIENCE */
/* Shared presentation controller. No private APIs, message persistence, stream capture or owned media copies. */
(() => {
  'use strict';
  if (globalThis.ControlSnapExperience || !/(^|\.)snapchat\.com$/.test(location.hostname)) return;
  const selectors = Object.freeze({
    contacts: '[data-testid="conversation-list"],[data-testid="chat-list"],[aria-label="Conversations"],[aria-label="Chat list"],[aria-label="Liste des conversations"],[data-control-snap-contacts]',
    rows: '[role="listitem"],[role="option"],a[href*="/chat/"],[data-testid*="conversation-item"],[data-testid*="friend-item"]',
    conversation: '[data-testid="conversation-panel"],[data-testid="chat-panel"],[aria-label="Conversation"],[data-control-snap-conversation]',
    log: '[role="log"],[data-testid="message-list"],[data-testid="chat-history"],[data-control-snap-chat-log]',
    composer: 'textarea,[contenteditable="true"],[role="textbox"]',
    identity: '[data-display-name],[data-friend-name],[data-testid*="display-name"],[data-testid*="friend-name"],[data-testid*="username"],h1,h2,h3,h4,[class*="name" i]',
    viewer: '[data-testid="snap-viewer"],[data-testid="media-viewer"],[role="dialog"][aria-label*="Snap" i]',
    call: '[data-testid="call-view"],[data-testid="video-call"],[data-testid="call-panel"],[role="dialog"][aria-label="Video call"],[role="dialog"][aria-label="Appel vidéo"]',
    camera: '[data-testid="camera-panel"],[data-testid="camera-view"]',
    next: 'button[aria-label="Next Snap"],button[aria-label="Snap suivant"],button[data-testid="next-snap"]',
    previous: 'button[aria-label="Previous Snap"],button[aria-label="Snap précédent"],button[data-testid="previous-snap"]',
    close: 'button[aria-label="Close"],button[aria-label="Fermer"],button[aria-label="Close Snap"],button[aria-label="Fermer le Snap"],[data-testid="close-snap"]',
    snapItems: '[data-snap-id]',
    currentMedia: '[data-current="true"] video,[data-current="true"] img,[aria-current="true"] video,[aria-current="true"] img,video:not([hidden]),img:not([hidden])'
  });
  const validName = value => {
    const text = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
    return text && text.length <= 160 && /[\p{L}\p{N}]/u.test(text) && !/^(null|undefined|loading|chargement|conversation|unknown|inconnu|reçue?|ouverte?|remis|envoyé|received|opened|delivered|sent|saved|new snap|nouveau snap)(\b|$)/i.test(text) ? text : '';
  };
  const label = node => node?.getAttribute('aria-label') || node?.getAttribute('title') || '';
  const shown = node => !!node?.isConnected && !node.hidden && node.getClientRects().length > 0 && getComputedStyle(node).display !== 'none' && (getComputedStyle(node).visibility !== 'hidden'||node.getAttribute('data-csx-ready')==='LOADING');
  const mark = (node, name, value = '') => { if (node && node.getAttribute(name) !== value) node.setAttribute(name, value); };
  function create(options = {}) {
    const identities = new Map(), ephemeral = new WeakMap(), surfaces = new Map();
    let serial = 0, selectedKey = '', active = null, disposed = false, suspended = false;
    const counters = {structuralPasses:0, scrollWrites:0, initialPositions:0, scopedMutations:0};
    const style = document.createElement('style'); style.dataset.controlSnapOwned = 'style';
    style.textContent = `
      [data-csx-ready="LOADING"]{opacity:0!important;visibility:hidden!important;pointer-events:none!important}
      [data-csx-ready="READY"]{opacity:1;transition:opacity 180ms cubic-bezier(.2,0,0,1)}
      [data-control-snap-owned="loading"]{position:fixed;z-index:2147483201;pointer-events:none;display:grid;place-items:center}
      .csx-spinner{width:22px;height:22px;border:2px solid #8885;border-top-color:#959595;border-radius:50%;animation:csx-spin .8s linear infinite}
      @keyframes csx-spin{to{transform:rotate(1turn)}}
      [data-csx-scroll]{overflow-anchor:none!important;scroll-behavior:auto!important;overscroll-behavior:contain}
      [data-csx-overlay]{position:fixed!important;inset:0!important;box-sizing:border-box!important;width:100%!important;height:var(--csx-height,100dvh)!important;max-width:none!important;max-height:none!important;margin:0!important;border-radius:0!important;z-index:2147483150!important;background:#111!important}
      [data-csx-overlay="call"]{z-index:2147483250!important}
      [data-csx-call-frame]{position:static!important;transform:none!important;contain:none!important}
      [data-csx-media]{object-fit:contain!important;max-width:100%!important;max-height:100%!important}
      [data-csx-call-remote]{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:var(--csx-fit,contain)!important}
      [data-csx-call-local]{position:absolute!important;inset:16px 16px auto auto!important;width:clamp(88px,16vw,180px)!important;height:auto!important;aspect-ratio:var(--csx-ratio,4/3)!important;max-height:25%!important;object-fit:contain!important;background:#171717!important;border-radius:12px!important;z-index:3!important}
      [data-csx-call-controls]{position:absolute!important;inset:auto 12px max(16px,env(safe-area-inset-bottom))!important;display:flex!important;justify-content:center!important;gap:12px!important;width:auto!important;height:auto!important;z-index:4!important}
      [data-csx-call-state]{position:absolute;top:16px;left:16px;max-width:70%;padding:8px 12px;border-radius:12px;background:#222d;color:white;font:14px system-ui;z-index:5}
      #control-snap-session{position:fixed;inset:0;z-index:2147483200;pointer-events:none;color:white}
      #control-snap-session .csx-progress{position:absolute;top:max(10px,env(safe-area-inset-top));left:12px;right:12px;display:flex;gap:4px}
      #control-snap-session .csx-track{height:3px;flex:1;background:#ffffff55;overflow:hidden;border-radius:3px}
      #control-snap-session .csx-fill{height:100%;background:white;transform-origin:left;transform:scaleX(var(--progress,0))}
      #control-snap-session .csx-state{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font:14px system-ui;text-align:center}
      @media(prefers-reduced-motion:reduce){[data-csx-ready]{transition:none!important}.csx-spinner{animation:none}}
    `;
    document.documentElement.append(style);
    function keyOf(node) {
      if (!node) return '';
      for (const attr of ['data-conversation-id','data-chat-id','data-thread-id','data-user-id']) {
        const value = node.getAttribute(attr); if (value && value !== '.' && value !== 'undefined') return attr + ':' + value;
      }
      const href = node.matches('a[href]') ? node.getAttribute('href') : node.querySelector('a[href*="/chat/"]')?.getAttribute('href');
      if (href) { const path = new URL(href,location.href).pathname; if (/\/(chat|conversation)\/[^/]+/.test(path)) return 'path:' + path; }
      // DOM identity is only session-local, never an index in a virtualized list.
      if (!ephemeral.has(node)) ephemeral.set(node, 'node:' + ++serial);
      return ephemeral.get(node);
    }
    function resolveIdentity(node, candidate) {
      const key = keyOf(node), known = identities.get(key);
      const nameNode = node?.querySelector(selectors.identity);
      const names = [node?.getAttribute('data-display-name'),nameNode?.getAttribute('data-display-name'),node?.getAttribute('data-friend-name'),nameNode?.getAttribute('data-friend-name'),candidate,nameNode?.textContent,nameNode?.getAttribute('title'),node?.getAttribute('data-username'),node?.querySelector('[data-username]')?.getAttribute('data-username'),node?.getAttribute('title'),node?.getAttribute('aria-label')];
      const displayName = names.map(validName).find(Boolean) || known?.displayName || 'Conversation';
      // Do not store neutral placeholders. Stable IDs permit cache recovery across native remounts.
      if (displayName !== 'Conversation' && !key.startsWith('node:')) {
        identities.delete(key); identities.set(key, {displayName});
        if (identities.size > 500) identities.delete(identities.keys().next().value);
      }
      return {key,displayName,known:displayName !== 'Conversation'};
    }
    function selectConversation(row) { const key = keyOf(row); if (key !== selectedKey) { selectedKey = key; stopConversation(); } return key; }
    function readySurface(node, ready, kind = 'surface') {
      if (!node || disposed) return;
      if (ready) { const entry = surfaces.get(node); clearTimeout(entry?.timer); entry?.indicator.remove(); surfaces.delete(node); mark(node,'data-csx-ready','READY'); if(entry)options.onReady?.(node);return; }
      if (surfaces.has(node) || node.getAttribute('data-csx-ready') === 'ERROR') return;
      mark(node,'data-csx-ready','LOADING');
      const indicator = document.createElement('div'); indicator.dataset.controlSnapOwned = 'loading'; indicator.setAttribute('role','status'); indicator.setAttribute('aria-label','Chargement'); indicator.innerHTML = '<span class="csx-spinner" aria-hidden="true"></span>';
      const rect = node.getBoundingClientRect(); Object.assign(indicator.style,{left:rect.x+'px',top:rect.y+'px',width:rect.width+'px',height:rect.height+'px'}); document.documentElement.append(indicator);
      const timer = setTimeout(() => { if (!disposed && surfaces.has(node)) { indicator.remove(); surfaces.delete(node); mark(node,'data-csx-ready','ERROR'); } }, 4000);
      surfaces.set(node,{indicator,timer,kind});
    }
    function stopConversation() { active?.dispose(); active = null; }
    function attachConversation(pane, log, key) {
      if (!log || !pane || disposed) return;
      key = key || selectedKey || keyOf(pane);
      if (active?.log === log && active.key === key) return active;
      stopConversation();
      const abort = new AbortController(); let frame = 0, sampleFrame = 0, initialTimer = 0, stable = 0, signature = '', userIntent = false, atBottom = true, metrics = null;
      const state = {pane,log,key,hasInitialPositioned:false,dispose(){abort.abort();cancelAnimationFrame(frame);cancelAnimationFrame(sampleFrame);clearTimeout(initialTimer);changes.disconnect();resize.disconnect();readySurface(pane,true);log.removeAttribute('data-csx-scroll');}};
      active = state; mark(log,'data-csx-scroll'); readySurface(pane,false,'conversation');
      const current = () => !disposed && active === state && log.isConnected;
      const distance = () => Math.max(0,log.scrollHeight-log.clientHeight-log.scrollTop);
      const snapshot = () => {
        const box = log.getBoundingClientRect(),nodes=log.children;
        // Message lists are vertically ordered. O(log n) layout reads even with thousands of entries.
        let lo=0,hi=nodes.length;
        while(lo<hi){const mid=(lo+hi)>>1;if(nodes[mid].getBoundingClientRect().bottom<=box.top+1)lo=mid+1;else hi=mid;}
        const first=nodes[lo];
        return {height:log.scrollHeight,top:log.scrollTop,first,offset:first?first.getBoundingClientRect().top-box.top:0,head:nodes[0],tail:nodes[nodes.length-1]};
      };
      const write = top => { if (Math.abs(log.scrollTop-top)>1) { log.scrollTop=top; counters.scrollWrites++; } };
      const remember = () => { if (current()) { atBottom=distance()<80;metrics=snapshot(); } };
      const intent = () => { userIntent=true; if (!state.hasInitialPositioned) { state.hasInitialPositioned=true; readySurface(pane,true); } atBottom=distance()<80; };
      log.addEventListener('wheel',intent,{passive:true,signal:abort.signal});log.addEventListener('touchmove',intent,{passive:true,signal:abort.signal});
      log.addEventListener('pointerdown',intent,{passive:true,signal:abort.signal});
      log.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(e.key))intent();},{signal:abort.signal});
      log.addEventListener('scroll',()=>{if(!sampleFrame)sampleFrame=requestAnimationFrame(()=>{sampleFrame=0;remember();});},{passive:true,signal:abort.signal});
      function initialize() {
        frame=0;
        if (!current() || state.hasInitialPositioned || suspended) return;
        const hasContent = log.children.length || log.textContent.trim() || pane.querySelector('[data-testid="empty-conversation"]');
        const next = log.scrollHeight + ':' + log.clientHeight;
        stable = next === signature ? stable+1 : 0; signature=next;
        if (hasContent && stable >= 3 && log.clientHeight > 0) {
          if(!userIntent){write(log.scrollHeight);counters.initialPositions++;}
          state.hasInitialPositioned=true;remember();readySurface(pane,true);return;
        }
        frame=requestAnimationFrame(initialize);
      }
      function reconcile(records = []) {
        if (!current() || suspended || !state.hasInitialPositioned) return;
        const old=metrics; if (!old) {remember();return;}
        const head=log.firstElementChild,tail=log.lastElementChild;
        const prepend=head!==old.head && old.head?.isConnected && log.contains(old.head);
        const append=tail!==old.tail && old.tail?.isConnected && log.contains(old.tail);
        if (prepend && old.first?.isConnected && log.contains(old.first)) {
          const offset=old.first.getBoundingClientRect().top-log.getBoundingClientRect().top;
          write(log.scrollTop+offset-old.offset);
        } else if (append && atBottom && !userIntent) write(log.scrollHeight);
        else if (append && atBottom && Math.abs(log.scrollTop-old.top)<2) write(log.scrollHeight);
        // Resize/media decode alone never pins a reader to the bottom after initial positioning.
        remember();
      }
      const changes=new MutationObserver(records=>{counters.scopedMutations++; if(frame||!state.hasInitialPositioned)return; frame=requestAnimationFrame(()=>{frame=0;reconcile(records);});});
      changes.observe(log,{childList:true,subtree:true,characterData:true});
      let oldHeight=log.clientHeight;
      const resize=new ResizeObserver(()=>{const height=log.clientHeight;if(height===oldHeight)return;oldHeight=height;if(current()&&!suspended&&state.hasInitialPositioned&&atBottom){write(log.scrollHeight);remember();}});
      resize.observe(log); // Not every message: one observer and no reconnect on each mutation.
      frame=requestAnimationFrame(initialize);
      initialTimer=setTimeout(()=>{cancelAnimationFrame(frame);frame=0;if(current()&&!state.hasInitialPositioned){state.hasInitialPositioned=true;readySurface(pane,true);mark(pane,'data-csx-ready','ERROR');remember();}},3500);
      return state;
    }
    function suspend(value) { const was=suspended;suspended=value;if(was&&!value&&active&&!active.hasInitialPositioned){const {pane,log,key}=active;stopConversation();attachConversation(pane,log,key);} }
    // Native media stays mounted and Snapchat remains the owner of read state and playback.
    // Controls are an adapter contract, not a private Snapchat API.
    let viewer=null,call=null;
    const owned=node=>!!node?.closest?.('[data-control-snap-owned],#control-snap-session');
    const button=(root,selector)=>[...root.querySelectorAll(selector)].find(node=>shown(node)&&!node.disabled);
    function stopViewer(){
      if(!viewer)return;
      const old=viewer;viewer=null;old.abort.abort();old.mediaAbort?.abort();old.observer.disconnect();
      clearTimeout(old.timer);clearTimeout(old.deadline);cancelAnimationFrame(old.frame);old.progressAnimation?.cancel();
      old.root.style.removeProperty('--csx-height');
      old.root.removeAttribute('data-csx-overlay');old.root.removeAttribute('data-csx-viewer-state');
      old.root.querySelectorAll('[data-csx-media]').forEach(node=>{node.removeAttribute('data-csx-media');node.removeAttribute('data-csx-ready');});
      old.chrome.remove(); // Never pause, replace or stop Snapchat-owned media.
    }
    function attachViewer(root){
      if(viewer?.root===root)return;
      stopViewer();
      const abort=new AbortController(),chrome=document.createElement('div');
      chrome.id='control-snap-session';chrome.dataset.controlSnapOwned='viewer';
      chrome.innerHTML='<div class="csx-progress" aria-hidden="true"></div><div class="csx-state" role="status"></div>';
      document.documentElement.append(chrome);mark(root,'data-csx-overlay','viewer');
      const state={root,abort,chrome,queue:[],index:0,phase:'IDLE',media:null,mediaAbort:null,source:'',token:0,frame:0,timer:0,deadline:0,transitioning:false};
      viewer=state;
      const current=()=>!disposed&&viewer===state&&root.isConnected;
      const phase=value=>{
        if(!current())return;
        state.phase=value;mark(root,'data-csx-viewer-state',value);
        const status=chrome.querySelector('.csx-state');
        status.replaceChildren();
        if(value==='LOADING'||value==='TRANSITIONING'){const spin=document.createElement('span');spin.className='csx-spinner';spin.style.display='block';spin.setAttribute('aria-label','Chargement du Snap');status.append(spin);}
        if(value==='ERROR')status.textContent='Ce Snap ne peut pas être chargé. Utilise les commandes Snapchat pour réessayer ou fermer.';
      };
      const progress=ratio=>chrome.querySelectorAll('.csx-fill').forEach((node,i)=>node.style.setProperty('--progress',String(i<state.index?1:i===state.index?Math.max(0,Math.min(1,ratio)):0)));
      function pausePhoto(){
        clearTimeout(state.timer);state.progressAnimation?.pause();
        if(state.photo?.started){state.photo.remaining=Math.max(0,state.photo.remaining-(performance.now()-state.photo.started));state.photo.started=0;}
      }
      function resumePhoto(){
        if(!current()||!state.photo||state.photo.started||document.hidden||call)return;
        state.photo.started=performance.now();state.progressAnimation?.play();
        state.timer=setTimeout(()=>{state.photo=null;if(mediaKey(state.media)===state.source&&shown(state.media)&&!state.media.closest('[hidden],[aria-hidden="true"]'))go(1,true);},state.photo.remaining);
      }
      state.pausePhoto=pausePhoto;state.resumePhoto=resumePhoto;
      function rebuildQueue(){
        const items=[...root.querySelectorAll(selectors.snapItems)];
        const queue=items.filter((item,i)=>items.findIndex(other=>other.dataset.snapId===item.dataset.snapId)===i);
        // Only render known entries: never fabricate a count from decorative DOM elements.
        const keys=queue.map(node=>node.dataset.snapId).join('|');
        if(keys!==state.keys){state.keys=keys;state.queue=queue;const tracks=chrome.querySelector('.csx-progress');tracks.replaceChildren();for(const item of queue){const track=document.createElement('div');track.className='csx-track';const fill=document.createElement('div');fill.className='csx-fill';track.append(fill);tracks.append(track);}}
        const explicit=queue.findIndex(node=>node.matches('[data-current="true"],[aria-current="true"]'));
        state.index=explicit>=0?explicit:Math.max(0,queue.findIndex(node=>node.contains(state.media)));
      }
      function go(direction,automatic=false){
        if(!current()||state.transitioning||call||document.hidden)return false;
        const next=button(root,direction>0?selectors.next:selectors.previous);
        if(!next){
          // Completion may close only a fully known queue. Unknown native viewers keep their behavior.
          if(automatic&&state.queue.length&&state.index===state.queue.length-1){
            phase('FINISHED');const close=button(root,selectors.close);if(close){phase('CLOSING');close.click();}
          }
          return false;
        }
        state.transitioning=true;phase('TRANSITIONING');clearTimeout(state.timer);
        next.click();
        clearTimeout(state.deadline);state.deadline=setTimeout(()=>{if(current()&&state.transitioning){state.transitioning=false;phase('ERROR');}},5000);
        return true;
      }
      const mediaKey=node=>(node?.currentSrc||node?.getAttribute('src')||'')+'|'+(node?.closest(selectors.snapItems)?.dataset.snapId||'');
      function prepare(){
        state.frame=0;if(!current())return;
        const media=[...root.querySelectorAll(selectors.currentMedia)].find(node=>!node.closest('[hidden],[aria-hidden="true"]')&&shown(node));
        if(!media){phase('LOADING');return;}
        const source=mediaKey(media);
        if(media===state.media&&source===state.source){rebuildQueue();return;}
        if(state.media){state.media.removeAttribute('data-csx-ready');state.media.removeAttribute('data-csx-media');}
        state.mediaAbort?.abort();state.mediaAbort=new AbortController();clearTimeout(state.timer);clearTimeout(state.deadline);state.progressAnimation?.cancel();state.photo=null;
        state.media=media;state.source=source;state.transitioning=false;
        const token=++state.token,signal=state.mediaAbort.signal;
        const fresh=()=>current()&&token===state.token&&mediaKey(media)===source&&shown(media)&&!media.closest('[hidden],[aria-hidden="true"]');
        rebuildQueue();progress(0);phase('LOADING');mark(media,'data-csx-media');mark(media,'data-csx-ready','LOADING');
        const fail=()=>{if(fresh()){clearTimeout(state.deadline);clearTimeout(state.timer);state.progressAnimation?.pause();state.photo=null;mark(media,'data-csx-ready','ERROR');phase('ERROR');}};
        const ready=()=>{
          if(!fresh()||state.phase==='PLAYING')return;
          clearTimeout(state.deadline);mark(media,'data-csx-ready','READY');phase('READY');
          if(media.tagName==='VIDEO'){if(!media.paused)phase('PLAYING');}
          else{
            phase('PLAYING');
            const duration=Number(media.closest('[data-duration-ms]')?.getAttribute('data-duration-ms'));
            // No invented photo duration or background consumption.
            if(Number.isFinite(duration)&&duration>0&&duration<=60000){
              state.photo={duration,remaining:duration,started:0};
              const fill=chrome.querySelectorAll('.csx-fill')[state.index];
              if(fill){state.progressAnimation=fill.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration,fill:'forwards'});state.progressAnimation.pause();}
              resumePhoto();
            }
          }
          // Decode only already supplied next imagery. Do not fetch/copy private URLs or mark unopened Snaps read.
          const nextImage=state.queue[state.index+1]?.querySelector('img');
          if(nextImage?.complete&&nextImage.naturalWidth)nextImage.decode?.().catch(()=>{});
        };
        state.deadline=setTimeout(fail,12000);media.addEventListener('error',fail,{signal});
        if(media.tagName==='IMG'){
          const decode=()=>{if(media.decode)media.decode().then(ready,fail);else ready();};
          if(media.complete&&media.naturalWidth)decode();else media.addEventListener('load',decode,{signal,once:true});
        }else{
          media.addEventListener('loadeddata',ready,{signal});if(media.readyState>=2)ready();
          media.addEventListener('playing',()=>{if(fresh()){mark(media,'data-csx-ready','READY');phase('PLAYING');}},{signal});
          media.addEventListener('timeupdate',()=>{if(fresh()&&Number.isFinite(media.duration)&&media.duration>0)progress(media.currentTime/media.duration);},{signal});
          media.addEventListener('ended',()=>{
            // Give Snapchat's handler the first chance to advance; avoid double-advancing the same video.
            setTimeout(()=>{if(fresh()&&!state.transitioning)go(1,true);},0);
          },{signal});
        }
      }
      const schedule=()=>{if(!state.frame)state.frame=requestAnimationFrame(prepare);};
      state.observer=new MutationObserver(records=>{if(records.some(record=>!owned(record.target)))schedule();});
      state.observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['src','hidden','aria-hidden','aria-current','data-current','data-snap-id']});
      root.addEventListener('click',event=>{
        if(event.defaultPrevented||event.target.closest('button,a,input,[role="button"],video[controls]'))return;
        const bounds=root.getBoundingClientRect();if(go(event.clientX-bounds.left<bounds.width*.22?-1:1)){event.preventDefault();}
      },{signal:abort.signal});
      document.addEventListener('keydown',event=>{
        if(!current()||call||event.defaultPrevented||event.target.closest?.('input,textarea,[contenteditable="true"]'))return;
        if(event.key==='Escape'){const close=button(root,selectors.close);if(close){event.preventDefault();phase('CLOSING');close.click();}}
        else if((event.key==='ArrowRight'||event.key==='ArrowLeft')&&go(event.key==='ArrowRight'?1:-1))event.preventDefault();
      },{signal:abort.signal});
      document.addEventListener('visibilitychange',()=>{if(document.hidden)pausePhoto();else resumePhoto();},{signal:abort.signal});
      prepare();return state;
    }
    function stopCall(){
      if(!call)return;const old=call;call=null;old.abort.abort();old.observer.disconnect();old.resize.disconnect();cancelAnimationFrame(old.frame);clearTimeout(old.timer);old.status.remove();
      old.root.style.removeProperty('--csx-height');
      for(const node of [old.root,...old.root.querySelectorAll('[data-csx-call-local],[data-csx-call-remote],[data-csx-call-controls],[data-csx-call-frame]')]){
        for(const attr of ['data-csx-overlay','data-csx-call-local','data-csx-call-remote','data-csx-call-controls','data-csx-call-frame'])node.removeAttribute(attr);
        node.style.removeProperty('--csx-ratio');node.style.removeProperty('--csx-fit');
      }
    }
    function attachCall(root){
      if(call?.root===root)return;stopCall();viewer?.pausePhoto();
      const abort=new AbortController(),status=document.createElement('div');
      status.dataset.controlSnapOwned='call-status';status.setAttribute('data-csx-call-state','REQUESTING');status.setAttribute('role','status');root.append(status);
      const state={root,abort,status,frame:0,timer:0};call=state;mark(root,'data-csx-overlay','call');
      function update(){
        state.frame=0;if(disposed||call!==state)return;
        const videos=[...root.querySelectorAll('video')];
        const local=videos.find(video=>/local|self|preview|votre|aperçu/i.test(label(video)+' '+video.getAttribute('data-testid')+' '+video.getAttribute('data-stream')));
        const remote=videos.find(video=>/remote|participant|distant/i.test(label(video)+' '+video.getAttribute('data-testid')+' '+video.getAttribute('data-stream')))||videos.find(video=>video!==local);
        root.querySelectorAll('[data-csx-call-local],[data-csx-call-remote]').forEach(node=>{if(node!==local)node.removeAttribute('data-csx-call-local');if(node!==remote)node.removeAttribute('data-csx-call-remote');});
        const settings=local?.srcObject?.getVideoTracks?.()[0]?.getSettings?.()||{};
        state.cameraSettings={width:settings.width,height:settings.height,aspectRatio:settings.aspectRatio,zoom:settings.zoom};
        if(local){mark(local,'data-csx-call-local');local.style.setProperty('--csx-ratio',String((local.videoWidth||settings.width||4)/(local.videoHeight||settings.height||3)));}
        if(remote){
          mark(remote,'data-csx-call-remote');const box=root.getBoundingClientRect(),ratio=remote.videoWidth/remote.videoHeight,screen=box.width/box.height;
          remote.style.setProperty('--csx-fit',Number.isFinite(ratio)&&Math.min(ratio/screen,screen/ratio)>=.85?'cover':'contain');
        }
        const controls=root.querySelector('[data-testid="call-controls"],[role="toolbar"]');if(controls)mark(controls,'data-csx-call-controls');
        for(const element of [local,remote,controls])for(let parent=element?.parentElement;parent&&parent!==root;parent=parent.parentElement)mark(parent,'data-csx-call-frame');
        const issue=[...root.querySelectorAll('[role="alert"],[data-testid="permission-error"]')].filter(node=>!owned(node)).map(node=>node.textContent).join(' ');
        let permission=/denied|refus|autorisa|permission.*block/i.test(issue)?'DENIED':/not found|introuvable|aucun.*(cam|micro)/i.test(issue)?'DEVICE_NOT_FOUND':/busy|utilisé|occupied/i.test(issue)?'DEVICE_BUSY':issue?'ERROR':videos.some(video=>video.readyState>=2)?'GRANTED':'REQUESTING';
        if(permission==='REQUESTING'&&state.timedOut)permission='ERROR';
        const messages={REQUESTING:'Connexion de l’appel…',GRANTED:'',DENIED:'Autorise la caméra et le microphone dans les réglages du navigateur.',DEVICE_NOT_FOUND:'Caméra ou microphone introuvable. Vérifie la source dans Snapchat.',DEVICE_BUSY:'La caméra ou le microphone est utilisé par une autre application.',ERROR:'L’appel n’est pas prêt. Vérifie les autorisations et les commandes Snapchat.'};
        mark(status,'data-csx-call-state',permission);if(status.textContent!==messages[permission])status.textContent=messages[permission];status.hidden=permission==='GRANTED';
        state.permission=permission;
      }
      const schedule=()=>{if(!state.frame)state.frame=requestAnimationFrame(update);};
      state.observer=new MutationObserver(records=>{if(records.some(record=>!owned(record.target)))schedule();});
      state.observer.observe(root,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['src','data-stream','aria-label','data-testid']});
      state.resize=new ResizeObserver(schedule);state.resize.observe(root);
      root.addEventListener('loadedmetadata',schedule,{capture:true,signal:abort.signal});root.addEventListener('loadeddata',schedule,{capture:true,signal:abort.signal});root.addEventListener('error',schedule,{capture:true,signal:abort.signal});
      state.timer=setTimeout(()=>{state.timedOut=true;schedule();},12000);update();
    }
    function refreshOverlays(){
      if(disposed)return;counters.structuralPasses++;
      const height=(window.visualViewport?.height||innerHeight)+'px';
      const callRoot=[...document.querySelectorAll(selectors.call)].find(shown);
      if(callRoot){callRoot.style.setProperty('--csx-height',height);attachCall(callRoot);}else stopCall();
      const viewerRoot=[...document.querySelectorAll(selectors.viewer)].find(node=>shown(node)&&!node.closest(selectors.call)&&node.querySelector('img,video,canvas'));
      if(viewerRoot){viewerRoot.style.setProperty('--csx-height',height);attachViewer(viewerRoot);}else stopViewer();
      suspend(!!callRoot||!!viewerRoot);
      if(!callRoot)viewer?.resumePhoto();
    }
    function dispose() {
      if(disposed)return;stopViewer();stopCall();stopConversation();for(const [node,entry] of surfaces){clearTimeout(entry.timer);entry.indicator.remove();node.removeAttribute('data-csx-ready');}surfaces.clear();
      document.querySelectorAll('[data-csx-ready]').forEach(node=>node.removeAttribute('data-csx-ready'));style.remove();identities.clear();disposed=true;
    }
    return {selectors,keyOf,validName,resolveIdentity,selectConversation,attachConversation,stopConversation,readySurface,suspend,refreshOverlays,dispose,counters,get active(){return active;},get viewer(){return viewer;},get call(){return call;}};
  }
  globalThis.ControlSnapExperience={create,selectors,validName};
})();
/* END SHARED SNAPCHAT EXPERIENCE */

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
      if(url.hostname==='accounts.snapchat.com'||/^\/(accounts|login|logout|oauth|consent|challenge|settings)(\/|$)/.test(p))return 'account';
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
    #control-native-loading .control-snap-mark i{inset:0;background:linear-gradient(110deg,transparent 25%,#fff 48%,transparent 70%);opacity:.45;background-size:300% 100%;animation:control-outline-reflection 1.8s ease-in-out infinite;-webkit-mask:var(--control-snap-mask) center/contain no-repeat;mask:var(--control-snap-mask) center/contain no-repeat}
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
    html[data-control-fit],html[data-control-fit] body{box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;margin:0!important;overflow-x:clip!important;overscroll-behavior-x:none!important;-webkit-text-size-adjust:100%;text-size-adjust:100%}
    [data-control-fit-frame]{box-sizing:border-box!important;min-width:0!important;max-width:100%!important;width:100%!important;margin-inline:0!important}
    [data-control-fit-frame][data-control-fit-flex]{width:auto!important;flex:1 1 0%!important}
    html[data-control-fit="Instagram"] :is(main,[role="main"]){min-width:0!important;max-width:100%!important;align-self:stretch!important;flex-grow:1!important}
    @media(min-width:951px),(min-width:701px) and (min-height:601px),(min-width:701px) and (pointer:fine){
      [data-control-snap-shell]{box-sizing:border-box!important;display:flex!important;width:100%!important;max-width:none!important;min-width:0!important;height:var(--control-snap-height,100dvh)!important;margin:0!important}
      [data-control-snap-contacts]{width:clamp(300px,28vw,420px)!important;min-width:0!important;flex:0 0 clamp(300px,28vw,420px)!important;height:100%!important}
      [data-control-snap-pane]{min-width:0!important;max-width:100%!important;flex:1 1 0%!important;height:100%!important}
    }
    #control-snap-row-actions,#control-snap-new-chat,#control-snap-hint{display:none}
    #control-snap-tabs{display:none}
    #control-snap-tabs{min-height:0!important;max-height:var(--control-snap-bottom)!important;margin:0!important;line-height:normal!important}
    @media(max-width:700px),(max-width:950px) and (max-height:600px) and (pointer:coarse){
      html[data-control-snap-view]{--control-snap-bottom:calc(58px + env(safe-area-inset-bottom,0px));color-scheme:light!important;background:#fff!important}
      html[data-control-snap-view] body{overflow:hidden!important;height:var(--control-snap-height,100dvh)!important;margin:0!important;background:#fff!important}
      [data-control-snap-shell]{display:block!important;box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;height:calc(var(--control-snap-height,100dvh) - var(--control-snap-bottom))!important;position:relative!important;background:#fff!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;overflow:hidden!important}
      [data-control-snap-contacts],[data-control-snap-pane]{box-sizing:border-box!important;position:relative!important;inset:auto!important;transform:none!important;width:100%!important;max-width:100%!important;min-width:0!important;flex:1 1 100%!important;height:calc(var(--control-snap-height,100dvh) - var(--control-snap-bottom))!important;max-height:none!important;overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior:contain}
      html[data-control-snap-view="messages"] [data-control-snap-pane],html[data-control-snap-view="snap"] [data-control-snap-contacts],html[data-control-snap-view="conversation"] [data-control-snap-contacts]{display:none!important}
      html[data-control-snap-view="snap"] [data-control-snap-pane]:not([data-control-snap-camera]),html[data-control-snap-view="conversation"] [data-control-snap-pane]:not([data-control-snap-conversation]){display:none!important}
      [data-control-snap-contacts]{background:#fff!important;color:#16181b!important;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;border:0!important;border-radius:0!important;box-shadow:none!important}
      [data-control-snap-contacts] :is(nav,[role="list"],[role="listbox"]){width:100%!important;min-width:0!important;max-width:none!important;background:#fff!important}
      [data-control-snap-list-flow]{width:100%!important;max-width:none!important;min-width:0!important;background:#fff!important;color:#16181b!important}
      [data-control-snap-contacts] :is(header,[role="heading"],h1,h2){background:#fff!important;color:#16181b!important}
      [data-control-snap-row]{box-sizing:border-box!important;display:block!important;width:100%!important;min-width:0!important;max-width:none!important;min-height:var(--control-row-height,80px)!important;height:var(--control-row-height,80px)!important;padding:0!important;background:#fff!important;color:#16181b!important;border:0!important;border-bottom:0!important;border-radius:0!important;text-decoration:none!important;text-align:left!important;overflow:hidden!important}
      [data-control-snap-row]:active{background:#f4f5f7!important}
      [data-control-snap-row-shell]{display:block!important;position:relative!important;inset:auto!important;transform:none!important;width:100%!important;height:100%!important;min-width:0!important;margin:0!important;padding:0!important;background:transparent!important}
      [data-control-snap-row] [data-control-snap-row-layout],[data-control-snap-row][data-control-snap-row-layout]{box-sizing:border-box!important;display:grid!important;grid-template-columns:54px minmax(0,1fr) 36px!important;grid-template-rows:1fr 1fr!important;align-items:center!important;column-gap:10px!important;row-gap:0!important;width:100%!important;height:100%!important;min-width:0!important;padding:9px 12px!important;margin:0!important;background:transparent!important;text-align:left!important}
      [data-control-snap-row][data-control-snap-row-layout]{height:var(--control-row-height,80px)!important}
      [data-control-snap-viewport]{margin:0!important;padding:0!important;min-width:0!important;max-width:100%!important;width:100%!important;border-radius:0!important}
      [data-control-snap-avatar-slot]:is(img,svg){object-fit:contain!important}
      [data-control-snap-avatar-slot]{grid-column:1!important;grid-row:1 / 3!important;position:relative!important;inset:auto!important;transform:none!important;width:54px!important;min-width:54px!important;max-width:54px!important;height:54px!important;min-height:54px!important;max-height:54px!important;flex:0 0 54px!important;margin:0!important;padding:0!important;border-radius:50%!important;overflow:hidden!important;background:#f0f2f4!important;box-shadow:none!important}
      [data-control-snap-avatar-slot] img{position:absolute!important;inset:0!important;transform:none!important;width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important}
      [data-control-snap-badge]{box-sizing:border-box!important;position:absolute!important;inset:auto 0 0 auto!important;display:grid!important;place-items:center!important;width:19px!important;min-width:19px!important;max-width:19px!important;height:19px!important;max-height:19px!important;margin:0!important;padding:0!important;border:1px solid #fff!important;border-radius:50%!important;box-shadow:none!important;background:#fff!important;font:13px/1 sans-serif!important;transform:none!important;z-index:1!important}
      [data-control-snap-avatar-slot] [data-control-snap-avatar-wrap]{width:100%!important;height:100%!important;min-width:0!important;max-width:100%!important;max-height:100%!important;inset:0!important;margin:0!important;padding:0!important;transform:none!important;border-radius:50%!important;box-shadow:none!important}
      [data-control-snap-text-slot]{grid-column:2!important;grid-row:1 / 3!important;display:flex!important;flex-direction:column!important;justify-content:center!important;position:static!important;inset:auto!important;transform:none!important;flex:1 1 0%!important;min-width:0!important;width:auto!important;max-width:none!important;height:auto!important;max-height:none!important;overflow:hidden!important;visibility:visible!important;opacity:1!important;clip:auto!important;clip-path:none!important;margin:0!important;padding:0!important;background:transparent!important;color:#17191c!important;text-align:left!important}
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
      [data-control-snap-camera] video{max-width:100%!important;max-height:100%!important;object-fit:contain!important}
      #control-snap-tabs{box-sizing:border-box!important;position:fixed!important;z-index:2147483000!important;inset:auto 0 0!important;display:flex!important;align-items:stretch!important;height:var(--control-snap-bottom)!important;padding:6px 18px calc(6px + env(safe-area-inset-bottom,0px))!important;background:rgba(255,255,255,.96)!important;-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);border-top:1px solid #eceef1!important;font:12px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important}
      #control-snap-tabs button{appearance:none!important;border:0!important;border-radius:16px!important;background:transparent!important;color:#17191c!important;display:flex!important;flex:1!important;align-items:center!important;justify-content:center!important;flex-direction:column!important;gap:3px!important;font:600 12px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;min-height:44px!important;cursor:pointer!important;transition:background .15s,color .15s!important}
      #control-snap-tabs button[aria-pressed="true"]{color:#111!important;background:transparent!important}
      #control-snap-tabs button svg{padding:5px!important;box-sizing:content-box!important;border-radius:12px!important;transition:background .18s ease-out!important}
      #control-snap-tabs button[aria-pressed="true"] svg{background:transparent!important}
      #control-snap-tabs button[aria-pressed="true"] svg>path:first-child{fill:currentColor!important}
      #control-snap-tabs button[aria-pressed="true"] svg :is(circle,path+path){stroke:#fff!important}
      #control-snap-tabs button:active{transform:scale(.97)!important}
      #control-snap-tabs button:disabled{opacity:.4!important;cursor:default!important}
      #control-snap-tabs button:focus-visible{outline:2px solid #0084ff!important;outline-offset:-2px!important}
      #control-snap-tabs svg{height:25px!important;width:25px!important;fill:none!important;stroke:currentColor!important;stroke-width:2!important;stroke-linecap:round!important;stroke-linejoin:round!important}
      #control-snap-tabs button>span{display:none!important}
      html[data-control-snap-view="conversation"]{--control-snap-bottom:0px;color-scheme:normal!important}
      html[data-control-snap-view="conversation"] #control-snap-tabs{display:none!important}
      html[data-control-snap-view="conversation"],html[data-control-snap-view="conversation"] body,html[data-control-snap-view="conversation"] [data-control-snap-shell],html[data-control-snap-view="conversation"] [data-control-snap-conversation]{background:var(--control-chat-background,#1e1e1e)!important}
      html[data-control-snap-view="conversation"] [data-control-snap-conversation]{display:flex!important;flex-direction:column!important;padding:0!important;margin:0!important;border:0!important;border-radius:0!important;overflow:hidden!important}
      html[data-control-snap-view="conversation"] [data-control-snap-chat-frame]{box-sizing:border-box!important;display:flex!important;flex-direction:column!important;position:relative!important;inset:auto!important;transform:none!important;width:100%!important;min-width:0!important;max-width:none!important;height:auto!important;min-height:0!important;max-height:none!important;padding:0!important;margin:0!important;border:0!important;border-radius:0!important;flex:1 1 0%!important;background:var(--control-chat-background,#1e1e1e)!important}
      html[data-control-snap-view="conversation"] [data-control-snap-chat-log]{position:relative!important;inset:auto!important;flex:1 1 0%!important;min-height:0!important;max-height:none!important;height:auto!important;min-width:0!important;overflow-y:auto!important;border-radius:0!important}
      html[data-control-snap-view="conversation"] [data-control-snap-chat-composer]{position:relative!important;inset:auto!important;flex:0 0 auto!important;min-width:0!important;max-width:100%!important;height:auto!important;margin-top:auto!important;margin-bottom:0!important}
      html[data-control-snap-view="conversation"] [data-control-snap-chat-frame]{align-items:stretch!important;justify-content:flex-start!important}
      [data-control-snap-name-line]{display:block!important;order:-1!important;flex:0 0 auto!important;position:static!important;inset:auto!important;transform:none!important;visibility:visible!important;opacity:1!important;height:auto!important;min-height:22px!important;max-height:22px!important;width:100%!important;min-width:0!important;max-width:none!important;font:500 18px/22px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;white-space:nowrap!important;text-overflow:ellipsis!important;overflow:hidden!important;overflow-wrap:normal!important;color:#17191c!important;margin:0!important;padding:0!important}
      [data-control-snap-status-line]{display:flex!important;flex-flow:row nowrap!important;align-items:center!important;justify-content:flex-start!important;gap:4px!important;position:static!important;inset:auto!important;transform:none!important;flex:0 1 auto!important;min-height:18px!important;max-height:36px!important;height:auto!important;min-width:0!important;width:auto!important;overflow:hidden!important;font:400 clamp(12px,3.35vw,13px)/17px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;white-space:nowrap!important;color:#747b84!important;margin:0!important;padding:0!important}
      [data-control-snap-status-line] svg{width:15px!important;height:15px!important;flex:0 0 15px!important}
      [data-control-snap-text-slot][data-control-snap-name-only]{grid-row:1!important;align-self:end!important}
      [data-control-snap-text-slot][data-control-snap-status-only]{grid-row:2!important;align-self:start!important}
      [data-control-snap-status-line] [data-control-snap-text-flow]{display:inline!important;width:auto!important;min-width:0!important;max-height:none!important;font:inherit!important;color:inherit!important;white-space:normal!important}
      [data-control-snap-status-line]{flex-wrap:wrap!important;column-gap:3px!important;row-gap:0!important;white-space:normal!important;overflow-wrap:anywhere!important}
      [data-control-snap-status-line] :is(time,svg){flex-shrink:0!important;white-space:nowrap!important}
      [data-control-snap-row-camera]{grid-column:3!important;grid-row:1 / 3!important;position:relative!important;inset:auto!important;width:36px!important;height:44px!important;min-width:0!important;padding:5px!important;margin:0!important;border:0!important;border-radius:50%!important;background:transparent!important;color:#2d3338!important;display:grid!important;place-items:center!important;font-size:0!important;cursor:pointer}
      [data-control-snap-static-row]{position:relative!important}
      [data-control-snap-action-wrap]{display:contents!important}
      [data-control-snap-outside-camera]{position:absolute!important;inset:50% 10px auto auto!important;transform:translateY(-50%)!important}
      #control-snap-row-actions{display:block!important;position:fixed!important;inset:0!important;z-index:10!important;pointer-events:none!important}
      #control-snap-row-actions button{box-sizing:border-box!important;position:absolute!important;width:36px!important;height:44px!important;display:grid!important;place-items:center!important;border:0!important;border-radius:50%!important;background:transparent!important;color:#2d3338!important;padding:5px!important;pointer-events:auto!important;touch-action:manipulation!important}
      #control-snap-row-actions svg{width:24px!important;height:24px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.8!important}
      #control-snap-row-actions button:focus-visible{outline:2px solid #0084ff!important}
      #control-snap-hint{display:block!important;position:fixed!important;z-index:2147483200!important;left:16px!important;right:16px!important;bottom:calc(20px + env(safe-area-inset-bottom,0px))!important;border-radius:16px!important;padding:14px 18px!important;background:#202124!important;color:#fff!important;font:14px/1.4 system-ui!important;box-shadow:0 4px 18px #0002!important}
      [data-control-snap-row-camera] svg{width:24px!important;height:24px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.8!important}
      [data-control-snap-avatar-slot][data-control-snap-group] [data-control-snap-avatar-wrap]{display:contents!important}
      [data-control-snap-avatar-slot][data-control-snap-group] img{width:66%!important;height:76%!important;inset:auto!important;bottom:0!important;left:0!important;z-index:1!important}
      [data-control-snap-avatar-slot][data-control-snap-group] img[data-control-snap-member="1"]{left:34%!important;z-index:2!important}
      [data-control-snap-avatar-slot][data-control-snap-group="3"] img{width:55%!important;height:60%!important}
      [data-control-snap-avatar-slot][data-control-snap-group="3"] img[data-control-snap-member="0"]{left:23%!important;top:0!important;bottom:auto!important;z-index:0!important}
      [data-control-snap-avatar-slot][data-control-snap-group="3"] img[data-control-snap-member="1"]{left:0!important}
      [data-control-snap-avatar-slot][data-control-snap-group="3"] img[data-control-snap-member="2"]{left:45%!important}
      [data-control-snap-avatar-slot][data-control-snap-group] img[data-control-snap-member="extra"]{display:none!important}
      [data-control-snap-toolbar]{box-sizing:border-box!important;position:sticky!important;top:0!important;z-index:5!important;display:flex!important;align-items:center!important;gap:4px!important;flex-wrap:wrap!important;justify-content:center!important;width:100%!important;min-width:0!important;max-width:100%!important;height:auto!important;min-height:68px!important;padding:8px 10px!important;background:#fff!important;color:#17191c!important}
      [data-control-snap-toolbar-flow]{display:contents!important}
      [data-control-snap-toolbar-title]{display:block!important;position:static!important;flex:1!important;min-width:0!important;margin:0!important;padding:0!important;font:600 21px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;text-align:center!important;order:2!important}
      [data-control-snap-toolbar-action]{position:relative!important;inset:auto!important;transform:none!important;flex:0 0 38px!important;width:38px!important;min-width:0!important;height:40px!important;padding:8px!important;border:0!important;border-radius:50%!important;background:#f0f2f4!important;color:#252a2f!important;display:grid!important;place-items:center!important}
      [data-control-snap-toolbar-action] svg{width:23px!important;height:23px!important;max-width:100%!important}
      [data-control-snap-toolbar-action="profile"]{order:0!important}
      [data-control-snap-toolbar-action="search"]{order:1!important}
      [data-control-snap-toolbar-action="notifications"]{order:3!important}
      [data-control-snap-toolbar-action="add"]{order:4!important;background:#fffc00!important}
      [data-control-snap-toolbar-action="more"]{order:5!important}
      [data-control-snap-search]{flex:1 1 100%!important;order:6!important;box-sizing:border-box!important;width:100%!important;min-width:0!important;font-size:16px!important}
      [data-control-snap-compose]{position:fixed!important;inset:auto 18px calc(var(--control-snap-bottom) + 18px) auto!important;z-index:20!important;width:56px!important;height:56px!important;min-width:0!important;padding:15px!important;border:0!important;border-radius:50%!important;background:#fffc00!important;color:#111!important;box-shadow:0 4px 14px #0003!important;font-size:0!important;display:grid!important;place-items:center!important}
      [data-control-snap-compose] svg{width:26px!important;height:26px!important}
      html:not([data-control-snap-view="messages"]) [data-control-snap-compose]{display:none!important}
      html[data-control-snap-view] :is(button,[role="button"]){-webkit-tap-highlight-color:transparent;touch-action:manipulation}
      html[data-control-snap-view] :is(input,textarea,[contenteditable="true"]){font-size:16px!important}
      [data-control-snap-chat-log]{overflow-x:hidden!important;overflow-wrap:anywhere!important;overscroll-behavior:contain!important}
      html[data-control-snap-view] [data-control-snap-pane]:has([data-control-snap-viewer]){display:block!important;position:fixed!important;inset:0!important;z-index:2147483100!important}
      [data-control-snap-viewer]{position:fixed!important;inset:0!important;z-index:2147483100!important;width:100%!important;max-width:100%!important;height:var(--control-snap-height,100dvh)!important;max-height:none!important;box-sizing:border-box!important}
      [data-control-snap-viewer] :is(video,img){max-width:100%!important;max-height:100%!important;object-fit:contain!important}
      html[data-control-snap-view="snap"] [data-control-snap-camera],html[data-control-snap-view="snap"] [data-control-snap-camera-fill]{background:#09090b!important;background-image:none!important}
      [data-control-snap-camera-start]{position:relative!important;display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;height:100%!important;border:0!important;border-radius:0!important;background:#09090b!important;color:#fff!important;padding:0!important;margin:0!important}
      [data-control-snap-camera-start]>*{display:none!important}
      [data-control-snap-camera-start]::before{content:"Activer la caméra";font:500 16px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:16px 24px;border:1px solid #fff5;border-radius:999px;background:#ffffff14;color:#fff}
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
    const snapchat='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#e1dc00" d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/></svg>';
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
  function fitViewport(mode){
    const enabled=['Snapchat','Instagram'].includes(app.id)&&mode==='messages';
    document.documentElement.toggleAttribute('data-control-fit',enabled);
    if(!enabled){document.querySelectorAll('[data-control-fit-frame],[data-control-fit-flex]').forEach(el=>{el.removeAttribute('data-control-fit-frame');el.removeAttribute('data-control-fit-flex');});return;}
    document.documentElement.setAttribute('data-control-fit',app.id);
    if(matchMedia('(pointer:coarse)').matches){
      let meta=document.querySelector('meta[name="viewport"]');
      if(!meta){meta=document.createElement('meta');meta.name='viewport';(document.head||document.documentElement).append(meta);}
      const content='width=device-width, initial-scale=1, viewport-fit=cover';
      if(meta.content!==content)meta.content=content;
    }
    const main=document.querySelector('main,[role="main"]');
    if(main?.parentElement){
      const css=getComputedStyle(main.parentElement);
      main.toggleAttribute('data-control-fit-flex',css.display.includes('flex')&&css.flexDirection==='row'&&main.parentElement.children.length>1);
    }
    for(let el=main;el&&el!==document.body;el=el.parentElement){
      if(el!==main&&el.children.length>1)break;
      el.setAttribute('data-control-fit-frame','');
    }
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
  const compactSnap=()=>matchMedia('(max-width:700px), (max-width:950px) and (max-height:600px) and (pointer:coarse)').matches;
  let snapView='messages',snapForceInbox=false,snapLastComposer=null,snapTabs=null,snapContacts=null,snapCamera=null;
  let snapExperience=null,snapPendingCamera=null,snapActionLayer=null;
  const snapActionButtons=new Map(),snapProcessedRows=new WeakSet(),snapDirtyRows=new WeakSet();
  let snapActionsFrame=0;
  const cameraIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h4l2-3h6l2 3h4v13H3Z"/><circle cx="12" cy="13" r="4"/></svg>';
  function snapCameraHint(){
    document.getElementById('control-snap-hint')?.remove();
    const hint=document.createElement('div');hint.id='control-snap-hint';hint.setAttribute('role','status');hint.textContent='Cette conversation ne propose pas de caméra accessible sur le Web.';document.documentElement.append(hint);setTimeout(()=>hint.remove(),3500);
  }
  function requestContactCamera(row){
    const target=row.matches('button,a,[role="button"]')?row:row.querySelector('button,a,[role="button"]');
    if(!target)return;
    const name=row.querySelector('[data-control-snap-name-line]')?.textContent.trim();
    const pending={name,expires:Date.now()+2500};snapPendingCamera=pending;
    target.click();
    setTimeout(()=>{if(snapPendingCamera===pending){snapPendingCamera=null;snapCameraHint();}},2500);
  }
  function snapRowActions(contacts,view){
    const enabled=compactSnap()&&view==='messages'&&![...document.querySelectorAll('[role="dialog"],[role="menu"]')].some(visible);
    if(!enabled){snapActionLayer?.remove();snapActionLayer=null;snapActionButtons.clear();return;}
    if(!snapActionLayer){snapActionLayer=document.createElement('div');snapActionLayer.id='control-snap-row-actions';document.documentElement.append(snapActionLayer);}
    const bounds=contacts.getBoundingClientRect(),top=Math.max(bounds.top,contacts.querySelector('[data-control-snap-toolbar]')?.getBoundingClientRect().bottom||0);
    const kept=new Set();
    for(const row of contacts.querySelectorAll('[data-control-snap-row]')){
      if(row.querySelector('[data-control-snap-row-camera]'))continue;
      const name=row.querySelector('[data-control-snap-name-line]')?.textContent.trim(),b=row.getBoundingClientRect();
      if(!name||b.height<44||b.top<top-1||b.bottom>bounds.bottom+1||!visible(row))continue;
      const target=row.matches('button,a,[role="button"]')?row:row.querySelector('button,a,[role="button"]');if(!target)continue;
      kept.add(row);let button=snapActionButtons.get(row);
      if(!button){button=document.createElement('button');button.type='button';button.innerHTML=cameraIcon;button.addEventListener('click',event=>{if(event.isTrusted)requestContactCamera(row);});snapActionButtons.set(row,button);snapActionLayer.append(button);}
      const label='Appareil photo pour '+name;if(button.getAttribute('aria-label')!==label)button.setAttribute('aria-label',label);
      button.style.left=Math.min(b.right-46,innerWidth-46)+'px';button.style.top=b.top+(b.height-44)/2+'px';
    }
    for(const [row,button] of snapActionButtons)if(!kept.has(row)){button.remove();snapActionButtons.delete(row);}
  }
  const snapRows='[role="listitem"],[role="option"],a[href*="/chat/"],[data-testid*="conversation-item"],[data-testid*="friend-item"]';
  function snapNavigation(){
    if(snapTabs?.isConnected)return;
    snapTabs=document.createElement('nav');snapTabs.id='control-snap-tabs';snapTabs.setAttribute('aria-label','Navigation Snapchat');
    snapTabs.innerHTML='<button type="button" data-view="messages" aria-label="Messages"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-8 8H4v-7a8 8 0 1 1 16-1Z"/><path d="M8 9h8M8 13h5"/></svg><span>Messages</span></button><button type="button" data-view="snap" aria-label="Snap"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h3l2-3h6l2 3h3v14H4Z"/><circle cx="12" cy="12" r="4"/></svg><span>Snap</span></button>';
    snapTabs.addEventListener('click',event=>{
      const button=event.target.closest('button[data-view]');if(!button||button.disabled)return;
      snapPendingCamera=null;snapView=button.dataset.view;snapForceInbox=snapView==='messages';
      refresh();
      // Only a deliberate tap on Snap may invoke the native camera START prompt.
      // Shutter, recording and send buttons are never invoked here.
      if(snapView==='snap'&&compactSnap()&&event.isTrusted){
        const start=snapCamera?.querySelector('[data-control-snap-camera-start]');
        if(start&&!start.disabled)start.click();
      }
    });
    document.documentElement.append(snapTabs);
  }
  function snapContactRows(contacts){
    let rows=[...contacts.querySelectorAll(snapRows)];
    if(!rows.length)rows=[...contacts.querySelectorAll('button,[role="button"]')].filter(el=>el.querySelector('img')&&!el.closest('header')&&!unwanted.test(signature(el)));
    const words=text=>/\p{L}/u.test(text||'');
    for(const row of rows){
      if(row.parentElement.closest(snapRows))continue;
      if(snapProcessedRows.has(row)&&row.hasAttribute('data-control-snap-row')&&!snapDirtyRows.has(row))continue;
      snapDirtyRows.delete(row);
      if(unwanted.test(signature(row))){hide(row);continue;}
      // Virtual lists own their row offsets: keep their measured height and transform.
      if(!row.hasAttribute('data-control-snap-row')&&getComputedStyle(row).position==='absolute'){
        const height=row.getBoundingClientRect().height;if(height>0)row.style.setProperty('--control-row-height',height+'px');
      }
      row.setAttribute('data-control-snap-row','');
      if(getComputedStyle(row).position==='static')row.setAttribute('data-control-snap-static-row','');
      for(let parent=row.parentElement;parent&&parent!==contacts;parent=parent.parentElement)parent.setAttribute('data-control-snap-list-flow','');
      for(const element of [row,...row.querySelectorAll('*')])for(const attr of ['data-control-snap-row-layout','data-control-snap-row-shell','data-control-snap-avatar-slot','data-control-snap-avatar-wrap','data-control-snap-text-slot','data-control-snap-text-flow','data-control-snap-name-line','data-control-snap-status-line','data-control-snap-name-only','data-control-snap-status-only','data-control-snap-group','data-control-snap-member','data-control-snap-row-camera','data-control-snap-outside-camera','data-control-snap-action-wrap'])element.removeAttribute(attr);
      const avatar=row.querySelector('img')||row.querySelector('[data-testid*="avatar" i],[class*="avatar" i],svg');
      let avatarGroup=avatar;
      while(avatarGroup?.parentElement&&avatarGroup.parentElement!==row&&!words(avatarGroup.parentElement.textContent))avatarGroup=avatarGroup.parentElement;
      const leaves=[...row.querySelectorAll('*')].filter(el=>!avatarGroup?.contains(el)&&!el.closest('svg,script,style,[data-control-snap-row-camera]')&&[...el.childNodes].some(n=>n.nodeType===3&&words(n.textContent)));
      const isStatus=el=>el.matches('small,time,[data-testid*="status"]')||/^(reçue?|ouverte?|remis|envoyé|vous avez|a réagi|a enregistré|enregistré|appel|nouveau snap|nouveau chat|received|opened|delivered|sent|saved|reacted|new snap|new chat|you |tap to|appuyez|\d+\s*(min|h|j|d|s)\b)/i.test(el.textContent.trim());
      const names=leaves.filter(el=>!isStatus(el)&&!el.closest('button[aria-label*="camera" i],button[aria-label*="photo" i]')&&!el.hasAttribute('data-control-snap-name'));
      let name=names.find(el=>el.matches('h1,h2,h3,h4,[data-testid*="name"],[data-display-name]'))||names[0];
      if(name&&!snapExperience?.validName(name.textContent))name=null;
      const resolved=snapExperience?.resolveIdentity(row,name?.textContent);
      let fallback=row.querySelector('[data-control-snap-name]');
      if(name){fallback?.remove();}
      else{
        const identity=row.querySelector('[data-display-name],[data-testid*="name"],[class*="name" i],[title]');
        const label=resolved?.displayName||row.getAttribute('data-display-name')||identity?.getAttribute('title');
        if(label&&!unwanted.test(label)){
          fallback=fallback||document.createElement('span');fallback.setAttribute('data-control-snap-name','');
          if(fallback.textContent!==label)fallback.textContent=label;
          if(!fallback.isConnected){
            const details=row.querySelector('[class*="details" i],[data-testid="conversation-info"]');
            (details&&!details.contains(avatar)?details:row).prepend(fallback);
          }name=fallback;
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
        const members=[...avatarSlot.querySelectorAll('img')].filter(img=>!img.closest('[data-control-snap-badge],[data-testid*="badge" i],[class*="badge" i]'));
        if(members.length>1){
          avatarSlot.setAttribute('data-control-snap-group',String(Math.min(3,members.length)));
          members.forEach((img,i)=>{
            img.setAttribute('data-control-snap-member',i<3?String(i):'extra');
            for(let node=img.parentElement;node&&node!==avatarSlot;node=node.parentElement)node.setAttribute('data-control-snap-avatar-wrap','');
          });
        }
        for(const badge of avatarSlot.querySelectorAll('span,div'))if([...badge.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()&&!words(n.textContent)))badge.setAttribute('data-control-snap-badge','');
      }
      for(const leaf of [...leaves,name]){
        if(!leaf.isConnected||avatarSlot?.contains(leaf))continue;
        const slot=childOf(leaf,layout);if(!slot)continue;
        slot.setAttribute('data-control-snap-text-slot','');
        for(let node=leaf;node&&node!==slot;node=node.parentElement)node.setAttribute('data-control-snap-text-flow','');
        if(leaf===slot)leaf.setAttribute('data-control-snap-text-flow','');
      }
      // Keep status fragments together below the name; allow a second line on narrow screens.
      name.setAttribute('data-control-snap-name-line','');
      const nameSlot=childOf(name,layout);
      if(nameSlot&&!leaves.some(el=>isStatus(el)&&nameSlot.contains(el)))nameSlot.setAttribute('data-control-snap-name-only','');
      for(const leaf of leaves.filter(isStatus)){
        let line=leaf;
        while(line.parentElement&&line.parentElement!==layout&&line.parentElement!==nameSlot&&!line.parentElement.contains(name))line=line.parentElement;
        if(!line.contains(name)){
          line.setAttribute('data-control-snap-status-line','');
          const slot=childOf(line,layout);if(slot&&!slot.contains(name))slot.setAttribute('data-control-snap-status-only','');
        }
      }
      // Only expose an actual native camera action; never invent a recipient or a send flow.
      const camera=[...row.querySelectorAll('button,[role="button"],a')].find(el=>el!==row&&!el.contains(name)&&/camera|appareil photo|prendre un snap|take a snap/i.test(signature(el)));
      if(camera){
        camera.setAttribute('data-control-snap-row-camera','');
        if(!layout.contains(camera)){
          camera.setAttribute('data-control-snap-outside-camera','');
          for(let node=camera.parentElement;node&&node!==row&&!node.contains(name);node=node.parentElement)node.setAttribute('data-control-snap-action-wrap','');
        }
      }
      snapProcessedRows.add(row);
    }
  }
  function snapHeader(contacts){
    const header=contacts.querySelector('header,[data-testid="chat-header"],[data-testid="conversation-list-header"]');
    if(header){
      header.setAttribute('data-control-snap-toolbar','');
      let title=header.querySelector('h1,h2,[role="heading"],[data-control-snap-toolbar-title]');
      if(!title&&header.children.length){title=document.createElement('span');title.setAttribute('data-control-snap-generated-title','');title.textContent='Chat';header.append(title);}
      title?.setAttribute('data-control-snap-toolbar-title','');
      const controls=[...header.querySelectorAll('button,[role="button"],a')].filter(el=>!el.closest('[role="dialog"],[role="menu"]'));
      for(const el of controls){
        const label=signature(el);
        const action=/search|recherch/i.test(label)?'search':/notification|alert/i.test(label)?'notifications':/add friend|ajout/i.test(label)?'add':/more|options|plus|menu|paramètre|settings/i.test(label)?'more':/profile|profil|account|compte/i.test(label)?'profile':null;
        if(!action)continue;
        el.setAttribute('data-control-snap-toolbar-action',action);
        for(let node=el.parentElement;node&&node!==header;node=node.parentElement){
          if(node.querySelector('input,[role="dialog"],[role="menu"]'))break;
          node.setAttribute('data-control-snap-toolbar-flow','');
        }
      }
      for(let node=title?.parentElement;node&&node!==header;node=node.parentElement)node.setAttribute('data-control-snap-toolbar-flow','');
    }
    for(const input of contacts.querySelectorAll('input[type="search"],input[placeholder*="Search" i],input[placeholder*="Recherch" i]'))input.setAttribute('data-control-snap-search','');
    const compose=[...document.querySelectorAll('button,[role="button"],a')].find(el=>el.id!=='control-snap-new-chat'&&!el.closest('[data-control-snap-row],[role="dialog"],[role="menu"]')&&/^(new (chat|message)|nouveau (chat|message)|nouvelle conversation|compose)(\b|$)/i.test(signature(el).trim()));
    compose?.setAttribute('data-control-snap-compose','');
    let fallback=document.getElementById('control-snap-new-chat');
    const search=contacts.querySelector('[data-control-snap-toolbar-action="search"],[data-control-snap-search]');
    if(compose||!search){fallback?.remove();return;}
    if(!fallback){
      fallback=document.createElement('button');fallback.id='control-snap-new-chat';fallback.type='button';fallback.setAttribute('aria-label','Nouvelle conversation');fallback.setAttribute('data-control-snap-compose','');
      fallback.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M13 4H5a2 2 0 0 0-2 2v12h7l4 3v-5M14 9l6-6 2 2-6 6-3 1Z"/></svg>';
      fallback.addEventListener('click',()=>{const current=contacts.querySelector('[data-control-snap-toolbar-action="search"],[data-control-snap-search]');if(current?.matches('input'))current.focus();else current?.click();});document.documentElement.append(fallback);
    }
  }
  function stopSnapAnchor(){snapExperience?.stopConversation();}
  function snapConversationLayout(pane,composer){
    if(!pane||!composer)return;
    const markers=['data-control-snap-chat-frame','data-control-snap-chat-log','data-control-snap-chat-composer'];
    for(const el of [pane,...pane.querySelectorAll(markers.map(a=>'['+a+']').join(','))])for(const attr of markers)el.removeAttribute(attr);
    let log=pane.querySelector('[role="log"],[data-testid="message-list"],[data-testid="chat-history"]');
    if(!log)log=[...pane.querySelectorAll('div,section')].filter(el=>!el.contains(composer)&&!composer.contains(el)&&/auto|scroll/.test(getComputedStyle(el).overflowY)).sort((a,b)=>b.getBoundingClientRect().height-a.getBoundingClientRect().height)[0];
    // Without a message region, leave the native controls alone instead of guessing at their layout.
    if(!log||log.contains(composer))return;
    let shared=log.parentElement;
    while(shared&&shared!==pane&&!shared.contains(composer))shared=shared.parentElement;
    if(!shared||!shared.contains(composer))return;
    // Stop at the common message/composer ancestor, NEVER inside the horizontal input toolbar.
    let footer=composer;
    while(footer.parentElement&&footer.parentElement!==shared)footer=footer.parentElement;
    footer.setAttribute('data-control-snap-chat-composer','');
    for(let node=log.parentElement;node&&node!==pane;node=node.parentElement)node.setAttribute('data-control-snap-chat-frame','');
    log.setAttribute('data-control-snap-chat-log','');
    if(document.documentElement.getAttribute('data-control-snap-view')==='conversation'){
      snapExperience?.attachConversation(pane,log);
    }
    const bg=getComputedStyle(log).backgroundColor;
    if(bg!=='rgba(0, 0, 0, 0)'&&bg!=='transparent')document.documentElement.style.setProperty('--control-chat-background',bg);
  }
  function snapCameraLayout(pane){
    if(!pane)return;
    const controls=[...pane.querySelectorAll('video,canvas,[data-testid="camera-view"],[data-testid="camera-panel"],button,[role="button"]')].filter(el=>!el.closest('[data-control-snap-viewer],[data-testid="snap-viewer"],[data-testid="media-viewer"],[role="dialog"]')).filter(el=>
      el.matches('video,canvas,[data-testid="camera-view"],[data-testid="camera-panel"]')||/camera|appareil photo|envoyer des snaps|send snaps/i.test(signature(el)+' '+el.textContent));
    for(const control of controls){
      if(control.matches('button,[role="button"]')){
        control.setAttribute('data-control-snap-camera-trigger','');
        const css=getComputedStyle(control),bounds=control.getBoundingClientRect();
        const initial=/cliquez sur l.appareil photo|click.*camera.*send.*snaps|ouvrir la cam[eé]ra|open camera|start camera|activer la cam[eé]ra/i.test(control.textContent);
        if(initial&&!pane.querySelector('video,canvas')){
          control.setAttribute('data-control-snap-camera-start','');
          control.setAttribute('data-control-snap-camera-large-trigger','');
        }else control.removeAttribute('data-control-snap-camera-start');
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
    if(!contacts){snapRowActions(document.body,'none');snapPendingCamera=null;document.getElementById('control-snap-new-chat')?.remove();stopSnapAnchor();snapTabs?.remove();document.documentElement.removeAttribute('data-control-snap-view');return;}
    if(root!==contacts&&root?.contains(contacts))while(contacts.parentElement!==root&&contacts.parentElement)contacts=contacts.parentElement;
    // The common parent is a better shell than a fixed depth when Snapchat adds wrappers.
    let branch=contacts;
    while(branch.parentElement&&branch.parentElement!==document.body&&branch.parentElement.children.length===1)branch=branch.parentElement;
    if(branch.parentElement&&branch.parentElement!==document.body)root=branch.parentElement;
    if(!root||!root.contains(contacts))return;
    contacts.setAttribute('data-control-snap-contacts','');root.setAttribute('data-control-snap-shell','');snapContactRows(contacts);snapHeader(contacts);
    for(let parent=root.parentElement;parent&&parent!==document.body&&parent.children.length===1;parent=parent.parentElement)parent.setAttribute('data-control-snap-viewport','');
    if(snapContacts!==contacts){
      snapContacts=contacts;
      contacts.addEventListener('scroll',()=>{if(!snapActionsFrame)snapActionsFrame=requestAnimationFrame(()=>{snapActionsFrame=0;if(contacts.isConnected)snapRowActions(contacts,document.documentElement.getAttribute('data-control-snap-view'));});},{capture:true,passive:true});
      contacts.addEventListener('click',event=>{const row=event.target.closest('[data-control-snap-row]');if(row){if(event.isTrusted)snapPendingCamera=null;snapExperience?.selectConversation(row);snapForceInbox=false;snapView='messages';snapLastComposer=null;schedule();}});
    }
    const panes=[...root.children].filter(el=>!el.matches('header,nav,button,[role="dialog"],[role="menu"],[data-control-snap-compose],[data-control-snap-viewer]')&&el!==branch&&el!==contacts&&!el.contains(contacts)&&!el.hasAttribute(hiddenAttr));
    for(const pane of panes)pane.setAttribute('data-control-snap-pane','');
    const conversation=document.querySelector('[data-testid="conversation-panel"],[data-testid="chat-panel"],[aria-label="Conversation"]')||panes.find(el=>el.querySelector('textarea,[contenteditable="true"],[role="textbox"]'));
    const composer=conversation?.querySelector('textarea,[contenteditable="true"],[role="textbox"]');
    const paneFor=el=>panes.find(p=>p===el||p.contains(el));
    for(const pane of panes){pane.removeAttribute('data-control-snap-conversation');pane.removeAttribute('data-control-snap-camera');}
    if(conversation){
      conversation.removeAttribute(hiddenAttr);
      const pane=paneFor(conversation);pane?.setAttribute('data-control-snap-conversation','');
      // A reused pane or an attachment camera must not inherit full-screen camera sizing.
      const cameraMarkers=['data-control-snap-camera-fill','data-control-snap-camera-surface','data-control-snap-camera-trigger','data-control-snap-camera-large-trigger','data-control-snap-camera-start'];
      if(pane)for(const el of [pane,...pane.querySelectorAll(cameraMarkers.map(a=>'['+a+']').join(','))])for(const attr of cameraMarkers)el.removeAttribute(attr);
      snapConversationLayout(pane,composer);
    }
    const previousCamera=snapCamera;
    snapCamera=panes.find(el=>!el.contains(composer)&&(el.matches('[data-testid="camera-panel"],[data-testid="camera-view"]')||el.querySelector('[data-testid="camera-panel"],[data-testid="camera-view"],button[aria-label*="camera" i],button[aria-label*="appareil photo" i]')||/send (?:a )?snaps|envoyer des snaps|cliquez sur l.appareil photo/i.test(el.textContent)));
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
      if(nextView==='conversation')snapConversationLayout(paneFor(conversation),composer);else stopSnapAnchor();
    }
    document.documentElement.style.setProperty('--control-snap-height',(window.visualViewport?.height||innerHeight)+'px');
    snapNavigation();snapRowActions(contacts,nextView);
    if(snapPendingCamera&&nextView==='conversation'){
      const pending=snapPendingCamera;
      const header=conversation?.querySelector('header,[data-testid="conversation-header"]');
      const camera=[...conversation.querySelectorAll('button,[role="button"]')].find(el=>/^(appareil photo|camera|ouvrir la caméra|open camera|prendre un snap|take a snap)(\b|$)/i.test(signature(el).trim())&&!/call|appel|video|vidéo|capture|shutter|send|envoyer/i.test(signature(el)));
      if(pending.expires>=Date.now()&&pending.name&&header?.textContent.includes(pending.name)&&camera&&visible(camera)&&!camera.disabled){snapPendingCamera=null;camera.click();}
    }
    for(const button of snapTabs.querySelectorAll('button')){button.setAttribute('aria-pressed',String(button.dataset.view===snapView));button.disabled=button.dataset.view==='snap'&&!snapCamera;const title=button.disabled?'La caméra Snapchat n’est pas disponible sur cette page.':'';if(button.title!==title)button.title=title;}
    // Native received-Snap viewers are separate from camera capture and must remain above the shell.
    for(const viewer of document.querySelectorAll('[data-testid="snap-viewer"],[data-testid="media-viewer"],[role="dialog"][aria-label*="Snap" i]')){
      if(viewer.querySelector('video,img,canvas')&&!viewer.querySelector('textarea,[contenteditable="true"]'))viewer.setAttribute('data-control-snap-viewer','');
    }
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
    if(app.id==='Snapchat'&&mode!=='account'){
      if(!snapExperience)snapExperience=globalThis.ControlSnapExperience?.create({onReady:schedule});
      snapExperience?.refreshOverlays();
    }
    fitViewport(mode);
    loading(mode);
    if(mode==='account'){
      snapExperience?.dispose();snapExperience=null;
      if(document.documentElement.hasAttribute('data-control-snap-view')){
        document.querySelectorAll('[data-control-snap-name],[data-control-snap-generated-title]').forEach(el=>el.remove());
        for(const el of document.querySelectorAll('*'))for(const name of el.getAttributeNames())if(name.startsWith('data-control-snap'))el.removeAttribute(name);
      }
      snapRowActions(document.body,'none');snapPendingCamera=null;document.getElementById('control-snap-new-chat')?.remove();stopSnapAnchor();snapTabs?.remove();document.documentElement.removeAttribute('data-control-snap-view');return;}
    for(const link of document.querySelectorAll('nav a[href],[role="navigation"] a[href]'))try{const url=new URL(link.href,location.href),n=networkFor(url.hostname);if(n?.id===app.id&&kind(n,url)==='blocked')hide(link);}catch{}
    if(mode==='media')singleMedia();if(app.id==='Snapchat')snapchat();
    if(app.id==='Instagram'&&mode==='messages')instagramInbox();
  }
  document.addEventListener('click',event=>{
    if(app.id==='Snapchat'&&event.target instanceof Element){
      const back=event.target.closest('button,[role="button"],a');
      if(back?.closest('[data-control-snap-conversation]')&&/^(back|retour|revenir|close conversation|fermer la conversation)(\b|$)/i.test(signature(back).trim()||back.textContent.trim())){
        snapPendingCamera=null;snapForceInbox=true;snapView='messages';schedule();
      }
    }
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
  let swipe=null;
  document.addEventListener('touchstart',event=>{
    swipe=null;
    if(app.id!=='Snapchat'||!compactSnap()||event.touches.length!==1||!['messages','snap'].includes(document.documentElement.getAttribute('data-control-snap-view')))return;
    const target=event.target instanceof Element?event.target:null;
    if(!target?.closest('[data-control-snap-contacts],[data-control-snap-camera]')||target.closest('input,textarea,[contenteditable="true"],[role="dialog"],[role="menu"],[data-control-snap-viewer]'))return;
    for(let node=target;node&&node!==document.body;node=node.parentElement)if(node.scrollWidth>node.clientWidth+2&&/auto|scroll/.test(getComputedStyle(node).overflowX))return;
    swipe={x:event.touches[0].clientX,y:event.touches[0].clientY,dx:0,horizontal:false};
  },{passive:true});
  document.addEventListener('touchmove',event=>{
    if(!swipe)return;
    if(event.touches.length!==1){swipe=null;return;}
    const dx=event.touches[0].clientX-swipe.x,dy=event.touches[0].clientY-swipe.y;
    if(!swipe.horizontal&&Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)){swipe=null;return;}
    if(Math.abs(dx)>18&&Math.abs(dx)>Math.abs(dy)*1.5){swipe.horizontal=true;swipe.dx=dx;if(event.cancelable)event.preventDefault();}
  },{passive:false});
  document.addEventListener('touchend',()=>{
    if(swipe?.horizontal&&Math.abs(swipe.dx)>64){
      const view=swipe.dx<0?'snap':'messages';
      // Show the native start prompt; a swipe does not capture or send anything.
      if(view==='messages'||snapCamera){snapView=view;snapForceInbox=view==='messages';refresh();}
    }
    swipe=null;
  },{passive:true});
  document.addEventListener('touchcancel',()=>swipe=null,{passive:true});
  document.addEventListener('wheel',stopContinuation,{capture:true,passive:false});
  document.addEventListener('touchmove',stopContinuation,{capture:true,passive:false});
  document.addEventListener('keydown',stopContinuation,true);
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(refresh);}}
  new MutationObserver(records=>{
    let meaningful=app.id!=='Snapchat';
    for(const record of records){
      const target=record.target instanceof Element?record.target:record.target.parentElement;
      if(app.id==='Snapchat'){
        if(target?.closest('[data-control-snap-owned],#control-snap-session,[data-control-snap-name],#control-snap-row-actions,#control-snap-new-chat'))continue;
        if(record.type==='childList'&&[...record.addedNodes,...record.removedNodes].length&&[...record.addedNodes,...record.removedNodes].every(node=>node instanceof Element&&node.matches('[data-control-snap-owned],#control-snap-session,#control-snap-row-actions,#control-snap-new-chat,[data-control-snap-name]')))continue;
        // Messages, media and call internals have dedicated session observers.
        if(target?.closest('[data-csx-scroll],[data-csx-overlay]'))continue;
        meaningful=true;
      }
      const row=target?.closest('[data-control-snap-row]');if(row)snapDirtyRows.add(row);
      for(const node of record.addedNodes||[])if(node instanceof Element){
        if(node.matches('[data-control-snap-row]'))snapDirtyRows.add(node);
        node.querySelectorAll('[data-control-snap-row]').forEach(el=>snapDirtyRows.add(el));
      }
    }
    if(meaningful)schedule();
  }).observe(document,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','data-testid','href','class','hidden','aria-expanded']});
  window.addEventListener('popstate',refresh);window.addEventListener('pageshow',refresh);window.addEventListener('resize',schedule);
  window.visualViewport?.addEventListener('resize',schedule);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();else finishLoading();});
  setInterval(()=>{if(lastUrl!==location.href||(grant&&grant.expires<=Date.now())){if(grant?.expires<=Date.now()){grant=null;try{sessionStorage.removeItem(tokenKey);}catch{}}refresh();}},200);
  refresh();
})();
