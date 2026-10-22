import { dropoutPredictor } from '../src/main/services/DropoutPredictor';
import { pedagogicalAIOrchestrator } from '../src/main/services/PedagogicalAIOrchestrator';
import { coordinationService } from '../src/main/services/CoordinationService';
import { db } from '../src/database/Database';

async function verify() {
  console.log('--- SOVEREIGN PEDAGOGICAL VERIFICATION ---');

  // 0. Initialize DB
  await db.initialize();

  // 1. Mock Student with Risk Factors
  const studentId = 'STU-TEST-001';
  console.log(`[1] Seeding test student: ${studentId}`);
  
  await db.run('INSERT OR REPLACE INTO students (id, name, status) VALUES (?, ?, ?)', [studentId, 'Teste Pedagógico', 'active']);
  await db.run('INSERT INTO attendance_logs (studentId, status, date) VALUES (?, ?, ?)', [studentId, 'absent', '2026-04-26']);
  await db.run('INSERT INTO attendance_logs (studentId, status, date) VALUES (?, ?, ?)', [studentId, 'absent', '2026-04-25']);
  await db.run('INSERT INTO attendance_logs (studentId, status, date) VALUES (?, ?, ?)', [studentId, 'absent', '2026-04-24']);

  // 2. Run Risk Analysis
  console.log('[2] Running Dropout Analysis...');
  const analysis = await dropoutPredictor.analyzeStudent(studentId);
  console.log(`Risk Score: ${analysis.riskScore}% (${analysis.level})`);
  console.log(`Factors: ${analysis.factors.join(', ')}`);

  // 3. Trigger Autonomous Intervention if risk is high
  if (analysis.riskScore > 50) {
    console.log('[3] High risk detected. Triggering Orchestrator...');
    const result = await pedagogicalAIOrchestrator.generateIntervention(studentId);
    console.log(`Dossier Created: ${result.dossierId}`);

    console.log('[4] Publishing Coordination Insight...');
    await coordinationService.publishInsight({
      type: 'DROPOUT_RISK',
      targetId: studentId,
      title: 'Alerta de Teste',
      content: 'Verificação de integração bem-sucedida.',
      priority: 'HIGH'
    });
  }

  // 5. Check Persistence
  const insights = await coordinationService.getPendingInsights();
  console.log(`[5] Pending Insights count: ${insights.length}`);
  
  console.log('--- VERIFICATION COMPLETE ---');
}

verify().catch(console.error);
