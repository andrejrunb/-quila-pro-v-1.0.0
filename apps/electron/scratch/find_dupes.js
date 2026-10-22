const fs = require('fs');
const content = fs.readFileSync('c:/aquila/apps/electron/src/database/Database.ts', 'utf8');
const lines = content.split('\n');
const methods = {};
lines.forEach((line, index) => {
  const match = line.match(/^\s*(?:public\s+|private\s+|protected\s+|async\s+)*([a-zA-Z0-9_]+)\s*\(/);
  if (match) {
    const methodName = match[1];
    if (!methods[methodName]) methods[methodName] = [];
    methods[methodName].push(index + 1);
  }
});

for (const [name, occurrences] of Object.entries(methods)) {
  if (occurrences.length > 1 && !['constructor', 'run', 'get', 'all', 'exec'].includes(name)) {
    console.log(`Method "${name}" duplicated at lines: ${occurrences.join(', ')}`);
  }
}
