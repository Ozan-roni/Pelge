const fs = require('node:fs');
const path = require('node:path');
const project = path.resolve(__dirname, '..');
const output = path.resolve(process.argv[2] || path.join(project, '..', 'control-extension-update'));
if (fs.existsSync(output)) throw new Error('Choose a new output directory to preserve existing files.');
fs.cpSync(path.join(project, 'dist'), output, {recursive:true});
fs.copyFileSync(path.join(__dirname, 'manifest.json'), path.join(output, 'manifest.json'));
fs.copyFileSync(path.join(project, 'dist/index.html'), path.join(output, 'Dashboard.html'));
const manifest = JSON.parse(fs.readFileSync(path.join(output, 'manifest.json'),'utf8'));
for (const file of [manifest.background.service_worker,manifest.action.default_popup,manifest.options_page,...manifest.content_scripts.flatMap(s=>[...(s.js||[]),...(s.css||[])])]) {
  if (!fs.existsSync(path.join(output,file))) throw new Error('Missing extension file: '+file);
}
console.log('Extension '+manifest.version+' prepared: '+output);
