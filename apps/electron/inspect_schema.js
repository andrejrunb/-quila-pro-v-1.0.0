
const DatabaseSQLite = require('better-sqlite3');
const path = require('path');
const os = require('os');

const appDataPath = process.env.AQUILA_USER_DATA_OVERRIDE || process.env.APPDATA || (process.platform === 'darwin' ? os.homedir() + '/Library/Application Support' : os.homedir() + '/.config');
const dbPath = path.join(appDataPath, 'AquilaPro', 'aquila.db');

console.log('Inspecting database at:', dbPath);

try {
    const db = new DatabaseSQLite(dbPath);
    
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables in database:', tables.map(t => t.name).join(', '));

    if (tables.some(t => t.name === 'zero_bypass_audits')) {
        const tableInfo = db.prepare("PRAGMA table_info(zero_bypass_audits)").all();
        console.log('Columns in zero_bypass_audits:');
        console.table(tableInfo);
    } else {
        console.log('Table zero_bypass_audits does NOT exist.');
    }
    
    db.close();
} catch (err) {
    console.error('Failed to inspect database:', err.message);
}
