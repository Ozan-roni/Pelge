// iPhone-sized window on the real sites, for development against the real DOM.
//   node scripts/simulate-iphone.cjs [url] [--raw] [--safari]
// --raw opens the site without the Control userscript (to study the native structure).
// --safari sends the desktop Safari identity (Snapchat Web then answers with its download page).
// You sign in yourself in the window; the profile stays in build/sim-profile (never committed).
// Every few seconds a screenshot and a structural outline (no message text) are written to build/sim/.
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const root = path.join(__dirname, '..');
const args = process.argv.slice(2);
const raw = args.includes('--raw');
const start = args.find(a => /^https:/.test(a)) || 'https://web.snapchat.com/';
const out = path.join(root, 'build', 'sim');
fs.mkdirSync(out, { recursive: true });
// What Safari sends when an iPhone asks for the desktop site.
const desktopSafari = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15';

function outline() {
  const keep = ['id', 'role', 'aria-label', 'aria-modal', 'data-testid', 'title', 'placeholder', 'type', 'href', 'contenteditable'];
  let count = 0;
  const walk = (node, depth) => {
    if (count > 1800 || depth > 22) return null;
    const box = node.getBoundingClientRect();
    if (!box.width && !box.height && node.tagName !== 'VIDEO') return null;
    count++;
    const css = getComputedStyle(node);
    const item = { t: node.tagName.toLowerCase(), b: [Math.round(box.x), Math.round(box.y), Math.round(box.width), Math.round(box.height)] };
    const cls = typeof node.className === 'string' ? node.className.trim().split(/\s+/).slice(0, 4).join(' ') : '';
    if (cls) item.c = cls;
    for (const name of keep) { const value = node.getAttribute(name); if (value) item[name] = name === 'href' ? value.replace(/[?#].*/, '').slice(0, 60) : value.slice(0, 48); }
    for (const name of node.getAttributeNames()) if (name.startsWith('data-control') || name.startsWith('data-csx') || name.startsWith('data-csm')) item[name] = node.getAttribute(name) || true;
    if (/auto|scroll/.test(css.overflowY) && node.scrollHeight > node.clientHeight + 1) item.scroll = [node.scrollTop, node.scrollHeight, node.clientHeight];
    if (css.position !== 'static' && css.position !== 'relative') item.pos = css.position;
    if (css.display === 'flex' || css.display === 'grid') item.d = css.display + (css.flexDirection === 'column' ? '-col' : '');
    if (node.tagName === 'VIDEO') item.video = [node.videoWidth, node.videoHeight, !!node.srcObject, css.objectFit, css.transform !== 'none'];
    if (node.tagName === 'IMG') item.img = [node.naturalWidth, node.naturalHeight];
    if (node.tagName === 'SVG' || node.tagName === 'svg') return item;
    const own = [...node.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('').length;
    if (own) item.text = own; // length only: no message content leaves the page
    const kids = [...node.children].map(child => walk(child, depth + 1)).filter(Boolean);
    if (kids.length) item.k = kids;
    return item;
  };
  return { url: location.origin + location.pathname, viewport: [innerWidth, innerHeight], count, tree: walk(document.body, 0) };
}

(async () => {
  // --desktop: a normal computer window. Snapchat Web only lets a computer in; sign in there,
  // then the window can be narrowed to a phone size through the command channel below.
  const desktop = args.includes('--desktop');
  const context = await chromium.launchPersistentContext(path.join(root, 'build', 'sim-profile'), {
    headless: false, channel: 'chrome', viewport: desktop ? { width: 1180, height: 844 } : { width: 390, height: 844 },
    deviceScaleFactor: desktop ? 1 : 2, hasTouch: !desktop,
    ...(args.includes('--safari') ? { userAgent: desktopSafari } : {}), locale: 'fr-FR', permissions: ['camera', 'microphone'],
    args: [desktop ? '--window-size=1200,940' : '--window-size=406,940', '--use-fake-ui-for-media-stream'],
  });
  // Command channel for development: drop JavaScript in build/sim/cmd.js, it runs with (page, context)
  // and its return value lands in build/sim/result.json.
  const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
  setInterval(async () => {
    const file = path.join(out, 'cmd.js');
    if (!fs.existsSync(file)) return;
    const code = fs.readFileSync(file, 'utf8'); fs.unlinkSync(file);
    let result;
    try { const current = context.pages().find(p => !p.isClosed()); result = { ok: true, value: await new AsyncFunction('page', 'context', 'root', code)(current, context, root) }; }
    catch (error) { result = { ok: false, error: String(error && error.stack || error).slice(0, 1500) }; }
    fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify(result === undefined ? null : result));
  }, 500);
  if (!raw) await context.addInitScript({ path: path.join(root, 'mobile', 'Control-iPhone.user.js') });
  const page = context.pages()[0] || await context.newPage();
  await page.goto(start).catch(() => {});
  console.log('simulator ready', raw ? '(raw site)' : '(with Control)', start);
  const timer = setInterval(async () => {
    try {
      const current = context.pages().find(p => !p.isClosed());
      if (!current) return;
      const url = new URL(current.url());
      // Never capture a sign-in page.
      if (/^accounts\./.test(url.hostname) || /login|password|challenge|checkpoint/i.test(url.pathname)) return;
      const data = await current.evaluate(outline);
      fs.writeFileSync(path.join(out, 'dom.json'), JSON.stringify(data));
      await current.screenshot({ path: path.join(out, 'screen.png') });
    } catch {}
  }, 4000);
  context.on('close', () => { clearInterval(timer); process.exit(0); });
})();
