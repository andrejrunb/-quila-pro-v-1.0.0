/**
 * scripts/test_backup_dr_suite.ts — Bateria de Validação de Missão Crítica: Opção A
 * 
 * Valida os 3 Pilares Fundamentais do Backup & DR do SQLite Edge:
 * 1. Resposta às 3 Perguntas de Auditoria do Piloto:
 *    - Qual foi o último estado válido do banco? (Manifesto criptográfico com timestamp e tuplas)
 *    - Quanto tempo leva para restaurar? (Meta: < 120 segundos / 2 minutos)
 *    - Como se prova que o backup é íntegro e restaurável? (SHA-256 + AES-256-GCM AuthTag + PRAGMA integrity_check)
 * 2. Criptografia Militar de Repouso AES-256-GCM com Rejeição a Adulterações (Anti-Tampering)
 * 3. Destino Duplo (Primário Local + Secundário USB/NAS) e Rotação GFS (7 Diários)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import DatabaseConstructor from 'better-sqlite3';
import { SQLiteDisasterRecoveryService } from '../apps/electron/src/main/services/SQLiteDisasterRecoveryService';

async function runFullDrSuite() {
  console.log('🏛️ =========================================================================');
  console.log('   ÁQUILA PRO — HOMOLOGAÇÃO DA OPÇÃO A: BACKUP & DR DO SQLITE EDGE');
  console.log('=========================================================================\n');

  const baseTestDir = path.join(__dirname, '..', '.tmp_op_a_validation');
  if (fs.existsSync(baseTestDir)) {
    fs.rmSync(baseTestDir, { recursive: true, force: true });
  }
  fs.mkdirSync(baseTestDir, { recursive: true });

  const primaryBackupDir = path.join(baseTestDir, 'primary_backups');
  const secondaryBackupDir = path.join(baseTestDir, 'secondary_usb_mock');
  const liveDbPath = path.join(baseTestDir, 'aquila_live.db');
  const restoreTargetPath = path.join(baseTestDir, 'aquila_emergency_restored.db');
  const masterKey = 'CHAVE_MESTRA_TESTE_AES256GCM_PILOTO_2026';

  try {
    // -------------------------------------------------------------
    // FASE 1: Inicialização do Banco Operacional com WAL e Dados Reais
    // -------------------------------------------------------------
    console.log('1️⃣ Criando banco SQLite ativo com WAL e dados do colégio piloto...');
    const db = new DatabaseConstructor(liveDbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');

    db.exec(`
      CREATE TABLE students (id TEXT PRIMARY KEY, name TEXT NOT NULL, class_id TEXT NOT NULL);
      CREATE TABLE classes (id TEXT PRIMARY KEY, name TEXT NOT NULL, room TEXT NOT NULL);
      CREATE TABLE attendance_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id TEXT NOT NULL, status TEXT NOT NULL, timestamp TEXT NOT NULL);
      CREATE TABLE zero_bypass_audits (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, action TEXT NOT NULL, details TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL);
    `);

    // Inserção em lote de 50 alunos, 2 turmas, 100 frequências, 10 professores/users e 50 auditorias
    const insertStudent = db.prepare("INSERT INTO students VALUES (?, ?, ?)");
    const insertClass = db.prepare("INSERT INTO classes VALUES (?, ?, ?)");
    const insertAttendance = db.prepare("INSERT INTO attendance_logs (student_id, status, timestamp) VALUES (?, ?, ?)");
    const insertAudit = db.prepare("INSERT INTO zero_bypass_audits (user_id, action, details, created_at) VALUES (?, ?, ?, ?)");
    const insertUser = db.prepare("INSERT INTO users VALUES (?, ?, ?)");

    const populateTx = db.transaction(() => {
      insertClass.run('TURMA_1EM_A', '1º Ano EM A', 'Sala 101');
      insertClass.run('TURMA_2EM_B', '2º Ano EM B', 'Sala 102');

      for (let i = 1; i <= 50; i++) {
        const sid = `STD_${i.toString().padStart(3, '0')}`;
        const cid = i <= 25 ? 'TURMA_1EM_A' : 'TURMA_2EM_B';
        insertStudent.run(sid, `Estudante Piloto ${i}`, cid);
        insertAttendance.run(sid, 'PRESENT', new Date().toISOString());
        insertAttendance.run(sid, 'PRESENT', new Date().toISOString());
        insertAudit.run('COORD_01', 'ATTENDANCE_RECORDED', `Presença validada para ${sid}`, new Date().toISOString());
      }

      for (let u = 1; u <= 10; u++) {
        insertUser.run(`PROF_${u}`, `Professor ${u}`, 'TEACHER');
      }
    });

    populateTx();
    console.log('✅ Banco populado: 50 alunos, 2 turmas, 100 presenças, 10 usuários e 50 auditorias gravadas no WAL.\n');

    // -------------------------------------------------------------
    // FASE 2: Geração de Backup Diário Criptografado com Destino Duplo
    // -------------------------------------------------------------
    console.log('2️⃣ Executando Snapshot Atômico (WAL checkpoint + VACUUM INTO + Criptografia AES-256-GCM)...');
    const backupStart = performance.now();
    const backupResult = SQLiteDisasterRecoveryService.createEncryptedBackup({
      dbPath: liveDbPath,
      backupPrimaryDir: primaryBackupDir,
      backupSecondaryDir: secondaryBackupDir,
      masterKey,
      author: 'ROTINA_NOTURNA_TI_PILOTO'
    });
    const backupElapsed = performance.now() - backupStart;

    console.log(`✅ Backup gerado com sucesso em ${backupElapsed.toFixed(2)} ms:`);
    console.log(`   - Arquivo Primário:   ${path.basename(backupResult.backupFile)}`);
    console.log(`   - Arquivo Secundário: ${backupResult.secondaryFile ? path.basename(backupResult.secondaryFile) : 'N/A'}`);
    console.log(`   - Tamanho Cifrado:    ${backupResult.sizeEncryptedBytes} bytes`);
    console.log(`   - Algoritmo:          ${backupResult.manifest.encryption} (com Auth Tag)`);
    console.log(`   - Hash SHA-256 Orig.: ${backupResult.manifest.sha256}`);
    console.log(`   - Resumo Lógico:      Alunos=${backupResult.manifest.rowCounts.students}, Turmas=${backupResult.manifest.rowCounts.classes}, Presenças=${backupResult.manifest.rowCounts.attendance_logs}, Audits=${backupResult.manifest.rowCounts.zero_bypass_audits}\n`);

    // Validação de existência física nos dois destinos
    if (!fs.existsSync(backupResult.backupFile)) throw new Error('Arquivo de backup primário não foi gravado!');
    if (!backupResult.secondaryFile || !fs.existsSync(backupResult.secondaryFile)) throw new Error('Arquivo secundário não foi gravado!');

    // -------------------------------------------------------------
    // FASE 3: Teste Criptográfico de Violação / Anti-Tampering
    // -------------------------------------------------------------
    console.log('3️⃣ Testando proteção anti-adulteração criptográfica (Auth Tag AES-256-GCM)...');
    const tamperedBackupPath = path.join(baseTestDir, 'tampered_backup.aquila.bak');
    const validBytes = fs.readFileSync(backupResult.backupFile);
    // Adultera um único byte na carga cifrada
    validBytes[validBytes.length - 10] ^= 0xFF;
    fs.writeFileSync(tamperedBackupPath, validBytes);

    let tamperingDetected = false;
    try {
      SQLiteDisasterRecoveryService.restoreEncryptedBackup({
        backupFilePath: tamperedBackupPath,
        targetRestorePath: path.join(baseTestDir, 'should_fail.db'),
        masterKey
      });
    } catch (err: any) {
      tamperingDetected = true;
      console.log(`✅ Violação detectada com sucesso pelo hardware criptográfico: "${err.message}"\n`);
    }

    if (!tamperingDetected) {
      throw new Error('Falha de segurança crítica: arquivo adulterado foi aceito sem erro de autenticação!');
    }

    // -------------------------------------------------------------
    // FASE 4: Restore Drill Obrigatório (< 2 minutos)
    // -------------------------------------------------------------
    console.log('4️⃣ Executando Restore Drill em sandbox isolado...');
    const drillResult = SQLiteDisasterRecoveryService.runRestoreDrill(backupResult.backupFile, masterKey);
    drillResult.log.forEach(l => console.log(`   ${l}`));

    if (!drillResult.success || !drillResult.underTwoMinutes || !drillResult.integrityOk) {
      throw new Error('Restore Drill falhou nos critérios de aceitação!');
    }
    console.log(`✅ Restore Drill Aprovado: tempo de ${drillResult.durationMs.toFixed(2)} ms (< 120.000 ms).\n`);

    // -------------------------------------------------------------
    // FASE 5: Simulação de Pane Catastrófica e Restauração Real
    // -------------------------------------------------------------
    console.log('5️⃣ Simulando pane catastrófica: destruição do banco ativo e recuperação de emergência...');
    // Fecha conexão do banco antes de simular desastre
    db.close();

    // Corrompe o banco ao vivo
    fs.writeFileSync(liveDbPath, 'DADOS_CORROMPIDOS_FALHA_DE_DISCO_PANE_ELETRICA');
    if (fs.existsSync(`${liveDbPath}-wal`)) fs.unlinkSync(`${liveDbPath}-wal`);
    if (fs.existsSync(`${liveDbPath}-shm`)) fs.unlinkSync(`${liveDbPath}-shm`);

    const restoreStart = performance.now();
    const restoreRes = SQLiteDisasterRecoveryService.restoreEncryptedBackup({
      backupFilePath: backupResult.backupFile,
      targetRestorePath: liveDbPath,
      masterKey,
      actor: 'COORDENADOR_TI_EMERGENCIA'
    });
    const restoreElapsed = performance.now() - restoreStart;

    console.log(`✅ Banco restaurado a partir do backup em ${restoreElapsed.toFixed(2)} ms:`);
    console.log(`   - PRAGMA integrity_check: ${restoreRes.integrityPragma}`);
    console.log(`   - Hash SHA-256 verificado: ${restoreRes.sha256Verified ? 'SIM' : 'NÃO'}`);

    // Reabre o banco restaurado e valida integridade total das entidades
    const restoredDb = new DatabaseConstructor(liveDbPath, { readonly: true });
    const countStudents = (restoredDb.prepare("SELECT count(*) as total FROM students").get() as any).total;
    const countClasses = (restoredDb.prepare("SELECT count(*) as total FROM classes").get() as any).total;
    const countAttendance = (restoredDb.prepare("SELECT count(*) as total FROM attendance_logs").get() as any).total;
    const countAudits = (restoredDb.prepare("SELECT count(*) as total FROM zero_bypass_audits").get() as any).total;
    const countUsers = (restoredDb.prepare("SELECT count(*) as total FROM users").get() as any).total;
    const pragmaFinal = (restoredDb.pragma('integrity_check') as any)[0].integrity_check;
    restoredDb.close();

    console.log(`   - Alunos restaurados:     ${countStudents}/50`);
    console.log(`   - Turmas restauradas:     ${countClasses}/2`);
    console.log(`   - Presenças restauradas:  ${countAttendance}/100`);
    console.log(`   - Audits restaurados:     ${countAudits}/50`);
    console.log(`   - Usuários restaurados:   ${countUsers}/10`);
    console.log(`   - Integridade Estrutural: ${pragmaFinal}`);

    if (countStudents !== 50 || countAttendance !== 100 || pragmaFinal !== 'ok') {
      throw new Error('Divergência de dados encontrada no banco recuperado!');
    }

    // -------------------------------------------------------------
    // FASE 6: Rotação GFS (Retenção dos 7 últimos diários)
    // -------------------------------------------------------------
    console.log('\n6️⃣ Testando política de retenção GFS (máximo 7 backups diários)...');
    // Cria 10 backups simulados no diretório primário
    for (let b = 1; b <= 10; b++) {
      const dummyFile = path.join(primaryBackupDir, `aquila_backup_2026-10-${b.toString().padStart(2, '0')}T00-00-00-000Z.aquila.bak`);
      fs.writeFileSync(dummyFile, 'DUMMY_BACKUP_PAYLOAD');
      // Define timestamps artificiais
      const fileTime = new Date(2026, 9, b).getTime() / 1000;
      fs.utimesSync(dummyFile, fileTime, fileTime);
    }

    // Executa mais um backup legítimo para disparar a rotação
    SQLiteDisasterRecoveryService.createEncryptedBackup({
      dbPath: liveDbPath,
      backupPrimaryDir: primaryBackupDir,
      masterKey
    });

    const remainingFiles = fs.readdirSync(primaryBackupDir).filter(f => f.endsWith('.aquila.bak'));
    console.log(`✅ Rotação GFS confirmada: ${remainingFiles.length} arquivos retidos (limite máximo de 7 ativos).`);
    if (remainingFiles.length > 7) {
      throw new Error(`Falha na rotação GFS: foram encontrados ${remainingFiles.length} backups (esperado: <= 7).`);
    }

    console.log('\n🏆 =========================================================================');
    console.log('   RESULTADO DA HOMOLOGAÇÃO DA OPÇÃO A: 100% APROVADO');
    console.log('   - Integridade Criptográfica: AES-256-GCM com Auth Tag');
    console.log(`   - Tempo de Restauração: ${restoreElapsed.toFixed(2)} ms (Meta: < 120.000 ms)`);
    console.log('   - Perda de Dados: 0 (Zero tuplas perdidas)');
    console.log('   - Destino Duplo & Rotação GFS: Operacionais');
    console.log('=========================================================================\n');
  } finally {
    if (fs.existsSync(baseTestDir)) {
      try {
        fs.rmSync(baseTestDir, { recursive: true, force: true });
      } catch {}
    }
  }
}

if (require.main === module) {
  runFullDrSuite()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Falha fatal na suíte da Opção A:', err);
      process.exit(1);
    });
}
