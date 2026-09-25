/* Isolated fixtures only: no real account, message, login or network request. */
const {chromium,webkit}=require(process.env.CONTROL_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
// Legacy two-tab contracts. The unmodified shipping messages-only mode is covered by check-snap-messages.cjs.
const source=fs.readFileSync(path.join(__dirname,'../mobile/Control-iPhone.user.js'),'utf8').replace('const snapMessagesOnly=true;','const snapMessagesOnly=false;');
const out=path.join(__dirname,'../build/iphone-verification');fs.mkdirSync(out,{recursive:true});
const cases=[
 {host:'www.instagram.com',dm:'/direct/inbox/',login:'/accounts/login/',blocked:['/','/reels/','/reel/not-received/','/explore/']},
 {host:'www.facebook.com',dm:'/messages/',login:'/login.php',blocked:['/','/watch/']},
 {host:'www.reddit.com',dm:'/message/inbox/',login:'/login/',blocked:['/','/r/popular/']},
 {host:'x.com',dm:'/messages',login:'/i/flow/login',blocked:['/','/explore']},
 {host:'web.snapchat.com',dm:'/',login:'/login/',blocked:['/spotlight','/stories','/discover','/map']}
];
const base='<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;font:16px system-ui}nav{padding:12px}nav a{margin-right:18px}main{padding:16px}video{background:#292b36;width:100%;height:230px}textarea{width:100%;height:60px}</style>';
const fixture=app=>`${base}<nav><a id="feed" href="${app.host==='web.snapchat.com'?'/spotlight':'/explore/'}">Discovery</a><a id="messages" href="${app.dm}">Messages</a></nav><main><h1>Native conversation</h1><video controls aria-label="Private attachment"></video><textarea aria-label="Message"></textarea><input aria-label="Username"><a id="received" href="/reel/AbC123/" target="_blank">Received video</a></main>`;
const media=`${base}<main><a href="/direct/inbox/">Back to messages</a><div><article><h1>Received video</h1><video id="received-video"></video></article><article id="recommendation"><h2>Another Reel</h2><video></video></article></div><button aria-label="Next reel">Next</button><a id="other-reel" href="/reel/Other123/">Another Reel</a></main>`;
const snap=`${base}<style>main{padding:0}main>div{display:flex}.contacts{width:320px;height:100vh;flex-shrink:0}.contact{display:flex;align-items:center;gap:16px;padding:16px;border-bottom:1px solid #ddd}.avatar{width:48px;height:48px;border-radius:50%;background:#ffef61}.conversation{width:600px}aside{width:300px}header{padding:16px}h1{font-size:24px}</style><main><div><section class="contacts" aria-label="Conversations"><header><h1>Chat</h1></header><nav><button aria-label="Spotlight">Spotlight</button><a href="/gallery">Gallery</a><a href="/camera">Camera</a></nav><div role="list">${Array.from({length:8},(_,i)=>`<a class="contact" role="listitem" href="/chat/${i}"><span class="avatar" aria-hidden="true"></span><span>Contact ${i+1}<small style="display:block;color:#68717e">Received · 8 min</small></span></a>`).join('')}</div></section><section class="conversation" data-testid="chat-placeholder">Choose a conversation</section><aside aria-label="Spotlight">Public video</aside></div></main>`;
async function run(){
 const engine=process.env.CONTROL_TEST_WEBKIT?webkit:chromium;
 const browser=await engine.launch({headless:true,channel:process.env.CONTROL_BROWSER_CHANNEL||undefined});
 try{
  for(const app of cases){
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await context.route('**/*',route=>route.fulfill({contentType:'text/html',body:/\/reel\//.test(new URL(route.request().url()).pathname)?media:fixture(app)}));
   await context.addInitScript({content:source});
   for(const route of app.blocked){await page.goto(`https://${app.host}${route}`);await page.waitForURL(`https://${app.host}${app.dm}`);}
   assert.equal(await page.locator('#control-iphone').count(),0,'No Control screen or launcher');
   assert.equal(await page.locator('#feed').isVisible(),false);
   assert.equal(await page.locator('video').isVisible(),true,'Private media remains native');
   await page.getByRole('textbox',{name:'Message',exact:true}).fill('Not sent');
   assert.notEqual(await page.evaluate(()=>getComputedStyle(document.body).overflowY),'hidden','Chats remain scrollable');
   if(app.host==='www.instagram.com'){
    await page.locator('#received').click();await page.waitForURL('**/reel/AbC123/');
    await page.waitForFunction(()=>document.documentElement.hasAttribute('data-control-single-media'));
    assert.equal(await page.locator('#received-video').isVisible(),true);
    assert.equal(await page.locator('#received-video').evaluate(v=>v.controls),true);
    assert.equal(await page.locator('#recommendation').isVisible(),false);
    assert.equal(await page.getByRole('button',{name:'Next reel'}).isVisible(),false);
    assert.equal(await page.locator('#other-reel').isVisible(),false);
    assert.equal(await page.evaluate(()=>{const e=new WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY:500});return document.body.dispatchEvent(e);}),false);
    assert.equal(await page.evaluate(()=>{const e=new Event('touchmove',{bubbles:true,cancelable:true});return document.body.dispatchEvent(e);}),false);
    await page.reload();await page.waitForFunction(()=>document.documentElement.hasAttribute('data-control-single-media'));
    await page.screenshot({path:path.join(out,'instagram-single.png')});
    await page.evaluate(()=>history.pushState({},'','/reel/Other123/'));await page.waitForURL(`https://${app.host}${app.dm}`);
    assert.equal(await page.locator('html').getAttribute('data-control-single-media'),null);
    await page.locator('#received').click();await page.waitForURL('**/reel/AbC123/');
    await page.getByRole('link',{name:'Back to messages'}).click();await page.waitForURL(`https://${app.host}${app.dm}`);
    assert.equal(await page.evaluate(()=>{const a=document.querySelector('#received');a.href='/reel/NotClicked/';return a.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));}),false,'Synthetic clicks cannot authorize another video');
   }
   await page.goto(`https://${app.host}${app.login}`);await page.getByRole('textbox',{name:'Username'}).fill('Test only');
   assert.equal(await page.locator('html').getAttribute('data-control-redirecting'),null);
   assert.deepEqual(errors,[]);await context.close();console.log('PASS',app.host,'quiet redirect, native messages, no Control UI, login preserved');
  }
  for(const width of [320,390,700,1280]){
   const context=await browser.newContext({viewport:{width,height:844}}),page=await context.newPage();
   await context.route('**/*',r=>r.fulfill({contentType:'text/html',body:snap}));await context.addInitScript({content:source});
   await page.goto('https://web.snapchat.com/');await page.locator('[data-control-snap-contacts]').waitFor();
   assert.equal(await page.getByRole('complementary',{name:'Spotlight'}).isVisible(),false);
   assert.equal(await page.getByRole('button',{name:'Spotlight'}).isVisible(),false);
   assert.equal(await page.getByRole('link',{name:'Gallery'}).isVisible(),true);
   assert.equal(await page.getByRole('link',{name:'Camera'}).isVisible(),true);
   assert.equal(await page.locator('.contact').count(),8);
   if(width<=700){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert((await page.locator('[data-control-snap-contacts]').boundingBox()).width>=width-2);}
   await page.screenshot({path:path.join(out,`snapchat-${width}.png`)});
   await page.evaluate(()=>{const pane=document.querySelector('.conversation');pane.removeAttribute('data-testid');pane.setAttribute('data-testid','conversation-panel');pane.innerHTML='<button id="back">Back</button><textarea aria-label="Message"></textarea>';});
   await page.waitForFunction(()=>document.documentElement.hasAttribute('data-control-snap-conversation-open'));
   if(width<=700)assert.equal(await page.locator('[data-control-snap-contacts]').isVisible(),false);
   await page.getByRole('textbox',{name:'Message'}).fill('Not sent');
   await page.evaluate(()=>{const p=document.querySelector('.conversation');p.setAttribute('data-testid','chat-placeholder');p.innerHTML='Choose a conversation';});
   await page.locator('[data-control-snap-contacts]').waitFor({state:'visible'});
   await context.close();console.log('PASS Snapchat native contacts/gallery/conversation at',width);
  }
  // Regression: the real screenshot has an 80px, avatar-only desktop rail, not a 320px list.
  for(const width of [320,390,430])for(const theme of ['light','dark']){
   const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,colorScheme:theme}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   const collapsed=`${base}<style>body{background:#111;color:white}main{padding:0}main>div{display:flex;height:100vh}.rail{width:80px;flex-shrink:0;height:100vh;background:#222}.rail nav{padding:0}.person{display:flex;height:80px;overflow:hidden}.person img{width:60px;height:60px}.details{display:none;width:0;color:white}.camera{width:800px;background:linear-gradient(150deg,#c78ad7,#ffd7b7);padding:24px;color:#111}.camera button{padding:20px;border-radius:20px}header{padding:16px}.public{position:fixed;right:0;top:45%}</style><main><div><section class="rail"><header>Chat</header><nav>${['Camille','Alex','Noé','Sam','Charlie','Lou','Robin','Max'].map((name,i)=>`<button type="button" role="listitem" class="person" ${i===7?'aria-label="Max"':''}><img alt="" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'%3E%3Ccircle cx='30' cy='30' r='29' fill='%23eef0f2'/%3E%3Ccircle cx='30' cy='23' r='10' fill='%23c0c6cc'/%3E%3Cpath d='M10 52a20 20 0 0 1 40 0' fill='%23c0c6cc'/%3E%3C/svg%3E">${i===7?'':`<div class="details"><span>${name}</span><small>Reçu · 8 min</small></div>`}</button>`).join('')}</nav></section><section class="camera" data-testid="camera-panel"><h1>Envoyer des Snaps</h1><button id="native-camera" aria-label="Appareil photo">Ouvrir la caméra</button><div id="private-conversation"></div></section><aside aria-label="Spotlight">Public content</aside><button class="public" aria-label="Stories">Stories</button></div></main>`;
   await context.route('**/*',r=>r.fulfill({contentType:'text/html',body:collapsed}));await context.addInitScript({content:source});
   await page.goto('https://web.snapchat.com/');await page.locator('#control-snap-tabs').waitFor();
   await page.locator('#control-native-loading').waitFor({state:'detached'});
   assert.equal(await page.locator('#control-snap-tabs button').count(),2);
   assert.equal(await page.locator('.camera').isVisible(),false,JSON.stringify(await page.locator('.camera').evaluate(n=>({view:document.documentElement.dataset.controlSnapView,attrs:n.getAttributeNames(),html:n.outerHTML.slice(0,1200)}))));
   assert.equal(await page.locator('.public').isVisible(),false);
   assert.equal(await page.locator('.rail').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)');
   assert.equal(await page.locator('.details').first().isVisible(),true);
   assert.equal(await page.locator('[data-control-snap-name]').innerText(),'Max');
   assert((await page.locator('.rail').boundingBox()).width>=width-2);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.evaluate(()=>{window.cameraClicks=0;document.querySelector('#native-camera').onclick=()=>window.cameraClicks++;document.querySelector('.person').onclick=()=>{document.querySelector('#private-conversation').innerHTML='<button aria-label="Back">Back</button><textarea aria-label="Native message"></textarea>';document.querySelector('#private-conversation button').onclick=()=>document.querySelector('#private-conversation').replaceChildren();};});
   await page.screenshot({path:path.join(out,`snapchat-mobile-${width}-${theme}.png`),animations:'disabled'});
   await page.getByRole('button',{name:'Snap',exact:true}).click();
   assert.equal(await page.locator('.rail').isVisible(),false);assert.equal(await page.locator('.camera').isVisible(),true);
   assert((await page.locator('.camera').boundingBox()).width>=width-2);
   assert.equal(await page.evaluate(()=>window.cameraClicks),1,'An explicit Snap tap may open only the native start-camera prompt');
   await page.locator('#native-camera').click();assert.equal(await page.evaluate(()=>window.cameraClicks),2,'Native camera listener retained');
   await page.screenshot({path:path.join(out,`snapchat-camera-${width}-${theme}.png`),animations:'disabled'});
   await page.evaluate(()=>{const pane=document.querySelector('.camera');pane.removeAttribute('data-testid');pane.querySelector('h1').remove();pane.querySelector('button').remove();pane.insertAdjacentHTML('afterbegin','<video id="camera-preview"></video>');});
   await page.locator('#camera-preview').waitFor({state:'visible'});
   assert.equal(await page.locator('html').getAttribute('data-control-snap-view'),'snap','Native camera preview must stay open after the initial prompt disappears');
   await page.getByRole('button',{name:'Messages',exact:true}).click();await page.locator('.person').first().click();
   await page.getByRole('textbox',{name:'Native message'}).fill('Not sent');assert.equal(await page.locator('.rail').isVisible(),false);
   assert.equal(await page.locator('#control-snap-tabs').isVisible(),false);await page.getByRole('button',{name:'Back',exact:true}).click();await page.locator('.rail').waitFor({state:'visible'});
   assert.equal(await page.locator('.camera').isVisible(),false,JSON.stringify(await page.locator('.camera').evaluate(n=>({view:document.documentElement.dataset.controlSnapView,attrs:n.getAttributeNames(),html:n.outerHTML.slice(0,1200)}))));
   await page.evaluate(()=>document.querySelector('.person .details span').textContent='Camille updated');
   await page.getByText('Camille updated',{exact:true}).waitFor();
   await page.locator('.person').last().evaluate(e=>e.setAttribute('aria-label','Max updated'));
   await page.getByText('Max updated',{exact:true}).waitFor();
   await page.setViewportSize({width:1280,height:844});assert.equal(await page.locator('#control-snap-tabs').isVisible(),false);
   await page.setViewportSize({width,height:844});await page.locator('#control-snap-tabs').waitFor();
   await page.addScriptTag({content:source});assert.equal(await page.locator('#control-snap-tabs').count(),1);
   assert.deepEqual(errors,[]);await context.close();console.log('PASS collapsed Snapchat rail, names, white UI, two tabs, native handlers',width,theme);
  }
  for(const theme of ['light','dark']){
   const context=await browser.newContext({viewport:{width:390,height:844},colorScheme:theme}),page=await context.newPage();
   await context.route('**/*',r=>r.fulfill({contentType:'text/html',body:`${base}<style>body{background:${theme==='dark'?'#111':'#fff'};color:${theme==='dark'?'#eee':'#111'}}#inbox{height:100vh;overflow:hidden}.search{position:sticky;top:0;padding:16px}input{width:100%;padding:14px;border-radius:12px;border:1px solid #8885;background:transparent;color:inherit}.notes{display:flex;gap:16px;padding:16px}.notes button{border:0;background:transparent;color:inherit;min-width:64px}.notes i{display:block;margin:auto auto 6px;width:52px;height:52px;border-radius:50%;background:#bf99d9}#list{height:600px;overflow-y:auto}#list a{display:block;padding:24px;color:inherit;text-decoration:none;border-bottom:1px solid #8883}</style><main id="inbox"><div class="search"><input type="search" placeholder="Search"></div><section class="notes" aria-label="Notes">${['Your note','Alex','Sam','Charlie'].map(x=>`<button><i></i>${x}</button>`).join('')}</section><div id="list">${Array.from({length:24},(_,i)=>`<a href="/direct/t/${i}/">Conversation ${i+1}</a>`).join('')}</div></main>`}));
   await context.addInitScript({content:source});await page.goto('https://www.instagram.com/direct/inbox/');
   await page.locator('[data-control-inbox-scroll]').waitFor();
   assert.equal(await page.locator('.search').evaluate(e=>getComputedStyle(e).position),'relative');
   assert.equal(await page.locator('#list').evaluate(e=>getComputedStyle(e).overflowY),'visible');
   const before=await page.locator('.notes').boundingBox();await page.locator('#inbox').evaluate(e=>e.scrollTop=240);const after=await page.locator('.notes').boundingBox();assert(after.y<before.y-200,'Notes scroll together with the inbox');
   assert((await page.locator('.search').boundingBox()).y<0,'Search scrolls with notes and messages');
   await page.locator('#inbox').evaluate(e=>e.scrollTop=0);
   await page.screenshot({path:path.join(out,`instagram-inbox-${theme}.png`)});
   await page.addScriptTag({content:source});assert.equal(await page.locator('#control-iphone-rules').count(),1);
   await context.close();console.log('PASS unified Instagram search/notes/inbox scrolling',theme);
  }
  const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),p=await ctx.newPage();
  await ctx.route('**/*',r=>r.fulfill({contentType:'text/html',body:`${base}<body></body>`}));await ctx.addInitScript({content:source});
  await p.goto('https://www.instagram.com/direct/inbox/');await p.locator('#control-native-loading').waitFor();
  assert.equal(await p.locator('#control-native-loading').innerText(),'');
  assert.equal(await p.locator('#control-native-loading rect').getAttribute('fill'),'none','Instagram logo must have no solid background');
  assert.match(await p.locator('#control-native-loading i').evaluate(e=>getComputedStyle(e).webkitMaskImage),/data:image\/svg/,'Reflection stays inside the logo outline');
  assert.equal(await p.locator('#control-native-loading i').evaluate(e=>getComputedStyle(e).animationName),'none');
  await p.screenshot({path:path.join(out,'loading-logo.png')});
  await p.evaluate(()=>document.body.innerHTML='<main><textarea aria-label="Message"></textarea></main>');
  await p.locator('#control-native-loading').waitFor({state:'detached'});
  assert.equal(await p.locator('html').getAttribute('data-control-mobile-loading'),null);
  await p.evaluate(()=>{document.body.innerHTML='';history.pushState({},'','/direct/t/example/');});
  assert.equal(await p.locator('#control-native-loading').count(),0,'Never replay the loading screen');
  await ctx.close();console.log('PASS logo-only single loading and reduced motion');
 }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
