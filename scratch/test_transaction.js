
const { Database } = require('./apps/electron/src/database/Database');
const path = require('path');

async function testTransaction() {
    const db = Database.getInstance();
    // Use a temporary DB or the real one if safe (here we'll just check the logic)
    console.log('Testing transaction logic...');
    
    try {
        await db.transaction(async () => {
            console.log('Inside transaction...');
            await db.run('CREATE TABLE IF NOT EXISTS test_trans (id TEXT PRIMARY KEY)');
            await db.run('INSERT INTO test_trans (id) VALUES (?)', ['1']);
            console.log('First insert done.');
            throw new Error('Forced error');
        });
    } catch (e) {
        console.log('Caught expected error:', e.message);
    }
    
    const rows = await db.all('SELECT * FROM test_trans WHERE id = ?', ['1']);
    if (rows.length > 0) {
        console.error('FAIL: Transaction did not rollback! Row still exists.');
    } else {
        console.log('SUCCESS: Transaction rolled back correctly.');
    }
}

// Note: This script needs to be run in an environment where Database.ts can be loaded.
// Since it's TS and has dependencies, I might need to run it via ts-node or similar.
// But I can also just analyze the code.
