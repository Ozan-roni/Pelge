// Regression test for the Control guard (mobile/Control-iPhone.user.js).
// Real hostnames are served by local fixtures: no account, no network content.
// Touch gestures are real (CDP), so scroll locking is exercised the way a finger does it.
const path = require('path');
const { chromium, devices } = require('playwright');
const userscript = path.join(__dirname, '..', 'mobile', 'Control-iPhone.user.js');

const feed = (title, extra = '') => `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<body style="margin:0"><h1>${title}</h1>${Array.from({ length: 60 }, (_, i) => `<article style="height:300px;border-bottom:1px solid #ccc">post ${i}</article>`).join('')}${extra}</body>`;
const swiper = (title, nextPath) => `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<body style="margin:0"><main id="s" style="height:100vh;overflow-y:scroll;scroll-snap-type:y mandatory">
${[0, 1, 2, 3].map(i => `<section style="height:100vh;scroll-snap-align:start;background:hsl(${i * 80} 60% 60%)">video ${i}</section>`).join('')}</main>
<script>const s=document.getElementById('s');s.addEventListener('scroll',()=>{if(s.scrollTop>200)history.replaceState(null,'','${nextPath}');});
window.advance=()=>history.replaceState(null,'','${nextPath}');</script></body>`;
const inbox = (title, link = '') => `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<body style="margin:0"><div role="log" id="log" style="height:100vh;overflow-y:auto">${Array.from({ length: 80 }, (_, i) => `<p style="height:60px;margin:0">message ${i}</p>`).join('')}${link}</div></body>`;

const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log((ok ? 'ok   ' : 'FAIL ') + name + (detail ? '  ' + detail : '')); };

(async () => {
  const browser = await chromium.launch();
  async function open(routes, url, before) {
    const context = await browser.newContext({ ...devices['iPhone 14'] });
    await context.addInitScript({ path: userscript });
    let loads = 0;
    await context.route('**/*', route => {
      const u = new URL(route.request().url());
      if (route.request().resourceType() !== 'document') return route.fulfill({ status: 204, body: '' });
      loads++;
      const answer = routes(u);
      if (typeof answer === 'object') return route.fulfill({ status: 302, headers: { location: answer.redirect } });
      return route.fulfill({ contentType: 'text/html', body: answer });
    });
    const page = await context.newPage();
    if (before) await before(page);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1600);
    const cdp = await context.newCDPSession(page);
    // Raw touch points: the compositor scrolls exactly as it does under a finger.
    // A page that is reloading or hidden never acknowledges a touch: do not wait for it forever.
    const touch = (type, touchPoints) => Promise.race([cdp.send('Input.dispatchTouchEvent', { type, touchPoints }).catch(() => {}), new Promise(done => setTimeout(done, 400))]);
    const swipe = async (times = 3) => {
      for (let i = 0; i < times; i++) {
        await touch('touchStart', [{ x: 195, y: 560 }]);
        for (let y = 540; y >= 140; y -= 40) { await touch('touchMove', [{ x: 195, y }]); await page.waitForTimeout(16); }
        await touch('touchEnd', []);
        await page.waitForTimeout(350);
      }
    };
    const state = () => page.evaluate(() => ({
      path: location.pathname, guard: document.documentElement.getAttribute('data-control-guard'),
      wall: !!document.getElementById('control-wall') && getComputedStyle(document.getElementById('control-wall')).opacity > 0.9,
      body: getComputedStyle(document.body).display, y: Math.round(scrollY),
      inner: Math.round(document.querySelector('#s,#log')?.scrollTop || 0), h: innerHeight,
    }));
    return { page, swipe, state, loads: () => loads, close: () => context.close() };
  }

  // 1. Facebook home when Facebook bounces /messages/ back to the feed: wall, no loop.
  {
    const t = await open(u => u.pathname.startsWith('/messages') ? { redirect: 'https://m.facebook.com/home.php' } : feed('Facebook feed'), 'https://m.facebook.com/');
    await t.page.waitForTimeout(1500); await t.swipe();
    const s = await t.state();
    check('facebook home: wall shown, feed hidden', s.wall && s.body === 'none' && s.guard === 'wall', JSON.stringify(s));
    check('facebook home: no scroll', s.y === 0);
    check('facebook home: redirect loop stopped', t.loads() <= 7, 'document loads=' + t.loads());
    await t.close();
  }
  // 2. Facebook home when messages exist: lands on messages, conversation scroll stays free.
  {
    const t = await open(u => u.pathname.startsWith('/messages') ? inbox('Messenger') : feed('Facebook feed'), 'https://www.facebook.com/');
    await t.swipe();
    const s = await t.state();
    check('facebook home: sent to messages', s.path.startsWith('/messages') && !s.wall && s.body !== 'none', JSON.stringify(s));
    check('messages: conversation still scrolls', s.inner > 100, 'scrollTop=' + s.inner);
    await t.close();
  }
  // 3. A single Facebook reel: swipe to the next one is refused.
  {
    const t = await open(u => swiper('reel', '/reel/222'), 'https://www.facebook.com/reel/111');
    await t.swipe();
    let s = await t.state();
    check('facebook reel: swipe does not move the player', s.inner === 0 && s.path === '/reel/111' && s.guard === 'lock', JSON.stringify(s));
    await t.page.evaluate(() => window.advance()); await t.page.waitForTimeout(1500);
    s = await t.state();
    check('facebook reel: automatic next item is undone', s.path === '/reel/111', s.path);
    await t.close();
  }
  // 4. Instagram: a reel received in a conversation opens alone; the next one returns to messages.
  {
    const routes = u => u.pathname.startsWith('/direct') ? inbox('Direct', '<a id="reel" href="/reel/ABC123/">reel</a>') : /^\/reels?\//.test(u.pathname) ? swiper('IG reel', '/reels/NEXT999/') : feed('Instagram feed');
    const t = await open(routes, 'https://www.instagram.com/direct/t/1/');
    await t.page.evaluate(() => { const a = document.getElementById('reel'); a.scrollIntoView(); });
    await t.page.tap('#reel'); await t.page.waitForTimeout(1800);
    let s = await t.state();
    check('instagram: received reel opens', s.path.startsWith('/reel/ABC123') && s.guard === 'lock' && !s.wall, JSON.stringify(s));
    await t.swipe();
    s = await t.state();
    check('instagram: received reel cannot be swiped', s.inner === 0 && s.path.startsWith('/reel/ABC123'), JSON.stringify(s));
    await t.page.evaluate(() => window.advance()); await t.page.waitForTimeout(1800);
    s = await t.state();
    // Either the change is refused in place or the tab returns to the conversations; the next reel never shows.
    check('instagram: next reel never opens', s.path.startsWith('/direct') || s.path.startsWith('/reel/ABC123'), s.path);
    await t.close();
  }
  // 5. Instagram feed, explore and reels tab never render.
  for (const start of ['/', '/explore/', '/reels/', '/reel/ZZZ000/']) {
    const t = await open(u => u.pathname.startsWith('/direct') ? inbox('Direct') : feed('Instagram feed'), 'https://www.instagram.com' + start);
    const s = await t.state();
    check('instagram ' + start + ': sent to messages', s.path.startsWith('/direct'), s.path);
    await t.close();
  }
  // 6. X and Reddit: feeds go to messages; a profile is capped.
  for (const [origin, start] of [['https://x.com', '/home'], ['https://x.com', '/explore'], ['https://x.com', '/i/trends'], ['https://www.reddit.com', '/'], ['https://www.reddit.com', '/r/popular/'], ['https://www.reddit.com', '/r/all/top/']]) {
    const t = await open(u => /^\/(messages|message|chat)/.test(u.pathname) ? inbox('messages') : feed('feed'), origin + start);
    const s = await t.state();
    check(origin.replace('https://', '') + start + ': sent to messages', /^\/(messages|message)/.test(s.path), s.path);
    await t.close();
  }
  for (const url of ['https://x.com/someone', 'https://www.reddit.com/user/someone/', 'https://www.instagram.com/someone/']) {
    const t = await open(() => feed('profile'), url);
    await t.swipe(14);
    const s = await t.state();
    check(url.replace('https://', '') + ': scroll capped', s.guard === 'cap' && s.y > 0 && s.y <= s.h * 3 + 2, 'y=' + s.y + ' viewport=' + s.h);
    await t.close();
  }
  // 7. Sign-in pages stay reachable.
  for (const url of ['https://x.com/i/flow/login', 'https://x.com/i/jf/onboarding/web', 'https://m.facebook.com/login.php', 'https://www.instagram.com/accounts/login/', 'https://www.reddit.com/login/', 'https://accounts.snapchat.com/accounts/v2/login']) {
    const t = await open(() => feed('login'), url);
    const s = await t.state();
    check(url.replace('https://', '') + ': reachable', !s.wall && s.body !== 'none' && s.guard === null, JSON.stringify(s));
    await t.close();
  }
  await browser.close();
  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
})();
