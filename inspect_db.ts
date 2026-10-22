import Database from './apps/electron/src/database/Database';
import path from 'path';

async function inspect() {
    const userDataDir = path.resolve('./apps/electron/test-user-data');
    process.env.AQUILA_USER_DATA_OVERRIDE = userDataDir;
    
    console.log("Inspecting DB at:", userDataDir);
    const db = Database.getInstance();
    await db.initialize();
    
    try {
        const info = await db.all("PRAGMA table_info(zero_bypass_audits)");
        console.log("Columns in zero_bypass_audits:");
        console.log(JSON.stringify(info, null, 2));
    } catch (e) {
        console.error("Error inspecting table:", e);
    }
}

inspect();
