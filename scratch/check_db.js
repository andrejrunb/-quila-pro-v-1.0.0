const DatabaseSQLite = require('better-sqlite3');
const path = require('path');
const dbPath = 'C:\\Users\\Thaysa\\AppData\\Roaming\\AquilaPro\\aquila.db';

try {
    const db = new DatabaseSQLite(dbPath);
    const info = db.pragma('table_info(attendance)');
    console.log('Columns in attendance:', JSON.stringify(info, null, 2));
    db.close();
} catch (err) {
    console.error('Error:', err);
}
