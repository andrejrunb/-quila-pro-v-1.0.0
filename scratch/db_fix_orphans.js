const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');

app.whenReady().then(() => {
    const dbPath = 'C:\\Users\\Thaysa\\AppData\\Roaming\\AquilaPro\\aquila.db';
    const db = new Database(dbPath);

    console.log('--- Fixing Database Inconsistencies ---');

    // 1. Fix classes with 'default' schoolId
    const res1 = db.prepare("UPDATE classes SET schoolId = 'school-aquila-main' WHERE schoolId = 'default'").run();
    console.log(`Updated ${res1.changes} classes (schoolId 'default' -> 'school-aquila-main')`);

    // 2. Fix rooms with 'default-school' schoolId
    const res2 = db.prepare("UPDATE rooms SET schoolId = 'school-aquila-main' WHERE schoolId = 'default-school'").run();
    console.log(`Updated ${res2.changes} rooms (schoolId 'default-school' -> 'school-aquila-main')`);

    // 3. Remove schedule without classId
    const res3 = db.prepare("DELETE FROM schedules WHERE classId = ''").run();
    console.log(`Deleted ${res3.changes} schedules with empty classId`);

    console.log('--- Running Final Integrity Check ---');
    const foreignKeys = db.prepare('PRAGMA foreign_key_check').all();
    console.log('Remaining Foreign Key Inconsistencies:', foreignKeys.length);

    db.close();
    console.log('Database fixed successfully.');
    app.quit();
});
