import { Database } from '../../database/Database';
import { seedProductionData } from './seedProductionData';
import * as path from 'path';
import { isIsolatedDemoDatabaseTarget } from '../../database/demoSeedGuard';

async function run() {
  const demoDbPath = process.env.AQUILA_DEMO_SEED_DB_PATH;
  if (
    process.env.NODE_ENV !== 'development' ||
    process.env.AQUILA_ENABLE_DEMO_SEED !== 'true' ||
    !demoDbPath ||
    !path.isAbsolute(demoDbPath) ||
    !isIsolatedDemoDatabaseTarget(path.resolve(demoDbPath))
  ) {
    throw new Error('Set NODE_ENV=development, AQUILA_ENABLE_DEMO_SEED=true, and AQUILA_DEMO_SEED_DB_PATH.');
  }

  console.log(`Inicializando banco sintético isolado: ${path.resolve(demoDbPath)}`);
  const db = new Database(path.resolve(demoDbPath));
  await db.initialize();
  Database.setInstance(db);

  await seedProductionData();

  console.log('Finalizado.');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
