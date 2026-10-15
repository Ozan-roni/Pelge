// Control 0.36.1 filters, driven exclusively by the active Seraphim session.
(() => {
 const realChrome=chrome, listeners=[];
 let state={active:false},rulesKey='',sessionBegan=Date.now(),lastSession='';
 const definitions=__CONTROL_DEFINITIONS__;
 const current=()=>definitions.find(d=>d.Domains.some(h=>location.hostname===h||location.hostname.endsWith('.'+h)));
 function rules(){const enabled=!!(state.active&&state.connected);const result={SchemaVersion:14,StrictMode:true,ShieldAll:enabled&&!!state.shield,GrayscaleMode:enabled&&!!state.gray,PostModeUntil:enabled?state.postUntil||0:0,ShowUsageTimer:false,SensitiveContentProtection:false};
  for(const d of definitions){const p=state.policies?.find(p=>p.Id===d.Id);const value={Enabled:enabled&&!!p?.Enabled,DailyLimitMinutes:p?.LimitBlock?p.DailyLimitMinutes||0:0};for(const rule of d.Rules)value[rule.Key]=p?.Flags?.find(f=>f.Key===rule.Key)?.Value??(rule.Key==='Search');result[d.Name]=value;if(d===current())result.ShowUsageTimer=enabled&&!!p?.ShowTimer;}
  return result;
 }
 function usage(){const Days={};for(const entry of state.usage||[]){const host=entry.AppId?.startsWith('web:')?entry.AppId.slice(4):null;const d=host?definitions.find(d=>d.Domains.some(h=>host===h||host.endsWith('.'+h))):definitions.find(d=>entry.AppId==='social-'+d.Id);if(!d)continue;const day=Days[entry.Day]??={};day[d.Name]=(day[d.Name]||0)+entry.Seconds*1000;}return {Days};}
 function update(next){if(!next||typeof next.active!=='boolean')return;state=next;if(state.session!==lastSession){lastSession=state.session;sessionBegan=Date.now();}const r=rules(),key=JSON.stringify(r);if(key!==rulesKey){rulesKey=key;for(const listener of listeners)listener({Rules:{newValue:r}},'sync');}for(const listener of listeners)listener({UsageState:{newValue:usage()}},'local');}
 const facade={storage:{sync:{get:async()=>({Rules:rules()})},local:{get:async key=>key==='UsageState'?{UsageState:usage()}:{ControlLaunchedSession:{StartedAt:sessionBegan,ApplicationKey:current()?.Name}}},onChanged:{addListener:fn=>listeners.push(fn)}},runtime:{getURL:p=>realChrome.runtime.getURL(p),sendMessage:async message=>{if(message.Type==='OpenDailyLimits')return realChrome.runtime.sendMessage({action:'controlTools'});if(message.Type==='CloseCurrentTab')return realChrome.runtime.sendMessage({action:'controlCloseTab'});return {ok:false,error:'Le partage de fichiers n’est pas relié dans ce compagnon.'};}}};
 realChrome.runtime.onMessage.addListener(message=>{if(message.action==='state')update(message.state);});
 realChrome.runtime.sendMessage({action:'status'}).then(update).catch(()=>update({active:false,connected:false}));
 // The following code is bundled here at build time; no eval or remote scripts.
 __CONTROL_RUNTIME__
})();
