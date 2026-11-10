// Regression test for the Snapchat mobile layer (mobile/runtime/SnapchatLite.js inside the userscript).
// The fixture reproduces the structure read on the real Snapchat Web (November 2026): a grid with the
// conversation rail (#root nav, names present but hidden) and one large pane; the address is
// /web/<id> while a conversation is open. Touch input is real (CDP touch points).
const path = require('path');
const { chromium, devices } = require('playwright');
const userscript = path.join(__dirname, '..', 'mobile', 'Control-iPhone.user.js');
const id = 'bda2f1aa-5071-4b93-b4b6-ca804c5a0043';
const fixture = `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Snapchat</title>
<style>body{margin:8px;background:#111;color:#ddd;font:16px sans-serif}.shell{position:absolute;inset:0;display:grid;grid-template-columns:82px 1fr}
.rail{display:flex;flex-direction:column}.head{display:flex;height:61px;padding:12px;box-sizing:border-box}.new{position:absolute;right:-18px;top:12px}
nav{flex:1;overflow-y:auto}.row{display:flex;align-items:center;height:74px;padding:0 12px}.avatar{width:58px;height:58px;border-radius:50%;background:#444;flex:none}
.text{display:none}.pane{position:relative;overflow:hidden}.bg{position:absolute;inset:10px;width:calc(100% - 20px);height:calc(100% - 20px)}
.top{display:flex;gap:8px;height:60px;align-items:center}ul{height:300px;overflow-y:auto;margin:0}li{height:60px}</style>
<body><main id="root"><div class="shell"><div class="fixed" style="position:fixed;height:0;width:100%"></div>
<div class="rail"><div class="head"><button id="me">me</button><div class="new"><button title="New Chat">+</button></div></div>
<nav><div role="list">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => `<div role="listitem"><div role="button" tabindex="0" class="row" data-i="${i}"><div class="avatar"></div><div class="text"><span id="title-${i}">Contact ${i}</span><span id="status-${i}">Opened</span></div></div></div>`).join('')}</div></nav></div>
<div class="pane" id="pane"></div></div></main>
<script>
const pane=document.getElementById('pane');
function render(){
  if(/^\\/web\\/[0-9a-f-]{20,}/.test(location.pathname))pane.innerHTML='<div class="top"><button title="Close Chat" id="close">&lt;</button><b>Contact</b><button title="Open Spotlight" id="spot">S</button></div><ul>'+Array.from({length:40},(_,i)=>'<li>message '+i+'</li>').join('')+'</ul><div role="textbox" contenteditable="true">Send a chat</div>';
  else pane.innerHTML='<img class="bg" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="><button id="shutter">Click the Camera to send Snaps</button>';
}
document.addEventListener('click',e=>{
  if(e.target.closest('.row')){history.pushState(null,'','/web/${id}');render();}
  if(e.target.closest('#close')){history.pushState(null,'','/web');render();}
});
render();
</script></body>`;
const results = [];
const check = (name, ok, detail = '') => { results.push(ok); console.log((ok ? 'ok   ' : 'FAIL ') + name + (detail ? '  ' + detail : '')); };

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ ...devices['iPhone 14'] });
  await context.addInitScript({ path: userscript });
  await context.route('**/*', route => route.request().resourceType() === 'document' ? route.fulfill({ contentType: 'text/html', body: fixture }) : route.fulfill({ status: 204, body: '' }));
  const page = await context.newPage();
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.goto('https://www.snapchat.com/web/'); await page.waitForTimeout(900);
  const cdp = await context.newCDPSession(page);
  const touch = (type, touchPoints) => Promise.race([cdp.send('Input.dispatchTouchEvent', { type, touchPoints }).catch(() => {}), new Promise(done => setTimeout(done, 400))]);
  const swipeRight = async () => { await touch('touchStart', [{ x: 40, y: 400 }]); for (let x = 60; x <= 330; x += 30) { await touch('touchMove', [{ x, y: 402 }]); await page.waitForTimeout(16); } await touch('touchEnd', []); };
  const swipeUp = async () => { await touch('touchStart', [{ x: 195, y: 300 }]); for (let y = 280; y >= 120; y -= 40) { await touch('touchMove', [{ x: 195, y }]); await page.waitForTimeout(16); } await touch('touchEnd', []); };
  const state = () => page.evaluate(() => {
    const box = s => { const n = document.querySelector(s); if (!n) return null; const r = n.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.width)]; };
    return { view: document.documentElement.getAttribute('data-cs'), path: location.pathname, side: box('.rail'), pane: box('#pane'),
      name: getComputedStyle(document.querySelector('.text')).display, bg: document.querySelector('.bg') ? getComputedStyle(document.querySelector('.bg')).display : 'gone',
      spot: document.querySelector('#spot') ? getComputedStyle(document.querySelector('#spot')).display : 'gone', newX: Math.round(document.querySelector('.new').getBoundingClientRect().right),
      log: Math.round(document.querySelector('ul')?.scrollTop || 0), cam: getComputedStyle(document.getElementById('control-snap-camera')).display, w: innerWidth };
  });

  let s = await state();
  check('list: full-width conversations', s.view === 'list' && s.side[0] === 0 && s.side[1] === s.w && s.pane[0] >= s.w, JSON.stringify(s));
  check('list: names shown', s.name === 'flex');
  check('list: decorative photo removed', s.bg === 'none');
  check('list: new-chat button inside the screen', s.newX <= s.w, 'right=' + s.newX);
  await page.tap('.row[data-i="2"]'); await page.waitForTimeout(900);
  s = await state();
  check('tap: conversation slides in', s.view === 'chat' && s.pane[0] === 0 && s.pane[1] === s.w && s.side[0] < 0, JSON.stringify(s));
  check('conversation: Spotlight hidden', s.spot === 'none');
  await swipeUp(); await page.waitForTimeout(300);
  s = await state();
  check('conversation: messages scroll, screen stays', s.log > 40 && s.view === 'chat', 'scrollTop=' + s.log);
  await swipeRight(); await page.waitForTimeout(1300);
  s = await state();
  check('swipe right: back to the list, conversation closed', s.view === 'list' && s.path === '/web' && s.side[0] === 0, JSON.stringify(s));
  await page.tap('.row[data-i="4"]'); await page.waitForTimeout(900);
  await page.tap('#close'); await page.waitForTimeout(1300);
  s = await state();
  check('native back button: back to the list', s.view === 'list' && s.path === '/web' && s.side[0] === 0, JSON.stringify(s));
  check('list: camera button offered', s.cam === 'grid');
  await page.tap('#control-snap-camera'); await page.waitForTimeout(700);
  s = await state();
  check('camera button: camera screen slides in', s.view === 'camera' && s.pane[0] === 0, JSON.stringify(s));
  await page.tap('#control-snap-back'); await page.waitForTimeout(700);
  s = await state();
  check('camera back: list again', s.view === 'list' && s.side[0] === 0, JSON.stringify(s));
  check('no script error', errors.length === 0, errors.slice(0, 2).join(' | '));
  await browser.close();
  const failed = results.filter(ok => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
})();
