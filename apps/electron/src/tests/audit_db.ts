import { Database } from '../database/Database';

async function runAudit() {
    const db = Database.getInstance();
    await db.initialize();

    console.log('--- Database Integrity Audit (TS) ---');

    const integrityResult = await db.checkIntegrity();
    console.log('Integrity Result:', JSON.stringify(integrityResult, null, 2));

    if (integrityResult.details && integrityResult.details.length > 0) {
        console.log('Found Inconsistencies. Attempting to retrieve row details...');
        for (const fk of integrityResult.details) {
            try {
                // Better-sqlite3 might return rowid or other info in fk details
                // PRAGMA foreign_key_check returns [table, rowid, parent, fkid]
                const row = await db.get(`SELECT * FROM ${fk.table} WHERE rowid = ?`, [fk.rowid]);
                console.log(`Table: ${fk.table}, Row:`, JSON.stringify(row, null, 2));
            } catch (err) {
                console.error(`Error fetching row for table ${fk.table}:`, err);
            }
        }
    }

    await db.close();
    process.exit(0);
}

runAudit().catch(err => {
    console.error('Audit failed:', err);
    process.exit(1);
});
