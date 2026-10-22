const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');

app.whenReady().then(() => {
    const dbPath = 'C:\\Users\\Thaysa\\AppData\\Roaming\\AquilaPro\\aquila.db';
    const db = new Database(dbPath);

    console.log('--- Schools Table Content ---');
    const schools = db.prepare('SELECT * FROM schools').all();
    console.log(JSON.stringify(schools, null, 2));

    console.log('--- Classes Table Content ---');
    const classes = db.prepare('SELECT * FROM classes').all();
    console.log(JSON.stringify(classes, null, 2));

    db.close();
    app.quit();
});
