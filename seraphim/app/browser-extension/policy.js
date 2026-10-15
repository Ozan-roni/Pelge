export const normalize = text => String(text ?? '').normalize('NFC').replaceAll('’', "'").replaceAll('\u00a0', ' ').trim();
export const matches = (input, expected) => normalize(input) === normalize(expected);
export const hostMatches = (host, domains) => domains.some(d => host === d || host.endsWith('.' + d));
export const safeUrl = value => { try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) ? u.href : null; } catch { return null; } };
export function rulesFor(state, grants, extensionBase, now = Date.now()) {
  if (!state?.active) return [];
  const rules = []; let id = 1;
  for (const grant of grants) {
    if (grant.until <= now) continue;
    rules.push({ id: id++, priority: 1000, action: { type: 'allow' }, condition: { tabIds: [grant.tabId], requestDomains: [grant.host], resourceTypes: grant.kind === 'adult' ? ['main_frame', 'image', 'media', 'sub_frame'] : ['main_frame'] } });
  }
  const gate = kind => ({ type: 'redirect', redirect: { regexSubstitution: extensionBase + 'gate.html?kind=' + kind + '#\\0' } });
  if(state.premium && state.threat && state.threatDomains?.length){
    for(let n=0;n<state.threatDomains.length;n+=500){const domains=state.threatDomains.slice(n,n+500);
      rules.push({id:id++,priority:3000,action:{type:'redirect',redirect:{regexSubstitution:extensionBase+'blocked.html#\\0'}},condition:{regexFilter:'^https?://.*',requestDomains:domains,resourceTypes:['main_frame']}});
      rules.push({id:id++,priority:2900,action:{type:'block'},condition:{requestDomains:domains,resourceTypes:['sub_frame','script','image','media','xmlhttprequest','font','stylesheet','other']}});
    }
  }
  if (state.adult) {
    rules.push({ id: id++, priority: 500, action: gate('adult'), condition: { regexFilter: '^https?://.*', requestDomains: state.adultDomains, resourceTypes: ['main_frame'] } });
    rules.push({ id: id++, priority: 400, action: { type: 'block' }, condition: { requestDomains: state.adultDomains, resourceTypes: ['image', 'media', 'sub_frame'] } });
  }
  if (state.social && state.domains?.length) rules.push({ id: id++, priority: 200, action: gate('social'), condition: { regexFilter: '^https?://.*', requestDomains: state.domains, resourceTypes: ['main_frame'] } });
  return rules;
}
export function safeSearchUrl(value, state) {
  const safe = safeUrl(value); if (!safe || !state?.active || !state.adult) return null;
  const url = new URL(safe); if (!/(^|\.)google\.(com|fr)$/.test(url.hostname) || url.pathname !== '/search' || url.searchParams.get('safe') === 'active') return null;
  url.searchParams.set('safe', 'active'); return url.href;
}
export function sensitiveText(text) {
  return /\b(?:nsfw|porn(?:ography)?|porno(?:graphie)?|xxx|nudes?|nudity|nudité|erotic(?:a)?|érotique|contenu\s+(?:adulte|explicite)|adult\s+content|sexual\s+content|only\s?fans|fansly)\b|(?:\b18\s*\+|🔞)/i.test(text);
}
