/* Shipping userscript, synthetic native DOM only: not a real Snapchat/iPhone session. */
const {chromium}=require(process.env.CONTROL_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../mobile/Control-iPhone.user.js'),'utf8');
const out=path.join(__dirname,'../build/iphone-verification');fs.mkdirSync(out,{recursive:true});
const portrait=i=>'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><circle cx="30" cy="22" r="12" fill="${['#f1c464','#be92dd','#85b9d6'][i%3]}"/><path d="M10 60v-8a20 20 0 0 1 40 0v8" fill="${['#f1c464','#be92dd','#85b9d6'][i%3]}"/></svg>`);
const names=['Camille','Groupe amis','Bram','David','Les voisins'];
const fixture=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=1100"><style>
*{box-sizing:border-box}body{margin:0;font:16px system-ui}main{width:1200px}.app{display:flex;height:100vh}.contacts{width:80px;overflow:auto}.contacts header{height:80px;display:flex;align-items:center}.row{height:80px;width:80px;position:relative}.hit{display:flex;width:80px;height:80px;padding:0;border:0}.row-content{display:flex;width:80px}.avatar{position:relative;width:60px;height:60px}.avatar .portrait{overflow:hidden;clip-path:circle(10%);width:0}.avatar img{position:absolute;width:100px;height:100px;top:20px;left:20px}.details{display:none;width:0}.details h3{display:none;height:0;opacity:0;font-size:0;margin:0}.status{display:flex;flex-direction:column}.row-camera{position:absolute;left:1100px}.native-compose{position:fixed;right:10px;bottom:20px;background:#fffc00}.stage{width:900px;height:800px;background:#202020;color:#eee}.chat-shell{display:flex;flex-direction:column;height:100%}.chat-shell header{display:flex;align-items:center;height:60px;padding:10px;gap:12px}.history{overflow:auto;height:500px;padding:12px}.history p{min-height:50px}.history img.attachment{width:520px}.composer{display:flex;padding:10px;gap:6px}.composer textarea{flex:1;min-width:0;background:#333;color:#fff;border:1px solid #555;border-radius:22px;padding:10px}.composer button{width:40px;height:40px;background:#333;color:white;border:0;border-radius:50%}#viewer{position:fixed;inset:0;background:#111;z-index:99999}#viewer video{width:100%;height:75vh;background:#456}
</style><main><div class="app"><section class="contacts" data-testid="conversation-list"><header><h1>Chat</h1></header><div role="list">${names.map((name,i)=>`<div role="listitem" class="row" data-conversation-id="person-${i}" ${i===1||i===4?'data-group-id="group-'+i+'"':''}><button class="hit"><div class="row-content"><div class="avatar">${Array.from({length:i===1?3:1},(_,j)=>`<div class="portrait"><img src="${portrait(j)}" alt=""></div>`).join('')}</div><div class="details">${i===2?'<span title="Bram" class="native-name"></span>':`<h3>${name}</h3>`}<div class="status"><span>Reçu</span><time> · 2h</time></div></div></div></button><button class="row-camera" aria-label="Appareil photo pour ${name}">Photo</button></div>`).join('')}</div></section><section class="stage" data-testid="camera-panel"><video></video><button aria-label="Appareil photo">Camera</button><button aria-label="Stories">Stories</button></section><button class="native-compose" aria-label="Nouveau message">+</button></div></main>`;
const init=()=>{
 window.events={send:0,gallery:0,camera:0};
 document.querySelectorAll('.hit').forEach(b=>b.onclick=()=>{
  const p=document.querySelector('.stage');p.dataset.testid='conversation-panel';p.innerHTML='<div class="chat-shell"><header><button aria-label="Back">Retour</button><strong>Camille</strong></header><div role="log" class="history">'+Array.from({length:20},(_,i)=>'<p>Message '+i+'</p>').join('')+'<img class="attachment" alt="Image reçue"><button id="received">Voir la vidéo reçue</button></div><footer class="composer"><button aria-label="Camera">Photo</button><textarea aria-label="Message" placeholder="Envoyer un Chat"></textarea><button aria-label="Emoji">☺</button><button aria-label="Gallery">▧</button><button aria-label="Envoyer">➤</button></footer></div>';
  p.querySelector('.attachment').src=document.querySelector('.avatar img').src;
  p.querySelector('[aria-label=Back]').onclick=()=>{p.dataset.testid='camera-panel';p.innerHTML='<video></video><button aria-label="Appareil photo">Camera</button>';};
  p.querySelector('[aria-label=Envoyer]').onclick=()=>events.send++;
  p.querySelector('[aria-label=Gallery]').onclick=()=>events.gallery++;
  p.querySelector('[aria-label=Camera]').onclick=()=>events.camera++;
  p.querySelector('#received').onclick=()=>{const d=document.createElement('div');d.id='viewer';d.dataset.testid='media-viewer';d.setAttribute('role','dialog');d.innerHTML='<video preload="none" aria-label="Received video"></video><button id="close-video">Fermer</button>';p.querySelector('[role=log]').append(d);const v=d.querySelector('video');let ready=0;Object.defineProperty(v,'readyState',{get:()=>ready});v.onclick=()=>{events.play=(events.play||0)+1;ready=2;v.dispatchEvent(new Event('loadeddata'));};d.querySelector('button').onclick=()=>d.remove();};
 });
};
const frames=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r)))));
(async()=>{
 const browser=await chromium.launch({channel:process.env.CONTROL_BROWSER_CHANNEL||undefined});
 try{for(const width of [320,390,430]){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await context.route('**/*',r=>r.fulfill({contentType:'text/html',body:fixture}));await context.addInitScript({content:source});await page.goto('https://web.snapchat.com/');await page.evaluate(init);
  await page.locator('html[data-control-snap-messages-only]').waitFor();await page.locator('#control-native-loading').waitFor({state:'detached'});await frames(page);
  assert.equal(await page.locator('#control-snap-tabs,#control-snap-row-actions,#control-snap-new-chat').count(),0);
  assert.equal(await page.locator('.native-compose').isVisible(),false);assert.equal(await page.locator('.stage').isVisible(),false);
  for(const row of await page.locator('.row-camera').all())assert.equal(await row.isVisible(),false);
  const contacts=await page.locator('.contacts').boundingBox();assert(contacts.width>=width-1&&contacts.height>=843,JSON.stringify(contacts));
  assert.deepEqual(await page.locator('[data-control-snap-name-line]').allTextContents(),names);
  for(const name of await page.locator('[data-control-snap-name-line]').all()){const b=await name.boundingBox();assert(b&&b.width>150&&b.height>10,JSON.stringify(b));}
  const members=await page.locator('[data-control-snap-group="3"] img').evaluateAll(imgs=>imgs.map(img=>{const b=img.getBoundingClientRect(),p=img.closest('[data-control-snap-avatar-slot]').getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height,inside:b.x>=p.x-1&&b.y>=p.y-1&&b.right<=p.right+1&&b.bottom<=p.bottom+1};}));assert.equal(members.length,3);assert.equal(new Set(members.map(b=>b.x+','+b.y)).size,3);assert(members.every(b=>b.inside&&b.w>20&&b.h>20),JSON.stringify(members));
  assert.equal(await page.locator('[data-control-snap-group="composite"]').count(),1);
  assert.equal(await page.locator('.row').first().locator('.portrait').evaluate(el=>getComputedStyle(el).clipPath),'none','Individual avatar wrapper must not crop its portrait');
  await page.evaluate(()=>{const slot=document.querySelectorAll('.row')[4].querySelector('.avatar');for(let i=0;i<2;i++){const wrap=slot.firstElementChild.cloneNode(true);slot.append(wrap);}});
  await page.waitForFunction(()=>document.querySelectorAll('.row')[4].querySelector('[data-control-snap-group="3"]'));
  assert.equal(await page.locator('.row').nth(4).locator('img[data-control-snap-member]').count(),3,'Late group members update without reloading');
  await page.evaluate(()=>{const row=document.querySelectorAll('.row')[3];row.dataset.displayName='David Martin';});await page.waitForFunction(()=>document.querySelectorAll('.row')[3].querySelector('[data-control-snap-name-line]')?.textContent==='David Martin');
  await page.evaluate(()=>{const row=document.querySelectorAll('.row')[3];row.dataset.conversationId='new-person';row.dataset.displayName='Nouveau contact';row.querySelector('h3').textContent='Nouveau contact';});await page.waitForFunction(()=>document.querySelectorAll('.row')[3].querySelector('[data-control-snap-name-line]')?.textContent==='Nouveau contact');
  assert.equal(await page.locator('.row').nth(3).locator('[data-control-snap-name-line]').count(),1);
  await page.screenshot({path:path.join(out,`snap-messages-only-${width}.png`),animations:'disabled'});
  await page.locator('.hit').first().click();await page.waitForFunction(()=>document.documentElement.dataset.controlSnapView==='conversation');await page.waitForFunction(()=>document.querySelector('.stage').dataset.csxReady==='READY');await frames(page);
  assert.equal(await page.getByRole('button',{name:'Camera',exact:true}).isVisible(),false);
  const pane=await page.locator('.stage').boundingBox(),composer=await page.locator('.composer').boundingBox(),send=await page.getByRole('button',{name:'Envoyer',exact:true}).boundingBox(),input=await page.getByRole('textbox',{name:'Message',exact:true}).boundingBox();
  assert(pane.width>=width-1&&pane.height>=843,JSON.stringify(pane));assert(composer.y>700&&composer.y+composer.height<=845,JSON.stringify(composer));assert(send.x>input.x+input.width&&send.x+send.width<=width,JSON.stringify({send,input}));
  await page.getByRole('textbox',{name:'Message',exact:true}).fill('Test');await page.getByRole('button',{name:'Envoyer',exact:true}).click();await page.getByRole('button',{name:'Gallery',exact:true}).click();assert.deepEqual(await page.evaluate(()=>[events.send,events.gallery,events.camera]),[1,1,0]);
  const media=await page.locator('.attachment').boundingBox();assert(media.width<=width&&media.x>=0,JSON.stringify(media));
  await page.screenshot({path:path.join(out,`snap-messages-chat-${width}.png`),animations:'disabled'});
  await page.locator('#received').click();await page.locator('#viewer[data-csx-overlay]').waitFor();await page.locator('#viewer video').click();assert.equal(await page.evaluate(()=>events.play),1);await page.locator('#close-video').click();await frames(page);
  await page.getByRole('button',{name:'Back',exact:true}).click();await page.waitForFunction(()=>document.documentElement.dataset.controlSnapView==='messages');await frames(page);assert.equal(await page.locator('.stage').isVisible(),false);assert.equal(await page.locator('[data-csx-chat]').count(),0);await page.locator('.hit').nth(1).click();await page.waitForFunction(()=>document.documentElement.dataset.controlSnapView==='conversation');
  assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await context.close();console.log('PASS shipping messages-only: names, groups, no camera/tabs/compose, full chat, native send/gallery/video and back',width);
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
