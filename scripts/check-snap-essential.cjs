/* Synthetic native-DOM contracts, not validation on a connected Snapchat account. */
const {chromium}=require(process.env.CONTROL_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),out=path.join(root,'build/snap-experience');
const source=['SnapchatEssentialUI','SnapchatExperience','SnapchatVisuals'].map(n=>fs.readFileSync(path.join(root,'dist/scripts',n+'.js'),'utf8')).join('\n');
const frames=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r)))));
const fixture='<!doctype html><meta name="viewport" content="width=device-width"><style>*{box-sizing:border-box}body{margin:0;font:16px system-ui}main{height:100dvh;display:flex}#list{width:320px;overflow:auto;background:#fff}header{height:64px;padding:12px;display:flex;align-items:center;gap:8px;flex-shrink:0}button{cursor:pointer}#list>button{display:block;width:100%;padding:18px;text-align:left;border:0;background:white}#pane{display:flex;flex-direction:column;min-width:0;flex:1;background:#202020;color:white}#log{flex:1;overflow:auto;min-height:0}#log p{height:52px;margin:0;padding:12px}footer{display:flex;gap:6px;padding:8px}textarea{flex:1;min-width:0;height:40px}footer.typing{position:absolute;top:0}#settings,#notifications{background:white;color:#161616;position:fixed;inset:10px;z-index:99}#settings button{display:block;padding:12px}#camera{position:fixed;inset:0;z-index:100}#camera video{width:100%;height:100%}[hidden]{display:none!important}</style><main><section id="list" aria-label="Conversations"><header><h2>Chat</h2><button aria-label="Search"><svg></svg></button><button aria-label="Settings"><svg></svg></button><button aria-label="Notifications"><svg></svg></button></header><button role="listitem" data-conversation-id="A" data-username="camille.92"><span data-display-name="Camille">Camille</span></button><button role="listitem" data-conversation-id="B" data-username="alex"><span data-display-name="Alex">Alex</span></button></section><section id="pane" data-testid="conversation-panel" data-conversation-id="A"><header><button aria-label="Back">Back</button><strong>Camille</strong></header><div id="log" data-testid="chat-history" role="log"></div><footer><button aria-label="Camera">Camera</button><textarea aria-label="Message"></textarea><button aria-label="Send">Send</button></footer></section></main><aside id="rail"><nav data-testid="stories"><a href="/stories">My Story</a></nav></aside>';
async function run(){
 fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({channel:process.env.CONTROL_BROWSER_CHANNEL||undefined});
 try{
  for(const width of [390,1280]){
   const context=await browser.newContext({viewport:{width,height:844}}),page=await context.newPage(),errors=[],failed=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
   await context.route('**/*',r=>r.fulfill({contentType:'text/html',body:fixture}));await page.goto('https://web.snapchat.com/');
   await page.evaluate(()=>{
    const log=document.querySelector('#log');log.innerHTML=Array.from({length:150},(_,i)=>'<p data-message-id="'+i+'">Message '+i+'</p>').join('');
    const input=document.querySelector('textarea');input.onfocus=()=>input.parentElement.classList.add('typing');
    input.oninput=()=>input.parentElement.dataset.typing=String(input.value.length);
    document.querySelector('[aria-label=Send]').onclick=()=>{log.insertAdjacentHTML('beforeend','<p></p>');log.lastElementChild.textContent=input.value;input.value='';};
    window.nativeOpens=0;document.querySelector('#list>button').onclick=()=>{nativeOpens++;document.querySelector('#pane').hidden=false;};
    document.querySelector('[aria-label=Back]').onclick=()=>{document.querySelector('#pane').hidden=true;};
   });
   await page.addScriptTag({content:source});await page.evaluate(()=>ControlSnapchatVisuals.update({enabled:true}));
   await page.waitForFunction(()=>ControlSnapchatVisuals.diagnostics.initialPositions===1);
   await frames(page);
   const before=await page.evaluate(()=>({y:document.querySelector('footer').getBoundingClientRect().y,scroll:document.querySelector('#log').scrollTop,passes:ControlSnapchatVisuals.diagnostics.layoutPasses}));
   await page.getByRole('textbox',{name:'Message',exact:true}).click();
   await page.getByRole('textbox',{name:'Message',exact:true}).pressSequentially('abcdefghijklmnopqrst',{delay:12});
   await frames(page);
   const after=await page.evaluate(()=>({y:document.querySelector('footer').getBoundingClientRect().y,scroll:document.querySelector('#log').scrollTop,passes:ControlSnapchatVisuals.diagnostics.layoutPasses}));
   assert.deepEqual(after,before,'Focus plus 20 characters must not move composer, scroll or rebuild layout');
   await page.getByRole('button',{name:'Send',exact:true}).click();await frames(page);
   const bottom=()=>page.waitForFunction(()=>{const l=document.querySelector('#log');return l.scrollHeight-l.clientHeight-l.scrollTop<2;});
   await bottom();
   await page.locator('#log').evaluate(l=>l.insertAdjacentHTML('beforeend','<p>New incoming</p>'));await frames(page);await bottom();
   await page.locator('#log').evaluate(l=>{l.dispatchEvent(new WheelEvent('wheel',{deltaY:-1560}));l.scrollTop-=30*52;});await frames(page);
   const reading=await page.locator('#log').evaluate(l=>l.scrollTop);
   await page.locator('#log').evaluate(l=>l.insertAdjacentHTML('beforeend','<p>New while reading</p>'));await frames(page);
   assert.equal(await page.locator('#log').evaluate(l=>l.scrollTop),reading);
   await page.getByRole('button',{name:'New message',exact:true}).click();await frames(page);await bottom();
   assert.equal(await page.evaluate(()=>ControlSnapchatVisuals.diagnostics.initialPositions),1);
   assert.equal(await page.locator('#log').isVisible(),true,'chat-history must never match story filtering');
   await page.screenshot({path:path.join(out,'essential-chat-'+width+'.png')});
   await page.getByRole('button',{name:'Back',exact:true}).click();await frames(page);
   // The native hidden state must win over presentation flex rules.
   assert.equal(await page.locator('#pane').isVisible(),false);
   const search=page.getByRole('searchbox',{name:'Search loaded conversations'});
   await search.fill('camille.92');await page.locator('.csx-search-results button').filter({hasText:'Camille'}).click();await frames(page);
   assert.equal(await page.evaluate(()=>nativeOpens),1);
   await page.getByRole('button',{name:'Back',exact:true}).click();await frames(page);
   await search.fill('Alex');assert.equal(await page.locator('.csx-search-results button').textContent(),'Alex');
   await search.press('Escape');assert.equal(await search.inputValue(),'');
   assert.equal(await page.locator('#rail').isVisible(),false);
   await page.evaluate(()=>{
    const panel=document.createElement('section');panel.id='settings';panel.dataset.testid='settings-panel';panel.innerHTML='<h2>Settings</h2>'+['Profile','Username','Notifications','Privacy controls','Blocked users','Camera','Microphone','Appearance','Help','About'].map(label=>'<button aria-label="'+label+'"><svg data-icon="camera"></svg>'+label+'</button>').join('');
    window.nativeSettingClicks=0;panel.querySelector('[aria-label="Privacy controls"]').onclick=()=>nativeSettingClicks++;document.body.append(panel);
   });
   await page.waitForSelector('[data-csx-settings]');
   const kinds=await page.locator('#settings [data-csx-icon]').evaluateAll(nodes=>nodes.map(n=>n.dataset.csxIcon));
   assert.deepEqual(kinds,['user','user','bell','shield','blocked','camera','mic','moon','help','info']);
   await page.locator('#settings').getByRole('button',{name:'Privacy controls',exact:true}).click();
   assert.equal(await page.evaluate(()=>nativeSettingClicks),1);
   await page.waitForFunction(()=>getComputedStyle(document.querySelector('#settings')).opacity==='1');
   await page.screenshot({path:path.join(out,'essential-settings-'+width+'.png')});
   await page.evaluate(()=>{
    document.querySelector('#settings').remove();const panel=document.createElement('section');panel.id='notifications';panel.dataset.testid='notifications-panel';
    panel.innerHTML='<h2>Notifications</h2><article role="listitem" data-unread="true"><strong>Camille</strong><p>Sent a message</p><time datetime="2026-09-22T10:30:00Z">10:30</time></article>';document.body.append(panel);
   });
   await page.waitForSelector('[data-csx-notification-row]');assert.equal(await page.locator('#notifications time').textContent(),'10:30');
   await page.evaluate(()=>{
    document.querySelector('#notifications').remove();const c=document.createElement('section');c.id='camera';c.dataset.testid='camera-panel';c.innerHTML='<video></video>';document.body.append(c);
    const v=c.querySelector('video');Object.defineProperties(v,{videoWidth:{value:1920},videoHeight:{value:1080},srcObject:{value:{getVideoTracks:()=>[{getSettings:()=>({facingMode:'user',width:1920,height:1080})}]}}});
   });
   await page.waitForSelector('[data-csx-camera-surface]');await frames(page);
   assert.equal(await page.locator('#camera video').evaluate(v=>getComputedStyle(v).objectFit),'contain');
   assert.equal(await page.locator('#camera video').evaluate(v=>getComputedStyle(v).transform),'matrix(-1, 0, 0, 1, 0, 0)');
   if(width>700){const c=await page.locator('#camera').boundingBox();assert(Math.abs(c.width/c.height-9/16)<.01,JSON.stringify(c));}
   await page.evaluate(()=>document.querySelector('#camera').hidden=true);await frames(page);
   assert.equal(await page.locator('#camera').isVisible(),false);
   await page.evaluate(()=>ControlSnapchatVisuals.update({enabled:false}));
   assert.equal(await page.locator('[data-control-snap-owned]').count(),0);
   assert.equal(await page.locator('#rail').isVisible(),true);
   assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
   console.log('PASS',width,'focus + 20 chars stable; send/receive/reading/CTA; native search/settings; notifications; hidden states; portrait contain; cleanup');await context.close();
  }
 }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
