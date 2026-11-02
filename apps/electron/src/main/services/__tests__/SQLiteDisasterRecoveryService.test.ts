import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
jest.unmock('better-sqlite3');
import Database from 'better-sqlite3';
import { SQLiteDisasterRecoveryService } from '../SQLiteDisasterRecoveryService';

const VALID_MASTER_KEY = 'super-secret-master-key-aquila-pro-32chars!';

describe('SQLiteDisasterRecoveryService — Trilha B: Backup e Restauração Crash-Safe', () => {
  let tmpDir: string;
  let sourceDbPath: string;
  let backupDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aquila-dr-test-'));
    sourceDbPath = path.join(tmpDir, 'aquila_source.db');
    backupDir = path.join(tmpDir, 'backups');
    fs.mkdirSync(backupDir, { recursive: true });

    // Cria banco com tabelas essenciais para o censo
    const db = new Database(sourceDbPath);
    db.pragma('journal_mode = WAL');
    db.exec(`
      CREATE TABLE students (id TEXT PRIMARY KEY, name TEXT NOT NULL);
      CREATE TABLE classes (id TEXT PRIMARY KEY, name TEXT NOT NULL);
      CREATE TABLE attendance_logs (id TEXT PRIMARY KEY, student_id TEXT NOT NULL);
      CREATE TABLE zero_bypass_audits (id TEXT PRIMARY KEY, action TEXT NOT NULL);
      CREATE TABLE users (id TEXT PRIMARY KEY, username TEXT NOT NULL);
    `);
    db.prepare('INSERT INTO students (id, name) VALUES (?, ?)').run('std_1', 'Aluno Silva');
    db.prepare('INSERT INTO classes (id, name) VALUES (?, ?)').run('cls_1', 'Turma 7A');
    db.prepare('INSERT INTO users (id, username) VALUES (?, ?)').run('usr_1', 'admin');
    db.close();
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {
        /* best effort on windows */
      }
    }
  });

  it('1. Recusa backup e restauração com chave fraca (< 32 caracteres) ou ausente', () => {
    expect(() =>
      SQLiteDisasterRecoveryService.createEncryptedBackup({
        dbPath: sourceDbPath,
        backupPrimaryDir: backupDir,
        masterKey: 'curta',
      })
    ).toThrow('pelo menos 32 caracteres');

    expect(() =>
      SQLiteDisasterRecoveryService.restoreEncryptedBackup({
        backupFilePath: 'invalid.bak',
        targetRestorePath: sourceDbPath,
        masterKey: 'curta',
      })
    ).toThrow('pelo menos 32 caracteres');
  });

  it('2. Cria backup criptografado com VACUUM INTO, dupla verificação de integridade e censo de tuplas', () => {
    const res = SQLiteDisasterRecoveryService.createEncryptedBackup({
      dbPath: sourceDbPath,
      backupPrimaryDir: backupDir,
      masterKey: VALID_MASTER_KEY,
      author: 'QA_OPERATOR',
    });

    expect(res.success).toBe(true);
    expect(fs.existsSync(res.backupFile)).toBe(true);
    expect(res.manifest.rowCounts.students).toBe(1);
    expect(res.manifest.rowCounts.classes).toBe(1);
    expect(res.manifest.rowCounts.users).toBe(1);
    expect(res.manifest.encryption).toBe('AES-256-GCM');
    expect(res.walCheckpointed).toBe(true);
  });

  it('3. Restaura backup criptografado com o protocolo de 7 etapas e valida SHA-256 e PRAGMAs', () => {
    const backupRes = SQLiteDisasterRecoveryService.createEncryptedBackup({
      dbPath: sourceDbPath,
      backupPrimaryDir: backupDir,
      masterKey: VALID_MASTER_KEY,
    });

    const targetRestorePath = path.join(tmpDir, 'aquila_restored.db');
    const restoreRes = SQLiteDisasterRecoveryService.restoreEncryptedBackup({
      backupFilePath: backupRes.backupFile,
      targetRestorePath,
      masterKey: VALID_MASTER_KEY,
      actor: 'DIRECTOR_MARIANA',
    });

    expect(restoreRes.success).toBe(true);
    expect(restoreRes.integrityPragma).toBe('ok');
    expect(restoreRes.sha256Verified).toBe(true);
    expect(fs.existsSync(targetRestorePath)).toBe(true);

    // Valida que os dados foram restaurados corretamente
    const restoredDb = new Database(targetRestorePath, { readonly: true });
    const student = restoredDb.prepare('SELECT name FROM students WHERE id = ?').get('std_1') as { name: string };
    expect(student?.name).toBe('Aluno Silva');
    restoredDb.close();

    // Valida que o diário de restauração foi limpo após o sucesso
    const journalPath = path.join(path.dirname(targetRestorePath), 'restore_journal.json');
    expect(fs.existsSync(journalPath)).toBe(false);
  });

  it('4. Rejeita restauração se a chave estiver incorreta ou se o arquivo for adulterado', () => {
    const backupRes = SQLiteDisasterRecoveryService.createEncryptedBackup({
      dbPath: sourceDbPath,
      backupPrimaryDir: backupDir,
      masterKey: VALID_MASTER_KEY,
    });

    const targetRestorePath = path.join(tmpDir, 'aquila_restored_fail.db');

    // Chave incorreta
    expect(() =>
      SQLiteDisasterRecoveryService.restoreEncryptedBackup({
        backupFilePath: backupRes.backupFile,
        targetRestorePath,
        masterKey: 'chave-incorreta-mas-com-pelo-menos-32-chars-longos!',
      })
    ).toThrow('Falha de integridade criptográfica');

    // Arquivo adulterado
    const backupBytes = fs.readFileSync(backupRes.backupFile);
    backupBytes[backupBytes.length - 10] ^= 0xff; // Inverte bits
    const tamperedPath = path.join(backupDir, 'tampered.bak');
    fs.writeFileSync(tamperedPath, backupBytes);

    expect(() =>
      SQLiteDisasterRecoveryService.restoreEncryptedBackup({
        backupFilePath: tamperedPath,
        targetRestorePath,
        masterKey: VALID_MASTER_KEY,
      })
    ).toThrow('Falha de integridade criptográfica');
  });

  it('5. Executa Restore Drill em sandbox com tempo < 120s e validação de tuplas', () => {
    const backupRes = SQLiteDisasterRecoveryService.createEncryptedBackup({
      dbPath: sourceDbPath,
      backupPrimaryDir: backupDir,
      masterKey: VALID_MASTER_KEY,
    });

    const drillRes = SQLiteDisasterRecoveryService.runRestoreDrill(backupRes.backupFile, VALID_MASTER_KEY);

    expect(drillRes.success).toBe(true);
    expect(drillRes.underTwoMinutes).toBe(true);
    expect(drillRes.integrityOk).toBe(true);
    expect(drillRes.tuplesVerified).toBe(true);
    expect(drillRes.durationMs).toBeLessThan(120_000);
  });

  it('6. Rotina recoverPendingRestoreOnBoot recupera estado com segurança se encontrar journal pendente', () => {
    const journalPath = path.join(tmpDir, 'restore_journal.json');
    const stagingPath = path.join(tmpDir, 'staging_test.db');
    fs.writeFileSync(stagingPath, 'dummy staging content');

    // Simula interrupção na fase PREPARING_REPLACEMENT
    fs.writeFileSync(
      journalPath,
      JSON.stringify({
        phase: 'PREPARING_REPLACEMENT',
        backupFilePath: 'backup.bak',
        stagingPath,
        targetRestorePath: sourceDbPath,
        startedAt: new Date().toISOString(),
        actor: 'TEST',
      })
    );

    const recovered = SQLiteDisasterRecoveryService.recoverPendingRestoreOnBoot(tmpDir);
    expect(recovered).toBe(true);
    expect(fs.existsSync(journalPath)).toBe(false);
    expect(fs.existsSync(stagingPath)).toBe(false);

    // Banco original permanece intacto
    const liveDb = new Database(sourceDbPath, { readonly: true });
    expect(liveDb.prepare('SELECT count(*) as total FROM students').get()).toEqual({ total: 1 });
    liveDb.close();
  });
});
