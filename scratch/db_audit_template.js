const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');

app.whenReady().then(() => {
    const dbPath = 'C:\\aquila\\apps\\electron\\test-user-data\\AquilaPro\\aquila.db';
    const db = new Database(dbPath);

    console.log('--- Template Database Integrity Audit ---');

    const integrity = db.prepare('PRAGMA integrity_check').get();
    console.log('Integrity Check:', JSON.stringify(integrity));

    const foreignKeys = db.prepare('PRAGMA foreign_key_check').all();
    console.log('Foreign Key Inconsistencies:', foreignKeys.length);

    db.close();
    app.quit();
});
