/* Reconstructed cases from the supplied screenshots, not authenticated Snapchat DOM. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.CONTROL_PLAYWRIGHT_MODULE||'playwright');
const {fixture,init,frames}=require('./check-snap-messages.cjs');
const source=fs.readFileSync(path.join(__dirname,'../mobile/Control-iPhone.user.js'),'utf8');
const out=path.join(__dirname,'../build/iphone-verification');fs.mkdirSync(out,{recursive:true});
const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="24" fill="#222"/><circle cx="24" cy="17" r="10" fill="#888"/><path d="M7 47a17 17 0 0 1 34 0" fill="#888"/></svg>';
const html=fixture.replace('<section class="contacts"','<aside class="native-account" style="min-height:100px;margin:20px 0"><div id="account-hit">'+svg+'</div></aside><section class="contacts"');
(async()=>{const browser=await chromium.launch({channel:process.env.CONTROL_BROWSER_CHANNEL||undefined});try{for(const width of [320,390,430]){
 const ctx=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await ctx.route('**/*',r=>r.fulfill({contentType:'text/html',body:html}));await ctx.addInitScript({content:source});await page.goto('https://web.snapchat.com/');await page.evaluate(init);
 await page.evaluate(()=>{
  window.nativeEvents={down:0,settings:0,snap:0,hangup:0};
  const account=document.querySelector('#account-hit');
  account.onpointerdown=e=>{if(e.isTrusted)nativeEvents.down++};
  account.onclick=e=>{if(!e.isTrusted)return;nativeEvents.settings++;const menu=document.createElement('div');menu.id='native-settings-menu';menu.setAttribute('role','menu');menu.innerHTML='<button role="menuitem">Mon compte</button><button role="menuitem">Confidentialité</button><button id="close-settings">Fermer</button>';menu.querySelector('#close-settings').onclick=()=>menu.remove();account.parentElement.append(menu);};
  const row=document.querySelector('.row'),wrap=document.createElement('div');wrap.className='icon-and-caption';wrap.style.cssText='position:absolute;left:200px;top:8px';wrap.innerHTML='<button class="received-native">■</button><b>Voir</b>';wrap.querySelector('button').onclick=e=>{e.stopPropagation();nativeEvents.snap++;const viewer=document.createElement('div');viewer.id='viewer';viewer.dataset.testid='media-viewer';viewer.setAttribute('role','dialog');viewer.innerHTML='<img alt="Snap"><button id="close-snap">Fermer</button>';viewer.querySelector('img').src=row.querySelector('.avatar img').src;viewer.querySelector('button').onclick=()=>viewer.remove();document.body.append(viewer);};row.append(wrap);
  row.querySelector('h3').innerHTML='<strong>Camille</strong>';
 });
 await page.locator('#control-native-loading').waitFor({state:'detached'});await frames(page);
 const bar=await page.locator('[data-control-snap-owned="mobile-toolbar"]').boundingBox(),row=await page.locator('.row').first().boundingBox();assert(row.y-bar.y-bar.height<=21,JSON.stringify({bar,row}));
 const hit=page.locator('[data-csm-settings-trigger]');assert.equal(await hit.count(),1);assert.equal(await hit.evaluate(n=>n.tagName.toLowerCase()),'svg');
 const gear=await page.locator('[data-csm-settings-face]').boundingBox(),native=await hit.boundingBox();assert.equal(native.width,40);assert.equal(native.height,40);assert.equal(native.x,gear.x);assert.equal(native.y,gear.y);
 await page.touchscreen.tap(gear.x+20,gear.y+20);await page.locator('#native-settings-menu').waitFor();assert.deepEqual(await page.evaluate(()=>[nativeEvents.down,nativeEvents.settings]),[1,1],'Native control must receive the trusted pointer and click');
 await page.locator('#close-settings').click();await frames(page);await page.touchscreen.tap(gear.x+20,gear.y+20);await page.locator('#native-settings-menu').waitFor();assert.equal(await page.evaluate(()=>nativeEvents.settings),2,'Repeated opening preserves the native SVG control');await page.locator('#close-settings').click();
 assert.equal(await page.locator('.row h3 strong').first().evaluate(n=>getComputedStyle(n).fontWeight),'400');
 await page.waitForFunction(()=>document.querySelector('.received-native').hasAttribute('data-csm-action'));
 assert.equal(await page.locator('.icon-and-caption b').isVisible(),false,'The external Voir caption must not overlap the name');
 const status=await page.locator('[data-control-snap-owned="status"]').first().boundingBox();await page.touchscreen.tap(status.x+60,status.y+9);await page.locator('#viewer[data-csx-overlay]').waitFor();assert.equal(await page.evaluate(()=>nativeEvents.snap),1);await page.locator('#close-snap').click();
 await page.screenshot({path:path.join(out,`snap-native-controls-${width}.png`),animations:'disabled'});
 await page.evaluate(()=>{const call=document.createElement('section');call.id='test-call';call.dataset.testid='call-panel';call.setAttribute('role','dialog');call.innerHTML='<header><button id="native-hangup" aria-label="Raccrocher" style="width:90px;height:42px;padding:12px 30px;border-radius:100px"><svg viewBox="0 0 24 24"><path d="M3 12h18"/></svg><span>Raccrocher</span></button></header><video muted></video>';document.body.append(call);call.querySelector('button').onclick=()=>{nativeEvents.hangup++;call.remove();};});
 await page.locator('[data-csx-hangup]').waitFor();await frames(page);const end=page.locator('#native-hangup'),size=await end.boundingBox(),graphic=await end.locator('[data-control-snap-owned="semantic-icon"]').boundingBox();assert.equal(size.width,44);assert.equal(size.height,44);assert(Math.abs(graphic.x+graphic.width/2-size.x-size.width/2)<1);assert(Math.abs(graphic.y+graphic.height/2-size.y-size.height/2)<1);
 await page.screenshot({path:path.join(out,`snap-square-hangup-${width}.png`),animations:'disabled'});await end.click();assert.equal(await page.evaluate(()=>nativeEvents.hangup),1);
 assert.deepEqual(errors,[]);await ctx.close();console.log('PASS SVG account outside list, trusted native settings, symbolic Voir, inherited typography, square native hangup',width);
}}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
