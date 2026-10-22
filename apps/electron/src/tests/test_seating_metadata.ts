import { db } from '../database/Database';
import { seatingIntelligenceService } from '../main/services/SeatingIntelligenceService';

async function runTest() {
  console.log('--- TESTE: INTELIGÊNCIA DE ASSENTOS COM METADADOS PEDAGÓGICOS ---');

  try {
    // Inicializar DB (Caminho padrão do teste ou override)
    await db.initialize();
    // 1. Limpeza e Mock de Dados
    const classId = 'test_class_708';
    
    // Criar Alunos com perfis diferentes
    const students = [
      { id: 'std_vision', name: 'Alice (Visão)', metadata: { vision_issue: true } },
      { id: 'std_tall', name: 'Bob (Alto)', metadata: { is_tall: true } },
      { id: 'std_conflict_1', name: 'Charlie (Conflito)', metadata: { avoid_pairs: ['std_conflict_2'] } },
      { id: 'std_conflict_2', name: 'David (Conflito)', metadata: {} },
      { id: 'std_frustrated', name: 'Eve (Frustrada)', frustrationScore: 9 }
    ];

    for (const s of students) {
      await db.run('DELETE FROM students WHERE id = ?', [s.id]);
      await db.createStudent({
        id: s.id,
        name: s.name,
        classId,
        metadata: s.metadata || {},
        frustrationScore: s.frustrationScore || 0,
        observationLevel: s.id.startsWith('std_conflict') ? 4 : 1
      });
    }

    // 2. Definir posições iniciais (todos no fundo ou misturados)
    const initialSeats = [
      { studentId: 'std_vision', row: 3, col: 2 },
      { studentId: 'std_tall', row: 0, col: 0 },
      { studentId: 'std_conflict_1', row: 1, col: 1 },
      { studentId: 'std_conflict_2', row: 1, col: 2 }, // Vizinhos
      { studentId: 'std_frustrated', row: 4, col: 4 }
    ];

    await db.run('DELETE FROM student_seats WHERE classId = ?', [classId]);
    for (const seat of initialSeats) {
        await db.saveStudentSeat(seat.studentId, classId, seat.row, seat.col, 0);
    }

    // 3. Gerar recomendações
    console.log('\n[Teste] Solicitando recomendações de layout...');
    const recommendations = await seatingIntelligenceService.suggestLayoutChanges(classId);

    // 4. Validação
    console.log(`\nRecomendações Geradas: ${recommendations.length}`);
    recommendations.forEach(r => {
        console.log(`- ${r.studentName}: ${r.reason} (Prioridade: ${r.priority})`);
    });

    // Verificações específicas
    const hasVisionMove = recommendations.some(r => r.studentId === 'std_vision' && r.suggestedPosition.row === 0);
    const hasTallMove = recommendations.some(r => r.studentId === 'std_tall' && r.suggestedPosition.row >= 3);
    const hasConflictMove = recommendations.some(r => r.studentId === 'std_conflict_1' && (r.reason.includes('Conflito') || r.reason.includes('Social')));
    const hasFrustrationMove = recommendations.some(r => r.studentId === 'std_frustrated' && r.suggestedPosition.row === 0);

    console.log('\n--- RESULTADOS ---');
    console.log(`[PASS] Visão -> Frente: ${hasVisionMove}`);
    console.log(`[PASS] Estatura -> Fundo: ${hasTallMove}`);
    console.log(`[PASS] Conflito -> Separar: ${hasConflictMove}`);
    console.log(`[PASS] Frustração -> Frente: ${hasFrustrationMove}`);

  } catch (err) {
    console.error('ERRO NO TESTE:', err);
  }
}

runTest();
