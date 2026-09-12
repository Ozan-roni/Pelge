/* Simulated mobile websites only. No real login, messages, microphone or social requests. */
const {chromium}=require(process.env.CONTROL_PLAYWRIGHT_MODULE || 'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../mobile/Control-iPhone.user.js'),'utf8');
const cases=[
 {name:'Instagram',host:'www.instagram.com',messages:'/direct/inbox/',login:'/accounts/login/',blocked:['/','/explore/','/reels/','/person/']},
 {name:'Facebook',host:'www.facebook.com',messages:'/messages/',login:'/login.php',blocked:['/','/watch/','/reels/','/groups/test/']},
 {name:'Reddit',host:'www.reddit.com',messages:'/message/inbox/',login:'/login/',blocked:['/','/r/popular/','/r/test/','/search/']},
 {name:'X / Twitter',host:'x.com',messages:'/messages',login:'/i/flow/login',blocked:['/','/home','/explore','/person/status/1']}
];
async function run(){
 const browser=await chromium.launch({channel:process.env.CONTROL_BROWSER_CHANNEL||undefined,headless:true});
 try{
  for(const app of cases){
   const errors=[],context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage();
   page.on('pageerror',error=>errors.push(error.message));
   await context.route('**/*',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;font:16px system-ui}nav a{display:inline-block;padding:12px}main{padding:20px}textarea{width:100%;min-height:60px}</style></head><body><nav><a id="feed" href="/">Feed</a><a id="messages" href="${app.messages}">Messages</a></nav><main><h1>Native app fixture</h1><p>Native conversation</p><video controls aria-label="Private attachment"></video><textarea aria-label="Message"></textarea><input aria-label="Username"></main></body></html>`}));
   await context.addInitScript({content:source});
   await page.goto(`https://${app.host}/`);
   await page.getByRole('heading',{name:'Le fil fait une pause.'}).waitFor();
   assert.equal(await page.locator('body').evaluate(e=>getComputedStyle(e).visibility),'hidden');
   await page.getByRole('link',{name:`Ouvrir les messages ${app.name}`,exact:true}).click();
   await page.getByRole('button',{name:'Ouvrir Control',exact:true}).waitFor();
   assert.equal(await page.locator('body').evaluate(e=>getComputedStyle(e).visibility),'visible');
   assert.equal(await page.locator('#feed').isVisible(),false);
   assert.equal(await page.locator('#messages').isVisible(),true);
   assert.equal(await page.locator('video').isVisible(),true);
   await page.getByRole('textbox',{name:'Message',exact:true}).fill('Unsent fixture text');
   await page.getByRole('button',{name:'Ouvrir Control',exact:true}).click();
   assert.equal(await page.getByRole('navigation',{name:'Choisir un réseau'}).getByRole('link').count(),4);
   await page.getByRole('button',{name:'Fermer Control',exact:true}).click();
   assert.equal(await page.getByRole('textbox',{name:'Message',exact:true}).inputValue(),'Unsent fixture text');
   // A history-only route change must be caught even without native DOM changes.
   for(const route of app.blocked){
    await page.evaluate(route=>history.pushState({},'',route),route);
    await page.getByRole('heading',{name:'Le fil fait une pause.'}).waitFor();
    assert.equal(await page.locator('body').evaluate(e=>getComputedStyle(e).visibility),'hidden');
   }
   await page.evaluate(route=>history.pushState({},'',route),app.login);
   await page.getByRole('button',{name:'Ouvrir Control',exact:true}).waitFor();
   await page.getByRole('textbox',{name:'Username',exact:true}).fill('Fixture account');
   await page.goBack();
   await page.getByRole('heading',{name:'Le fil fait une pause.'}).waitFor();
   await page.goto(`https://${app.host}${app.messages}?control=home`);
   await page.getByRole('heading',{name:'Tes conversations, simplement.'}).waitFor();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.getByRole('button',{name:'Fermer Control',exact:true}).click();
   assert.equal(await page.getByRole('textbox',{name:'Message',exact:true}).isVisible(),true);
   await page.addScriptTag({content:source});
   assert.equal(await page.locator('#control-iphone').count(),1,'Duplicate injection is harmless');
   assert.deepEqual(errors,[]);
   await context.close();console.log('PASS:',app.name,'mobile launcher, route gates, login, private media, native typing and back navigation');
  }
  const context=await browser.newContext({viewport:{width:320,height:640},reducedMotion:'reduce',colorScheme:'dark'}),page=await context.newPage();
  await context.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<html><body>Fixture</body></html>'}));
  await context.addInitScript({content:source});
  await page.goto('https://www.instagram.com/direct/inbox/?control=home');
  assert.equal(await page.getByRole('dialog').evaluate(e=>getComputedStyle(e).animationName),'none');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.goto('https://example.com/');assert.equal(await page.locator('#control-iphone').count(),0);
  await context.close();console.log('PASS: small viewport, reduced motion and unrelated-domain exclusion');
 }finally{await browser.close();}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
