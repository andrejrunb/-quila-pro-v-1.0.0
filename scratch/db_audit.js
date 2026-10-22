const Database = require('better-sqlite3');
const path = require('path');

const dbPath = 'C:\\Users\\Thaysa\\AppData\\Roaming\\AquilaPro\\aquila.db';
const db = new Database(dbPath);

console.log('--- Database Integrity Audit ---');

const integrity = db.prepare('PRAGMA integrity_check').get();
console.log('Integrity Check:', integrity);

const foreignKeys = db.prepare('PRAGMA foreign_key_check').all();
console.log('Foreign Key Inconsistencies:', foreignKeys.length);

if (foreignKeys.length > 0) {
    console.log('Details:');
    foreignKeys.forEach((fk, index) => {
        console.log(`${index + 1}. Table: ${fk.table}, RowId: ${fk.rowid}, Target: ${fk.parent}, FkIndex: ${fk.fkid}`);
        
        // Try to find the offending row
        try {
            const row = db.prepare(`SELECT * FROM ${fk.table} WHERE rowid = ?`).get(fk.rowid);
            console.log('   Offending Row:', JSON.stringify(row, null, 2));
        } catch (err) {
            console.log('   Could not retrieve row details:', err.message);
        }
    });
}

db.close();
