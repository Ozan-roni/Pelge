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
   assert.equal(await page.evaluate(()=>window.nativeClicks),0);await page.locator('.camera-start').click();assert.equal(await page.evaluate(()=>window.nativeClicks),1);
   await page.locator('.surface').evaluate(e=>e.innerHTML='<video class="preview" aria-label="Camera preview"></video>');
   await page.getByRole('button',{name:'Messages',exact:true}).click();await page.getByRole('button',{name:'Snap',exact:true}).click();
   const preview=await page.locator('.preview').boundingBox();assert(preview.width>=width-1,'Live camera uses available width');
   for(let i=0;i<4;i++){await page.getByRole('button',{name:'Messages',exact:true}).click();await page.getByRole('button',{name:'Snap',exact:true}).click();}
   assert.equal(await page.locator('#control-native-loading').count(),0,'No repeated loader');assert.equal(await page.locator('#control-snap-tabs button').count(),2);
   assert.deepEqual(errors,[]);await context.close();console.log('PASS nested avatars, text alignment, native camera, transitions',width,'virtual:',virtual);
  }
  for(const reducedMotion of ['reduce','no-preference']){
   const context=await browser.newContext({viewport:{width:390,height:844},colorScheme:'dark',reducedMotion}),page=await context.newPage();
   await context.route('**/*',r=>r.fulfill({contentType:'text/html',body:'<meta name="viewport" content="width=device-width,initial-scale=1"><body></body>'}));await context.addInitScript({content:source});
   await page.goto('https://web.snapchat.com/');await page.locator('#control-native-loading').waitFor();
   assert.equal(await page.locator('#control-native-loading').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(255, 255, 255)');
   assert.equal(await page.locator('#control-native-loading rect').count(),0,'No square behind the ghost');
   assert.equal(await page.locator('#control-native-loading path').getAttribute('fill'),'#fffc00');
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
