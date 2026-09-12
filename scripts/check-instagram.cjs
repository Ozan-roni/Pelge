/* Isolated DOM fixture: all Instagram requests are intercepted; no account or messages are accessed. */
const {chromium}=require(process.env.CONTROL_PLAYWRIGHT_MODULE || 'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'build/instagram-verification');
fs.mkdirSync(out,{recursive:true});
const source=name=>fs.readFileSync(path.join(root,'dist',name),'utf8');
const styles=['ContentFilter.css','ContentFilterExtended.css','ControlFeedback.css','InstagramVisuals.css'].map(f=>source('styles/'+f)).join('\n');
const avatar='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56"><rect width="56" height="56" rx="28" fill="#987fb5"/></svg>');
const fixture=`<nav aria-label="Instagram"><strong>Instagram</strong><a href="/">Home</a><a href="/explore/">Search</a><a href="/direct/inbox/">Messages</a><a href="/profile/">Profile</a></nav><main><section class="inbox"><header><h2>Conversations</h2><button aria-label="New message">＋</button></header><div class="notes"><button aria-label="Your note"><img src="${avatar}" alt=""><span>Your note</span></button><button aria-label="Friend note"><img src="${avatar}" alt=""><span>A little break</span></button></div><h3>Messages</h3><a class="thread" href="/direct/t/test/"><img src="${avatar}" alt=""><div>Sample conversation<small>Design preview · no real messages</small></div></a></section><section class="conversation"><header><h2>Sample conversation</h2><button aria-label="Call">Call</button></header><div role="log"><div class="bubble" role="button">A note about music</div><div class="bubble sent">Native message appearance</div></div><footer class="composer"><div contenteditable="true" role="textbox" aria-label="Message" data-placeholder="Message…"></div><button aria-label="Send">Send</button></footer></section></main>`;
const base=`*{box-sizing:border-box}body{margin:0;font:14px system-ui;background:rgb(var(--ig-primary-background));color:var(--native-text)}nav{position:fixed;inset:0 auto 0 0;width:200px;display:flex;flex-direction:column;gap:16px;padding:24px}nav a{padding:14px;color:inherit;text-decoration:none}main{margin-left:200px;display:flex;height:100vh}button{font:inherit;color:inherit;cursor:pointer}.inbox{width:340px;flex-shrink:0;border-right:1px solid #8883}header{height:80px;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #8883}header button{border:0;background:none}h2{font-size:18px}h3{padding:0 24px}.notes{height:150px;display:flex;gap:22px;padding:20px}.notes button{width:85px;display:flex;flex-direction:column;align-items:center;gap:8px;background:none;border:0}.notes img,.thread img{width:56px;height:56px;border-radius:50%}.thread{display:flex;gap:14px;padding:18px 24px;color:inherit;text-decoration:none}.thread small{display:block;margin-top:8px;color:#888}.conversation{flex:1;min-width:0;display:flex;flex-direction:column}.conversation [role=log]{flex:1;padding:32px;display:flex;flex-direction:column;justify-content:flex-end;gap:20px}.bubble{background:rgb(70,70,75);color:white;padding:16px;border-radius:20px;width:fit-content}.sent{align-self:flex-end;background:rgb(88,63,190)}.composer{display:flex;align-items:center;border:1px solid #8885;border-radius:24px;margin:20px;padding:12px 18px;gap:16px}.composer [contenteditable]{flex:1;background:transparent;border:0;outline:none;min-height:24px}.composer button{background:transparent;border:0;color:#a48ff8}@media(max-width:700px){nav{display:none}main{margin-left:0}.inbox{width:100%;border:0}.conversation{display:none}}`;
async function run(){
 const browser=await chromium.launch({channel:process.env.CONTROL_BROWSER_CHANNEL||undefined,headless:true});
 try {
  for(const theme of ['dark','light']) {
   const context=await browser.newContext({viewport:{width:1280,height:850}}), page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.pathname.startsWith('/assets/'))return route.fulfill({body:fs.readFileSync(path.join(root,'dist',url.pathname)),contentType:url.pathname.endsWith('.svg')?'image/svg+xml':'image/png'});
    return route.fulfill({contentType:'text/html',body:`<!doctype html><html style="--ig-primary-background:${theme==='dark'?'0,0,0':'255,255,255'};--native-text:${theme==='dark'?'#fafafa':'#242424'}"><head><style>${base}\n${styles}</style></head><body></body></html>`});
   });
   await page.goto('https://www.instagram.com/direct/inbox/');
   await page.evaluate(()=>{
    window.ruleListeners=[];
    window.testRules={SchemaVersion:14,ShowUsageTimer:false,Instagram:{Enabled:true,DMsOnly:false,Search:true,Stories:false,DailyLimitMinutes:0}};
    window.chrome={runtime:{getURL:p=>location.origin+'/'+p},storage:{sync:{get:async()=>({Rules:window.testRules})},onChanged:{addListener:fn=>window.ruleListeners.push(fn)}}};
   });
   await page.addScriptTag({content:source('scripts/InstagramVisuals.js')});
   await page.addScriptTag({content:source('scripts/ContentFilter.js')});
   await page.addScriptTag({content:source('scripts/ExtendedFilters.js')});
   await page.locator('#ControlInstagramLoading').waitFor();
   assert.equal(await page.locator('#ControlInstagramLoading').getAttribute('data-theme'),theme);
   assert.equal(await page.locator('body').evaluate(e=>getComputedStyle(e).opacity),'0');
   await page.screenshot({path:path.join(out,`loading-${theme}.png`),animations:'disabled'});
   await page.evaluate(html=>document.body.innerHTML=html,fixture);
   await page.waitForFunction(()=>document.documentElement.dataset.controlIgLoading==='revealing');
   const fade=await page.evaluate(()=>{
    const animation=document.body.getAnimations().find(a=>a.animationName==='ControlIgAppReveal');
    animation.pause();animation.currentTime=320;
    const opacity=Number(getComputedStyle(document.body).opacity);
    animation.play();return opacity;
   });
   assert(fade>0 && fade<1,'The entire app must fade through an intermediate opacity');
   await page.locator('#ControlInstagramLoading').waitFor({state:'detached'});
   assert.equal(await page.locator('body').evaluate(e=>getComputedStyle(e).opacity),'1');
   assert.equal(await page.locator('html').getAttribute('data-control-ig-loading'),null);
   await page.locator('[data-control-ig-notes]').waitFor();
   // Reproduce the nested grey pill from the reported screenshot.
   await page.locator('[contenteditable]').evaluate(e=>{e.style.background='rgb(31,32,37)';e.style.border='1px solid rgb(54,54,58)';e.style.borderRadius='18px';});
   const report=await page.evaluate(()=>{
    const notes=document.querySelector('.notes'),dock=document.querySelector('#ControlInstagramMobileFeatureDock'),bubble=document.querySelector('.bubble'),field=document.querySelector('[contenteditable]');
    return {nativeBubble:getComputedStyle(bubble).backgroundColor,fieldBackground:getComputedStyle(field).backgroundColor,fieldBorder:getComputedStyle(field).borderTopWidth,notesShadow:getComputedStyle(notes).boxShadow,notesTop:notes.getBoundingClientRect().top,dockBottom:dock.getBoundingClientRect().bottom,dockPosition:getComputedStyle(dock).position,toolMarkers:document.querySelectorAll('[data-control-ig-direct-tool]').length,light:document.documentElement.classList.contains('ControlInstagramLight')};
   });
   assert.equal(report.nativeBubble,'rgb(70, 70, 75)');assert.equal(report.fieldBackground,'rgba(0, 0, 0, 0)');assert.equal(report.fieldBorder,'0px');assert.equal(report.notesShadow,'none');
   assert.equal(report.dockPosition,'relative');assert(report.notesTop>=report.dockBottom-1);assert.equal(report.toolMarkers,0);assert.equal(report.light,theme==='light');
   assert.equal(await page.locator('.composer').evaluate(e=>getComputedStyle(e).borderTopWidth),'1px','Preserve the outer composer frame');
   for (const width of [1024,1280,1440]) {
    await page.setViewportSize({width,height:850});
    const geometry=await page.evaluate(()=>({railRight:document.querySelector('nav').getBoundingClientRect().right,mainLeft:document.querySelector('main').getBoundingClientRect().left,overflow:document.documentElement.scrollWidth>innerWidth,notesLeft:document.querySelector('.notes').getBoundingClientRect().left}));
    assert(geometry.mainLeft>=geometry.railRight-1,'Inbox must clear the navigation rail');
    assert(geometry.notesLeft>=geometry.railRight-1,'Notes must clear the navigation rail');
    assert.equal(geometry.overflow,false,'No horizontal page overflow');
   }
   await page.setViewportSize({width:1280,height:850});
   await page.getByRole('textbox',{name:'Message',exact:true}).fill('Unsent fixture text');
   await page.evaluate(()=>{history.pushState({},'','/direct/t/test/');ScheduleFilters();});
   assert.equal(await page.locator('#ControlInstagramLoading').count(),0);
   await page.screenshot({path:path.join(out,`messages-${theme}.png`)});
   await page.setViewportSize({width:390,height:844});
   await page.waitForFunction(()=>!document.documentElement.classList.contains('ControlInstagramPolished'));
   assert.equal(await page.locator('#ControlInstagramMobileFeatureDock,[data-control-ig-notes]').count(),0);
   await page.setViewportSize({width:1280,height:850});
   await page.locator('[data-control-ig-notes]').waitFor();
   await page.evaluate(()=>{document.querySelector('.notes').remove();ScheduleFilters();});
   await page.waitForFunction(()=>document.querySelector('#ControlInstagramMobileFeatureDock')?.hidden);
   await page.evaluate(()=>{window.testRules.Instagram.Enabled=false;window.ruleListeners.forEach(fn=>fn({Rules:{newValue:window.testRules}},'sync'));});
   await page.waitForFunction(()=>!document.documentElement.classList.contains('ControlInstagramPolished'));
   assert.equal(await page.locator('[data-control-ig-notes],#ControlInstagramLoading,#ControlInstagramMobileFeatureDock').count(),0);
   assert.equal(await page.locator('[contenteditable]').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(31, 32, 37)','Restore the original field when Control is disabled');
   assert.deepEqual(errors,[]);console.log('PASS:',theme,'messaging surfaces, notes alignment, no splash replay, native composer and disable cleanup');
   await context.close();
  }
  const context=await browser.newContext({reducedMotion:'reduce',viewport:{width:390,height:844}}),page=await context.newPage();
  await context.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<html><body></body></html>'}));
  await page.goto('https://www.instagram.com/direct/inbox/');
  await page.evaluate(()=>window.chrome={runtime:{getURL:()=> 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>'}});
  await page.addStyleTag({content:styles});await page.addScriptTag({content:source('scripts/InstagramVisuals.js')});
  await page.evaluate(()=>ControlInstagramVisuals.update({enabled:true}));
  assert.equal(await page.locator('#ControlInstagramLoading').evaluate(e=>getComputedStyle(e).animationName),'none');
  await page.evaluate(()=>ControlInstagramVisuals.update({enabled:false}));assert.equal(await page.locator('#ControlInstagramLoading').count(),0);
  assert.equal(await page.locator('body').evaluate(e=>getComputedStyle(e).opacity),'1');
  await context.close();console.log('PASS: reduced motion and immediate loader cleanup');
 } finally {await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
