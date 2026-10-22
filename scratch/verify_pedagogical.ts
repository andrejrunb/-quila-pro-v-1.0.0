import { sovereignRegistry } from '../apps/electron/src/main/registry';
import { db } from '../apps/electron/src/database/Database';
import { coordinationService } from '../apps/electron/src/main/services/CoordinationService';
import { pedagogicalRiskService } from '../apps/electron/src/main/services/PedagogicalRiskService';
import { absenceIntelligenceService } from '../apps/electron/src/main/services/AbsenceIntelligenceService';

async function seed() {
  console.log('🌱 Seeding Pedagogical Data (Phase 501+)...');
  
  // 1. Initialize Database
  console.log('💾 Initializing Database...');
  await db.initialize();
  
  // 2. Register Instances in Registry (since we are running standalone)
  sovereignRegistry.registerInstance('db', db);
  sovereignRegistry.registerInstance('coordinationService', coordinationService);
  sovereignRegistry.registerInstance('pedagogicalRiskService', pedagogicalRiskService);
  sovereignRegistry.registerInstance('absenceIntelligenceService', absenceIntelligenceService);

  // 3. Create a dummy environment (School -> Class -> Student) if none exist
  console.log('📝 Cleaning and creating test environment...');
  await db.run("DELETE FROM coordination_insights WHERE target_id = 'std-test-501'");
  await db.run("DELETE FROM attendance WHERE studentId = 'std-test-501'");
  await db.run("DELETE FROM students WHERE id = 'std-test-501'");
  
  // DEBUG: Check schema
  const attendanceSchema = await db.all("SELECT sql FROM sqlite_master WHERE name='attendance'");
  console.log('DEBUG: Attendance Schema:', JSON.stringify(attendanceSchema, null, 2));
  const schedulesSchema = await db.all("SELECT sql FROM sqlite_master WHERE name='schedules'");
  console.log('DEBUG: Schedules Schema:', JSON.stringify(schedulesSchema, null, 2));

  await db.run(`
    INSERT OR REPLACE INTO schools (id, name)
    VALUES ('school-001', 'Escola Áquila Sede')
  `);
  await db.run(`
    INSERT OR REPLACE INTO classes (id, name, schoolId)
    VALUES ('class-001', 'Turma de Teste 501', 'school-001')
  `);
  await db.run(`
    INSERT OR REPLACE INTO rooms (id, name, schoolId)
    VALUES ('room-001', 'Laboratório de IA', 'school-001')
  `);
  // Satisfy schedules schema (based on probable columns)
  await db.run(`
    INSERT OR REPLACE INTO schedules (id, classId, teacher, subject, roomId)
    VALUES ('sch-1', 'class-001', 'Prof. Arthur', 'Matemática', 'room-001')
  `);
  await db.run(`
    INSERT OR REPLACE INTO students (id, name, classId, status)
    VALUES ('std-test-501', 'Arthur Morgan', 'class-001', 'active')
  `);
  
  // 3.5 Seed Attendance Records (to simulate risk)
  console.log('📅 Seeding attendance history...');
  await db.run(`
    INSERT OR REPLACE INTO attendance (id, studentId, classId, scheduleId, date, status)
    VALUES 
      ('att-1', 'std-test-501', 'class-001', 'sch-1', '2026-04-20', 'absent'),
      ('att-2', 'std-test-501', 'class-001', 'sch-1', '2026-04-21', 'absent'),
      ('att-3', 'std-test-501', 'class-001', 'sch-1', '2026-04-22', 'absent')
  `);

  // 4. Trigger an absence insight
  console.log('📡 Simulating Absence Drift (3 consecutive absences)...');
  await absenceIntelligenceService.trackAbsence('std-test-501', 3); 

  // 5. Force Risk Analysis (Already triggered by absence, but let's be explicit)
  console.log('🧠 Running Global Risk Audit...');
  await pedagogicalRiskService.runGlobalAudit();

  // 6. Verify Insights
  const summary = await coordinationService.getCoordinationSummary();
  console.log('📊 Coordination Summary:', JSON.stringify(summary, null, 2));

  const insights = await coordinationService.getPendingInsights();
  console.log('💡 Pending Insights:', JSON.stringify(insights, null, 2));

  console.log('✅ Seed Complete.');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed Failed:', err);
  process.exit(1);
});
