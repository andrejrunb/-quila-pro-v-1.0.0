const { execFileSync } = require('child_process');
const path = require('path');
console.log('Building Electron Main Process (Zero-Bypass Certified)...');
const electronDir = path.resolve(__dirname, '..');
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), '--project', path.resolve(electronDir, 'tsconfig.json')], {
  stdio: 'inherit',
  cwd: electronDir
});
