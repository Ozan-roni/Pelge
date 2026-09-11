/* Shared by the trusted dashboard and the extension service worker. */
(() => {
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const equal = (a,b) => JSON.stringify(a) === JSON.stringify(b);
  function diff(before, after) {
    const patch = {};
    for (const [key,value] of Object.entries(after || {})) {
      if (['__proto__','constructor','prototype','SchemaVersion','ProtectedApplications'].includes(key)) continue;
      if (object(value)) { const nested = diff(before?.[key],value); if(Object.keys(nested).length) patch[key]=nested; }
      else if (!equal(before?.[key],value)) patch[key]=value;
    }
    return patch;
  }
  function validate(patch, defaults) {
    if(!object(patch)) throw new Error('Invalid settings');
    const clean = {};
    for(const [key,value] of Object.entries(patch)) {
      if(!Object.hasOwn(defaults,key) || ['SchemaVersion','ProtectedApplications','__proto__','constructor','prototype'].includes(key)) throw new Error('Unknown setting');
      const expected=defaults[key];
      if(object(expected)) clean[key]=validate(value,expected);
      else if(typeof expected==='boolean' && typeof value==='boolean') clean[key]=value;
      else if(typeof expected==='number' && Number.isFinite(value) && value>=0 && (key!=='DailyLimitMinutes'||(Number.isInteger(value)&&value<=1440))) clean[key]=value;
      else if(typeof expected==='string' && typeof value==='string' && value.length<=80) clean[key]=value;
      else if(Array.isArray(expected) && Array.isArray(value) && value.length<=500 && value.every(v=>typeof v==='string'&&v.length<=253)) clean[key]=[...new Set(value)];
      else throw new Error('Invalid setting value');
    }
    return clean;
  }
  function apply(rules, patch) {
    const next=structuredClone(rules);
    for(const [key,value] of Object.entries(patch)) next[key]=object(value)?apply(next[key],value):structuredClone(value);
    for(const app of ['Instagram','Snapchat','Facebook','X']) {
      const changes=patch[app];
      if(!changes || changes.DMsOnly===true) continue;
      const allow=Object.entries(changes).some(([key,value])=>key!=='Enabled'&&key!=='DMsOnly'&&typeof value==='boolean'&&(key==='Search'?value:!value));
      if(allow && next[app]?.DMsOnly) next[app].DMsOnly=false;
    }
    if(patch.YouTube?.Shorts===false && patch.YouTube?.VideoOnly!==true) next.YouTube.VideoOnly=false;
    return next;
  }
  globalThis.ControlRuleProtocol=Object.freeze({diff,validate,apply});
})();
