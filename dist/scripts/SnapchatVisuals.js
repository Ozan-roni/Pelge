/* Desktop adapter. Opt-in follows the existing per-app Control setting. */
(() => {
  'use strict';
  if(!/(^|\.)snapchat\.com$/.test(location.hostname)||globalThis.ControlSnapchatVisuals)return;
  let runtime=null,observer=null,abort=null,frame=0,styles=null,lastList=null,lastPane=null;
  const attrs=['data-csx-desktop-shell','data-csx-desktop-list','data-csx-desktop-pane','data-csx-desktop-frame','data-csx-desktop-log','data-csx-desktop-composer','data-csx-name-invalid'];
  const mark=(node,name)=>{if(node&&!node.hasAttribute(name))node.setAttribute(name,'');};
  const shown=node=>node?.isConnected&&!node.hidden&&node.getClientRects().length>0&&getComputedStyle(node).display!=='none';
  function clear(){
    observer?.disconnect();observer=null;abort?.abort();abort=null;cancelAnimationFrame(frame);frame=0;
    runtime?.dispose();runtime=null;styles?.remove();styles=null;lastList=null;lastPane=null;
    for(const node of document.querySelectorAll(attrs.map(attr=>'['+attr+']').join(',')))for(const attr of attrs)node.removeAttribute(attr);
    document.querySelectorAll('[data-csx-identity-fallback]').forEach(node=>node.remove());
  }
  function identity(row){
    const original=row.querySelector(runtime.selectors.identity);
    const resolved=runtime.resolveIdentity(row,original?.textContent);
    let fallback=row.querySelector('[data-csx-identity-fallback]');
    if(runtime.validName(original?.textContent)){fallback?.remove();original.removeAttribute('data-csx-name-invalid');return;}
    if(original){mark(original,'data-csx-name-invalid');if(!fallback){fallback=document.createElement('span');fallback.dataset.csxIdentityFallback='';fallback.dataset.controlSnapOwned='identity';original.after(fallback);}if(fallback.textContent!==resolved.displayName)fallback.textContent=resolved.displayName;}
  }
  function refresh(){
    frame=0;if(!runtime)return;
    if(/^\/(accounts|login|logout|oauth|settings|consent|challenge)(\/|$)/.test(location.pathname)){clear();return;}
    runtime.refreshOverlays();
    const list=[...document.querySelectorAll(runtime.selectors.contacts)].find(shown);
    const pane=[...document.querySelectorAll(runtime.selectors.conversation)].find(shown);
    if(list){
      mark(list,'data-csx-desktop-list');list.querySelectorAll(runtime.selectors.rows).forEach(identity);
      if(list!==lastList){runtime.readySurface(list,false,'contacts');lastList=list;}
      if(list.querySelector(runtime.selectors.rows))runtime.readySurface(list,true,'contacts');
    }
    if(pane){
      mark(pane,'data-csx-desktop-pane');
      const log=pane.querySelector(runtime.selectors.log),input=pane.querySelector(runtime.selectors.composer);
      if(log&&input&&!log.contains(input)){
        let shared=log.parentElement;while(shared&&shared!==pane&&!shared.contains(input))shared=shared.parentElement;
        if(shared?.contains(input)){
          let footer=input;while(footer.parentElement&&footer.parentElement!==shared)footer=footer.parentElement;
          mark(footer,'data-csx-desktop-composer');mark(log,'data-csx-desktop-log');
          for(let node=log.parentElement;node&&node!==pane;node=node.parentElement)mark(node,'data-csx-desktop-frame');
        }
        runtime.attachConversation(pane,log);
      }else runtime.stopConversation();
    }else runtime.stopConversation();
    if(lastPane&&lastPane!==pane&&lastPane.isConnected)lastPane.removeAttribute('data-csx-desktop-pane');
    lastPane=pane;
    if(list&&pane){let shell=list.parentElement;while(shell&&shell!==document.body&&!shell.contains(pane))shell=shell.parentElement;if(shell&&shell!==document.body)mark(shell,'data-csx-desktop-shell');}
  }
  function schedule(){if(runtime&&!frame)frame=requestAnimationFrame(refresh);}
  function update({enabled}={}){
    if(!enabled){if(runtime)clear();return;}
    if(runtime||!document.documentElement||!globalThis.ControlSnapExperience||/^\/(accounts|login|logout|oauth|settings|consent|challenge)(\/|$)/.test(location.pathname))return;
    runtime=globalThis.ControlSnapExperience.create({onReady:schedule});abort=new AbortController();
    styles=document.createElement('style');styles.dataset.controlSnapOwned='desktop-style';
    styles.textContent=[
      '[data-csx-name-invalid]{display:none!important}',
      '[data-csx-desktop-shell]{display:flex!important;min-width:0!important;width:100%!important;height:100dvh!important;overflow:hidden!important}',
      '[data-csx-desktop-list]{flex:0 0 clamp(280px,28vw,390px)!important;min-width:0!important;width:clamp(280px,28vw,390px)!important;overflow-y:auto!important;height:100%!important}',
      '[data-csx-desktop-pane]{flex:1 1 0!important;min-width:0!important;height:100%!important;margin:0!important;border-radius:0!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}',
      '[data-csx-desktop-frame]{display:flex!important;flex-direction:column!important;flex:1 1 0!important;min-height:0!important;min-width:0!important;height:auto!important}',
      '[data-csx-desktop-log]{flex:1 1 0!important;min-height:0!important;overflow-y:auto!important;overscroll-behavior:contain!important}',
      '[data-csx-desktop-composer]{flex:0 0 auto!important;min-width:0!important}',
      '[data-csx-desktop-list] img{max-width:64px;max-height:64px;object-fit:contain}',
      '@media(max-width:700px){[data-csx-desktop-shell]{display:block!important}[data-csx-desktop-list]{width:100%!important}[data-csx-desktop-shell]:has([data-csx-desktop-pane]) [data-csx-desktop-list]{display:none!important}}'
    ].join('\n');document.documentElement.append(styles);
    document.addEventListener('click',event=>{const row=event.target.closest?.(runtime?.selectors.rows||'[data-csx-none]');if(row&&row.closest(runtime.selectors.contacts)){runtime.selectConversation(row);schedule();}},{capture:true,signal:abort.signal});
    observer=new MutationObserver(records=>{
      if(records.some(record=>{
        const target=record.target instanceof Element?record.target:record.target.parentElement;
        if(target?.closest('[data-control-snap-owned],#control-snap-session,[data-csx-scroll],[data-csx-overlay]'))return false;
        if(record.type!=='childList'&&target?.closest('[data-csx-composer]'))return false;
        if(record.type==='childList'&&[...record.addedNodes,...record.removedNodes].length&&[...record.addedNodes,...record.removedNodes].every(node=>node instanceof Element&&node.matches('[data-control-snap-owned],#control-snap-session')))return false;
        return true;
      }))schedule();
    });
    observer.observe(document.body||document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden','class','data-testid','data-display-name','data-conversation-id','data-chat-id','aria-label']});
    window.addEventListener('popstate',schedule,{signal:abort.signal});window.addEventListener('resize',schedule,{signal:abort.signal});window.visualViewport?.addEventListener('resize',schedule,{signal:abort.signal});
    refresh();
  }
  globalThis.ControlSnapchatVisuals={update,refresh:schedule,get diagnostics(){return runtime?.counters;}};
})();
