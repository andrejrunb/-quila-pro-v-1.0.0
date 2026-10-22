const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');

app.whenReady().then(() => {
    const dbPath = 'C:\\Users\\Thaysa\\AppData\\Roaming\\AquilaPro\\aquila.db';
    const db = new Database(dbPath);

    console.log('--- Rooms Table Content ---');
    const rooms = db.prepare('SELECT * FROM rooms').all();
    console.log(JSON.stringify(rooms, null, 2));

    console.log('--- Schedules Table Content ---');
    const schedules = db.prepare('SELECT * FROM schedules').all();
    console.log(JSON.stringify(schedules, null, 2));

    db.close();
    app.quit();
});
