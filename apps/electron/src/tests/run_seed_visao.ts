import Database from '../database/Database';
import { seedRealSchool } from '../database/seedRealSchool';
import { isIsolatedDemoDatabaseTarget } from '../database/demoSeedGuard';
import * as path from 'path';

async function main() {
  const demoDbPath = process.env.AQUILA_DEMO_SEED_DB_PATH;
  if (
    process.env.NODE_ENV !== 'development' ||
    process.env.AQUILA_ENABLE_DEMO_SEED !== 'true' ||
    !demoDbPath ||
    !path.isAbsolute(demoDbPath) ||
    !isIsolatedDemoDatabaseTarget(path.resolve(demoDbPath))
  ) {
    throw new Error('Set NODE_ENV=development, AQUILA_ENABLE_DEMO_SEED=true, and an absolute AQUILA_DEMO_SEED_DB_PATH.');
  }

  console.log('Starting isolated reference-school seed:', path.resolve(demoDbPath));
  const db = new Database(path.resolve(demoDbPath));
  await db.initialize();
  
  const result = await seedRealSchool(db);
  console.log("Seed completed! Result summary:", {
    teachersCreated: result.teachersCreated,
    classesCreated: result.classesCreated,
    roomsCreated: result.roomsCreated,
    schedulesCreated: result.schedulesCreated,
  });

  process.exit(0);
}

main().catch(err => {
  console.error("Fatal error during seeding:", err);
  process.exit(1);
});
