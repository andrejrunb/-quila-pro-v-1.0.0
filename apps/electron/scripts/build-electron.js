const { execFileSync } = require('child_process');
console.log('Building Electron Main Process (Zero-Bypass Certified)...');
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), '--project', 'tsconfig.json'], {
  stdio: 'inherit'
});
