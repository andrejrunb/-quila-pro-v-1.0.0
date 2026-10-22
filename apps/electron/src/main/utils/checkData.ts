import { Database } from '../../database/Database';

async function check() {
  const db = Database.getInstance();
  await db.initialize();
  
  const studentCount: any = db.prepare('SELECT COUNT(*) as count FROM students').get();
  const staffCount: any = db.prepare('SELECT COUNT(*) as count FROM staff').get();
  
  console.log(`--- Database Check ---`);
  console.log(`Students: ${studentCount.count}`);
  console.log(`Staff: ${staffCount.count}`);
  console.log(`----------------------`);
  
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
