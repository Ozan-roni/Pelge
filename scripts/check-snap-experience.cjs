/* Contract tests, not a live Snapchat account. Media events and permission errors are simulated. */
const {chromium}=require(process.env.CONTROL_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),runtime=fs.readFileSync(path.join(root,'dist/scripts/SnapchatEssentialUI.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'dist/scripts/SnapchatExperience.js'),'utf8');
const adapter=fs.readFileSync(path.join(root,'dist/scripts/SnapchatVisuals.js'),'utf8');
const out=path.join(root,'build/snap-experience');fs.mkdirSync(out,{recursive:true});
const fixture='<!doctype html><meta name="viewport" content="width=device-width"><style>*{box-sizing:border-box}body{margin:0;font:16px system-ui}main{display:flex;height:100vh}#list{width:320px;background:#fafafa}#list button{display:block;width:100%;padding:20px;text-align:left;border:0;background:white}#pane{flex:1;display:flex;flex-direction:column;min-width:0;background:#202020;color:white}header{padding:20px;height:64px;flex-shrink:0;background:#121212}#log{flex:1;overflow:auto;min-height:0}#log p{height:44px;margin:0;padding:10px 20px;border-bottom:1px solid #333}footer{display:flex;padding:10px;gap:12px}textarea{flex:1;min-width:0}button{cursor:pointer}#viewer{position:fixed;inset:0;background:#111;color:white;z-index:20}#viewer img,#viewer video{width:100%;height:100%;object-fit:contain}#viewer>button{position:absolute;bottom:20px;z-index:3}#viewer>button:last-child{right:20px}#viewer>[data-snap-id]{height:100%}</style><main><section id="list" aria-label="Conversations"><header>Chat</header><button role="listitem" data-conversation-id="A"><span data-testid="display-name">Alex</span></button><button role="listitem" data-conversation-id="B"><span data-testid="display-name">Bram</span></button></section><section id="pane" data-testid="conversation-panel" data-conversation-id="A"><header>Alex</header><div id="log" role="log"></div><footer><button aria-label="Camera">◉</button><textarea aria-label="Message"></textarea><button aria-label="Emoji">☺</button></footer></section></main>';
const frames=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))));
const bottom=page=>page.waitForFunction(()=>{const l=document.querySelector('#log');return !cx.active?.following&&Math.abs(l.scrollHeight-l.clientHeight-l.scrollTop)<2;});
async function run(){
 const browser=await chromium.launch({channel:process.env.CONTROL_BROWSER_CHANNEL||undefined});
 const errors=[];
 try{
  const context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));await context.route('**/*',r=>r.fulfill({contentType:'text/html',body:fixture}));
  await page.goto('https://web.snapchat.com/');await page.addScriptTag({content:runtime});
  await page.evaluate(()=>{window.cx=ControlSnapExperience.create();window.fill=count=>{document.querySelector('#log').innerHTML=Array.from({length:count},(_,i)=>'<p data-message-id="'+i+'">Message '+i+'</p>').join('');};});
  await page.addStyleTag({content:'#log p{height:84px}#list header{background:#fafafa;color:#111}'});
  for(const count of [10,3000]){
   await page.evaluate(count=>{cx.stopConversation();fill(count);cx.attachConversation(document.querySelector('#pane'),document.querySelector('#log'),'A'+count);},count);
   await page.waitForFunction(()=>cx.active.hasInitialPositioned);await bottom(page);
   const initial=await page.evaluate(()=>cx.counters.initialPositions);
   await page.evaluate(()=>{document.querySelector('#pane header').textContent='Alex écrit…';cx.attachConversation(document.querySelector('#pane'),document.querySelector('#log'),cx.active.key);});
   await frames(page);assert.equal(await page.evaluate(()=>cx.counters.initialPositions),initial,'Header text cannot reset a session');
   await page.locator('#log').evaluate(l=>{l.dispatchEvent(new WheelEvent('wheel',{deltaY:-100}));l.scrollTop=40;});
   await frames(page);
   await page.locator('#log').evaluate(l=>l.insertAdjacentHTML('beforeend','<p>Incoming while reading</p>'));await frames(page);
   assert.equal(await page.locator('#log').evaluate(l=>l.scrollTop),40);
   await page.locator('#log').evaluate(l=>l.insertAdjacentHTML('afterbegin','<p>Older A</p><p>Older B</p>'));await frames(page);
   assert.equal(await page.locator('#log').evaluate(l=>l.scrollTop),208,'Prepending preserves the same visible message');
   await page.locator('#log').evaluate(l=>{l.scrollTop=l.scrollHeight;});await frames(page);
   await page.locator('#log').evaluate(l=>l.insertAdjacentHTML('beforeend','<p>Incoming at bottom</p>'));await frames(page);await bottom(page);
   const writes=await page.evaluate(()=>cx.counters.scrollWrites);
   await page.locator('#log p').last().evaluate(p=>p.style.height='200px');await frames(page);
   assert.equal(await page.evaluate(()=>cx.counters.scrollWrites),writes,'Late media layout does not repin conversation');
   console.log('PASS scroll initial once, user reading, prepend, append and late media:',count,'messages');
  }
  await page.evaluate(()=>{fill(100);cx.attachConversation(document.querySelector('#pane'),document.querySelector('#log'),'A-race');cx.attachConversation(document.querySelector('#pane'),document.querySelector('#log'),'B-race');});
  await page.waitForFunction(()=>cx.active.hasInitialPositioned);
  assert.equal(await page.evaluate(()=>cx.active.key),'B-race');
  assert.equal(await page.evaluate(()=>document.querySelectorAll('[data-control-snap-owned="loading"]').length),0);
  const identity=await page.evaluate(()=>{
   const row=document.querySelector('[data-conversation-id="A"]');const first=cx.resolveIdentity(row).displayName;
   row.querySelector('span').textContent='.';const transient=cx.resolveIdentity(row).displayName;
   row.dataset.conversationId='C';const recycled=cx.resolveIdentity(row).displayName;
   row.remove();const remount=document.createElement('button');remount.setAttribute('role','listitem');remount.dataset.conversationId='A';remount.innerHTML='<span data-testid="display-name">.</span>';document.querySelector('#list').append(remount);
   return {first,transient,recycled,remounted:cx.resolveIdentity(remount).displayName};
  });
  assert.deepEqual(identity,{first:'Alex',transient:'Alex',recycled:'Conversation',remounted:'Alex'});
  console.log('PASS stable IDs, transient dot, remount recovery, recycled identity and A→B cancellation');
  await page.evaluate(()=>{
   window.openViewer=types=>{
    document.querySelector('#viewer')?.remove();cx.refreshOverlays();window.nativeSteps=0;window.nativeClosed=0;
    const viewer=document.createElement('div');viewer.id='viewer';viewer.dataset.testid='snap-viewer';viewer.setAttribute('role','dialog');
    types.forEach((type,i)=>{
     const item=document.createElement('div');item.dataset.snapId='snap-'+i;item.hidden=i>0;item.dataset.current=String(i===0);item.dataset.durationMs=String(window.photoDuration||90);
     const media=document.createElement(type==='photo'?'img':'video');media.id='media-'+i;
     if(type==='photo')media.src='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#347878"/><text x="60" y="100" fill="white" font-size="30">Snap '+(i+1)+'</text></svg>');
     else{Object.defineProperties(media,{readyState:{value:2,configurable:true},duration:{value:1,configurable:true},paused:{value:false,configurable:true}});}
     item.append(media);viewer.append(item);
    });
    const previous=document.createElement('button'),next=document.createElement('button'),close=document.createElement('button');previous.setAttribute('aria-label','Previous Snap');previous.textContent='Previous';next.setAttribute('aria-label','Next Snap');next.textContent='Next';close.setAttribute('aria-label','Close Snap');close.textContent='Close';
    const move=delta=>{const items=[...viewer.querySelectorAll('[data-snap-id]')],index=items.findIndex(item=>!item.hidden),target=index+delta;if(target<0||target>=items.length)return;items[index].hidden=true;items[index].dataset.current='false';items[target].hidden=false;items[target].dataset.current='true';previous.disabled=target===0;next.disabled=target===items.length-1;nativeSteps++;};
    previous.onclick=()=>move(-1);next.onclick=()=>move(1);close.onclick=()=>{nativeClosed++;viewer.remove();cx.refreshOverlays();};previous.disabled=true;next.disabled=types.length===1;
    viewer.append(previous,next,close);document.body.append(viewer);cx.refreshOverlays();
    window.completeCurrent=()=>{const media=viewer.querySelector('[data-current="true"] video');media?.dispatchEvent(new Event('ended'));};
   };
  });
  for(const types of [['photo'],['photo','photo'],['photo','video'],['video','photo'],['video','video'],['photo','video','photo','video','photo','video']]){
   await page.evaluate(types=>openViewer(types),types);
   for(let i=0;i<types.length;i++){
    await page.waitForFunction(index=>cx.viewer?.index===index&&['PLAYING','READY'].includes(cx.viewer.phase),i);
    assert.equal(await page.locator('#control-snap-session').count(),1);
    if(types[i]==='video')await page.evaluate(()=>completeCurrent());
   }
   await page.waitForFunction(()=>nativeClosed===1);assert.equal(await page.evaluate(()=>nativeSteps),types.length-1);
   console.log('PASS native continuous queue:',types.join(' → '));
  }
  // Native advancing first must not skip another item.
  await page.evaluate(()=>{photoDuration=60000;openViewer(['video','video','photo']);const video=document.querySelector('#media-0');video.addEventListener('ended',()=>document.querySelector('[aria-label="Next Snap"]').click());video.dispatchEvent(new Event('ended'));});
  await page.waitForFunction(()=>cx.viewer?.index===1);await frames(page);assert.equal(await page.evaluate(()=>nativeSteps),1);
  await page.keyboard.press('ArrowLeft');await page.waitForFunction(()=>cx.viewer?.index===0);
  await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>cx.viewer?.index===1);
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!cx.viewer);
  console.log('PASS no double advance, previous/next keys and Escape');
  // A media promise from a closed session cannot mutate its replacement.
  await page.evaluate(()=>{
   openViewer(['video']);const media=document.querySelector('#media-0');Object.defineProperty(media,'readyState',{value:0,configurable:true});media.setAttribute('src','pending:old');cx.refreshOverlays();window.staleMedia=media;
  });
  await frames(page);
  await page.evaluate(()=>{openViewer(['video']);staleMedia.dispatchEvent(new Event('loadeddata'));staleMedia.dispatchEvent(new Event('error'));});
  await page.waitForFunction(()=>cx.viewer?.phase==='PLAYING');
  await page.evaluate(()=>document.querySelector('#media-0').dispatchEvent(new Event('error')));
  await page.waitForFunction(()=>cx.viewer?.phase==='ERROR');
  assert.match(await page.locator('#control-snap-session').innerText(),/ne peut pas être chargé/);
  await page.keyboard.press('Escape');
  // Unknown queue: don't pretend one Snap means all unread Snaps, don't close or fetch.
  await page.evaluate(()=>{const root=document.createElement('div');root.id='unknown';root.dataset.testid='snap-viewer';root.innerHTML='<video></video>';document.body.append(root);const v=root.querySelector('video');Object.defineProperty(v,'readyState',{value:2});cx.refreshOverlays();v.dispatchEvent(new Event('ended'));});
  await frames(page);assert.equal(await page.locator('#unknown').count(),1);assert.equal(await page.locator('.csx-track').count(),0);
  await page.evaluate(()=>{document.querySelector('#unknown').remove();cx.refreshOverlays();});
  console.log('PASS late media isolation, failed media and unsupported queue safe fallback');
  // Native call ownership: no getUserMedia, stop(), applyConstraints(), play(), or replacement.
  await page.evaluate(()=>{
   window.streamStops=0;window.constraints=0;
   const root=document.createElement('div');root.id='call';root.dataset.testid='video-call';root.innerHTML='<video aria-label="Remote participant"></video><video aria-label="Local preview"></video><div role="toolbar"><button>Microphone</button><button>Camera</button><button>Hang up</button></div>';
   document.body.append(root);const [remote,local]=root.querySelectorAll('video');
   for(const video of [remote,local])Object.defineProperty(video,'readyState',{value:2});
   Object.defineProperties(remote,{videoWidth:{value:1080},videoHeight:{value:1920}});
   Object.defineProperties(local,{videoWidth:{value:1920},videoHeight:{value:1080},srcObject:{value:{getVideoTracks:()=>[{getSettings:()=>({width:1920,height:1080,zoom:1}),stop:()=>streamStops++,applyConstraints:()=>constraints++}]}}});
   cx.refreshOverlays();
  });
  assert.equal(await page.locator('[data-csx-call-remote]').evaluate(v=>getComputedStyle(v).objectFit),'contain');
  assert.equal(await page.locator('[data-csx-call-local]').evaluate(v=>getComputedStyle(v).objectFit),'contain');
  const local=await page.locator('[data-csx-call-local]').boundingBox();assert(local.width<=181);
  await page.screenshot({path:path.join(out,'call-desktop.png')});
  for(const [text,state] of [['Permission denied','DENIED'],['Device not found','DEVICE_NOT_FOUND'],['Device busy','DEVICE_BUSY']]){
   await page.evaluate(text=>{let alert=document.querySelector('#call [role="alert"]');if(!alert){alert=document.createElement('div');alert.setAttribute('role','alert');document.querySelector('#call').append(alert);}alert.textContent=text;},text);
   await page.waitForFunction(state=>cx.call.permission===state,state);
  }
  await page.evaluate(()=>{document.querySelector('#call').remove();cx.refreshOverlays();});assert.deepEqual(await page.evaluate(()=>[streamStops,constraints]),[0,0]);
  console.log('PASS remote aspect-ratio, natural local preview, permission states and native stream ownership');
  await page.evaluate(()=>cx.dispose());assert.equal(await page.locator('[data-csx-scroll],#control-snap-session,[data-control-snap-owned]').count(),0);
  // Desktop adapter lifecycle + settings disable.
  await page.addScriptTag({content:adapter});await page.evaluate(()=>ControlSnapchatVisuals.update({enabled:true}));
  await page.waitForFunction(()=>document.querySelector('[data-csx-desktop-pane]'));
  await page.waitForFunction(()=>document.querySelector('#pane').dataset.csxReady==='READY');
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('#pane')).opacity==='1');
  await page.locator('#list [data-conversation-id="B"] span').first().evaluate(node=>node.textContent='.');
  await page.waitForFunction(()=>document.querySelector('#list [data-conversation-id="B"] [data-csx-identity-fallback]')?.textContent==='Bram');
  assert.equal(await page.locator('#list [data-conversation-id="B"] [data-testid="display-name"]').isVisible(),false);
  await page.screenshot({path:path.join(out,'conversation-desktop.png')});
  const passes=await page.evaluate(()=>ControlSnapchatVisuals.diagnostics.structuralPasses);
  await page.locator('#log').evaluate(async log=>{for(let i=0;i<20;i++){log.lastElementChild.textContent='Typing '+i;await new Promise(requestAnimationFrame);}});
  await frames(page);assert.equal(await page.evaluate(()=>ControlSnapchatVisuals.diagnostics.structuralPasses),passes,'Message mutations must not trigger structural rescans');
  await page.evaluate(()=>ControlSnapchatVisuals.update({enabled:false}));
  assert.equal(await page.locator('[data-csx-desktop-pane],[data-csx-desktop-list],[data-csx-scroll],[data-control-snap-owned]').count(),0);
  console.log('PASS opt-in/disable restores native layout; 20 message updates = 0 structural rescans');
  assert.deepEqual(errors,[]);await context.close();
 }finally{await browser.close();}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
