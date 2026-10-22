import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';

test.describe('Seating Intelligence Integration', () => {
  let electronApp: any;
  let window: any;

  test.beforeAll(async () => {
    // Note: We might need to handle auth if main_flow requires it, 
    // but here we test the IPC bridge directly.
    electronApp = await electron.launch({ 
      args: ['.'],
      env: { ...process.env, PLAYWRIGHT: 'true' }
    });
    window = await electronApp.firstWindow();
    // Wait for boot phase 2 (SeatingService is registered in phase 2)
    await window.waitForTimeout(3000);
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('should handle seating layout lifecycle', async () => {
    // 1. Check if bridge is available
    console.log('[TEST] Checking bridge...');
    const hasBridge = await window.evaluate(() => !!(window as any).aquila?.seating);
    expect(hasBridge).toBe(true);
    console.log('[TEST] Bridge OK.');

    // 2. Test getLayout
    console.log('[TEST] Getting layout...');
    const layout = await window.evaluate(async () => {
      return await (window as any).aquila.seating.getLayout('class-01');
    });
    expect(Array.isArray(layout)).toBe(true);
    console.log('[TEST] Layout OK.');

    // 3. Test getRecommendations
    console.log('[TEST] Getting recommendations...');
    const recs = await window.evaluate(async () => {
      return await (window as any).aquila.seating.getRecommendations('class-01');
    });
    expect(Array.isArray(recs)).toBe(true);
    console.log('[TEST] Recommendations OK.');

    // 4. Test saveLayout (which triggers audit)
    console.log('[TEST] Saving layout...');
    const result = await window.evaluate(async () => {
      // Pass an empty layout for testing persistence call
      return await (window as any).aquila.seating.saveLayout('class-01', []);
    });
    console.log('[TEST] Save result:', result);
    expect(result.success).toBe(true);
  });
});
