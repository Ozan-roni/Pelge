/* Native-like DOM regressions with real decoded, locally generated media (no account/private media). */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.CONTROL_PLAYWRIGHT_MODULE||'playwright');
const {fixture,init,frames}=require('./check-snap-messages.cjs');
const baseline=process.env.CONTROL_BASELINE==='1';
const source=baseline?require('node:child_process').execFileSync('git',['-c','safe.directory='+path.resolve(__dirname,'..').replaceAll('\\','/'),'show','020abd9:mobile/Control-iPhone.user.js'],{cwd:path.resolve(__dirname,'..'),encoding:'utf8'}):fs.readFileSync(path.join(__dirname,'../mobile/Control-iPhone.user.js'),'utf8');
const out=path.join(__dirname,'../build/iphone-verification');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:process.env.CONTROL_BROWSER_CHANNEL||undefined});try{
 for(const [width,height]of [[390,844],[393,852],[430,932]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',r=>r.fulfill({contentType:'text/html',body:fixture}));await context.addInitScript({content:source});await page.goto('https://web.snapchat.com/');await page.evaluate(init);await page.locator('#control-native-loading').waitFor({state:'detached'});
  await page.evaluate(()=>{
   const list=document.querySelector('.contacts');window.headerActions=[];
   for(const name of ['Mon compte','Notifications','Ajouter un ami','Options']){const b=document.createElement('button');b.setAttribute('aria-label',name);b.innerHTML='<svg width="24" height="24"><circle cx="12" cy="12" r="8"/></svg>';b.onclick=()=>headerActions.push(name);list.prepend(b);}
   for(const [i,text]of ['Voir','Répondre'].entries()){const a=document.createElement('div');a.tabIndex=0;a.style.cssText='position:absolute;left:45%;top:15px;font-size:24px';a.innerHTML='<svg width="32" height="32"><circle cx="16" cy="16" r="10"/></svg><span>'+text+'</span>';a.onclick=e=>{e.stopPropagation();window.actionTapped=text;};document.querySelectorAll('.row')[i].append(a);}
  });await frames(page);
  if(!baseline){const title=await page.locator('.csm-title').boundingBox();assert(Math.abs(title.x+title.width/2-width/2)<1,JSON.stringify(title));assert.equal(await page.locator('#control-snap-brand').count(),0);
  assert.equal(await page.locator('[data-control-snap-owned="search"] input').isVisible(),false);
  await page.getByRole('button',{name:'Rechercher',exact:true}).click();await page.getByRole('searchbox').fill('Camille');await page.locator('.csx-search-results button').waitFor();await page.getByRole('button',{name:'Annuler',exact:true}).click();
  await page.getByRole('button',{name:'Notifications',exact:true}).click();assert.deepEqual(await page.evaluate(()=>headerActions),['Notifications']);
  await page.screenshot({path:path.join(out,`snap-native-debug-${width}.png`)});
  for(const row of await page.locator('.row').all()){
   const n=await row.locator('[data-control-snap-name-line]').boundingBox(),a=await row.locator('[data-control-snap-avatar-slot]').boundingBox(),b=await row.boundingBox();assert(n&&a&&n.x>=a.x+a.width+8&&n.x+n.width<=width-50,JSON.stringify({n,a,b}));assert(b.height>=80&&b.height<=95);
  }
  const act=page.locator('[data-csm-action]').first(),ab=await act.boundingBox(),nb=await page.locator('.row').first().locator('[data-control-snap-name-line]').boundingBox();assert(ab&&nb,JSON.stringify({ab,nb,html:await act.evaluate(n=>n.outerHTML)}));assert(ab.x>=nb.x+nb.width&&ab.x+ab.width<=width);await act.click();assert.equal(await page.evaluate(()=>actionTapped),'Voir');
  await page.screenshot({path:path.join(out,`snap-native-chat-${width}.png`)});
  }
  await page.locator('.hit').nth(2).click();await page.waitForFunction(()=>document.documentElement.dataset.controlSnapView==='conversation');
  // Produce a real moving video entirely locally. No readyState/play mocks.
  await page.evaluate(async()=>{
   const canvas=document.createElement('canvas');canvas.width=240;canvas.height=320;const ctx=canvas.getContext('2d'),stream=canvas.captureStream(15),chunks=[];let tick=0;const paint=()=>{ctx.fillStyle=tick++%2?'#15c99a':'#6545f5';ctx.fillRect(0,0,240,320);ctx.fillStyle='#fff';ctx.fillRect(40+tick%60,100,80,80);};paint();const timer=setInterval(paint,60),recorder=new MediaRecorder(stream);recorder.ondataavailable=e=>chunks.push(e.data);const done=new Promise(r=>recorder.onstop=r);recorder.start();await new Promise(r=>setTimeout(r,700));recorder.stop();await done;clearInterval(timer);stream.getTracks().forEach(t=>t.stop());window.sampleVideo=URL.createObjectURL(new Blob(chunks,{type:recorder.mimeType}));window.samplePhoto=canvas.toDataURL();
   window.openNativeMedia=photo=>{const p=document.createElement('section');p.id='unlabelled-portal';p.style.cssText='position:fixed;inset:0;width:100vw;height:100dvh;z-index:99999;background:black';p.innerHTML='<header style="position:absolute;top:0;z-index:10;color:white">Média de test<button id="native-close">Fermer</button></header>'+(photo?'<img alt="Photo de test">':'<video playsinline muted loop></video>')+'<footer style="position:absolute;bottom:0;z-index:10"><textarea placeholder="Répondre au message"></textarea></footer>';const m=p.querySelector('img,video');m.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:contain';m.src=photo?samplePhoto:sampleVideo;p.querySelector('button').onclick=()=>p.remove();document.querySelector('.app').append(p);if(!photo)m.play().catch(e=>window.playFailure=e.name);};
   document.querySelector('#received').onclick=()=>openNativeMedia(false);
  });
  await page.locator('#received').click();await page.waitForFunction(()=>{const v=document.querySelector('#unlabelled-portal video');return v&&v.readyState>=2&&v.currentTime>0&&!v.paused;});await frames(page);
  assert.equal(await page.locator('#unlabelled-portal').getAttribute('data-control-snap-pane'),null,'Unknown portals must not become hidden panes');
  assert.equal(await page.locator('#unlabelled-portal video').evaluate(v=>{const b=v.getBoundingClientRect();return document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)===v;}),true,'Decoded media must be on top of its black background');
  await page.screenshot({path:path.join(out,`snap-native-video-${width}.png`)});await page.locator('#native-close').click();
  await page.evaluate(()=>document.querySelector('#received').onclick=()=>openNativeMedia(true));await page.locator('#received').click();await page.waitForFunction(()=>document.querySelector('#unlabelled-portal img')?.naturalWidth>0);await frames(page);
  assert.equal(await page.locator('#unlabelled-portal img').isVisible(),true);await page.locator('#native-close').click();assert.equal(await page.locator('html').getAttribute('data-control-snap-view'),'conversation');
  // The same unlabelled native portal may be mounted inside a transformed chat log.
  await page.evaluate(()=>{
   const original=openNativeMedia;window.openNativeMedia=photo=>{original(photo);const log=document.querySelector('.history');log.style.cssText='transform:translateZ(0);contain:paint;overflow:hidden;height:180px';log.append(document.querySelector('#unlabelled-portal'));};
   document.querySelector('#received').onclick=()=>openNativeMedia(false);
  });
  await page.locator('#received').click();await page.waitForFunction(()=>{const v=document.querySelector('#unlabelled-portal video');return v&&v.readyState>=2&&v.currentTime>0&&!v.paused;});await frames(page);
  assert.equal(await page.locator('#unlabelled-portal').getAttribute('data-csx-overlay'),'viewer',JSON.stringify(await page.locator('#unlabelled-portal').evaluate(n=>({attrs:n.getAttributeNames(),position:getComputedStyle(n).position,rect:n.getBoundingClientRect().toJSON(),ancestors:[...function*(x){while(x){yield [x.tagName,x.getAttributeNames()];x=x.parentElement;}}(n.parentElement)],marked:[...document.querySelectorAll('[data-csx-detected-viewer]')].map(x=>[x.id,x.className])}))));
  assert.equal(await page.locator('#unlabelled-portal video').evaluate(v=>{const b=v.getBoundingClientRect();return b.width>=innerWidth-1&&b.height>innerHeight/2&&document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)===v;}),true);
  await page.locator('#native-close').click();await frames(page);assert.equal(await page.locator('[data-csx-viewer-host]').count(),0);
  await page.getByRole('button',{name:'Back',exact:true}).click();await frames(page);assert.equal(await page.locator('html').getAttribute('data-control-snap-view'),'messages');assert.equal(await page.locator('.stage').isVisible(),false);
  assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await context.close();console.log('PASS compact header/native actions/search/grid + real decoded image/video portals, nested log and return',width,height);
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
