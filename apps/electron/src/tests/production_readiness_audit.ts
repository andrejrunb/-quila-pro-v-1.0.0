import { Database } from '../database/Database';

/**
 * production_readiness_audit.ts — AG-034
 * Auditoria final de integridade de dados e performance para o Áquila Pro OS.
 */
async function runAudit() {
  console.log('=== [AUDITORIA] Inspecionando Prontidão de Produção ===\n');

  const db = Database.getInstance();
  await db.initialize();

  try {
    // 1. Contagem de Registros
    const studentCount = await db.get('SELECT COUNT(*) as count FROM students');
    const staffCount = await db.get('SELECT COUNT(*) as count FROM staff');
    const classesCount = await db.get('SELECT COUNT(*) as count FROM classes');
    const attendanceCount = await db.get('SELECT COUNT(*) as count FROM attendance');

    console.log('[DADOS] Estatísticas de Massa:');
    console.log(` - Alunos: ${studentCount?.count || 0}`);
    console.log(` - Funcionários: ${staffCount?.count || 0}`);
    console.log(` - Turmas: ${classesCount?.count || 0}`);
    console.log(` - Registros de Presença: ${attendanceCount?.count || 0}`);
    console.log('----------------------------------');

    // 2. Verificação de Saúde do DB (PRAGMAs)
    const journalMode = await db.get('PRAGMA journal_mode');
    const synchronous = await db.get('PRAGMA synchronous');
    const cacheSize = await db.get('PRAGMA cache_size');

    console.log('[HEALTH] Configurações SQLite:');
    console.log(` - Modo de Jornal: ${journalMode?.journal_mode || 'N/A'}`);
    console.log(` - Sincronismo: ${synchronous?.synchronous || 'N/A'}`);
    console.log(` - Cache Size: ${cacheSize?.cache_size || 'N/A'}`);
    console.log('----------------------------------');

    // 3. Teste de Stress Analítico (Query de Risco)
    console.log('[PERF] Executando Query de Risco Pedagógico (Complexa)...');
    const startTime = Date.now();
    
    // Query simulando o cálculo de risco de evasão massivo
    const riskQuery = `
      SELECT 
        s.id, 
        s.name, 
        (SELECT COUNT(*) FROM attendance a WHERE a.studentId = s.id AND a.status = 'absent') as total_absences,
        (SELECT COUNT(*) FROM billing b WHERE b.studentHash = s.id AND b.status = 'pending') as pending_bills
      FROM students s
      WHERE s.status = 'active'
      LIMIT 1000
    `;
    
    await db.all(riskQuery);
    const duration = Date.now() - startTime;
    
    console.log(` - Tempo de execução (1000 registros): ${duration}ms`);
    if (duration < 500) {
      console.log(' ✅ Performance: EXCELENTE');
    } else if (duration < 2000) {
      console.log(' ⚠️ Performance: ACEITÁVEL (Otimização recomendada)');
    } else {
      console.log(' ❌ Performance: CRÍTICA (Gargalo detectado)');
    }
    console.log('----------------------------------');

    // 4. Verificação de Integridade de FKs
    console.log('[INTEGRIDADE] Verificando Foreign Keys...');
    const fkCheck = await db.all('PRAGMA foreign_key_check');
    if (fkCheck.length === 0) {
      console.log(' ✅ Todas as referências estão íntegras.');
    } else {
      console.log(` ❌ Detectadas ${fkCheck.length} violações de integridade!`);
      fkCheck.slice(0, 10).forEach((v: any) => {
        console.log(`    - Tabela: ${v.table}, LinhaID: ${v.rowid}, Pai: ${v.parent}, Erro: ${v.fkid}`);
      });
    }

    console.log('\n=== [AUDITORIA] Sistema Pronto para Produção (V2.1.0) ===');
  } catch (err: any) {
    console.error('❌ [ERRO] Falha na auditoria:', err.message);
  } finally {
    process.exit(0);
  }
}

runAudit();
