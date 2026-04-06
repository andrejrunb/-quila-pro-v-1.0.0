
const { _electron: electron } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

/**
 * Áquila Pro v3441 - Performance & Resource Audit Script
 * Monitors Heap, RSS and External memory usage of the Electron process.
 */

async function runAudit() {
  console.log('--- starting Áquila Pro Performance Audit ---');
  
  const electronApp = await electron.launch({
    args: [path.join(__dirname, '../dist/main.js')],
    env: { ...process.env, PLAYWRIGHT: 'true', NODE_ENV: 'test' },
    timeout: 60000
  });

  const window = await electronApp.firstWindow();
  console.log('App launched. Monitoring for 2 minutes...');

  const logPath = path.join(__dirname, '../perf_audit.log');
  fs.writeFileSync(logPath, `Timestamp, RSS(MB), HeapTotal(MB), HeapUsed(MB), External(MB), Uptime(s)\n`);

  // Simple loop to query metrics every 5 seconds
  for (let i = 0; i < 24; i++) {
    try {
      const metrics = await window.evaluate(async () => {
        return await window.aquila.getPerformanceMetrics();
      });

      const entry = `${new Date().toISOString()}, ${metrics.rss}, ${metrics.heapTotal}, ${metrics.heapUsed}, ${metrics.external}, ${metrics.uptime}`;
      console.log(`[Metric] ${entry}`);
      fs.appendFileSync(logPath, entry + '\n');
    } catch (err) {
      console.error('Audit query failed:', err.message);
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  console.log(`Audit complete. Results saved to: ${logPath}`);
  await electronApp.close();
}

runAudit().catch(console.error);
