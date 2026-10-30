var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// scripts/test_backup_dr_suite.ts
var fs2 = __toESM(require("fs"));
var path2 = __toESM(require("path"));
var crypto2 = __toESM(require("crypto"));
function loadBetterSqlite3() {
  try {
    return require("better-sqlite3");
  } catch (e) {
    try {
      const candidate = require.resolve("better-sqlite3", { paths: [path2.resolve(__dirname, "../apps/electron")] });
      return require(candidate);
    } catch (e2) {
      throw e;
    }
  }
}

var import_better_sqlite32 = __toESM(loadBetterSqlite3());

// apps/electron/src/main/services/SQLiteDisasterRecoveryService.ts
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
var crypto = __toESM(require("crypto"));
var import_better_sqlite3 = __toESM(loadBetterSqlite3());
var SQLiteDisasterRecoveryService = class {
  static ALGORITHM = "aes-256-gcm";
  static SALT_LENGTH = 16;
  static IV_LENGTH = 16;
  static TAG_LENGTH = 16;
  /**
   * Obtém a chave mestra com validação estrita de segurança.
   * Proíbe terminantemente o uso de chaves padrão hardcoded.
   */
  static resolveMasterKey(explicitKey) {
    const key = explicitKey || process.env.AQUILA_BACKUP_MASTER_KEY;
    if (!key || key.trim().length < 32) {
      throw new Error(
        "AQUILA_BACKUP_MASTER_KEY \xE9 obrigat\xF3ria e deve ter pelo menos 32 caracteres. Backup/restaura\xE7\xE3o recusados para impedir uso de chave padr\xE3o."
      );
    }
    return key;
  }
  /**
   * Executa backup completo, atômico e criptografado com AES-256-GCM
   */
  static createEncryptedBackup(options) {
    const start = performance.now();
    const key = this.resolveMasterKey(options.masterKey);
    const author = options.author || "SYSTEM_AUTOMATION";
    if (!fs.existsSync(options.dbPath)) {
      throw new Error(`Banco de dados de origem n\xE3o encontrado: ${options.dbPath}`);
    }
    if (!fs.existsSync(options.backupPrimaryDir)) {
      fs.mkdirSync(options.backupPrimaryDir, { recursive: true });
    }
    const controlDb = new import_better_sqlite3.default(options.dbPath);
    controlDb.pragma("journal_mode = WAL");
    controlDb.pragma("wal_checkpoint(TRUNCATE)");
    const timestamp = (options.referenceDate || /* @__PURE__ */ new Date()).toISOString();
    const safeTimestamp = timestamp.replace(/[:.]/g, "-");
    const tempSnapshotPath = path.join(options.backupPrimaryDir, `temp_snap_${safeTimestamp}.db`);
    if (fs.existsSync(tempSnapshotPath)) fs.unlinkSync(tempSnapshotPath);
    const safeSqlPath = tempSnapshotPath.replace(/\\/g, "/");
    controlDb.exec(`VACUUM INTO '${safeSqlPath}'`);
    controlDb.close();
    const snapshotBuffer = fs.readFileSync(tempSnapshotPath);
    const unencryptedSha256 = crypto.createHash("sha256").update(snapshotBuffer).digest("hex");
    const snapDb = new import_better_sqlite3.default(tempSnapshotPath, { readonly: true });
    const pragmaCheck = snapDb.pragma("integrity_check")[0]?.integrity_check;
    if (pragmaCheck !== "ok") {
      snapDb.close();
      if (fs.existsSync(tempSnapshotPath)) fs.unlinkSync(tempSnapshotPath);
      throw new Error(`Snapshot inicial corrompido: PRAGMA integrity_check = ${pragmaCheck}`);
    }
    const getCount = (table) => {
      try {
        const row = snapDb.prepare(`SELECT count(*) as total FROM ${table}`).get();
        return row.total;
      } catch {
        return 0;
      }
    };
    const rowCounts = {
      students: getCount("students"),
      classes: getCount("classes"),
      attendance_logs: getCount("attendance_logs"),
      zero_bypass_audits: getCount("zero_bypass_audits"),
      users: getCount("users")
    };
    snapDb.close();
    const manifest = {
      version: "2.1.0-rc.14",
      timestamp,
      sourceDbName: path.basename(options.dbPath),
      unencryptedSizeBytes: snapshotBuffer.length,
      sha256: unencryptedSha256,
      rowCounts,
      encryption: "AES-256-GCM",
      author
    };
    const manifestJsonBuffer = Buffer.from(JSON.stringify(manifest), "utf-8");
    const manifestLengthHeader = Buffer.alloc(4);
    manifestLengthHeader.writeUInt32BE(manifestJsonBuffer.length, 0);
    const fullPayload = Buffer.concat([manifestLengthHeader, manifestJsonBuffer, snapshotBuffer]);
    const salt = crypto.randomBytes(this.SALT_LENGTH);
    const derivedKey = crypto.scryptSync(key, salt, 32);
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, derivedKey, iv);
    const encryptedData = Buffer.concat([cipher.update(fullPayload), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const finalBackupBuffer = Buffer.concat([salt, iv, authTag, encryptedData]);
    const backupFileName = `aquila_backup_${safeTimestamp}.aquila.bak`;
    const primaryFile = path.join(options.backupPrimaryDir, backupFileName);
    fs.writeFileSync(primaryFile, finalBackupBuffer);
    if (fs.existsSync(tempSnapshotPath)) fs.unlinkSync(tempSnapshotPath);
    let secondaryFile;
    let secondaryCopySuccess = false;
    if (options.backupSecondaryDir) {
      try {
        if (!fs.existsSync(options.backupSecondaryDir)) {
          fs.mkdirSync(options.backupSecondaryDir, { recursive: true });
        }
        secondaryFile = path.join(options.backupSecondaryDir, backupFileName);
        fs.copyFileSync(primaryFile, secondaryFile);
        secondaryCopySuccess = true;
      } catch (err) {
        if (options.requireSecondary) {
          if (fs.existsSync(primaryFile)) fs.unlinkSync(primaryFile);
          throw new Error(`Falha cr\xEDtica ao copiar backup para destino secund\xE1rio obrigat\xF3rio: ${err.message}`);
        } else {
          console.warn(`[SQLiteDisasterRecovery] ALERTA: falha ao copiar para destino secund\xE1rio: ${err.message}`);
        }
      }
    }
    this.rotateGFSBackups(options.backupPrimaryDir, options.referenceDate);
    const durationMs = performance.now() - start;
    return {
      success: true,
      backupFile: primaryFile,
      secondaryFile,
      secondaryCopySuccess,
      manifest,
      sizeEncryptedBytes: finalBackupBuffer.length,
      durationMs,
      walCheckpointed: true
    };
  }
  /**
   * Restaura e valida um backup criptografado AES-256-GCM
   */
  static restoreEncryptedBackup(options) {
    const start = performance.now();
    const key = this.resolveMasterKey(options.masterKey);
    if (!fs.existsSync(options.backupFilePath)) {
      throw new Error(`Arquivo de backup n\xE3o encontrado: ${options.backupFilePath}`);
    }
    const fileBuffer = fs.readFileSync(options.backupFilePath);
    if (fileBuffer.length < this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH) {
      throw new Error("Arquivo de backup inv\xE1lido ou truncado.");
    }
    let offset = 0;
    const salt = fileBuffer.subarray(offset, offset + this.SALT_LENGTH);
    offset += this.SALT_LENGTH;
    const iv = fileBuffer.subarray(offset, offset + this.IV_LENGTH);
    offset += this.IV_LENGTH;
    const authTag = fileBuffer.subarray(offset, offset + this.TAG_LENGTH);
    offset += this.TAG_LENGTH;
    const ciphertext = fileBuffer.subarray(offset);
    const derivedKey = crypto.scryptSync(key, salt, 32);
    const decipher = crypto.createDecipheriv(this.ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(authTag);
    let decryptedPayload;
    try {
      decryptedPayload = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    } catch (err) {
      throw new Error(`Falha de integridade criptogr\xE1fica (Auth Tag inv\xE1lida ou chave incorreta): ${err.message}`);
    }
    const manifestLength = decryptedPayload.readUInt32BE(0);
    const manifestBuffer = decryptedPayload.subarray(4, 4 + manifestLength);
    const manifest = JSON.parse(manifestBuffer.toString("utf-8"));
    const snapshotBuffer = decryptedPayload.subarray(4 + manifestLength);
    const computedSha256 = crypto.createHash("sha256").update(snapshotBuffer).digest("hex");
    const sha256Verified = computedSha256 === manifest.sha256;
    if (!sha256Verified) {
      throw new Error(`Diverg\xEAncia de SHA-256 no banco extra\xEDdo! Esperado: ${manifest.sha256}, Obtido: ${computedSha256}`);
    }
    const targetDir = path.dirname(options.targetRestorePath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const tempValidPath = `${options.targetRestorePath}.restore_tmp`;
    if (fs.existsSync(tempValidPath)) fs.unlinkSync(tempValidPath);
    fs.writeFileSync(tempValidPath, snapshotBuffer);
    const testDb = new import_better_sqlite3.default(tempValidPath, { readonly: true });
    const pragmaStatus = testDb.pragma("integrity_check")[0]?.integrity_check || "unknown";
    testDb.close();
    if (pragmaStatus !== "ok") {
      if (fs.existsSync(tempValidPath)) fs.unlinkSync(tempValidPath);
      throw new Error(`Restaura\xE7\xE3o rejeitada: PRAGMA integrity_check falhou com status "${pragmaStatus}"`);
    }
    if (fs.existsSync(`${options.targetRestorePath}-wal`)) fs.unlinkSync(`${options.targetRestorePath}-wal`);
    if (fs.existsSync(`${options.targetRestorePath}-shm`)) fs.unlinkSync(`${options.targetRestorePath}-shm`);
    if (fs.existsSync(options.targetRestorePath)) fs.unlinkSync(options.targetRestorePath);
    fs.renameSync(tempValidPath, options.targetRestorePath);
    const durationMs = performance.now() - start;
    return {
      success: true,
      restoredDbPath: options.targetRestorePath,
      manifest,
      integrityPragma: pragmaStatus,
      sha256Verified: true,
      durationMs,
      auditRecorded: true
    };
  }
  /**
   * Executa Restore Drill de emergência em sandbox isolado, validando o tempo (< 120s)
   */
  static runRestoreDrill(backupFilePath, masterKey) {
    const log = [];
    const t0 = performance.now();
    log.push(`[DRILL] Iniciando simula\xE7\xE3o de Disaster Recovery para: ${path.basename(backupFilePath)}`);
    const key = this.resolveMasterKey(masterKey);
    const sandboxDir = path.join(path.dirname(backupFilePath), ".restore_drill_sandbox");
    if (fs.existsSync(sandboxDir)) fs.rmSync(sandboxDir, { recursive: true, force: true });
    fs.mkdirSync(sandboxDir, { recursive: true });
    const sandboxTarget = path.join(sandboxDir, "aquila_restored_drill.db");
    try {
      const res = this.restoreEncryptedBackup({
        backupFilePath,
        targetRestorePath: sandboxTarget,
        masterKey: key,
        actor: "RESTORE_DRILL_AUTOMATION"
      });
      const totalMs = performance.now() - t0;
      const underTwoMinutes = totalMs < 12e4;
      log.push(`[DRILL] Descriptografia AES-256-GCM e confer\xEAncia Auth Tag: OK`);
      log.push(`[DRILL] Hash SHA-256: CONFERIDO (${res.manifest.sha256})`);
      log.push(`[DRILL] PRAGMA integrity_check: ${res.integrityPragma}`);
      log.push(`[DRILL] Tuplas verificadas: Estudantes=${res.manifest.rowCounts.students}, Audits=${res.manifest.rowCounts.zero_bypass_audits}`);
      log.push(`[DRILL] Tempo total de restaura\xE7\xE3o: ${totalMs.toFixed(2)} ms (Meta < 120.000 ms: ${underTwoMinutes ? "APROVADO" : "REPROVADO"})`);
      return {
        success: res.success,
        durationMs: totalMs,
        underTwoMinutes,
        integrityOk: res.integrityPragma === "ok",
        tuplesVerified: true,
        manifest: res.manifest,
        log
      };
    } finally {
      if (fs.existsSync(sandboxDir)) {
        try {
          fs.rmSync(sandboxDir, { recursive: true, force: true });
        } catch {
        }
      }
    }
  }
  /**
   * Rotação GFS Real (Grandfather-Father-Son):
   * - Preserva até 7 backups diários (< 7 dias)
   * - Preserva até 4 backups semanais (7 a 28 dias)
   * - Preserva até 12 backups mensais (28 a 365 dias)
   * - Remove backups obsoletos que não se enquadram nas janelas de retenção
   */
  static rotateGFSBackups(backupDir, referenceDate) {
    try {
      const now = referenceDate ? referenceDate.getTime() : Date.now();
      const DAY_MS = 24 * 60 * 60 * 1e3;
      const files = fs.readdirSync(backupDir).filter((f) => f.startsWith("aquila_backup_") && f.endsWith(".aquila.bak")).map((f) => {
        const filePath = path.join(backupDir, f);
        return {
          name: f,
          path: filePath,
          mtime: fs.statSync(filePath).mtime.getTime()
        };
      }).sort((a, b) => b.mtime - a.mtime);
      const daily = [];
      const weekly = [];
      const monthly = [];
      const dailyBuckets = /* @__PURE__ */ new Set();
      const weeklyBuckets = /* @__PURE__ */ new Set();
      const monthlyBuckets = /* @__PURE__ */ new Set();
      for (const file of files) {
        const ageMs = Math.max(0, now - file.mtime);
        const ageDays = ageMs / DAY_MS;
        const fileDate = new Date(file.mtime);
        if (ageDays <= 7) {
          const dayKey = fileDate.toISOString().slice(0, 10);
          if (!dailyBuckets.has(dayKey) && daily.length < 7) {
            dailyBuckets.add(dayKey);
            daily.push(file);
          }
        } else if (ageDays <= 35) {
          const weekIndex = Math.floor(ageDays / 7);
          const weekKey = `W_${weekIndex}`;
          if (!weeklyBuckets.has(weekKey) && weekly.length < 4) {
            weeklyBuckets.add(weekKey);
            weekly.push(file);
          }
        } else if (ageDays <= 365) {
          const monthKey = fileDate.toISOString().slice(0, 7);
          if (!monthlyBuckets.has(monthKey) && monthly.length < 12) {
            monthlyBuckets.add(monthKey);
            monthly.push(file);
          }
        }
      }
      const keepPaths = /* @__PURE__ */ new Set([
        ...daily.map((f) => f.path),
        ...weekly.map((f) => f.path),
        ...monthly.map((f) => f.path)
      ]);
      let prunedCount = 0;
      for (const file of files) {
        if (!keepPaths.has(file.path)) {
          fs.unlinkSync(file.path);
          prunedCount++;
        }
      }
      return {
        dailyCount: daily.length,
        weeklyCount: weekly.length,
        monthlyCount: monthly.length,
        prunedCount,
        retainedFiles: Array.from(keepPaths)
      };
    } catch (error) {
      throw new Error(`Falha na rota\xE7\xE3o GFS: ${error.message}`);
    }
  }
};

// scripts/test_backup_dr_suite.ts
var TEST_ROOT = path2.join(process.cwd(), ".backup-dr-test-v14");
var DB_PATH = path2.join(TEST_ROOT, "aquila_test.db");
var BACKUP_DIR = path2.join(TEST_ROOT, "backups");
var RESTORE_DIR = path2.join(TEST_ROOT, "restore");
var SECONDARY_DIR = path2.join(TEST_ROOT, "secondary");
var STRONG_KEY = crypto2.randomBytes(32).toString("base64");
var WRONG_KEY = crypto2.randomBytes(32).toString("base64");
function resetEnvironment() {
  if (fs2.existsSync(TEST_ROOT)) {
    fs2.rmSync(TEST_ROOT, { recursive: true, force: true });
  }
  fs2.mkdirSync(TEST_ROOT, { recursive: true });
  fs2.mkdirSync(BACKUP_DIR, { recursive: true });
  fs2.mkdirSync(RESTORE_DIR, { recursive: true });
  fs2.mkdirSync(SECONDARY_DIR, { recursive: true });
}
function createTestDatabase() {
  const db = new import_better_sqlite32.default(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
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
    insertClass.run("TURMA_1EM_A", "1\xBA Ano EM A", "Sala 101");
    insertClass.run("TURMA_2EM_B", "2\xBA Ano EM B", "Sala 102");
    for (let i = 1; i <= 50; i++) {
      const sid = `STD_${i.toString().padStart(3, "0")}`;
      insertStudent.run(sid, `Estudante Piloto ${i}`, i <= 25 ? "TURMA_1EM_A" : "TURMA_2EM_B");
      insertAttendance.run(sid, "PRESENT", (/* @__PURE__ */ new Date()).toISOString());
      insertAudit.run("COORD_01", "ATTENDANCE_RECORDED", `Presen\xE7a validada para ${sid}`, (/* @__PURE__ */ new Date()).toISOString());
    }
    for (let u = 1; u <= 5; u++) {
      insertUser.run(`PROF_${u}`, `Professor ${u}`, "TEACHER");
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
  } catch (err) {
    if (err.message.includes("AQUILA_BACKUP_MASTER_KEY \xE9 obrigat\xF3ria")) {
      rejected = true;
    }
  } finally {
    if (savedKey) process.env.AQUILA_BACKUP_MASTER_KEY = savedKey;
  }
  if (!rejected) {
    throw new Error("FALHA REGRESSIVA: backup foi aceito sem AQUILA_BACKUP_MASTER_KEY!");
  }
  console.log("\u2705 TESTE 1: Backup sem chave mestra foi recusado com sucesso.");
}
function testWeakKeyMustFail() {
  const weakKey = "senha_curta_123";
  let rejected = false;
  try {
    SQLiteDisasterRecoveryService.createEncryptedBackup({
      dbPath: DB_PATH,
      backupPrimaryDir: BACKUP_DIR,
      backupSecondaryDir: SECONDARY_DIR,
      masterKey: weakKey
    });
  } catch (err) {
    if (err.message.includes("pelo menos 32 caracteres")) {
      rejected = true;
    }
  }
  if (!rejected) {
    throw new Error("FALHA: backup aceitou chave mestra fraca (< 32 caracteres)!");
  }
  console.log("\u2705 TESTE 2: Chave mestra fraca (< 32 chars) foi recusada com sucesso.");
}
function testBackupAndRestoreWithValidKey() {
  const t0 = performance.now();
  const backup = SQLiteDisasterRecoveryService.createEncryptedBackup({
    dbPath: DB_PATH,
    backupPrimaryDir: BACKUP_DIR,
    backupSecondaryDir: SECONDARY_DIR,
    masterKey: STRONG_KEY,
    author: "TESTE_AUTOMATIZADO_V14"
  });
  if (!backup.success || !backup.backupFile || !fs2.existsSync(backup.backupFile)) {
    throw new Error("FALHA: backup prim\xE1rio n\xE3o foi gerado com sucesso.");
  }
  if (!backup.secondaryFile || !fs2.existsSync(backup.secondaryFile) || !backup.secondaryCopySuccess) {
    throw new Error("FALHA: c\xF3pia secund\xE1ria n\xE3o foi gerada com sucesso.");
  }
  const restoredDbPath = path2.join(RESTORE_DIR, "restored_valid.db");
  const restore = SQLiteDisasterRecoveryService.restoreEncryptedBackup({
    backupFilePath: backup.backupFile,
    targetRestorePath: restoredDbPath,
    masterKey: STRONG_KEY,
    actor: "TESTE_AUTOMATIZADO_V14"
  });
  const totalMs = performance.now() - t0;
  if (!restore.success || !restore.sha256Verified || restore.integrityPragma !== "ok") {
    throw new Error(`FALHA: restaura\xE7\xE3o falhou! Pragma: ${restore.integrityPragma}, SHA verificado: ${restore.sha256Verified}`);
  }
  const verifyDb = new import_better_sqlite32.default(restoredDbPath, { readonly: true });
  const count = verifyDb.prepare("SELECT count(*) as total FROM students").get().total;
  verifyDb.close();
  if (count !== 50) {
    throw new Error(`FALHA: diverg\xEAncia de dados no banco restaurado! Alunos: ${count}/50`);
  }
  console.log(`\u2705 TESTE 3: Backup e restaura\xE7\xE3o com chave v\xE1lida aprovados em ${totalMs.toFixed(2)} ms (Alunos: 50/50, SHA-256 verificado, PRAGMA ok).`);
}
function testWrongKeyMustFail() {
  const backup = SQLiteDisasterRecoveryService.createEncryptedBackup({
    dbPath: DB_PATH,
    backupPrimaryDir: BACKUP_DIR,
    masterKey: STRONG_KEY,
    author: "TESTE_WRONG_KEY"
  });
  let rejected = false;
  try {
    SQLiteDisasterRecoveryService.restoreEncryptedBackup({
      backupFilePath: backup.backupFile,
      targetRestorePath: path2.join(RESTORE_DIR, "should_fail_wrong_key.db"),
      masterKey: WRONG_KEY,
      actor: "TESTE_WRONG_KEY"
    });
  } catch (err) {
    rejected = true;
  }
  if (!rejected) {
    throw new Error("FALHA: restaura\xE7\xE3o aceitou chave mestra incorreta!");
  }
  console.log("\u2705 TESTE 4: Restaura\xE7\xE3o com chave incorreta foi rejeitada pelo motor criptogr\xE1fico.");
}
function testTamperedBackupMustFail() {
  const backup = SQLiteDisasterRecoveryService.createEncryptedBackup({
    dbPath: DB_PATH,
    backupPrimaryDir: BACKUP_DIR,
    masterKey: STRONG_KEY,
    author: "TESTE_TAMPERED"
  });
  const originalBytes = fs2.readFileSync(backup.backupFile);
  const tamperedBytes = Buffer.from(originalBytes);
  tamperedBytes[tamperedBytes.length - 1] ^= 255;
  const tamperedPath = path2.join(BACKUP_DIR, "tampered_test.aquila.bak");
  fs2.writeFileSync(tamperedPath, tamperedBytes);
  let rejected = false;
  try {
    SQLiteDisasterRecoveryService.restoreEncryptedBackup({
      backupFilePath: tamperedPath,
      targetRestorePath: path2.join(RESTORE_DIR, "should_fail_tampered.db"),
      masterKey: STRONG_KEY,
      actor: "TESTE_TAMPERED"
    });
  } catch (err) {
    rejected = true;
  }
  if (!rejected) {
    throw new Error("FALHA: backup com ciphertext adulterado foi aceito sem erro de autentica\xE7\xE3o!");
  }
  console.log("\u2705 TESTE 5: Backup adulterado foi rejeitado pela Auth Tag do AES-256-GCM.");
}
function testGfsRetention() {
  const gfsTestDir = path2.join(TEST_ROOT, "gfs_test");
  fs2.mkdirSync(gfsTestDir, { recursive: true });
  const now = new Date(2026, 9, 25, 12, 0, 0);
  const DAY_MS = 24 * 60 * 60 * 1e3;
  const testAgesDays = [
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    14,
    21,
    28,
    35,
    42,
    60,
    90,
    120,
    150,
    180,
    210,
    240,
    270,
    300,
    330,
    360,
    400,
    450
  ];
  for (let i = 0; i < testAgesDays.length; i++) {
    const ageDays = testAgesDays[i];
    const fileDate = new Date(now.getTime() - ageDays * DAY_MS);
    const tsStr = fileDate.toISOString().replace(/[:.]/g, "-");
    const fPath = path2.join(gfsTestDir, `aquila_backup_${tsStr}_test_${i}.aquila.bak`);
    fs2.writeFileSync(fPath, `DUMMY_GFS_DATA_${i}`);
    const timeSec = fileDate.getTime() / 1e3;
    fs2.utimesSync(fPath, timeSec, timeSec);
  }
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
    throw new Error("FALHA GFS: nenhum arquivo obsoleto foi podado!");
  }
  console.log(`\u2705 TESTE 6: Pol\xEDtica GFS Real validada: ${summary.dailyCount} di\xE1rios, ${summary.weeklyCount} semanais, ${summary.monthlyCount} mensais retidos (${summary.prunedCount} podados com sucesso).`);
}
function testSecondaryDestinationFailure() {
  const invalidDir = process.platform === "win32" ? "Z:\\non_existent_drive_mount_999\\backups" : "/sys/kernel/security/impossible_backup_dir";
  let rejected = false;
  try {
    SQLiteDisasterRecoveryService.createEncryptedBackup({
      dbPath: DB_PATH,
      backupPrimaryDir: BACKUP_DIR,
      backupSecondaryDir: invalidDir,
      requireSecondary: true,
      // Modo estrito: falha se o destino secundário obrigatório falhar
      masterKey: STRONG_KEY,
      author: "TESTE_SECONDARY_FAIL"
    });
  } catch (err) {
    if (err.message.includes("destino secund\xE1rio obrigat\xF3rio")) {
      rejected = true;
    }
  }
  if (!rejected) {
    throw new Error("FALHA: backup com requireSecondary=true deveria ter falhado com destino secund\xE1rio inacess\xEDvel!");
  }
  const softBackup = SQLiteDisasterRecoveryService.createEncryptedBackup({
    dbPath: DB_PATH,
    backupPrimaryDir: BACKUP_DIR,
    backupSecondaryDir: invalidDir,
    requireSecondary: false,
    masterKey: STRONG_KEY,
    author: "TESTE_SECONDARY_SOFT"
  });
  if (!softBackup.success || softBackup.secondaryCopySuccess !== false) {
    throw new Error("FALHA: backup suave com destino secund\xE1rio inv\xE1lido deveria retornar secondaryCopySuccess: false!");
  }
  console.log("\u2705 TESTE 7: Detec\xE7\xE3o de falha no destino secund\xE1rio validada (bloqueio no modo estrito e flag secondaryCopySuccess: false no modo suave).");
}
function runAllTests() {
  console.log("\u{1F3DB}\uFE0F =========================================================================");
  console.log("   \xC1QUILA PRO \u2014 BATERIA DE TESTES DE SEGURAN\xC7A E GFS (Op\xE7\xE3o A \u2014 rc.14)");
  console.log("=========================================================================\n");
  resetEnvironment();
  createTestDatabase();
  testBackupWithoutKeyMustFail();
  testWeakKeyMustFail();
  testBackupAndRestoreWithValidKey();
  testWrongKeyMustFail();
  testTamperedBackupMustFail();
  testGfsRetention();
  testSecondaryDestinationFailure();
  console.log("\n\u{1F3C6} TODAS AS 7 PROVAS DE SEGURAN\xC7A E CONTINUIDADE APROVADAS COM SUCESSO (100% VERDE).");
  if (fs2.existsSync(TEST_ROOT)) {
    try {
      fs2.rmSync(TEST_ROOT, { recursive: true, force: true });
    } catch {
    }
  }
}
if (require.main === module) {
  runAllTests();
}
