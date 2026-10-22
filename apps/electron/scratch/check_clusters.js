const fs = require('fs');
const content = fs.readFileSync('c:/aquila/apps/electron/src/ipc/handlers.ts', 'utf8');

const calls = [...content.matchAll(/register(\w+)Cluster\(/g)].map(m => m[1]);
const defs = [...content.matchAll(/function register(\w+)Cluster\(/g)].map(m => m[1]);

console.log('Calls:', calls.join(', '));
console.log('Definitions:', defs.join(', '));

const missing = calls.filter(c => !defs.includes(c));
console.log('Missing definitions:', missing.join(', '));
