import { NotificationManager } from '../main/services/NotificationManager';
import Database from '../database/Database';
import { logger } from '../main/logger';
import * as path from 'path';

async function testSecurityIPC() {
    console.log('--- Testing Security IPC Handler Logic ---');
    
    try {
        // Initialize Database with a test path or override
        const db = Database.getInstance();
        await db.initialize();
        const notificationManager = NotificationManager.getInstance(db);
        
        // Mock some alerts if database is empty
        const alerts = await notificationManager.getSecurityAlerts(5);
        console.log(`Successfully retrieved ${alerts.length} security alerts.`);
        
        if (alerts.length > 0) {
            console.log('First alert sample:', JSON.stringify(alerts[0], null, 2));
        } else {
            console.log('No alerts found in database. This is expected if no events have occurred.');
        }
        
        console.log('--- Test Passed ---');
    } catch (error) {
        console.error('--- Test Failed ---');
        console.error(error);
        process.exit(1);
    }
}

testSecurityIPC();
