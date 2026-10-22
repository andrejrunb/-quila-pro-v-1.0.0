
import { NotificationManager } from '../main/services/NotificationManager';
import { ioTMainService } from '../main/services/IoTMainService';
import Database from '../database/Database';

async function testSecurityProtocol() {
    console.log('--- Starting Security Protocol Smoke Test ---');
    
    try {
        const db = Database.getInstance();
        await db.initialize();
        
        // Mock context check (simulating handlers.ts behavior)
        const mockAlertId = 'alert-123';
        const mockType = 'GLOBAL_LOCKDOWN';
        
        console.log(`[Test] Executing GLOBAL_LOCKDOWN for alert ${mockAlertId}...`);
        
        // We simulate the IPC call logic directly
        const result = await ioTMainService.forceLockdown();
        
        console.log('[Test] Lockdown command sent to all devices.');
        console.log('[Test] Devices affected:', ioTMainService.getDevices().length);
        
        if (result && Array.isArray(result) && result.length > 0) {
            console.log('--- Test Passed ---');
            process.exit(0);
        } else {
            console.error('--- Test Failed: No devices locked ---');
            process.exit(1);
        }
    } catch (err) {
        console.error('--- Test Failed with Error ---');
        console.error(err);
        process.exit(1);
    }
}

testSecurityProtocol();
