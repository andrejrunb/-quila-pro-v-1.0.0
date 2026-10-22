import Database from '../database/Database';
import { seedRealSchool } from '../database/seedRealSchool';
import * as path from 'path';
import * as fs from 'fs';

async function main() {
  console.log("--- starting seed script for Colegio Visao ---");
  
  // Resolve AppData database path
  const appDataPath = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config');
  const dbDir = path.join(appDataPath, 'AquilaPro');
  const dbFile = path.join(dbDir, 'aquila.db');
  
  console.log("Database file path:", dbFile);

  if (fs.existsSync(dbFile)) {
    console.log("Deleting old database file to ensure a clean seed...");
    try {
      fs.unlinkSync(dbFile);
      console.log("Database file deleted successfully.");
    } catch (e: any) {
      console.error("Failed to delete database file:", e.message);
    }
  }

  const db = new Database(dbFile);
  await db.initialize();
  
  const result = await seedRealSchool(db);
  console.log("Seed completed! Result summary:", {
    teachersCreated: result.teachersCreated,
    classesCreated: result.classesCreated,
    roomsCreated: result.roomsCreated,
    schedulesCreated: result.schedulesCreated,
    totalCredentials: result.credentials.length
  });

  process.exit(0);
}

main().catch(err => {
  console.error("Fatal error during seeding:", err);
  process.exit(1);
});
