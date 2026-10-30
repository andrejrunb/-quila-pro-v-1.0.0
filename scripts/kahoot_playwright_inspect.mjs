import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const TARGET_URL = 'https://create.kahoot.it/creator/05c029d8-4b5a-4451-a570-24d2146c412d';
const DETAILS_URL = 'https://create.kahoot.it/details/05c029d8-4b5a-4451-a570-24d2146c412d';
const LOG_DIR = 'c:/aquila/logs';

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

async function run() {
  console.log('=== REA / AGENT REACH: Kahoot Creator Playwright Probe ===');
  console.log('Target:', TARGET_URL);

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  const networkTraffic = [];
  const consoleMessages = [];

  page.on('console', msg => {
    const text = `[CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`;
    consoleMessages.push(text);
  });

  page.on('request', req => {
    const url = req.url();
    if (url.includes('kahoot') && !url.endsWith('.png') && !url.endsWith('.svg') && !url.endsWith('.woff2')) {
      // console.log(`[REQ] ${req.method()} ${url}`);
    }
  });

  page.on('response', async res => {
    const url = res.url();
    const status = res.status();
    const contentType = res.headers()['content-type'] || '';
    
    if (url.includes('/rest/') || url.includes('/api/') || url.includes('graphql') || url.includes('drafts') || url.includes('kahoots')) {
      let body = '';
      try {
        if (contentType.includes('json') || contentType.includes('text')) {
          body = await res.text();
        }
      } catch (e) {
        body = `[Error reading body: ${e.message}]`;
      }
      
      networkTraffic.push({
        url,
        status,
        contentType,
        body: body.length > 2000 ? body.substring(0, 2000) + '... (truncated)' : body
      });
      console.log(`[RESP] ${status} ${url} (${contentType})`);
    }
  });

  console.log(`\nNavigating to ${TARGET_URL}...`);
  try {
    await page.goto(TARGET_URL, { waitUntil: 'load', timeout: 30000 });
  } catch (err) {
    console.warn(`Initial goto completed or timed out: ${err.message}`);
  }

  // Wait 6 seconds for client-side React hydration & API calls
  await page.waitForTimeout(6000);

  const finalUrl = page.url();
  const pageTitle = await page.title();
  console.log(`\nFinal Page URL: ${finalUrl}`);
  console.log(`Page Title: ${pageTitle}`);

  // Take screenshot
  const screenshotPath = path.join(LOG_DIR, 'kahoot_creator_screen.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved to: ${screenshotPath}`);

  // Extract page content / text
  const bodyText = await page.evaluate(() => document.body.innerText);
  fs.writeFileSync(path.join(LOG_DIR, 'kahoot_creator_body.txt'), bodyText, 'utf-8');
  console.log(`Body text snippet (first 500 chars):\n${bodyText.substring(0, 500)}`);

  // Extract storage
  const storageData = await page.evaluate(() => {
    const local = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      local[key] = localStorage.getItem(key);
    }
    const session = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      session[key] = sessionStorage.getItem(key);
    }
    return { local, session };
  });

  // Save full harvest report
  const report = {
    targetUrl: TARGET_URL,
    finalUrl,
    pageTitle,
    capturedNetworkRequests: networkTraffic,
    consoleMessages: consoleMessages.slice(-50),
    storageData,
    bodyTextLength: bodyText.length
  };

  fs.writeFileSync(path.join(LOG_DIR, 'kahoot_rea_report.json'), JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\nSaved harvest report to: ${path.join(LOG_DIR, 'kahoot_rea_report.json')}`);

  // Also probe details URL if finalUrl was login or error
  if (finalUrl.includes('login') || finalUrl.includes('auth')) {
    console.log('\n[INFO] Creator redirected to auth. Probing public details page...');
    try {
      await page.goto(DETAILS_URL, { waitUntil: 'networkidle', timeout: 15000 });
      console.log(`Details Page URL: ${page.url()}`);
      console.log(`Details Page Title: ${await page.title()}`);
      await page.screenshot({ path: path.join(LOG_DIR, 'kahoot_details_screen.png') });
      const detailsBody = await page.evaluate(() => document.body.innerText);
      fs.writeFileSync(path.join(LOG_DIR, 'kahoot_details_body.txt'), detailsBody, 'utf-8');
    } catch (e) {
      console.warn('Details probe error:', e.message);
    }
  }

  await browser.close();
  console.log('\nProbe finished successfully.');
}

run().catch(err => {
  console.error('Fatal probe failure:', err);
  process.exit(1);
});
