(() => {
  'use strict';
  let state = { active: false }, timer, serial = 0;
  const masked = new Map(), shortMasked = new Map(), adMasked = new Map(), originalAutoplay = new Map();let revealed = new WeakSet();
  const selector = "article,[role='article'],[data-testid='tweet'],[role='listitem'],ytd-video-renderer,ytd-rich-item-renderer,ytd-compact-video-renderer,ytd-grid-video-renderer,[data-e2e*='feed-item'],[data-e2e*='recommend-item']";
  const pattern = /\b(?:nsfw|porn(?:ography)?|porno(?:graphie)?|xxx|nudes?|nudity|nudité|erotic(?:a)?|érotique|contenu\s+(?:adulte|explicite)|adult\s+content|sexual\s+content|only\s?fans|fansly)\b|(?:\b18\s*\+|🔞)/i;
  const hostMatches = (host, domains) => domains.some(d => host === d || host.endsWith('.' + d));
  let metricSession='', counted={shorts:new WeakSet(),adult:new WeakSet(),ads:new WeakSet()}, pending={shorts:0,adult:0,ads:0}, metricTimer;
  function count(kind,node) {
    if(!state.active||!state.premium||!state.session||counted[kind].has(node))return;
    counted[kind].add(node);pending[kind]++;clearTimeout(metricTimer);metricTimer=setTimeout(flush,800);
  }
  function flush() {
    if(!state.active||!state.premium)return;
    for(const kind of ['shorts','adult','ads'])while(pending[kind]>0){const amount=Math.min(100,pending[kind]);pending[kind]-=amount;
      chrome.runtime.sendMessage({action:'metrics',kind,count:amount,eventId:crypto.randomUUID(),session:metricSession}).catch(()=>{});
    }
  }
  function alreadyHidden(node){return !node.isConnected||node.closest('[data-seraphim-masked],[data-seraphim-shorts],[data-seraphim-ad],[data-seraphim-blacklist]')||getComputedStyle(node).display==='none'||node.getClientRects().length===0;}
  function ads() {
    const targets=new Set();
    if(state.active&&state.premium&&state.ads)for(const node of document.querySelectorAll('ins.adsbygoogle,[data-ad-slot],ytd-ad-slot-renderer,ytd-display-ad-renderer,ytd-promoted-sparkles-web-renderer,ytd-promoted-video-renderer,[data-testid="placementTracking"],[data-advertisement="true"]'))targets.add(node);
    for(const [node,entry] of [...adMasked])if(!targets.has(node)||!node.isConnected){if(entry.display)node.style.setProperty('display',entry.display,entry.priority);else node.style.removeProperty('display');node.removeAttribute('data-seraphim-ad');adMasked.delete(node);}
    for(const node of targets){if(adMasked.has(node)||alreadyHidden(node))continue;const display=node.style.getPropertyValue('display'),priority=node.style.getPropertyPriority('display');node.dataset.seraphimAd='true';node.style.setProperty('display','none','important');adMasked.set(node,{display,priority});count('ads',node);}
  }
  function restore(entry) {
    if (entry.display) entry.node.style.setProperty('display', entry.display, entry.priority);else entry.node.style.removeProperty('display');
    entry.node.removeAttribute('data-seraphim-masked');entry.placeholder.remove();masked.delete(entry.id);
  }
  function mask(node) {
    if (alreadyHidden(node) || revealed.has(node) || node.closest('[data-seraphim-placeholder]')) return;
    const id = String(++serial), placeholder = document.createElement('div');placeholder.dataset.seraphimPlaceholder = id;
    const root = placeholder.attachShadow({ mode: 'closed' });root.innerHTML = '<style>:host{display:block;margin:12px 0}.card{font:13px/1.5 Segoe UI,sans-serif;color:#766995;background:#f3eefb;border:1px solid #e5ddf3;border-radius:16px;padding:20px}.card.dark{color:#bcb2d2;background:#211d2b;border-color:#413753}b{display:block;color:inherit;margin-bottom:8px}button{background:transparent;color:inherit;border:1px solid currentColor;border-radius:9px;padding:8px 12px;cursor:pointer}</style>';
    const card = document.createElement('div');card.className = 'card' + (state.premium ? ' dark' : '');const label = document.createElement('b');label.textContent = 'Control · Contenu sensible masqué';card.append(label);
    const detail = document.createElement('p');detail.textContent = 'Un signal textuel a été détecté. Vous pouvez garder cette pause ou recopier un passage pour révéler cet élément.';card.append(detail);
    const reveal = document.createElement('button');reveal.textContent = 'Recopier un passage pour révéler';reveal.addEventListener('click', () => chrome.runtime.sendMessage({ action: 'revealRequest', item: id }));card.append(reveal);root.append(card);
    const display = node.style.getPropertyValue('display'), priority = node.style.getPropertyPriority('display');node.dataset.seraphimMasked = id;node.style.setProperty('display', 'none', 'important');node.before(placeholder);masked.set(id, { id, node, placeholder, display, priority });count('adult',node);
  }
  function quiet() {
    shortVideos();ads();
    const existing = document.getElementById('seraphim-quiet-style');
    if (!state.active || !state.quiet) { existing?.remove();for(const [video,value] of originalAutoplay) if(video.isConnected) video.setAttribute('autoplay',value);originalAutoplay.clear();return; }
    if (!existing) { const style = document.createElement('style');style.id = 'seraphim-quiet-style';style.textContent = '#related:has(ytd-watch-next-secondary-results-renderer){display:none!important}';(document.head || document.documentElement).append(style); }
    for (const video of document.querySelectorAll('video[autoplay]')) { if(!originalAutoplay.has(video)) originalAutoplay.set(video,video.getAttribute('autoplay'));video.removeAttribute('autoplay');video.autoplay = false; }
  }
  function restoreShorts(node,entry) {
    if(entry.display)node.style.setProperty('display',entry.display,entry.priority);else node.style.removeProperty('display');
    node.removeAttribute('data-seraphim-shorts');entry.placeholder?.remove();shortMasked.delete(node);
  }
  function shortVideos() {
    const targets=new Set();
    if(state.active&&state.premium&&state.shorts) {
      const host=location.hostname,path=location.pathname;
      if(hostMatches(host,['instagram.com','facebook.com'])) {
        if(/^\/(?:reels?|watch\/reels)(?:\/|$)/i.test(path)) {const main=document.querySelector('main,[role="main"]');if(main)targets.add(main);}
        else for(const link of document.querySelectorAll('a[href*="/reel/"],a[href*="/reels/"]'))targets.add(link.closest('article,[role="article"],[role="listitem"]')||link);
      }
      if(hostMatches(host,['youtube.com'])) {
        for(const node of document.querySelectorAll('ytd-reel-shelf-renderer,ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]),ytd-guide-entry-renderer:has(a[href^="/shorts"])'))targets.add(node);
        if(/^\/shorts(?:\/|$)/i.test(path))for(const node of document.querySelectorAll('ytd-shorts'))targets.add(node);
      }
      if(hostMatches(host,['snapchat.com'])&&/^\/spotlight(?:\/|$)/i.test(path)){const main=document.querySelector('main,[role="main"]');if(main)targets.add(main);}
    }
    for(const [node,entry] of [...shortMasked])if(!targets.has(node)||!node.isConnected)restoreShorts(node,entry);
    for(const node of targets) {
      if(shortMasked.has(node)||alreadyHidden(node))continue;
      const display=node.style.getPropertyValue('display'),priority=node.style.getPropertyPriority('display');
      const placeholder=document.createElement('div');placeholder.dataset.seraphimShortPlaceholder='true';
      const shadow=placeholder.attachShadow({mode:'closed'});shadow.innerHTML='<style>:host{display:block;margin:12px 0}.pause{font:12px/1.7 Segoe UI,sans-serif;color:#c8bbdc;background:#19151f;border:1px solid #4a3d59;border-radius:14px;padding:20px}b{display:block;color:#dbc9f3;margin-bottom:5px}</style><div class="pause"><b>Seraphim · Le flux court est en pause.</b>Revenez à votre intention. Cette option se règle dans la page Web de Seraphim.</div>';
      node.before(placeholder);node.dataset.seraphimShorts='true';node.style.setProperty('display','none','important');shortMasked.set(node,{display,priority,placeholder});count('shorts',node);
    }
  }
  const blacklistMasked=new Map();let blacklistRules=[],blacklistRevealed=new WeakMap();const blacklistSignature=node=>(node.textContent||"").slice(0,20000)+[...node.querySelectorAll("img[alt]")].map(i=>i.alt).join(" ");
  const fold=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  const escapeRx=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  function blacklistMatch(node){
    const text=fold((node.textContent||'').slice(0,20000)+' '+(node.getAttribute('aria-label')||'')+' '+[...node.querySelectorAll('img[alt]')].map(n=>n.alt).join(' '));
    const authors=[...node.querySelectorAll('[data-testid="User-Name"],[data-testid="UserName"],[data-e2e*="author"],a[rel="author"],header a,.author,[itemprop="author"]')].map(n=>fold(n.textContent||''));
    const handles=[...node.querySelectorAll('header a[href],a[rel="author"],[data-testid="User-Name"] a,[data-e2e*="author"] a')].map(a=>{try{return fold(new URL(a.href,location.href).pathname.split('/').filter(Boolean)[0]).replace(/^@/,'');}catch{return '';}});
    for(const r of blacklistRules){if(r.kind==='handle'&&handles.includes(r.term)||r.kind==='name'&&authors.some(a=>r.rx.test(a)))return 'certain';if(r.rx.test(text)||r.kind==='handle'&&[...node.querySelectorAll('a[href]')].some(a=>{try{return new URL(a.href,location.href).pathname.split('/').some(p=>fold(p).replace(/^@/,'')===r.term);}catch{return false;}}))return 'uncertain';}return null;
  }
  function restoreBlacklist(entry){if(entry.display)entry.node.style.setProperty('display',entry.display,entry.priority);else entry.node.style.removeProperty('display');entry.node.removeAttribute('data-seraphim-blacklist');entry.placeholder?.remove();blacklistMasked.delete(entry.id);}
  function scanBlacklist(){
    for(const entry of [...blacklistMasked.values()]){const match=state.active&&state.blacklistEnabled?blacklistMatch(entry.node):null;if(!entry.node.isConnected||!match||match!==entry.kind)restoreBlacklist(entry);}
    if(!state.active||!state.blacklistEnabled||!blacklistRules.length)return;
    const targets=document.querySelectorAll(selector+',shreddit-post,[data-test-id="pin"],li.b_algo,.tF2Cxc,.MjjYud:has(h3)');
    for(const node of [...targets].slice(0,600)){if(alreadyHidden(node)||node.dataset.seraphimBlacklist||node.closest('[data-seraphim-blacklist]'))continue;const kind=blacklistMatch(node);if(!kind||kind==='uncertain'&&blacklistRevealed.get(node)===blacklistSignature(node))continue;
      const id='bl:'+String(++serial),display=node.style.getPropertyValue('display'),priority=node.style.getPropertyPriority('display');let placeholder=null;
      if(kind==='uncertain'){placeholder=document.createElement('div');placeholder.dataset.seraphimPlaceholder=id;const shadow=placeholder.attachShadow({mode:'closed'});shadow.innerHTML='<style>:host{display:block;margin:15px 0}.veil{position:relative;min-height:145px;display:grid;place-items:center;border-radius:15px;overflow:hidden;background:#14121c;border:1px solid #b7a0d12d;color:#d2c1e6;font:12px/1.6 Segoe UI}.media{position:absolute;inset:0;filter:blur(18px);opacity:.12;background-size:cover;background-position:center}.copy{position:relative;text-align:center;padding:25px}b{display:block;font-weight:500}button{font:inherit;margin-top:12px;padding:8px 15px;border:1px solid #c1a6e755;border-radius:20px;color:inherit;background:transparent;cursor:pointer}</style>';
       const veil=document.createElement('div');veil.className='veil';const media=document.createElement('div');media.className='media';const image=node.querySelector('img');if(image?.currentSrc){try{const u=new URL(image.currentSrc);if(['https:','data:'].includes(u.protocol))media.style.backgroundImage='url('+JSON.stringify(u.href)+')';}catch{}}const copy=document.createElement('div');copy.className='copy';const title=document.createElement('b');title.textContent='Blacklist · correspondance à vérifier';const button=document.createElement('button');button.textContent=state.premium?'Recopier avant de voir':'Afficher cet élément';button.onclick=()=>{if(state.premium)chrome.runtime.sendMessage({action:'revealRequest',item:id}).catch(()=>{});else{blacklistRevealed.set(node,blacklistSignature(node));revealed.add(node);restoreBlacklist(blacklistMasked.get(id));}};copy.append(title,button);veil.append(media,copy);shadow.append(veil);node.before(placeholder);
      }
      node.dataset.seraphimBlacklist=id;node.style.setProperty('display','none','important');blacklistMasked.set(id,{id,node,display,priority,placeholder,kind});count('adult',node);
    }
  }

  function scan() {
    scanBlacklist();
    if (!state.active || !state.adult) { for (const entry of [...masked.values()]) restore(entry);quiet();return; }
    for (const node of document.querySelectorAll(selector)) {
      if (node.dataset.seraphimMasked || node.closest('[data-seraphim-shorts]') || revealed.has(node)) continue;
      let sensitive = pattern.test((node.textContent || '').slice(0,20000) + ' ' + (node.getAttribute('aria-label') || ''));
      for (const media of node.querySelectorAll('img[alt],a[href]')) {
        if (pattern.test(media.getAttribute('alt') || '')) sensitive = true;
        if (media.href) try { if (hostMatches(new URL(media.href).hostname, state.adultDomains || [])) sensitive = true; } catch {}
      }
      if (sensitive) mask(node);
    }
    quiet();
  }
  function update(next) {
    if (next.session !== state.session || !next.active) revealed = new WeakSet();
    if(next.session!==metricSession){metricSession=next.session||'';counted={shorts:new WeakSet(),adult:new WeakSet(),ads:new WeakSet()};pending={shorts:0,adult:0,ads:0};clearTimeout(metricTimer);}
    if(!next.active){pending={shorts:0,adult:0,ads:0};clearTimeout(metricTimer);}
    if(!next.active||next.session!==state.session||JSON.stringify(next.blacklist)!==JSON.stringify(state.blacklist))blacklistRevealed=new WeakMap();
    blacklistRules=(next.blacklist||[]).slice(0,500).map(raw=>{const value=fold(raw);const kind=value.startsWith("@")?"handle":value.startsWith("mot:")?"keyword":"name";const term=value.replace(/^(?:@|nom:|mot:)\s*/,"");return {kind,term,rx:new RegExp("(^|[^\\p{L}\\p{N}_])"+escapeRx(term)+"([^\\p{L}\\p{N}_]|$)","iu")};}).filter(r=>r.term.length>=2);
    state = next;
    scan();
  }
  chrome.runtime.onMessage.addListener(message => {
    if (message.action === 'state') update(message.state);
    if (message.action === 'reveal') { const blocked=blacklistMasked.get(message.item);if(blocked&&blocked.kind==='uncertain'){blacklistRevealed.set(blocked.node,blacklistSignature(blocked.node));revealed.add(blocked.node);restoreBlacklist(blocked);}const entry = masked.get(message.item);if (entry) { revealed.add(entry.node);restore(entry); } }
  });
  const observer = new MutationObserver(() => { clearTimeout(timer);timer = setTimeout(scan, 350); });observer.observe(document, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['alt','title','href','style','class'] });
  addEventListener('popstate',scan);addEventListener('hashchange',scan);
  chrome.runtime.sendMessage({ action: 'status' }).then(update).catch(() => update({ active: false }));
})();
