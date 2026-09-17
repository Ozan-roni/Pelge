/* Synthetic adversarial DOM, not a recording of a signed-in Snapchat account. */
const {chromium,webkit}=require(process.env.CONTROL_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../mobile/Control-iPhone.user.js'),'utf8');
const out=path.join(__dirname,'../build/iphone-verification');fs.mkdirSync(out,{recursive:true});
const avatar='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="#ecedf1"/><circle cx="32" cy="24" r="12" fill="#a9b1bc"/><path d="M10 58a22 22 0 0 1 44 0" fill="#a9b1bc"/></svg>');
const pageHTML=virtual=>`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{box-sizing:border-box}body{margin:0;background:#101014;color:white;font-family:system-ui}main{padding:20px;width:1100px}main>.app{display:flex;height:100vh}.contacts{width:80px;flex:none;height:100vh;overflow:auto}header{height:64px;padding:18px;font-size:24px;font-weight:700}
nav{position:relative;min-height:960px}.row{position:${virtual?'absolute':'relative'};height:80px;width:80px}.row-hit{width:80px;height:80px;padding:0;border:0;background:#222;color:white}.row-content{display:flex;flex-direction:column;width:80px;height:80px}.avatar-wrap{position:relative;background:#111;border-radius:50%;width:150px;height:60px}.avatar-paint{position:absolute;top:25px;left:15px;width:170px;height:140px}.avatar-paint img{position:absolute;left:24px;top:15px;width:100px;height:110px}.badge{position:absolute;left:0;top:-10px;background:white;box-shadow:0 2px 15px #8886;border-radius:30px;padding:3px 25px}.details{display:none;width:0;height:0;color:white;position:absolute;top:35px;left:20px}.name{font-size:22px;font-weight:bold}small{display:block}
.camera{width:900px;padding:25px;border-radius:32px;background:linear-gradient(130deg,#b2cfee,#ede7fa)}.frame{width:720px;height:690px;margin:30px;padding:24px;border-radius:40px;display:flex;align-items:center;justify-content:center}.surface{position:relative;width:560px;height:610px;padding:30px;margin:20px;border-radius:50px;background:linear-gradient(140deg,#c497df,#f3c5af)}.camera-start{width:400px;height:530px;border:0;border-radius:36px;background:#0002;color:white;font:600 20px system-ui;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px}.camera-start svg{width:100px;height:100px}.preview{position:absolute;inset:30px;width:400px;height:400px;object-fit:contain}.public{position:absolute;right:0;top:45%}
#ControlUsageTimer{position:fixed;right:4px;top:4px;background:#eee;color:#222}
</style></head><body><main><div class="app"><section class="contacts" aria-label="Conversations"><header>Chat</header><nav>${['Camille','Noé','Alex','Lou','Sam','Robin','Charlie','Max','Adèle','Gabriel','Sacha','Léa'].map((name,i)=>`<div role="listitem" class="row" ${virtual?`style="transform:translateY(${i*80}px)"`:''}><button class="row-hit" type="button"><div class="row-content"><div class="avatar-wrap"><div class="avatar-paint"><img alt="" src="${avatar}"></div><span class="badge">😊</span></div><div class="details"><span class="name">${name}</span><small>Reçu · 8 min</small></div></div></button></div>`).join('')}</nav></section><section class="camera" data-testid="camera-panel"><div class="frame"><div class="surface"><button class="camera-start" aria-label="Appareil photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h4l2-3h6l2 3h4v15H3Z"/><circle cx="12" cy="12" r="4"/></svg><span>Cliquez sur l’appareil photo<br>pour envoyer des Snaps.</span></button></div></div></section><button class="public" aria-label="Stories">Stories</button></div></main><div id="ControlUsageTimer">Snapchat 00:16</div></body></html>`;
async function run(){
 const browser=await (process.env.CONTROL_TEST_WEBKIT?webkit:chromium).launch({headless:true,channel:process.env.CONTROL_BROWSER_CHANNEL||undefined});
 try{
  for(const virtual of [false,true])for(const width of [320,390,430]){
   const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,colorScheme:'dark'}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await context.route('**/*',r=>r.fulfill({contentType:'text/html',body:pageHTML(virtual)}));await context.addInitScript({content:source});
   await page.goto('https://web.snapchat.com/');await page.locator('#control-snap-tabs').waitFor();await page.locator('#control-native-loading').waitFor({state:'detached'});
   await page.screenshot({path:path.join(out,`snap-nested-${width}-${virtual}.png`),animations:'disabled'});
   const geometry=await page.locator('.row').evaluateAll(rows=>rows.map(row=>{
    const r=row.getBoundingClientRect(),a=row.querySelector('.avatar-wrap').getBoundingClientRect(),n=row.querySelector('.name').getBoundingClientRect(),img=row.querySelector('img').getBoundingClientRect();
    return {y:r.y,height:r.height,avatarWidth:a.width,avatarHeight:a.height,nameX:n.x,avatarRight:a.right,imageRight:img.right,rowRight:r.right,nameRight:n.right};
   }));
   for(let i=0;i<geometry.length;i++){const g=geometry[i];assert(g.avatarWidth<=55&&g.avatarHeight<=55,JSON.stringify(g));assert(g.nameX>=g.avatarRight+10,'Names must not overlap avatars');assert(g.imageRight<=g.avatarRight+1,JSON.stringify(g));assert(g.nameRight<=g.rowRight+1);if(i)assert(g.y>=geometry[i-1].y+geometry[i-1].height-1,'Rows must not overlap');}
   assert.equal(await page.locator('#ControlUsageTimer').isVisible(),false);
   await page.evaluate(()=>{window.nativeClicks=0;document.querySelector('.camera-start').onclick=()=>window.nativeClicks++;});
   await page.getByRole('button',{name:'Snap',exact:true}).click();
   await page.screenshot({path:path.join(out,`snap-full-camera-${width}-${virtual}.png`),animations:'disabled'});
   const nav=await page.locator('#control-snap-tabs').boundingBox();
   for(const selector of ['.camera','.frame','.surface','.camera-start']){
    const box=await page.locator(selector).boundingBox();assert(box.x<=1&&box.width>=width-1,selector+' width '+JSON.stringify(box));assert(box.y<=1&&box.y+box.height>=nav.y-1,selector+' height '+JSON.stringify(box));
   }
   assert.equal(await page.evaluate(()=>window.nativeClicks),1,'Snap opens the native start prompt on an explicit tap');await page.locator('.camera-start').click();assert.equal(await page.evaluate(()=>window.nativeClicks),2);
   await page.locator('.surface').evaluate(e=>e.innerHTML='<video class="preview" aria-label="Camera preview"></video>');
   await page.getByRole('button',{name:'Messages',exact:true}).click();await page.getByRole('button',{name:'Snap',exact:true}).click();
   const preview=await page.locator('.preview').boundingBox();assert(preview.width>=width-1,'Live camera uses available width');
   for(let i=0;i<4;i++){await page.getByRole('button',{name:'Messages',exact:true}).click();await page.getByRole('button',{name:'Snap',exact:true}).click();}
   assert.equal(await page.locator('#control-native-loading').count(),0,'No repeated loader');assert.equal(await page.locator('#control-snap-tabs button').count(),2);
   assert.deepEqual(errors,[]);await context.close();console.log('PASS nested avatars, text alignment, native camera, transitions',width,'virtual:',virtual);
  }
  for(const width of [320,390,430]){
   const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true}),page=await context.newPage();
   // Name headings and fragmented statuses were absent from the earlier simple fixtures.
   const html=pageHTML(false).replaceAll('<span class="name">','<h3 class="name" style="opacity:0;max-height:0">').replaceAll('</span><small>Reçu · 8 min</small>','</h3><div class="status"><svg width="30" height="30" viewBox="0 0 24 24"><path d="M3 3h18v16H3Z" fill="none" stroke="#00adf0"/></svg><span>Reçu</span><span>·</span><time>8 min</time></div>');
   await context.route('**/*',r=>r.fulfill({contentType:'text/html',body:html}));await context.addInitScript({content:source});
   await page.goto('https://web.snapchat.com/');await page.locator('#control-snap-tabs').waitFor();await page.locator('#control-native-loading').waitFor({state:'detached'});
   assert.equal(await page.locator('#control-snap-tabs').innerText(),'','Icon-only navigation');
   const rows=await page.locator('.row').evaluateAll(items=>items.map(row=>{const name=row.querySelector('.name'),status=row.querySelector('.status'),n=name.getBoundingClientRect(),s=status.getBoundingClientRect(),r=row.getBoundingClientRect();return {name:name.textContent,y:n.y,bottom:n.bottom,opacity:getComputedStyle(name).opacity,statusTop:s.y,statusBottom:s.bottom,rowBottom:r.bottom};}));
   for(const row of rows){assert.equal(row.opacity,'1');assert(row.bottom>row.y);assert(row.statusTop>=row.bottom-1);assert(row.statusBottom<=row.rowBottom+1,JSON.stringify(row));}
   await page.screenshot({path:path.join(out,'snap-names-icons-'+width+'.png'),animations:'disabled'});
   await page.evaluate(()=>{
    document.querySelector('.camera').innerHTML='<div class="dialog-shell" style="height:640px;width:700px;padding:20px;border:1px solid white;border-radius:30px"><header style="background:#101010;color:white"><button aria-label="Back">←</button> Camille</header><div role="log" style="background:#202124;color:white;overflow-y:auto;height:400px;padding:16px"><p>Conversation de test</p><p>Contenu natif conservé</p></div><footer><textarea aria-label="Chat" style="width:100%;height:64px"></textarea></footer></div>';
    document.querySelector('[aria-label="Back"]').onclick=()=>document.querySelector('.camera').replaceChildren();
   });
   await page.waitForFunction(()=>document.documentElement.getAttribute('data-control-snap-view')==='conversation');
   assert.equal(await page.locator('#control-snap-tabs').isVisible(),false);
   const pane=await page.locator('.camera').boundingBox(),frame=await page.locator('.dialog-shell').boundingBox();
   assert(pane.x<=1&&pane.y<=1&&pane.width>=width-1&&pane.height>=843,JSON.stringify(pane));
   assert(frame.width>=width-1&&frame.height>=843,JSON.stringify(frame));
   assert.equal(await page.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(32, 33, 36)');
   await page.getByRole('textbox',{name:'Chat'}).fill('Not sent');
   await page.screenshot({path:path.join(out,'snap-full-conversation-'+width+'.png'),animations:'disabled'});
   await page.getByRole('button',{name:'Back',exact:true}).click();await page.locator('#control-snap-tabs').waitFor({state:'visible'});
   await context.close();console.log('PASS headings visible, compact status, icon-only tabs, edge-to-edge conversation and native back',width);
  }
  // A chat attachment camera must never be mistaken for the full-screen camera pane.
  for(const width of [320,390,430])for(const semanticLog of [true,false]){
   const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,colorScheme:'dark'}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   const chat='<section data-testid="conversation-panel" class="native-chat"><header class="chat-header"><button aria-label="Back">‹</button><strong>Camille</strong><button aria-label="Call">Appeler</button></header><div class="chat-body"><div class="history-wrap"><div class="history" '+(semanticLog?'role="log"':'')+'>'+Array.from({length:30},(_,i)=>'<p>Message de test '+i+'</p>').join('')+'</div></div><div class="native-toolbar"><button aria-label="Appareil photo" class="attach">◉</button><div class="input-wrap"><div class="input-inner"><div contenteditable="true" role="textbox" aria-label="Envoyer un Chat"></div></div></div><button aria-label="Emoji">☺</button><button aria-label="Galerie">▣</button></div></div></section>';
   const css='<style>.native-chat{width:850px;height:700px;display:flex;flex-direction:column;background:#202124;color:#eee;border-radius:28px;padding:20px}.chat-header{height:64px;flex:0 0 64px;display:flex;align-items:center;gap:12px;background:#111;font-size:17px;padding:8px}.chat-header strong{flex:1}.chat-header button{font-size:14px}.chat-body{display:flex;flex-direction:column;flex:1;min-height:0}.history-wrap{flex:1;min-height:0;display:flex;flex-direction:column}.history{height:430px;overflow-y:auto;background:#202124;padding:12px}.history p{padding:14px;background:#303134;border-radius:10px}.native-toolbar{display:flex;flex-direction:row;align-items:center;gap:8px;padding:8px;flex:0 0 auto;background:#202124}.native-toolbar button{width:36px;height:36px;min-width:36px;flex:0 0 36px;border-radius:50%;background:#333;color:white;border:1px solid #444;font-size:22px;padding:0}.input-wrap{flex:1;min-width:0;border-radius:24px;background:#333;padding:10px}.input-inner{display:flex;align-items:center;min-width:0}.input-inner [role=textbox]{min-width:0;min-height:22px;max-height:100px;overflow-y:auto;flex:1;color:white;font:16px system-ui;outline:none}</style>';
   const html=pageHTML(false).replace('</head>',css+'</head>').replace('<button class="public"',chat+'<button class="public"');
   await context.route('**/*',r=>r.fulfill({contentType:'text/html',body:html}));await context.addInitScript({content:source});
   await page.goto('https://web.snapchat.com/');await page.waitForFunction(()=>document.documentElement.getAttribute('data-control-snap-view')==='conversation');
   await page.locator('#control-native-loading').waitFor({state:'detached'});
   async function checkChat(height){
    const g=await page.evaluate(()=>{const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right};};return{header:box('.chat-header'),history:box('.history'),toolbar:box('.native-toolbar'),input:box('[role=textbox]'),buttons:[...document.querySelectorAll('.native-toolbar button')].map(e=>{const r=e.getBoundingClientRect();return{y:r.y,width:r.width,height:r.height,bottom:r.bottom};}),direction:getComputedStyle(document.querySelector('.native-toolbar')).flexDirection,camera:document.querySelector('.native-chat').hasAttribute('data-control-snap-camera')};});
    assert.equal(g.camera,false,'Attachment camera must not classify a conversation as the camera pane');
    assert.equal(g.direction,'row','Native composer stays horizontal');
    assert(g.toolbar.height<100&&g.toolbar.bottom<=height+1&&g.toolbar.bottom>=height-2,JSON.stringify(g));
    assert(g.history.y>=g.header.bottom-1&&g.history.bottom<=g.toolbar.y+1&&g.history.height>=height-180,JSON.stringify(g));
    assert(g.input.width>=width-175&&g.input.y>=g.toolbar.y&&g.input.bottom<=g.toolbar.bottom,JSON.stringify(g));
    for(const b of g.buttons)assert(b.width<=45&&b.height<=45&&b.y>=g.toolbar.y&&b.bottom<=g.toolbar.bottom,JSON.stringify(g));
    assert.equal(await page.locator('#control-snap-tabs').isVisible(),false);
    assert.equal(await page.locator('.history').evaluate(e=>getComputedStyle(e).color),'rgb(238, 238, 238)','Preserve native dark conversation text contrast');
   }
   await checkChat(844);
   await page.getByRole('textbox',{name:'Envoyer un Chat'}).fill('Texte de test — non envoyé');
   await page.locator('.history').evaluate(el=>el.scrollTop=el.scrollHeight);assert(await page.locator('.history').evaluate(el=>el.scrollTop>0));
   await page.screenshot({path:path.join(out,'snap-chat-toolbar-'+width+'-'+semanticLog+'.png'),animations:'disabled'});
   await page.setViewportSize({width,height:480});await page.waitForFunction(()=>document.documentElement.style.getPropertyValue('--control-snap-height')==='480px');await checkChat(480);
   await page.screenshot({path:path.join(out,'snap-chat-keyboard-'+width+'-'+semanticLog+'.png'),animations:'disabled'});
   await page.evaluate(()=>{window.attachmentClicks=0;document.querySelector('.attach').onclick=()=>window.attachmentClicks++;});
   await page.getByRole('button',{name:'Appareil photo',exact:true}).click();assert.equal(await page.evaluate(()=>window.attachmentClicks),1);
   assert.deepEqual(errors,[]);await context.close();console.log('PASS native chat toolbar, history scrolling, attachment action and resized viewport',width,'semantic:',semanticLog);
  }
  for(const reducedMotion of ['reduce','no-preference']){
   const context=await browser.newContext({viewport:{width:390,height:844},colorScheme:'dark',reducedMotion}),page=await context.newPage();
   await context.route('**/*',r=>r.fulfill({contentType:'text/html',body:'<meta name="viewport" content="width=device-width,initial-scale=1"><body></body>'}));await context.addInitScript({content:source});
   await page.goto('https://web.snapchat.com/');await page.locator('#control-native-loading').waitFor();
   assert.equal(await page.locator('#control-native-loading').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)');
   assert.equal(await page.locator('#control-native-loading rect').count(),0,'No square behind the ghost');
   assert.equal(await page.locator('#control-native-loading path').getAttribute('fill'),'#e1dc00');
   assert.match(await page.locator('#control-native-loading i').evaluate(e=>getComputedStyle(e).webkitMaskImage),/data:image/);
   assert.equal(await page.locator('#control-native-loading i').evaluate(e=>getComputedStyle(e).animationName),reducedMotion==='reduce'?'none':'control-outline-reflection');
   await page.screenshot({path:path.join(out,`snap-yellow-loader-${reducedMotion}.png`)});
   await page.evaluate(()=>document.body.innerHTML='<textarea></textarea>');await page.locator('#control-native-loading').waitFor({state:'detached'});
   assert.equal(await page.locator('html').getAttribute('data-control-mobile-loading'),null);
   await context.close();console.log('PASS yellow vector ghost, white background, masked reflection, fade',reducedMotion);
  }
 }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
