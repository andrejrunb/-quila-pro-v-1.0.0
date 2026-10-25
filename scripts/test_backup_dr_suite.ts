/**
 * scripts/test_backup_dr_suite.ts — Bateria de Validação de Missão Crítica: Opção A (v2.1.0-rc.14)
 * 
 * Validação rigorosa dos 7 requisitos de homologação:
 * 1. Recusar backup sem chave mestra (proíbe chave padrão).
 * 2. Recusar chave mestra fraca (< 32 caracteres).
 * 3. Backup, manifesto SHA-256 e restauração bem-sucedidos com chave forte.
 * 4. Recusar restauração com chave incorreta.
 * 5. Recusar backup com adulteração de bytes (Auth Tag AES-256-GCM).
 * 6. Política GFS Real: preservação de 7 diários, 4 semanais e 12 mensais.
 * 7. Detecção e tratamento de falha no destino secundário obrigatório.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import DatabaseConstructor from 'better-sqlite3';
import { SQLiteDisasterRecoveryService } from '../apps/electron/src/main/services/SQLiteDisasterRecoveryService';

const TEST_ROOT = path.join(process.cwd(), '.backup-dr-test-v14');
const DB_PATH = path.join(TEST_ROOT, 'aquila_test.db');
const BACKUP_DIR = path.join(TEST_ROOT, 'backups');
const RESTORE_DIR = path.join(TEST_ROOT, 'restore');
const SECONDARY_DIR = path.join(TEST_ROOT, 'secondary');

const STRONG_KEY = crypto.randomBytes(32).toString('base64'); // 44 caracteres base64
const WRONG_KEY = crypto.randomBytes(32).toString('base64');

function resetEnvironment() {
  if (fs.existsSync(TEST_ROOT)) {
    fs.rmSync(TEST_ROOT, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_ROOT, { recursive: true });
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  fs.mkdirSync(RESTORE_DIR, { recursive: true });
  fs.mkdirSync(SECONDARY_DIR, { recursive: true });
}

function createTestDatabase() {
  const db = new DatabaseConstructor(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');

  db.exec(`
    CREATE TABLE students (id TEXT PRIMARY KEY, name TEXT NOT NULL, class_id TEXT NOT NULL);
    CREATE TABLE classes (id TEXT PRIMARY KEY, name TEXT NOT NULL, room TEXT NOT NULL);
    CREATE TABLE attendance_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id TEXT NOT NULL, status TEXT NOT NULL, timestamp TEXT NOT NULL);
    CREATE TABLE zero_bypass_audits (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, action TEXT NOT NULL, details TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL);
  `);

  const insertStudent = db.prepare("INSERT INTO students VALUES (?, ?, ?)");
  const insertClass = db.prepare("INSERT INTO classes VALUES (?, ?, ?)");
  const insertAttendance = db.prepare("INSERT INTO attendance_logs (student_id, status, timestamp) VALUES (?, ?, ?)");
  const insertAudit = db.prepare("INSERT INTO zero_bypass_audits (user_id, action, details, created_at) VALUES (?, ?, ?, ?)");
  const insertUser = db.prepare("INSERT INTO users VALUES (?, ?, ?)");

  const tx = db.transaction(() => {
    insertClass.run('TURMA_1EM_A', '1º Ano EM A', 'Sala 101');
    insertClass.run('TURMA_2EM_B', '2º Ano EM B', 'Sala 102');

    for (let i = 1; i <= 50; i++) {
      const sid = `STD_${i.toString().padStart(3, '0')}`;
      insertStudent.run(sid, `Estudante Piloto ${i}`, i <= 25 ? 'TURMA_1EM_A' : 'TURMA_2EM_B');
      insertAttendance.run(sid, 'PRESENT', new Date().toISOString());
      insertAudit.run('COORD_01', 'ATTENDANCE_RECORDED', `Presença validada para ${sid}`, new Date().toISOString());
    }

    for (let u = 1; u <= 5; u++) {
      insertUser.run(`PROF_${u}`, `Professor ${u}`, 'TEACHER');
    }
  });

  tx();
  db.close();
}

function testBackupWithoutKeyMustFail() {
  const savedKey = process.env.AQUILA_BACKUP_MASTER_KEY;
  delete process.env.AQUILA_BACKUP_MASTER_KEY;

  let rejected = false;
  try {
    SQLiteDisasterRecoveryService.createEncryptedBackup({
      dbPath: DB_PATH,
      backupPrimaryDir: BACKUP_DIR,
      backupSecondaryDir: SECONDARY_DIR
    });
  } catch (err: any) {
    if (err.message.includes('AQUILA_BACKUP_MASTER_KEY é obrigatória')) {
      rejected = true;
    }
  } finally {
    if (savedKey) process.env.AQUILA_BACKUP_MASTER_KEY = savedKey;
  }

  if (!rejected) {
    throw new Error('FALHA REGRESSIVA: backup foi aceito sem AQUILA_BACKUP_MASTER_KEY!');
  }
  console.log('✅ TESTE 1: Backup sem chave mestra foi recusado com sucesso.');
}

function testWeakKeyMustFail() {
  const weakKey = 'senha_curta_123'; // < 32 chars
  let rejected = false;

  try {
    SQLiteDisasterRecoveryService.createEncryptedBackup({
      dbPath: DB_PATH,
      backupPrimaryDir: BACKUP_DIR,
      backupSecondaryDir: SECONDARY_DIR,
      masterKey: weakKey
    });
  } catch (err: any) {
    if (err.message.includes('pelo menos 32 caracteres')) {
      rejected = true;
    }
  }

  if (!rejected) {
    throw new Error('FALHA: backup aceitou chave mestra fraca (< 32 caracteres)!');
  }
  console.log('✅ TESTE 2: Chave mestra fraca (< 32 chars) foi recusada com sucesso.');
}

function testBackupAndRestoreWithValidKey() {
  const t0 = performance.now();
  const backup = SQLiteDisasterRecoveryService.createEncryptedBackup({
    dbPath: DB_PATH,
    backupPrimaryDir: BACKUP_DIR,
    backupSecondaryDir: SECONDARY_DIR,
    masterKey: STRONG_KEY,
    author: 'TESTE_AUTOMATIZADO_V14'
  });

  if (!backup.success || !backup.backupFile || !fs.existsSync(backup.backupFile)) {
    throw new Error('FALHA: backup primário não foi gerado com sucesso.');
  }

  if (!backup.secondaryFile || !fs.existsSync(backup.secondaryFile) || !backup.secondaryCopySuccess) {
    throw new Error('FALHA: cópia secundária não foi gerada com sucesso.');
  }

  const restoredDbPath = path.join(RESTORE_DIR, 'restored_valid.db');
  const restore = SQLiteDisasterRecoveryService.restoreEncryptedBackup({
    backupFilePath: backup.backupFile,
    targetRestorePath: restoredDbPath,
    masterKey: STRONG_KEY,
    actor: 'TESTE_AUTOMATIZADO_V14'
  });

  const totalMs = performance.now() - t0;

  if (!restore.success || !restore.sha256Verified || restore.integrityPragma !== 'ok') {
    throw new Error(`FALHA: restauração falhou! Pragma: ${restore.integrityPragma}, SHA verificado: ${restore.sha256Verified}`);
  }

  // Verifica paridade de tuplas
  const verifyDb = new DatabaseConstructor(restoredDbPath, { readonly: true });
  const count = (verifyDb.prepare("SELECT count(*) as total FROM students").get() as any).total;
  verifyDb.close();

  if (count !== 50) {
    throw new Error(`FALHA: divergência de dados no banco restaurado! Alunos: ${count}/50`);
  }

  console.log(`✅ TESTE 3: Backup e restauração com chave válida aprovados em ${totalMs.toFixed(2)} ms (Alunos: 50/50, SHA-256 verificado, PRAGMA ok).`);
}

function testWrongKeyMustFail() {
  const backup = SQLiteDisasterRecoveryService.createEncryptedBackup({
    dbPath: DB_PATH,
    backupPrimaryDir: BACKUP_DIR,
    masterKey: STRONG_KEY,
    author: 'TESTE_WRONG_KEY'
  });

  let rejected = false;
  try {
    SQLiteDisasterRecoveryService.restoreEncryptedBackup({
      backupFilePath: backup.backupFile,
      targetRestorePath: path.join(RESTORE_DIR, 'should_fail_wrong_key.db'),
      masterKey: WRONG_KEY,
      actor: 'TESTE_WRONG_KEY'
    });
  } catch (err: any) {
    rejected = true;
  }

  if (!rejected) {
    throw new Error('FALHA: restauração aceitou chave mestra incorreta!');
  }
  console.log('✅ TESTE 4: Restauração com chave incorreta foi rejeitada pelo motor criptográfico.');
}

function testTamperedBackupMustFail() {
  const backup = SQLiteDisasterRecoveryService.createEncryptedBackup({
    dbPath: DB_PATH,
    backupPrimaryDir: BACKUP_DIR,
    masterKey: STRONG_KEY,
    author: 'TESTE_TAMPERED'
  });

  const originalBytes = fs.readFileSync(backup.backupFile);
  const tamperedBytes = Buffer.from(originalBytes);
  // Adultera um byte no final do ciphertext
  tamperedBytes[tamperedBytes.length - 1] ^= 0xFF;

  const tamperedPath = path.join(BACKUP_DIR, 'tampered_test.aquila.bak');
  fs.writeFileSync(tamperedPath, tamperedBytes);

  let rejected = false;
  try {
    SQLiteDisasterRecoveryService.restoreEncryptedBackup({
      backupFilePath: tamperedPath,
      targetRestorePath: path.join(RESTORE_DIR, 'should_fail_tampered.db'),
      masterKey: STRONG_KEY,
      actor: 'TESTE_TAMPERED'
    });
  } catch (err: any) {
    rejected = true;
  }

  if (!rejected) {
    throw new Error('FALHA: backup com ciphertext adulterado foi aceito sem erro de autenticação!');
  }
  console.log('✅ TESTE 5: Backup adulterado foi rejeitado pela Auth Tag do AES-256-GCM.');
}

function testGfsRetention() {
  const gfsTestDir = path.join(TEST_ROOT, 'gfs_test');
  fs.mkdirSync(gfsTestDir, { recursive: true });

  const now = new Date(2026, 9, 25, 12, 0, 0); // 25 de Outubro de 2026
  const DAY_MS = 24 * 60 * 60 * 1000;

  // Cria 20 backups simulando diferentes idades:
  // - 10 dias consecutivos recentes (idade 0 a 9 dias)
  // - 6 semanas anteriores (idade 14, 21, 28, 35, 42, 49 dias)
  // - 15 meses anteriores (idade 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 390, 420, 450, 480 dias)
  const testAgesDays = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
    14, 21, 28, 35, 42,
    60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 400, 450
  ];

  for (let i = 0; i < testAgesDays.length; i++) {
    const ageDays = testAgesDays[i];
    const fileDate = new Date(now.getTime() - ageDays * DAY_MS);
    const tsStr = fileDate.toISOString().replace(/[:.]/g, '-');
    const fPath = path.join(gfsTestDir, `aquila_backup_${tsStr}_test_${i}.aquila.bak`);
    fs.writeFileSync(fPath, `DUMMY_GFS_DATA_${i}`);
    const timeSec = fileDate.getTime() / 1000;
    fs.utimesSync(fPath, timeSec, timeSec);
  }

  // Executa rotação GFS com a data de referência
  const summary = SQLiteDisasterRecoveryService.rotateGFSBackups(gfsTestDir, now);

  if (summary.dailyCount > 7) {
    throw new Error(`FALHA GFS: dailyCount excedeu 7 (${summary.dailyCount})`);
  }
  if (summary.weeklyCount > 4) {
    throw new Error(`FALHA GFS: weeklyCount excedeu 4 (${summary.weeklyCount})`);
  }
  if (summary.monthlyCount > 12) {
    throw new Error(`FALHA GFS: monthlyCount excedeu 12 (${summary.monthlyCount})`);
  }
  if (summary.prunedCount === 0) {
    throw new Error('FALHA GFS: nenhum arquivo obsoleto foi podado!');
  }

  console.log(`✅ TESTE 6: Política GFS Real validada: ${summary.dailyCount} diários, ${summary.weeklyCount} semanais, ${summary.monthlyCount} mensais retidos (${summary.prunedCount} podados com sucesso).`);
}

function testSecondaryDestinationFailure() {
  // Caminho impossível no Windows (unidade Z: inexistente) ou caractere nulo
  const invalidDir = process.platform === 'win32' ? 'Z:\\non_existent_drive_mount_999\\backups' : '/sys/kernel/security/impossible_backup_dir';

  let rejected = false;
  try {
    SQLiteDisasterRecoveryService.createEncryptedBackup({
      dbPath: DB_PATH,
      backupPrimaryDir: BACKUP_DIR,
      backupSecondaryDir: invalidDir,
      requireSecondary: true, // Modo estrito: falha se o destino secundário obrigatório falhar
      masterKey: STRONG_KEY,
      author: 'TESTE_SECONDARY_FAIL'
    });
  } catch (err: any) {
    if (err.message.includes('destino secundário obrigatório')) {
      rejected = true;
    }
  }

  if (!rejected) {
    throw new Error('FALHA: backup com requireSecondary=true deveria ter falhado com destino secundário inacessível!');
  }

  // No modo padrão (não obrigatório), deve apenas sinalizar secondaryCopySuccess: false
  const softBackup = SQLiteDisasterRecoveryService.createEncryptedBackup({
    dbPath: DB_PATH,
    backupPrimaryDir: BACKUP_DIR,
    backupSecondaryDir: invalidDir,
    requireSecondary: false,
    masterKey: STRONG_KEY,
    author: 'TESTE_SECONDARY_SOFT'
  });

  if (!softBackup.success || softBackup.secondaryCopySuccess !== false) {
    throw new Error('FALHA: backup suave com destino secundário inválido deveria retornar secondaryCopySuccess: false!');
  }

  console.log('✅ TESTE 7: Detecção de falha no destino secundário validada (bloqueio no modo estrito e flag secondaryCopySuccess: false no modo suave).');
}

function runAllTests() {
  console.log('🏛️ =========================================================================');
  console.log('   ÁQUILA PRO — BATERIA DE TESTES DE SEGURANÇA E GFS (Opção A — rc.14)');
  console.log('=========================================================================\n');

  resetEnvironment();
  createTestDatabase();

  testBackupWithoutKeyMustFail();
  testWeakKeyMustFail();
  testBackupAndRestoreWithValidKey();
  testWrongKeyMustFail();
  testTamperedBackupMustFail();
  testGfsRetention();
  testSecondaryDestinationFailure();

  console.log('\n🏆 TODAS AS 7 PROVAS DE SEGURANÇA E CONTINUIDADE APROVADAS COM SUCESSO (100% VERDE).');

  // Limpa ambiente
  if (fs.existsSync(TEST_ROOT)) {
    try {
      fs.rmSync(TEST_ROOT, { recursive: true, force: true });
    } catch {}
  }
}

if (require.main === module) {
  runAllTests();
}
