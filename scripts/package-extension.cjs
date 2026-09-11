const path = require('node:path');
const { execFileSync } = require('node:child_process');
const output = path.resolve(__dirname, '../build/extension-' + Date.now());
execFileSync(process.execPath, [path.resolve(__dirname, '../extension/package.cjs'), output], { stdio: 'inherit' });
