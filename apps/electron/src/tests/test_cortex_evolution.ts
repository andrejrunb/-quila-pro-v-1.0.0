import Database from '../database/Database';
import { cortexEvolutionService } from '../main/services/CortexEvolutionService';
import { whatsappService } from '../main/services/WhatsAppService';
import { AttendanceCalculator } from '../main/services/AttendanceCalculator';

async function testEvolution() {
  console.log('--- TESTE DE EVOLUÇÃO DO CÓRTEX (MULTIDIMENSIONAL) ---');
  
  const db = Database.getInstance();
  await db.initialize();
  
  // 1. Mock do Gateway para o WhatsAppService
  whatsappService.setGateway({
    send: async (id: string, payload: any) => {
      console.log(`[MOCK WA] Notificação Enviada (${id}):`, payload.body);
      return { success: true };
    }
  });

  console.log('[Setup] Seeding data de teste (Cenário de Risco Crítico)...');
  const testStudentId = `test-std-${Date.now()}`;
  
  await db.run("INSERT OR IGNORE INTO schools (id, name) VALUES ('school-01', 'Escola Teste')");
  await db.run("INSERT OR IGNORE INTO classes (id, schoolId, name) VALUES ('class-01', 'school-01', 'Classe Teste')");
  await db.run("INSERT INTO students (id, classId, name, status) VALUES (?, ?, ?, 'active')", 
    [testStudentId, 'class-01', 'Estudante Risco Crítico Teste']);
  
  // 1. Risco de Evasão (65%)
  await db.run("INSERT INTO evasion_profiles (studentId, riskProbability, factors, trend) VALUES (?, ?, ?, ?)", 
    [testStudentId, 65, JSON.stringify(['absences', 'behavior']), 'stable']);

  // 2. Comportamento (Indisciplina - Risco 8.5)
  await db.run("INSERT INTO behavioral_logs (id, studentId, stress, aggression, riskScore, timestamp) VALUES (?, ?, ?, ?, ?, datetime('now'))",
    [`beh-${Date.now()}`, testStudentId, 8, 9, 8.5]);

  // 3. Tarefas Pendentes (2 tarefas)
  await db.run("INSERT INTO student_tasks (id, studentId, title, dueDate, status) VALUES (?, ?, ?, datetime('now', '+1 day'), ?)",
    [`task-${Date.now()}`, testStudentId, 'Lição Mal Feita', 'pending']);
  await db.run("INSERT INTO student_tasks (id, studentId, title, dueDate, status) VALUES (?, ?, ?, datetime('now', '-1 day'), ?)",
    [`task-${Date.now()}-2`, testStudentId, 'Trabalho de Biologia Vencido', 'pending']);

  // 4. Relatos de Professores (Indisciplina crônica)
  await db.run("INSERT OR IGNORE INTO rooms (id, schoolId, name) VALUES ('room-01', 'school-01', 'Sala Teste')");
  await db.run("INSERT OR IGNORE INTO schedules (id, classId, roomId, dayOfWeek, subject) VALUES ('sch-01', 'class-01', 'room-01', 0, 'Matemática')");
  await db.run("INSERT INTO lesson_reports (id, scheduleId, date, teacherNotes) VALUES (?, ?, ?, ?)",
    [`rep-${Date.now()}`, 'sch-01', new Date().toISOString().split('T')[0], 'O aluno foi desrespeitoso com os colegas e recusou-se a realizar a atividade em grupo.']);

  console.log('[Passo 1] Iniciando performStudySession multidimensional...');
  // Nota: O performStudySession analisa até 10 alunos priorizando risco
  await cortexEvolutionService.performStudySession();

  console.log('[Passo 2] Verificando se os insights de risco foram indexados...');
  // Buscamos por termos que a I.A deve gerar na síntese
  const results = cortexEvolutionService.searchKnowledge('comportamento');
  const criticalResults = cortexEvolutionService.searchKnowledge('critical');
  
  const allResults = [...results, ...criticalResults];
  
  if (allResults.length > 0) {
    console.log(`[SUCESSO] Encontrados ${allResults.length} insights relevantes no Córtex.`);
    allResults.forEach((r, i) => {
       console.log(`  Insight ${i+1}: [${r.category}] [Severity: ${r.severity || 'INFO'}] ${r.content}`);
    });
  } else {
    console.log('[AVISO] Nenhum insight específico encontrado. Verifique se o LLM/Mock gerou a saída esperada.');
    // Listar todos os itens do índice
    const allKnowledge = cortexEvolutionService.searchKnowledge('');
    console.log(`Total de itens no conhecimento: ${allKnowledge.length}`);
  }

  process.exit(0);
}

testEvolution().catch(err => {
  console.error('[ERRO NO TESTE]', err);
  process.exit(1);
});
