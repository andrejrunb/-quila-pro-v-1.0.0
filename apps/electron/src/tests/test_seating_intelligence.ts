import { Database } from '../database/Database';
import { seatingIntelligenceService } from '../main/services/SeatingIntelligenceService';

async function testSeating() {
    console.log('--- [TESTE] Iniciando Validação de Seating Intelligence ---');
    const db = Database.getInstance();
    await db.initialize();

    const classId = 'test-class-708';
    
    // 1. Limpar e Setup
    await db.run('DELETE FROM students WHERE classId = ?', [classId]);
    await db.run('DELETE FROM classes WHERE id = ?', [classId]);
    
    await db.run('INSERT INTO classes (id, schoolId, name) VALUES (?, ?, ?)', [classId, 'test-school', 'Turma de Teste HALO']);
    
    // Aluno 1: Visão (deve ir para row 0)
    await db.run('INSERT INTO students (id, classId, name, row, col, frustrationScore, observationLevel, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        ['s1', classId, 'João Visão', 5, 2, 0, 0, JSON.stringify({ vision_issue: true })]);

    // Aluno 2: Indisciplina (deve ir para row 1)
    await db.run('INSERT INTO students (id, classId, name, row, col, frustrationScore, observationLevel) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['s2', classId, 'Maria Bagunça', 4, 0, 0, 5]);

    // Aluno 3: Outra Indisciplina (deve ser separado de Maria)
    await db.run('INSERT INTO students (id, classId, name, row, col, frustrationScore, observationLevel) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['s3', classId, 'Pedro Bagunça', 3, 0, 0, 4]);

    // Aluno 4: Frustrado (deve subir 2 filas)
    await db.run('INSERT INTO students (id, classId, name, row, col, frustrationScore, observationLevel) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['s4', classId, 'Ana Frustrada', 5, 4, 8, 0]);

    // Aluno 5: Alto (deve ir para o fundo)
    await db.run('INSERT INTO students (id, classId, name, row, col, frustrationScore, observationLevel, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        ['s5', classId, 'Marcos Alto', 0, 1, 0, 0, JSON.stringify({ is_tall: true })]);

    console.log('[Passo 1] Gerando Recomendações...');
    const recommendations = await seatingIntelligenceService.getRecommendations(classId);
    
    console.log('\n--- RESULTADOS ---');
    recommendations.forEach(r => {
        console.log(`- ${r.studentName}: (${r.currentPosition.row},${r.currentPosition.col}) -> (${r.suggestedPosition.row},${r.suggestedPosition.col})`);
        console.log(`  Motivo: ${r.reason}`);
        console.log(`  Prioridade: ${r.priority}`);
    });

    // Verificação de Separação (Proximity check)
    const maria = recommendations.find(r => r.studentId === 's2');
    const pedro = recommendations.find(r => r.studentId === 's3');
    
    if (maria && pedro) {
        const dist = Math.abs(maria.suggestedPosition.row - pedro.suggestedPosition.row) + Math.abs(maria.suggestedPosition.col - pedro.suggestedPosition.col);
        console.log(`\n[Audit] Distância entre alunos indisciplinados: ${dist}`);
        if (dist <= 1) {
            console.error('❌ ERRO: Alunos indisciplinados estão adjacentes!');
        } else {
            console.log('✅ SUCESSO: Alunos indisciplinados separados corretamente.');
        }
    }

    console.log('\n--- [TESTE] Validação concluída ---');
    process.exit(0);
}

testSeating();
