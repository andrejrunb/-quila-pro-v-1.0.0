const DatabaseSQLite = require('better-sqlite3');
const dbPath = 'C:\\Users\\Thaysa\\AppData\\Roaming\\AquilaPro\\aquila.db';
const db = new DatabaseSQLite(dbPath);

const tables = ['students', 'events', 'attendance', 'attendance_logs'];
tables.forEach(t => {
    try {
        const info = db.pragma(`table_info(${t})`);
        console.log(`Columns in ${t}:`, info.map(c => c.name).join(', '));
    } catch (e) {
        console.error(`Error checking ${t}:`, e.message);
    }
});
db.close();
