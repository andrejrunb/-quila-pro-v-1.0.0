const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const os = require('os');

// Path to the database (adjusting based on the app's structure)
const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'aquila-pro', 'database.sqlite');

console.log('Targeting database at:', dbPath);

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // 1. Ensure Arthur Morgan exists
  db.run(`
    INSERT OR IGNORE INTO students (id, name, class_id, status)
    VALUES ('STU-ARTHUR-001', 'Arthur Morgan', 'CLASS-001', 'ACTIVE')
  `);

  // 2. Add drift metadata
  const metadata = JSON.stringify({
    biometricDrift: {
      detectedAt: new Date().toISOString(),
      status: 'NEEDS_RECAPTURE'
    }
  });

  db.run(`
    UPDATE students 
    SET metadata = ? 
    WHERE id = 'STU-ARTHUR-001'
  `, [metadata], function(err) {
    if (err) {
      console.error('Error updating student metadata:', err);
    } else {
      console.log('Arthur Morgan biometric drift seeded successfully.');
    }
  });

  // 3. Ensure a class exists for the dashboard
  db.run(`
    INSERT OR IGNORE INTO classes (id, name)
    VALUES ('CLASS-001', '3º Ano EM')
  `);
});

db.close();
