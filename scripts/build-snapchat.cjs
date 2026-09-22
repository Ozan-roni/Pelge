// Mechanical bundle: one runtime for the extension and the self-contained Safari script.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'mobile/Control-iPhone.user.js');
const start = '/* BEGIN SHARED SNAPCHAT EXPERIENCE */';
const end = '/* END SHARED SNAPCHAT EXPERIENCE */';
const runtime = ['SnapchatEssentialUI.js','SnapchatExperience.js'].map(file=>fs.readFileSync(path.join(root,'dist/scripts',file),'utf8').trim()).join('\n\n');
const source = fs.readFileSync(file, 'utf8');
const block = start + '\n' + runtime + '\n' + end;
const a = source.indexOf(start), b = source.indexOf(end);
const result = a >= 0 && b > a ? source.slice(0, a) + block + source.slice(b + end.length) : source.replace('// ==/UserScript==', '// ==/UserScript==\n\n' + block);
if (process.argv.includes('--check')) {
  if (source !== result) throw Error('Run npm run build:snapchat: embedded runtime differs from source');
} else if (source !== result) fs.writeFileSync(file, result);
