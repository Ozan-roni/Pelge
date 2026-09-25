/* Synthetic regressions for nested viewers, decorative bubbles and native settings menus.
 * Does not access Snapchat accounts or prove Safari/native media decoding. */
const {chromium}=require(process.env.CONTROL_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {fixture,init,frames}=require('./check-snap-messages.cjs');
const root=path.resolve(__dirname,'..'),baseline=process.env.CONTROL_BASELINE==='1';
const source=baseline?execFileSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),'show','HEAD:mobile/Control-iPhone.user.js'],{cwd:root,encoding:'utf8'}):fs.readFileSync(path.join(root,'mobile/Control-iPhone.user.js'),'utf8');
const out=path.join(root,'build/iphone-verification');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:process.env.CONTROL_BROWSER_CHANNEL||undefined}),failures=[];
 const check=async(name,fn)=>{try{await fn();console.log('PASS',name);}catch(e){failures.push(name+': '+e.message);console.error('FAIL',name,e.message);}};
 try{for(const width of (baseline?[390]:[390,320,430])){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await context.route('**/*',r=>r.fulfill({contentType:'text/html',body:fixture}));await context.addInitScript({content:source});await page.goto('https://web.snapchat.com/');await page.evaluate(init);await page.locator('#control-native-loading').waitFor({state:'detached'});
  await page.evaluate(()=>{
   const bubble='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><path d="M10 10h40v35H20L10 55Z" fill="none" stroke="black"/></svg>';
   const rows=document.querySelectorAll('.row');rows[0].querySelector('.avatar').insertAdjacentHTML('afterbegin',bubble.replace('<svg ','<svg class="bubble" '));rows[1].querySelector('.avatar').insertAdjacentHTML('afterbegin',bubble);
   // Unlabelled light-grey SVG cloud, as well as labelled/white decorations.
   const cloud=rows[0].querySelector('.bubble');cloud.removeAttribute('class');cloud.querySelectorAll('path,circle,ellipse').forEach(n=>{n.setAttribute('fill','#f1f3f4');n.setAttribute('stroke','#444');});cloud.classList.add('neutral-shape');
  });await frames(page);
  await check('avatar decorations and front member '+width,async()=>{
   assert.equal(await page.locator('.row').first().locator('.neutral-shape').isVisible(),false);
   assert.equal(await page.locator('.row').first().locator('[data-control-snap-group]').count(),0);
   const single=page.locator('.row').first().locator('.portrait');
   assert.equal(await single.evaluate(n=>getComputedStyle(n).clipPath),'none');
   assert((await single.locator('img').boundingBox()).width>40);
   const group=page.locator('.row').nth(1);assert.equal(await group.locator('[data-control-snap-group="3"]').count(),1);assert.equal(await group.locator('.avatar > svg').isVisible(),false);
   const front=await group.locator('[data-control-snap-member="0"]').boundingBox(),rear=await group.locator('[data-control-snap-member="1"]').boundingBox();assert(front.width>rear.width&&front.y>rear.y,JSON.stringify({front,rear}));assert.equal(await page.locator('#control-snap-brand').count(),baseline?1:0);
  });
  await page.screenshot({path:path.join(out,`snap-surfaces-list-${width}${baseline?'-baseline':''}.png`)});
  await page.evaluate(()=>{
   const menu=document.createElement('div');menu.id='real-settings';menu.setAttribute('role','menu');
   const labels=['Thème Système','Désactiver les effets sonores','Centre d’aide','Publicités sur Snapchat','Signaler un problème','J’ai une suggestion','Paramètres du compte','Politique de confidentialité'];
   for(const label of labels){const row=document.createElement('div');row.setAttribute('role','listitem');const b=document.createElement('button');b.setAttribute('role','menuitem');b.style.cssText='height:110px;width:100%;font-size:24px';const img=document.createElement('img');img.src=document.querySelector('.avatar img').src;img.dataset.icon='native';b.append(img);const text=document.createElement('span');text.textContent=label;b.append(text);row.append(b);menu.append(row);}
   menu.querySelector('button').onclick=()=>window.settingClicks=(window.settingClicks||0)+1;document.querySelector('.contacts').append(menu);
  });await frames(page);
  await check('settings isolated and compact glass '+width,async()=>{
   const menu=page.locator('#real-settings');assert.equal(await menu.locator('[data-control-snap-row]').count(),0);assert.equal(await menu.locator('[data-csx-setting-row]').count(),8);
   const b=await menu.boundingBox();assert(b.x>=0&&b.x+b.width<=width+1&&b.height<750,JSON.stringify(b));assert.notEqual(await menu.evaluate(n=>getComputedStyle(n).backdropFilter),'none');
   assert.equal(await menu.locator('[data-csx-setting-row] [data-control-snap-owned] svg').count(),8);
   await menu.locator('button').first().click();assert.equal(await page.evaluate(()=>settingClicks),1);
  });
  await page.screenshot({path:path.join(out,`snap-surfaces-settings-${width}${baseline?'-baseline':''}.png`)});
  await page.emulateMedia({colorScheme:'dark'});await page.screenshot({path:path.join(out,`snap-surfaces-settings-dark-${width}${baseline?'-baseline':''}.png`)});await page.emulateMedia({colorScheme:'light'});
  await page.evaluate(()=>document.querySelector('#real-settings').remove());await frames(page);
  await page.locator('.hit').first().click();await page.waitForFunction(()=>document.querySelector('.stage').dataset.csxReady==='READY');
  await page.evaluate(()=>{
   document.querySelector('.history').style.cssText='transform:translateZ(0);contain:paint;overflow:hidden;height:180px';
   document.querySelector('#received').onclick=()=>{
    const d=document.createElement('div');d.id='adversarial-viewer';d.dataset.testid='media-viewer';d.style.cssText='position:fixed;inset:0;background:#111';
    d.innerHTML='<header><img class="avatar" width="32" height="32"><span>Expéditeur</span><button aria-label="Fermer">Fermer</button></header><video playsinline style="width:100%;height:75vh;background:#495d69"></video><div class="reactions"><button>♥</button><button>👍</button></div><textarea aria-label="Répondre au message" placeholder="Répondre au message"></textarea>';
    d.querySelector('img').src=document.querySelector('.avatar img').src;const v=d.querySelector('video');Object.defineProperty(v,'readyState',{get:()=>2});Object.defineProperty(v,'paused',{get:()=>false});v.onclick=()=>window.videoTaps=(window.videoTaps||0)+1;d.querySelector('[aria-label="Fermer"]').onclick=()=>d.remove();
    if(window.photoVariant){d.removeAttribute('data-testid');d.setAttribute('role','dialog');d.querySelector('button').removeAttribute('aria-label');const photo=document.createElement('img');photo.className='received-photo';photo.src=d.querySelector('img').src;photo.style.cssText='width:100%;height:75vh';v.replaceWith(photo);}
    document.querySelector('.history').append(d);
   };
  });
  await page.locator('#received').click();await frames(page);
  await check('one-tap nested viewer media and hit target '+width,async()=>{
   assert.equal(await page.locator('#adversarial-viewer video[data-csx-media]').count(),1);assert.equal(await page.locator('#adversarial-viewer header img[data-csx-media]').count(),0);
   const box=await page.locator('#adversarial-viewer').boundingBox();assert(box.y===0&&box.width>=width-1&&box.height>=843,JSON.stringify(box));assert.equal(await page.locator('.history').evaluate(n=>getComputedStyle(n).transform),'none');assert.equal(await page.locator('.history').evaluate(n=>getComputedStyle(n).contain),'none');
   const mediaBox=await page.locator('#adversarial-viewer video').boundingBox(),reactionBox=await page.locator('#adversarial-viewer .reactions').boundingBox();assert(mediaBox.y+mediaBox.height<=reactionBox.y,JSON.stringify({mediaBox,reactionBox}));
   await page.locator('#adversarial-viewer video').click({position:{x:width/2,y:250},timeout:2500});assert.equal(await page.evaluate(()=>videoTaps),1);
  });
  await page.screenshot({path:path.join(out,`snap-surfaces-viewer-${width}${baseline?'-baseline':''}.png`)});
  // Force is only allowed to clean up the intentionally broken old-version baseline.
  await page.locator('#adversarial-viewer [aria-label="Fermer"]').click({force:baseline});await frames(page);
  await check('viewer teardown restores conversation '+width,async()=>{assert.equal(await page.locator('[data-csx-viewer-host]').count(),0);assert.equal(await page.locator('html').getAttribute('data-control-snap-view'),'conversation');assert.notEqual(await page.locator('.history').evaluate(n=>getComputedStyle(n).transform),'none');assert.deepEqual(errors,[]);});
  if(!baseline){
   await page.evaluate(()=>window.photoVariant=true);await page.locator('#received').click();await frames(page);
   await check('native photo dialog without media test id '+width,async()=>{
    const photo=page.locator('.received-photo[data-csx-media]');await photo.waitFor({state:'visible'});const box=await photo.boundingBox();assert(box.width>=width-1&&box.y>=60&&box.y+box.height<760,JSON.stringify(box));assert.equal(await page.locator('#adversarial-viewer header img[data-csx-media]').count(),0);
    const reactions=await page.locator('#adversarial-viewer .reactions').boundingBox(),reply=await page.locator('#adversarial-viewer textarea').boundingBox();assert(reactions.y>=box.y+box.height&&reactions.y+reactions.height<=reply.y);
    await page.locator('#adversarial-viewer button').filter({hasText:'Fermer'}).click();await frames(page);assert.equal(await page.locator('[data-csx-viewer-host]').count(),0);assert.equal(await page.locator('html').getAttribute('data-control-snap-view'),'conversation');
   });
  }
  await context.close();
 }}finally{await browser.close();}
 assert.deepEqual(failures,[]);
})().catch(e=>{console.error(e);process.exitCode=1;});
