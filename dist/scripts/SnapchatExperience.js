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
    const counters = {structuralPasses:0, scrollWrites:0, initialPositions:0, scopedMutations:0, layoutPasses:0};
    const layouts=new WeakMap();
    const style = document.createElement('style'); style.dataset.controlSnapOwned = 'style';
    style.textContent = `
      [data-csx-ready="LOADING"]{opacity:0!important;visibility:hidden!important;pointer-events:none!important}
      video[data-csx-media][data-csx-ready="LOADING"]{opacity:1!important;visibility:visible!important;pointer-events:auto!important}
      [data-csx-ready="READY"]{opacity:1;transition:opacity 180ms cubic-bezier(.2,0,0,1)}
      [data-control-snap-owned="loading"]{position:fixed;z-index:2147483201;pointer-events:none;display:grid;place-items:center}
      .csx-spinner{width:22px;height:22px;border:2px solid #8885;border-top-color:#959595;border-radius:50%;animation:csx-spin .8s linear infinite}
      @keyframes csx-spin{to{transform:rotate(1turn)}}
      [data-csx-scroll]{overflow-anchor:none!important;scroll-behavior:auto!important;overscroll-behavior:contain}
      [data-csx-chat]{position:relative!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;min-height:0!important;min-width:0!important}
      [data-csx-chat][hidden],[data-csx-chat][aria-hidden="true"]{display:none!important}
      [data-csx-chat-frame]{display:flex!important;flex-direction:column!important;flex:1 1 0%!important;min-height:0!important;min-width:0!important;height:auto!important;overflow:hidden!important;position:relative!important;inset:auto!important}
      [data-csx-chat-header]{position:relative!important;inset:auto!important;flex:0 0 auto!important;min-height:48px;z-index:2}
      [data-csx-chat-log]{position:relative!important;inset:auto!important;flex:1 1 0%!important;height:auto!important;min-height:0!important;min-width:0!important;overflow-y:auto!important;overflow-x:hidden!important;scrollbar-gutter:stable}
      [data-csx-composer]{position:relative!important;inset:auto!important;transform:none!important;flex:0 0 auto!important;min-width:0!important;max-width:100%!important;height:auto!important;overflow:visible!important;margin:0!important;z-index:2}
      [data-csx-composer-controls]{display:flex!important;flex-flow:row nowrap!important;align-items:center!important;gap:6px!important;min-width:0!important;width:100%!important;box-sizing:border-box!important}
      [data-csx-composer] :is(textarea,[contenteditable="true"],[role="textbox"]){min-width:0!important;max-width:100%!important;min-height:38px!important;max-height:112px!important;overflow-y:auto!important;font-size:16px!important;box-sizing:border-box!important;resize:none!important;scroll-margin:0!important}
      [data-csx-composer-controls]>:is(textarea,[contenteditable="true"],[role="textbox"]){flex:1 1 0%!important}
      [data-csx-composer-controls]>button{flex:0 0 40px!important;width:40px!important;height:40px!important;min-width:0!important;padding:8px!important;border-radius:50%!important}
      [data-control-snap-owned="new-message"]{position:absolute;bottom:var(--csx-composer-offset,72px);left:50%;transform:translateX(-50%);z-index:4;display:flex;align-items:center;gap:6px;border:1px solid #ffffff40;border-radius:22px;background:#252525ee;color:white;padding:9px 14px;font:600 13px system-ui;box-shadow:0 3px 12px #0002;cursor:pointer}
      [data-control-snap-owned="new-message"][hidden]{display:none!important}
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
    const essentialUI=globalThis.ControlSnapEssentialUI?.create({selectors,resolveIdentity,selectConversation});
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
    function layoutConversation(pane,log,input){
      if(!pane||!log||!input||log.contains(input))return;
      const old=layouts.get(pane);if(old?.log===log&&old.input===input&&old.footer.isConnected)return;
      if(old)for(const [node,attr] of old.marks)node.removeAttribute(attr);
      let shared=log.parentElement;while(shared&&shared!==pane&&!shared.contains(input))shared=shared.parentElement;
      if(!shared?.contains(input))return;
      let footer=input;while(footer.parentElement&&footer.parentElement!==shared)footer=footer.parentElement;
      const marks=[],tag=(node,attr)=>{mark(node,attr);marks.push([node,attr]);};
      tag(pane,'data-csx-chat');tag(log,'data-csx-chat-log');tag(footer,'data-csx-composer');
      for(let node=log.parentElement;node&&node!==pane;node=node.parentElement)tag(node,'data-csx-chat-frame');
      const header=pane.querySelector('header,[data-testid="conversation-header"]');if(header&&!log.contains(header))tag(header,'data-csx-chat-header');
      for(let node=input.parentElement;node&&footer.contains(node);node=node.parentElement){
        if(node.querySelectorAll('button,[role="button"]').length>=2||node.matches('[role="toolbar"],form')){tag(node,'data-csx-composer-controls');break;}
        if(node===footer)break;
      }
      layouts.set(pane,{log,input,footer,marks});counters.layoutPasses++;
    }
    function releaseLayout(pane){
      const layout=layouts.get(pane);if(!layout)return;
      for(const [node,attr] of layout.marks)node.removeAttribute(attr);
      pane.style.removeProperty('--csx-composer-offset');layouts.delete(pane);
    }
    function stopConversation() { const old=active;active=null;if(old){old.dispose();releaseLayout(old.pane);old.pane.removeAttribute('data-csx-ready');} }
    function attachConversation(pane, log, key) {
      if (!log || !pane || disposed) return;
      key = key || selectedKey || keyOf(pane);
      if (active?.log === log && active.key === key) {layoutConversation(pane,log,pane.querySelector(selectors.composer));return active;}
      stopConversation();
      layoutConversation(pane,log,pane.querySelector(selectors.composer));
      const abort = new AbortController(); let frame = 0, sampleFrame = 0, followFrame = 0, followTarget = 0, following = false, initialTimer = 0, stable = 0, signature = '', userIntent = false, atBottom = true, metrics = null;
      const notice=document.createElement('button');notice.type='button';notice.hidden=true;notice.dataset.controlSnapOwned='new-message';notice.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 4v16m-6-6 6 6 6-6"/></svg><span>New message</span>';pane.append(notice);
      const state = {pane,log,key,hasInitialPositioned:false,get following(){return following;},dispose(){abort.abort();notice.remove();cancelAnimationFrame(frame);cancelAnimationFrame(sampleFrame);cancelAnimationFrame(followFrame);clearTimeout(initialTimer);changes.disconnect();resize.disconnect();readySurface(pane,true);log.removeAttribute('data-csx-scroll');}};
      active = state; mark(log,'data-csx-scroll'); readySurface(pane,false,'conversation');
      let pendingImages=0;
      for(const image of [...log.querySelectorAll('img')].slice(-12)){
        pendingImages++;
        const settled=()=>{pendingImages=Math.max(0,pendingImages-1);};
        const decode=()=>{if(image.decode)image.decode().catch(()=>{}).then(settled);else settled();};
        if(image.complete)decode();else{image.addEventListener('load',decode,{once:true,signal:abort.signal});image.addEventListener('error',settled,{once:true,signal:abort.signal});}
      }
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
      const remember = () => { if (current()) { atBottom=distance()<100;metrics=snapshot();if(atBottom)notice.hidden=true; } };
      function followBottom(){
        followTarget=Math.max(0,log.scrollHeight-log.clientHeight);
        if(following)return;
        if(matchMedia('(prefers-reduced-motion:reduce)').matches){write(log.scrollHeight);remember();return;}
        following=true;notice.hidden=true;const start=log.scrollTop,started=performance.now();
        const tick=now=>{if(!current()||suspended){following=false;return;}const progress=Math.min(1,(now-started)/180);write(start+(followTarget-start)*(1-Math.pow(1-progress,3)));if(progress<1)followFrame=requestAnimationFrame(tick);else{following=false;followFrame=0;remember();}};
        followFrame=requestAnimationFrame(tick);
      }
      const intent = () => { cancelAnimationFrame(followFrame);following=false;userIntent=true; if (!state.hasInitialPositioned) { state.hasInitialPositioned=true; readySurface(pane,true); } atBottom=distance()<100; };
      notice.addEventListener('click',()=>{if(current())followBottom();},{signal:abort.signal});
      log.addEventListener('wheel',intent,{passive:true,signal:abort.signal});log.addEventListener('touchmove',intent,{passive:true,signal:abort.signal});
      log.addEventListener('pointerdown',intent,{passive:true,signal:abort.signal});
      log.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(e.key))intent();},{signal:abort.signal});
      log.addEventListener('scroll',()=>{if(!following&&!sampleFrame)sampleFrame=requestAnimationFrame(()=>{sampleFrame=0;if(!following)remember();});},{passive:true,signal:abort.signal});
      function initialize() {
        frame=0;
        if (!current() || state.hasInitialPositioned || suspended) return;
        const hasContent = log.children.length || log.textContent.trim() || pane.querySelector('[data-testid="empty-conversation"]');
        const next = log.scrollHeight + ':' + log.clientHeight;
        stable = next === signature ? stable+1 : 0; signature=next;
        if (hasContent && pendingImages===0 && stable >= 3 && log.clientHeight > 0) {
          if(!userIntent){write(log.scrollHeight);counters.initialPositions++;}
          state.hasInitialPositioned=true;clearTimeout(initialTimer);remember();readySurface(pane,true);return;
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
        } else if (append && atBottom && (!userIntent||following||Math.abs(log.scrollTop-old.top)<2)) followBottom();
        else if(append&&!atBottom)notice.hidden=false;
        // Resize/media decode alone never pins a reader to the bottom after initial positioning.
        if(!following)remember();
      }
      const changes=new MutationObserver(records=>{counters.scopedMutations++; if(frame||!state.hasInitialPositioned)return; frame=requestAnimationFrame(()=>{frame=0;reconcile(records);});});
      changes.observe(log,{childList:true,subtree:true,characterData:true});
      let oldHeight=log.clientHeight;
      const resize=new ResizeObserver(()=>{const footer=layouts.get(pane)?.footer;if(footer)pane.style.setProperty('--csx-composer-offset',(footer.getBoundingClientRect().height+12)+'px');const height=log.clientHeight;if(height===oldHeight)return;oldHeight=height;if(current()&&!suspended&&state.hasInitialPositioned&&atBottom){write(log.scrollHeight);remember();}});
      resize.observe(log); // Not every message: one observer and no reconnect on each mutation.
      frame=requestAnimationFrame(initialize);
      initialTimer=setTimeout(()=>{cancelAnimationFrame(frame);frame=0;if(current()&&!state.hasInitialPositioned){if(!userIntent){write(log.scrollHeight);counters.initialPositions++;}state.hasInitialPositioned=true;readySurface(pane,true);mark(pane,'data-csx-ready','ERROR');remember();}},3500);
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
      old.root.removeAttribute('data-csx-overlay');old.root.removeAttribute('data-csx-viewer-state');old.root.removeAttribute('data-control-snap-viewer');
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
        if(event.defaultPrevented||event.target.closest('button,a,input,[role="button"],video'))return;
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
          mark(remote,'data-csx-call-remote');
          remote.style.setProperty('--csx-fit','contain');
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
      essentialUI?.refresh();
      const height=(window.visualViewport?.height||innerHeight)+'px';
      const callRoot=[...document.querySelectorAll(selectors.call)].find(shown);
      if(callRoot){callRoot.style.setProperty('--csx-height',height);attachCall(callRoot);}else stopCall();
      const viewerRoot=[...document.querySelectorAll(selectors.viewer)].find(node=>shown(node)&&!node.closest(selectors.call)&&node.querySelector('img,video,canvas'));
      if(viewerRoot){viewerRoot.style.setProperty('--csx-height',height);attachViewer(viewerRoot);}else stopViewer();
      suspend(!!callRoot||!!viewerRoot);
      if(!callRoot)viewer?.resumePhoto();
    }
    function dispose() {
      if(disposed)return;essentialUI?.dispose();stopViewer();stopCall();stopConversation();for(const [node,entry] of surfaces){clearTimeout(entry.timer);entry.indicator.remove();node.removeAttribute('data-csx-ready');}surfaces.clear();
      document.querySelectorAll('[data-csx-ready]').forEach(node=>node.removeAttribute('data-csx-ready'));
      for(const attr of ['data-csx-chat','data-csx-chat-frame','data-csx-chat-header','data-csx-chat-log','data-csx-composer','data-csx-composer-controls'])document.querySelectorAll('['+attr+']').forEach(node=>{node.removeAttribute(attr);node.style.removeProperty('--csx-composer-offset');});
      style.remove();identities.clear();disposed=true;
    }
    return {selectors,keyOf,validName,resolveIdentity,selectConversation,attachConversation,stopConversation,readySurface,suspend,refreshOverlays,dispose,counters,get active(){return active;},get viewer(){return viewer;},get call(){return call;}};
  }
  globalThis.ControlSnapExperience={create,selectors,validName};
})();
