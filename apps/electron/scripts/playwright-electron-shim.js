const { spawn } = require('child_process');
const path = require('path');

/**
 * Playwright-Electron Argument Shim
 * Filtra o argumento '--remote-debugging-port=0' que causa crash no Electron v28
 * em certos ambientes Windows.
 */

const electronBin = path.join(__dirname, '../node_modules/electron/dist/electron.exe');
const args = process.argv.slice(2).filter(arg => !arg.startsWith('--remote-debugging-port'));

console.log('[Shim] Launching Electron without debug port...');
const child = spawn(electronBin, args, {
  stdio: 'inherit',
  env: process.env
});

child.on('exit', (code) => process.exit(code));
