
import { Database } from "../src/database/Database";
import { churnMonitorService } from "../src/main/services/ChurnMonitorService";
import { dropoutPredictor } from "../src/main/services/DropoutPredictor";
import { sovereignGraphService } from "../src/main/services/SovereignGraphService";
import { academicRecordsService } from "../src/main/services/AcademicRecordsService";

async function verify() {
  console.log("--- Starting Evasion Intelligence Verification ---");
  
  const db = Database.getInstance();
  await db.initialize();

  // Initialize Services that need explicit DB injection
  academicRecordsService.setDatabase(db);
  // churnMonitorService and sovereignGraphService use getInstance() which internally use Database.getInstance()

  // Disable FK for testing
  await db.run('PRAGMA foreign_keys = OFF');

  // 1. Seed test data
  const schoolId = 'school_01';
  const classId = 'test_class_001';
  
  await db.run('INSERT OR REPLACE INTO schools (id, name) VALUES (?, ?)', [schoolId, 'Test School']);
  await db.run('INSERT OR REPLACE INTO classes (id, schoolId, name) VALUES (?, ?, ?)', [classId, schoolId, 'Test Class']);
  
  const studentA = { id: 'student_a', name: 'Student A (Critical)', classId, reg: 'REG001' };
  const studentB = { id: 'student_b', name: 'Student B (Relational Risk)', classId, reg: 'REG002' };
  
  await db.run('INSERT OR REPLACE INTO students (id, name, classId, status, registrationNumber) VALUES (?, ?, ?, ?, ?)', [studentA.id, studentA.name, studentA.classId, 'active', studentA.reg]);
  await db.run('INSERT OR REPLACE INTO students (id, name, classId, status, registrationNumber) VALUES (?, ?, ?, ?, ?)', [studentB.id, studentB.name, studentB.classId, 'active', studentB.reg]);

  // Add critical absences for Student A
  for (let i = 0; i < 20; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    await db.run('INSERT OR REPLACE INTO attendance (id, studentId, classId, scheduleId, date, status) VALUES (?, ?, ?, ?, ?, ?)', 
      [`att_a_${i}`, studentA.id, classId, 'sch_1', dateStr, 'absent']);
  }

  // 2. Run Risk Scan
  console.log("Running Global Risk Scan...");
  await churnMonitorService.runGlobalRiskScan();

  // 3. Check Results
  const stats = await churnMonitorService.getGlobalRiskStats();
  console.log("Global Risk Stats:", stats);

  // 4. Verify Student A is Critical
  const studentAData = await db.get('SELECT metadata FROM students WHERE id = ?', [studentA.id]);
  const metadataA = JSON.parse(studentAData.metadata || '{}');
  console.log("Student A Analysis:", metadataA);

  // 5. Verify Relational Risk for Student B
  const studentBData = await db.get('SELECT metadata FROM students WHERE id = ?', [studentB.id]);
  const metadataB = JSON.parse(studentBData.metadata || '{}');
  console.log("Student B Analysis:", metadataB);

  if (metadataB.factors.some((f: string) => f.includes('Risco de influência social'))) {
    console.log("SUCCESS: Relational risk factor detected for Student B.");
  } else {
    console.log("FAILURE: Relational risk factor NOT detected for Student B.");
  }

  // 6. Check Graph Associations
  const neighborsA = sovereignGraphService.getKnowledgeContext(studentA.id);
  console.log("Student A Graph Context Neighbors count:", neighborsA.length);

  console.log("--- Verification Complete ---");
  process.exit(0);
}

verify().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
