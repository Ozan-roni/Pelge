// Embeds mobile/runtime/SnapchatLite.js into the userscript (and its Seraphim copy).
// node scripts/build-snap-lite.cjs          writes the block
// node scripts/build-snap-lite.cjs --check  fails when the embedded block differs from the source
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'mobile/runtime/SnapchatLite.js'), 'utf8').replace(/\r\n/g, '\n').trim() + '\n';
const begin = '/* BEGIN CONTROL SNAPCHAT MOBILE */', end = '/* END CONTROL SNAPCHAT MOBILE */\n', anchor = '/* BEGIN SHARED INSTAGRAM MEDIA GUARD */';
const check = process.argv.includes('--check');
for (const target of ['mobile/Control-iPhone.user.js', 'seraphim/app/mobile/Control-iPhone.user.js']) {
  const file = path.join(root, target);
  let text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const from = text.indexOf(begin);
  if (from >= 0) text = text.slice(0, from) + text.slice(text.indexOf(end, from) + end.length).replace(/^\n/, '');
  if (!text.includes(anchor)) throw Error(target + ': anchor not found');
  const result = text.replace(anchor, source + '\n' + anchor);
  if (check) { if (result !== fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')) throw Error(target + ': run node scripts/build-snap-lite.cjs'); }
  else fs.writeFileSync(file, result);
}
console.log(check ? 'embedded Snapchat mobile block is current' : 'embedded Snapchat mobile block written');
