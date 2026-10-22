import { createDb } from './index';
const db = createDb();
import { institutions, users, classes, students, attendance, grades, invoices, notifications } from './schema';
import { 
  seedInstitutions, 
  seedUsers, 
  seedClasses, 
  seedStudents, 
  seedGrades, 
  seedInvoices, 
  seedNotifications 
} from './seed';

async function main() {
  console.log('Seeding database...');
  
  try {
    console.log('Inserting institutions...');
    for (const inst of seedInstitutions) {
      await db.insert(institutions).values(inst).onConflictDoNothing();
    }

    console.log('Inserting users...');
    for (const user of seedUsers) {
      await db.insert(users).values(user).onConflictDoNothing();
    }

    console.log('Inserting classes...');
    for (const cls of seedClasses) {
      await db.insert(classes).values(cls).onConflictDoNothing();
    }

    console.log('Inserting students...');
    for (const std of seedStudents) {
      await db.insert(students).values(std).onConflictDoNothing();
    }

    console.log('Inserting grades...');
    for (const grd of seedGrades) {
      await db.insert(grades).values(grd).onConflictDoNothing();
    }

    console.log('Inserting invoices...');
    for (const inv of seedInvoices) {
      await db.insert(invoices).values(inv).onConflictDoNothing();
    }

    console.log('Inserting notifications...');
    for (const notif of seedNotifications) {
      await db.insert(notifications).values(notif).onConflictDoNothing();
    }
    
    console.log('✅ Seed completed successfully!');
  } catch (err) {
    console.error('❌ Error during seed:', err);
    process.exit(1);
  }
}

main();
