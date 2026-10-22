const path = require('path');
const jiti = require('jiti')(__filename, {
  cache: false,
  debug: true,
  alias: {
    '@': path.resolve(__dirname, '../apps/electron/src')
  }
});

console.log('🚀 Launching Pedagogical Seed via JITI...');
jiti('./verify_pedagogical.ts');
