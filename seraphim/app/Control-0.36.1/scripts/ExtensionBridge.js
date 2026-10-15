(() => {
  const origins = new Set(['https://control-focus-app.dylanyonan4.chatgpt.site','http://127.0.0.1:4173','http://127.0.0.1:8788']);
  if (window !== window.top || !origins.has(location.origin)) return;
  const respond = (Type,RequestId,Payload={}) => window.postMessage({Sender:'ControlExtension',Type,RequestId,...Payload},location.origin);
  const ready=()=>{
    if(!document.documentElement)return;
    document.documentElement.setAttribute('data-control-extension-active','true');
    document.documentElement.setAttribute('data-control-extension-version',chrome.runtime.getManifest().version);
    document.documentElement.setAttribute('data-control-extension-protocol','2');
    respond('Ready',null);
  };
  window.addEventListener('message',async event=>{
    if(event.source!==window || event.origin!==location.origin || event.data?.Sender!=='ControlDashboard')return;
    const {Type,RequestId,Patch}=event.data;
    if(typeof RequestId!=='string'||RequestId.length>100)return;
    try {
      if(['StartProtectionPause','ReadProtectionPause','CompleteProtectionPause'].includes(Type)) {
        const result=await chrome.runtime.sendMessage({Type,Selected:event.data.Selected});
        if(!result?.Success)throw new Error(result?.Error||'Protection pause unavailable');
        respond('ProtectionPauseResult',RequestId,result);
      }
      else if(Type==='ReadRules') { const data=await chrome.storage.sync.get('Rules'); respond('RulesRead',RequestId,{Rules:data.Rules??null}); }
      else if(Type==='PatchRules') {
        const result=await chrome.runtime.sendMessage({Type:'UpdateRules',Patch});
        if(!result?.Success)throw new Error(result?.Error||'Settings were not applied');
        respond('RulesWritten',RequestId,{Rules:result.Rules,Success:true});
      } else if(Type==='OpenProtectedPage'&&typeof event.data.Url==='string') {
        const result=await chrome.runtime.sendMessage({Type,Url:event.data.Url}); respond('ProtectedPageOpened',RequestId,{Success:result?.Success===true});
      } else if(Type==='ReadUsageStats'||Type==='ResetUsageStats') {
        const result=await chrome.runtime.sendMessage({Type:Type==='ReadUsageStats'?'GetUsageStats':'ResetUsageStats'});
        respond('UsageStatsRead',RequestId,{Success:result?.Success===true,UsageState:result?.UsageState??null});
      }
    } catch { respond('RequestFailed',RequestId,{Error:'Extension unavailable. Reload Control and try again.'}); }
  });
  chrome.storage.onChanged.addListener((changes,area)=>{ if(area==='sync'&&changes.Rules?.newValue)respond('RulesChanged',null,{Rules:changes.Rules.newValue}); });
  if(document.documentElement)ready();else document.addEventListener('readystatechange',ready,{once:true});
})();
