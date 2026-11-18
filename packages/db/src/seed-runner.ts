import { getWebDb } from './index';
import { seedAcademicFixtures } from './seed';

async function main() {
  console.log('Seeding Áquila Pro web/shared database...');
  try {
    const db = await getWebDb();
    await seedAcademicFixtures(db);
    console.log('Seed completed successfully.');
  } catch (err) {
    console.error('Error during seed:', err);
    process.exit(1);
  }
}

main();
