import { Database } from '../apps/electron/src/database/Database';
import path from 'path';
import fs from 'fs';

async function checkSchema() {
    const userDataDir = path.join(process.cwd(), 'test-user-data');
    if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
    }
    process.env.AQUILA_USER_DATA_OVERRIDE = userDataDir;

    const db = new Database();
    await db.initialize();

    try {
        const info = (db as any).db.prepare('PRAGMA table_info(zero_bypass_audits)').all();
        console.log('Table Info:', JSON.stringify(info, null, 2));
    } catch (err) {
        console.error('Error getting table info:', err);
    }
}

checkSchema();
