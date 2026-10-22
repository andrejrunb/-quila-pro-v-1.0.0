import { Database } from '../../database/Database';
import { seedProductionData } from './seedProductionData';

async function run() {
  console.log('Inicializando Banco de Dados para Seeding...');
  const db = new Database();
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
