import { rulesFor, safeUrl, safeSearchUrl } from './policy.js';
let state = { active: false, connected: false }, port, sequence = 0, grants = [], fingerprint = '', chain = Promise.resolve();
const requests = new Map();let threatCache={version:null,domains:[]};
async function loadThreats(next){
  if(!next.active||!next.premium||!next.threat)return [];
  if(threatCache.version===next.threatVersion&&threatCache.domains.length===next.threatCount)return threatCache.domains;
  const stored=await chrome.storage.local.get('threatCache');const saved=stored.threatCache;
  if(saved?.version===next.threatVersion&&Array.isArray(saved.domains)&&saved.domains.length===next.threatCount){threatCache=saved;return saved.domains;}
  const domains=[];for(let n=0;n<Math.ceil(next.threatCount/500);n++){const page=await native({action:'threatPage',count:n,session:next.session,text:next.threatVersion});if(!page.valid||page.threatVersion!==next.threatVersion||!Array.isArray(page.threatDomains))throw Error('Liste interrompue');domains.push(...page.threatDomains);}
  if(domains.length!==next.threatCount)throw Error('Liste incomplète');threatCache={version:next.threatVersion,domains};await chrome.storage.local.set({threatCache});return domains;
}
function listed(host){const set=new Set(threatCache.domains);let candidate=host.toLowerCase();while(candidate.includes('.')){if(set.has(candidate))return true;candidate=candidate.slice(candidate.indexOf('.')+1);}return false;}

function native(request) {
  return new Promise(resolve => {
    try {
      if (!port) {
        port = chrome.runtime.connectNative('com.seraphim.control');
        port.onMessage.addListener(response => { const pending = requests.get(response.seq); if (pending) { clearTimeout(pending.timer); requests.delete(response.seq); pending.resolve(response); } });
        port.onDisconnect.addListener(() => { void chrome.runtime.lastError;port = null; for (const pending of requests.values()) { clearTimeout(pending.timer); pending.resolve({ active: false, connected: false }); } requests.clear(); apply({ active: false, connected: false }); });
      }
      const seq = ++sequence;
      const timer = setTimeout(() => { requests.delete(seq); resolve({ active: false, connected: false }); }, 2500);
      requests.set(seq, { timer, resolve }); port.postMessage({ ...request, seq });
    } catch { resolve({ active: false, connected: false }); }
  });
}
function apply(next, force = false) {
  chain = chain.catch(() => {}).then(async () => {
    if (state.session !== next.session || !next.active) grants = [];
    state = next;
    grants = grants.filter(g => g.until > Date.now());
    const key=JSON.stringify([next.active,next.premium,next.social,next.adult,next.domains,next.adultDomains,next.threat,next.threatVersion,grants]);
    if(force||key!==fingerprint){
    const domains=await loadThreats(next);
    const previous = await chrome.declarativeNetRequest.getSessionRules();
    const rules = rulesFor({...state,threatDomains:domains}, grants, chrome.runtime.getURL('')).map(rule => JSON.parse(JSON.stringify(rule)));
    await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: previous.map(r => r.id), addRules: rules });
    fingerprint=key;}
    if(state.active&&state.premium&&state.threat&&threatCache.version===state.threatVersion)await native({action:'threatReady',session:state.session,text:state.threatVersion});
    await chrome.storage.session.set({ state, grants });
    await chrome.action.setBadgeText({ text: state.active ? 'ON' : '' });
    await chrome.action.setBadgeBackgroundColor({ color: '#6557ff' });
    for (const tab of await chrome.tabs.query({})) chrome.tabs.sendMessage(tab.id, { action: 'state', state }).catch(() => {});
  }); return chain;
}
let polling=false;async function poll(){if(polling)return chain;polling=true;try{const next=await native({action:'status'});await apply(next);if(next.active){const tabs=await chrome.tabs.query({active:true,lastFocusedWindow:true});const tab=tabs[0];if(tab?.url){const win=await chrome.windows.get(tab.windowId);if(win.focused){const url=safeUrl(tab.url);if(url)await native({action:'webFocus',host:new URL(url).hostname,session:next.session});}}}return chain;}catch{await chrome.action.setBadgeText({text:'!'});}finally{polling=false;}}
chrome.runtime.onMessage.addListener((request, sender, respond) => {
  const own = sender.id === chrome.runtime.id;
  if (!own) { respond({ error: 'Origine refusée.' }); return false; }
  (async () => {
    if(request.action==='controlTools'&&(sender.tab||sender.url?.startsWith(chrome.runtime.getURL('popup.html'))))return native({action:'controlTools'});
    if(request.action==='controlCloseTab'&&sender.tab&&state.active){await chrome.tabs.remove(sender.tab.id);return {ok:true};}
    if (request.action === 'status') { await poll(); return state; }
    if(request.action==='threatDetail'&&sender.url?.startsWith(chrome.runtime.getURL('blocked.html')) )return native({action:'threatDetail'});
    if(request.action==='threatBlocked'){
      if(!sender.tab||!sender.url?.startsWith(chrome.runtime.getURL('blocked.html#'))||!state.active||!state.premium||!state.threat||request.session!==state.session||typeof request.host!=='string'||!listed(request.host)||typeof request.eventId!=='string'||request.eventId.length>100)return {valid:false};
      const original=safeUrl(sender.url.slice(chrome.runtime.getURL('blocked.html#').length));if(!original||new URL(original).hostname!==request.host)return {valid:false};
      const result=await native({action:'threatBlocked',host:request.host,id:request.eventId,session:request.session});await apply(result);return {valid:!!result.valid};
    }
    if (request.action === 'metrics') {
      if(!sender.tab||!state.active||!state.premium||request.session!==state.session||!['shorts','adult','ads'].includes(request.kind)||!Number.isInteger(request.count)||request.count<1||request.count>100||typeof request.eventId!=='string'||request.eventId.length>100)return {valid:false};
      const result=await native({action:'metrics',kind:request.kind,count:request.count,id:request.eventId,session:request.session});
      await apply(result);return {valid:!!result.valid};
    }
    if (request.action === 'openApp' && sender.url?.startsWith(chrome.runtime.getURL('popup.html'))) return native({ action: 'show' });
    if (request.action === 'challenge') {
      const target = safeUrl(request.target); if (!target) return { error: 'Adresse invalide.' };
      return native({ action: 'challenge', host: new URL(target).hostname, kind: request.kind });
    }
    if (request.action === 'verify') {
      if (!sender.url?.startsWith(chrome.runtime.getURL('gate.html'))) return { error: 'Validation réservée à la page de passage.' };
      const target = safeUrl(request.target); if (!target) return { error: 'Adresse invalide.' };
      const host = new URL(target).hostname;
      const result = await native({ action: 'verify', host, kind: request.kind, id: request.id, text: request.text });
      if (!result.valid) return result;
      let tabId = sender.tab?.id;
      if (request.kind === 'content') {
        const contentTab = await chrome.storage.session.get('contentGate:' + sender.tab.id);
        const saved = contentTab['contentGate:' + sender.tab.id];
        if (saved) { await chrome.tabs.sendMessage(saved.tabId, { action: 'reveal', item: saved.item }); await chrome.tabs.remove(sender.tab.id); return result; }
      }
      grants = grants.filter(g => g.tabId !== tabId || g.host !== host);
      grants.push({ tabId, host, kind: request.kind, until: Date.now() + 15 * 60 * 1000 });
      await apply(result, true); await chrome.tabs.update(tabId, { url: target }); return result;
    }
    if (request.action === 'revealRequest') {
      if (!sender.tab || typeof request.item !== 'string') return { error: 'Élément invalide.' };
      const target = safeUrl(sender.tab.url); if (!target) return { error: 'Adresse invalide.' };
      const tab = await chrome.tabs.create({ url: chrome.runtime.getURL('gate.html?kind=content#') + target });
      await chrome.storage.session.set({ ['contentGate:' + tab.id]: { tabId: sender.tab.id, item: request.item } });
      return { ok: true };
    }
    return { error: 'Action inconnue.' };
  })().then(respond).catch(() => respond({ active: false, connected: false, error: 'Le compagnon est momentanément indisponible.' }));
  return true;
});
chrome.tabs.onRemoved.addListener(id => { grants = grants.filter(g => g.tabId !== id); apply(state, true); });
chrome.runtime.onInstalled.addListener(() => poll());chrome.runtime.onStartup.addListener(() => poll());
chrome.webNavigation.onBeforeNavigate.addListener(details => { if (details.frameId === 0) { const url = safeSearchUrl(details.url, state); if (url) chrome.tabs.update(details.tabId, { url }).catch(() => {}); } });
chrome.alarms.create('seraphim-heartbeat', { periodInMinutes: .5 });chrome.alarms.onAlarm.addListener(() => poll());
setInterval(poll, 2000);poll();
