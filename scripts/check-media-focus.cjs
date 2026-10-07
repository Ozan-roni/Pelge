/* Isolated browser regressions. All requests are intercepted; camera pixels are
 * generated locally, and no account, device camera or private message is used. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.CONTROL_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'build/media-focus');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const iphone=read('mobile/Control-iPhone.user.js');
const baselineRoot=process.env.CONTROL_MEDIA_BASELINE_ROOT;
const runtimeRead=p=>baselineRoot?fs.readFileSync(path.join(baselineRoot,p),'utf8'):read(p);
const frames=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
const media=`<main><a id="back" href="/direct/inbox/">Retour</a><div id="scroller" style="height:500px;overflow-y:auto;scroll-snap-type:y mandatory"><article style="height:500px"><video id="chosen" controls style="width:100%;height:360px;background:#435286"></video><textarea aria-label="Commentaire"></textarea></article><article id="extra" style="height:500px"><video style="width:100%;height:360px;background:#96522b"></video></article><div style="height:2000px"></div></div><button aria-label="Next reel">Next</button></main>`;
const fixture=`<!doctype html><meta name="viewport" content="width=device-width"><style>body{margin:0;font:16px system-ui}article{scroll-snap-align:start}[data-control-filter-hidden="true"]{display:none!important}</style><main><a id="open" href="/reel/Chosen/">Vidéo choisie</a><div style="height:2400px"></div></main><script>window.nativeContinuation=0;document.addEventListener('wheel',()=>nativeContinuation++,true);document.addEventListener('touchmove',()=>nativeContinuation++,true);</script>`;
async function instagram(browser,edition,width){
 const context=await browser.newContext({viewport:{width,height:844},hasTouch:true,isMobile:width<700}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/*',r=>r.fulfill({contentType:'text/html',body:fixture}));
 if(edition==='iphone')await context.addInitScript({content:baselineRoot?runtimeRead('mobile/Control-iPhone.user.js'):iphone});
 await page.goto('https://www.instagram.com/'+(edition==='iphone'?'direct/inbox/':'person/'));
 if(edition==='extension'){
  await page.evaluate(()=>{window.chrome={storage:{sync:{get:async()=>({Rules:{Instagram:{Enabled:true,DMsOnly:false,Reels:true,SearchScrollLock:true}}})},onChanged:{addListener:fn=>window.ruleChanged=fn}}};});
  await page.addStyleTag({content:runtimeRead('dist/styles/ContentFilter.css')});
  await page.addScriptTag({content:runtimeRead('dist/scripts/ContentFilter.js')});
  await page.evaluate(()=>document.querySelector('#open').addEventListener('click',e=>{e.preventDefault();history.pushState({},'','/reel/Chosen/');}));
 }else await page.evaluate(html=>document.querySelector('#open').addEventListener('click',e=>{e.preventDefault();history.pushState({},'','/reel/Chosen/');document.querySelector('main').outerHTML=html;}),media);
 await page.locator('#open').click();
 if(edition==='extension')await page.evaluate(html=>document.querySelector('main').outerHTML=html,media);
 await page.evaluate(()=>{const previous=document.createElement('article');previous.id='preloaded';previous.style.cssText='position:absolute;top:-600px;width:100%;height:400px';previous.innerHTML='<video style="width:100%;height:400px"></video>';document.querySelector('#scroller').prepend(previous);});
 const marker=edition==='iphone'?'data-control-single-media':'data-control-ig-single-media';
 if(!baselineRoot)await page.waitForFunction(attr=>document.documentElement.hasAttribute(attr),marker);
 await frames(page);
 assert.equal(await page.locator('#chosen').isVisible(),true);
 assert.equal(await page.locator('#preloaded').isVisible(),false,'Offscreen preloaded video must not replace the selected player');
 assert.equal(await page.locator('#extra').isVisible(),false,JSON.stringify(await page.evaluate(()=>({path:location.pathname,chosen:sessionStorage.getItem('ControlInstagramChosenProfileMedia'),blocker:document.querySelector('#ControlRouteBlocker')?.textContent,extra:document.querySelector('#extra')?.outerHTML,scroll:document.querySelector('#scroller')?.getAttributeNames()}))));
 assert.equal(await page.locator('[aria-label="Next reel"]').isVisible(),false);
 assert.equal(await page.locator('#scroller').evaluate(n=>getComputedStyle(n).overflowY),'hidden');
 // Exercise the browser's actual wheel default action, plus capture listeners that
 // Instagram registered before Control. A document-level listener is too late.
 await page.locator('#chosen').hover();await page.mouse.wheel(0,600);await frames(page);
 assert.equal(await page.locator('#scroller').evaluate(n=>n.scrollTop),0);
 for(const type of ['wheel','touchmove'])assert.equal(await page.locator('textarea').evaluate((n,type)=>n.dispatchEvent(new Event(type,{bubbles:true,cancelable:true})),type),false);
 assert.equal(await page.evaluate(()=>nativeContinuation),0);
 for(const key of ['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '])assert.equal(await page.evaluate(key=>document.body.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true})),key),false);
 assert.equal(await page.locator('textarea').evaluate(n=>n.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true}))),true);
 await page.locator('textarea').fill('Texte local uniquement');
 // React may add a new nested scroll container after the first rendering pass.
 await page.evaluate(()=>{const box=document.createElement('div');box.id='late';box.style.cssText='overflow-y:auto;height:40px';box.innerHTML='<div style="height:500px"></div>';document.querySelector('main').append(box);});
 await page.waitForFunction(()=>getComputedStyle(document.querySelector('#late')).overflowY==='hidden');
 await page.screenshot({path:path.join(out,`instagram-${edition}-${width}.png`)});
 if(edition==='extension'){
  await page.evaluate(()=>ruleChanged({Rules:{newValue:{Instagram:{Enabled:false}}}},'sync'));await frames(page);
  assert.equal(await page.locator('html').getAttribute(marker),null);
  assert.equal(await page.locator('#scroller').evaluate(n=>getComputedStyle(n).overflowY),'auto');
  assert.equal(await page.locator('#extra').isVisible(),true);
 }
 await page.evaluate(()=>{history.pushState({},'','/direct/inbox/');document.querySelector('#extra')?.remove();document.querySelector('#chosen')?.remove();});await frames(page);
 await page.waitForFunction(attr=>!document.documentElement.hasAttribute(attr),marker);
 assert.equal(await page.locator('#scroller').evaluate(n=>getComputedStyle(n).overflowY),'auto');
 assert.equal(await page.evaluate(()=>document.body.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY:100}))),true);
 assert.deepEqual(errors,[]);await context.close();console.log('PASS Instagram',edition,width,'chosen video, native scroll interception, nested/late scrollers, keyboard, editing, return');
}
async function snapchat(browser,width,height,messagesOnly){
 const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/*',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width"><style>body{margin:0;background:#101010}#camera{height:100dvh;width:100vw;position:relative}video{width:100%;height:100%;object-fit:cover}button{position:absolute;bottom:16px;left:16px;z-index:2;padding:16px}</style><section id="camera" data-testid="camera-panel"><video playsinline muted autoplay></video><button>Capture native</button></section>'}));
 await page.goto('https://web.snapchat.com/');
 if(messagesOnly)await page.evaluate(()=>{document.querySelector('#camera').dataset.testid='conversation-panel';const input=document.createElement('textarea');input.setAttribute('aria-label','Message');document.querySelector('#camera').append(input);});
 await page.evaluate(()=>{
  const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#32c6a2';ctx.fillRect(0,0,640,480);ctx.strokeStyle='#fff';ctx.lineWidth=12;ctx.strokeRect(6,6,628,468);ctx.fillStyle='#fff';ctx.font='36px sans-serif';ctx.fillText('CADRAGE COMPLET',120,240);
  window.stream=canvas.captureStream(10);const track=stream.getVideoTracks()[0];window.originalConstraints=track.getConstraints();window.constraintWrites=0;window.facing='user';
  const settings=track.getSettings.bind(track);track.getSettings=()=>({...settings(),facingMode:facing});const apply=track.applyConstraints.bind(track);track.applyConstraints=(...args)=>{constraintWrites++;return apply(...args);};
  document.querySelector('video').srcObject=stream;window.nativeCaptures=0;document.querySelector('button').onclick=()=>nativeCaptures++;
 });
 await page.addScriptTag({content:runtimeRead('dist/scripts/SnapchatEssentialUI.js')});
 await page.evaluate(messagesOnly=>{window.presentation=ControlSnapEssentialUI.create({messagesOnly,selectors:{viewer:'[data-testid="snap-viewer"]',call:'[data-testid="call-view"]',conversation:'[data-testid="conversation-panel"]',log:'[role="log"]',contacts:'[aria-label="Conversations"]'}});presentation.refresh();},messagesOnly);
 await page.waitForFunction(()=>document.querySelector('video').readyState>=2);
 assert.equal(await page.locator('video').evaluate(v=>getComputedStyle(v).objectFit),'contain');
 assert.equal(await page.evaluate(()=>constraintWrites),0,'Control must preserve native camera constraints and zoom');
 assert.equal(await page.evaluate(()=>JSON.stringify(stream.getVideoTracks()[0].getConstraints())===JSON.stringify(originalConstraints)),true);
 const size=await page.locator('video').boundingBox();assert(size.width<=width&&size.height<=height);
 await page.screenshot({path:path.join(out,`snap-camera-${width}x${height}-${messagesOnly}.png`)});
 await page.locator('button').click();assert.equal(await page.evaluate(()=>nativeCaptures),1);
 await page.evaluate(()=>{facing='environment';presentation.refresh();});
 assert.equal(await page.locator('video').evaluate(v=>getComputedStyle(v).transform),'none');
 await page.evaluate(()=>{facing='user';document.querySelector('video').style.transform='scaleX(-1)';presentation.refresh();});
 assert.equal(await page.locator('video').getAttribute('data-csx-mirror'),null,'A native mirror must not be applied twice');
 await page.evaluate(()=>{presentation.dispose();stream.getTracks().forEach(t=>t.stop());});
 assert.equal(await page.locator('[data-csx-camera-media]').count(),0);assert.equal(await page.evaluate(()=>constraintWrites),0);
 assert.deepEqual(errors,[]);await context.close();console.log('PASS Snapchat',width,height,'messagesOnly:',messagesOnly,'complete camera ratio, unchanged stream, native shutter, front/rear switch, cleanup');
}
(async()=>{fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({channel:process.env.CONTROL_BROWSER_CHANNEL||undefined});try{
 for(const edition of ['extension','iphone'])for(const width of [390,1280])await instagram(browser,edition,width);
 for(const [width,height]of [[320,740],[390,844],[430,932],[844,390]])for(const messagesOnly of [false,true])await snapchat(browser,width,height,messagesOnly);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
