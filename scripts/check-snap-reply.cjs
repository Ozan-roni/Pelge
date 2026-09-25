/* Regression contracts for native Reply + mixed group avatars. No real private messages are read. */
const {chromium}=require(process.env.CONTROL_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture,init,frames}=require('./check-snap-messages.cjs');
const source=fs.readFileSync(path.join(__dirname,'../mobile/Control-iPhone.user.js'),'utf8');
const out=path.join(__dirname,'../build/iphone-verification');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:process.env.CONTROL_BROWSER_CHANNEL||undefined});
 try{for(const width of [320,390,430]){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await context.route('**/*',r=>r.fulfill({contentType:'text/html',body:fixture}));await context.addInitScript({content:source});await page.goto('https://web.snapchat.com/');await page.evaluate(init);await page.locator('#control-native-loading').waitFor({state:'detached'});
  await page.evaluate(()=>{
   const rows=document.querySelectorAll('.row');
   const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" style="width:12px;height:12px"><circle cx="30" cy="20" r="12" fill="#cb81bf"/><path d="M10 60v-10a20 20 0 0 1 40 0v10" fill="#cb81bf"/></svg>';
   rows[1].querySelectorAll('.portrait')[0].innerHTML=svg;
   rows[1].querySelectorAll('.portrait')[1].innerHTML=svg.replaceAll('#cb81bf','#86b6e0');
   window.replyClicks=0;
   window.openReceived=()=>{
    replyClicks++;
    const pane=document.querySelector('.stage');pane.dataset.testid='camera-panel';
    pane.innerHTML='<div role="dialog" id="received-player"><video playsinline controls></video><button aria-label="Fermer">Fermer</button><textarea aria-label="Répondre au Snap" placeholder="Répondre au Snap"></textarea></div>';
    const video=pane.querySelector('video');video.style.cssText='height:65vh;width:100%;background:#35434f';
    Object.defineProperty(video,'readyState',{get:()=>2});Object.defineProperty(video,'paused',{get:()=>false});
    video.onclick=()=>window.videoClicks=(window.videoClicks||0)+1;
    pane.querySelector('button').onclick=()=>{pane.innerHTML='<button aria-label="Appareil photo">Camera</button>';};
   };
   for(const row of [rows[0],rows[1]]){
    const action=document.createElement('button');action.className='native-reply';action.style.cssText='position:absolute;left:48%;top:12px;font-size:20px';
    action.innerHTML=svg+'<span>Répondre</span>';action.onclick=openReceived;row.append(action);
   }
   // Native received-Snap target remains independent of the native reply action.
   const received=document.createElement('button');received.id='open-snap';received.setAttribute('aria-label','Voir le Snap reçu');received.textContent='Reçu';received.onclick=e=>{e.stopPropagation();openReceived();};rows[0].querySelector('.status').replaceChildren(received);
  });
  await page.waitForFunction(()=>document.querySelectorAll('[data-control-snap-row-reply]').length===2);await frames(page);
  for(const row of [page.locator('.row').nth(0),page.locator('.row').nth(1)]){
   const action=row.locator('[data-csm-action]'),b=await action.boundingBox(),name=await row.locator('[data-control-snap-name-line]').boundingBox();
   assert(b&&name&&b.x>=name.x+name.width&&b.x+b.width<=width,JSON.stringify({b,name}));
   assert.equal(await action.locator(':scope > svg').isVisible(),false);
   assert.equal(await action.locator('[data-control-snap-owned="row-icon"] svg').isVisible(),true);
   assert.equal(await row.locator('.native-reply [data-control-snap-text-flow]').count(),0);
  }
  const members=await page.locator('.row').nth(1).locator('[data-control-snap-member]').evaluateAll(nodes=>nodes.map(el=>{const b=el.getBoundingClientRect();return{tag:el.tagName,w:b.width,h:b.height,x:b.x,y:b.y};}));
  assert.deepEqual(members.map(m=>m.tag.toLowerCase()),['svg','svg','img']);assert(members.every(m=>m.w>30&&m.h>30));assert.equal(new Set(members.map(m=>m.x+','+m.y)).size,3);
  await page.screenshot({path:path.join(out,`snap-reply-groups-${width}.png`),animations:'disabled'});
  for(const selector of ['#open-snap','.native-reply[data-csm-action]']){
   await page.locator(selector).first().click();await page.locator('#received-player[data-csx-overlay="viewer"]').waitFor();await frames(page);
   assert.equal(await page.locator('#received-player video').isVisible(),true);assert.equal(await page.locator('#received-player textarea').isVisible(),true);
   const video=await page.locator('#received-player video').boundingBox();assert(video.width>=width-1&&video.height>300,JSON.stringify(video));
   const reply=await page.locator('#received-player textarea').boundingBox();assert(reply.y>760&&reply.y+reply.height<=844&&reply.x>=0&&reply.x+reply.width<=width,JSON.stringify(reply));
   await page.locator('#received-player textarea').fill('Une réponse');assert.equal(await page.locator('#received-player textarea').inputValue(),'Une réponse');
   await page.locator('#received-player video').click();assert((await page.evaluate(()=>videoClicks))>0);
   await page.screenshot({path:path.join(out,`snap-received-player-${width}.png`),animations:'disabled'});
   await page.getByRole('button',{name:'Fermer',exact:true}).click();await frames(page);
   assert.equal(await page.locator('[data-csx-viewer-host]').count(),0);assert.equal(await page.locator('.stage').isVisible(),false);assert.equal(await page.locator('.contacts').isVisible(),true);
  }
  assert.equal(await page.evaluate(()=>replyClicks),2,'Only the two deliberate native actions open media');
  assert.deepEqual(errors,[]);await context.close();console.log('PASS mixed SVG/image group, Reply alignment, received video/reply input in hidden camera pane and return',width);
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
