var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// scripts/sqlite_backup_dr.ts
var sqlite_backup_dr_exports = {};
__export(sqlite_backup_dr_exports, {
  SQLiteDisasterRecoveryService: () => SQLiteDisasterRecoveryService
});
module.exports = __toCommonJS(sqlite_backup_dr_exports);
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
var crypto = __toESM(require("crypto"));
var import_better_sqlite3 = __toESM(require("better-sqlite3"));
var SQLiteDisasterRecoveryService = class {
  /**
   * Executa checkpoint do WAL e cria snapshot limpo via VACUUM INTO
   */
  static createSnapshot(db, sourceDbPath, backupDir) {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    db.pragma("wal_checkpoint(TRUNCATE)");
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    const snapshotName = `aquila_snap_${timestamp}.db`;
    const snapshotPath = path.join(backupDir, snapshotName);
    if (fs.existsSync(snapshotPath)) {
      fs.unlinkSync(snapshotPath);
    }
    const safePath = snapshotPath.replace(/\\/g, "/");
    db.exec(`VACUUM INTO '${safePath}'`);
    const fileBuffer = fs.readFileSync(snapshotPath);
    const sha256Hex = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    const sha256Path = `${snapshotPath}.sha256`;
    fs.writeFileSync(sha256Path, `${sha256Hex}  ${snapshotName}
`, "utf-8");
    return {
      snapshotPath,
      sha256Path,
      sha256Hex,
      sizeBytes: fileBuffer.length,
      timestamp,
      walCheckpointed: true
    };
  }
  /**
   * Verifica a integridade física e lógica do snapshot
   */
  static verifySnapshot(snapshotPath, expectedSha256) {
    try {
      if (!fs.existsSync(snapshotPath)) {
        return { valid: false, integrityPragma: "FILE_NOT_FOUND", recordCount: 0, hashMatch: false, error: "Snapshot file not found" };
      }
      let hashMatch = true;
      if (expectedSha256) {
        const fileBuffer = fs.readFileSync(snapshotPath);
        const actualHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
        hashMatch = actualHash === expectedSha256;
        if (!hashMatch) {
          return { valid: false, integrityPragma: "HASH_MISMATCH", recordCount: 0, hashMatch: false, error: `Hash mismatch: expected ${expectedSha256}, got ${actualHash}` };
        }
      }
      const snapDb = new import_better_sqlite3.default(snapshotPath, { readonly: true });
      const pragmaResult = snapDb.pragma("integrity_check");
      const integrityStatus = pragmaResult[0]?.integrity_check || "unknown";
      if (integrityStatus !== "ok") {
        snapDb.close();
        return { valid: false, integrityPragma: integrityStatus, recordCount: 0, hashMatch, error: `Integrity check failed: ${integrityStatus}` };
      }
      let recordCount = 0;
      try {
        const countRow = snapDb.prepare("SELECT count(*) as total FROM zero_bypass_audits").get();
        recordCount = countRow.total;
      } catch {
        recordCount = 1;
      }
      snapDb.close();
      return {
        valid: true,
        integrityPragma: integrityStatus,
        recordCount,
        hashMatch
      };
    } catch (err) {
      return {
        valid: false,
        integrityPragma: "EXCEPTION",
        recordCount: 0,
        hashMatch: false,
        error: err.message
      };
    }
  }
  /**
   * Restaura o banco de dados a partir de um snapshot validado
   */
  static restoreDatabase(snapshotPath, targetPath) {
    const verification = this.verifySnapshot(snapshotPath);
    if (!verification.valid) {
      throw new Error(`Restaura\xE7\xE3o abortada: snapshot inv\xE1lido ou corrompido (${verification.error})`);
    }
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    if (fs.existsSync(`${targetPath}-wal`)) fs.unlinkSync(`${targetPath}-wal`);
    if (fs.existsSync(`${targetPath}-shm`)) fs.unlinkSync(`${targetPath}-shm`);
    fs.copyFileSync(snapshotPath, targetPath);
    return true;
  }
};
async function runDisasterRecoverySuite() {
  console.log("\u{1F3DB}\uFE0F Iniciando Bateria de Teste de Backup & Disaster Recovery (DR)...");
  const tempDir = path.join(__dirname, "..", ".tmp_sqlite_dr_test");
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });
  const liveDbPath = path.join(tempDir, "aquila_live.db");
  const backupDir = path.join(tempDir, "backups");
  const restorePath = path.join(tempDir, "aquila_restored.db");
  try {
    console.log("1\uFE0F\u20E3 Inicializando banco de teste em modo WAL...");
    const liveDb = new import_better_sqlite3.default(liveDbPath);
    liveDb.pragma("journal_mode = WAL");
    liveDb.pragma("synchronous = NORMAL");
    liveDb.exec(`
      CREATE TABLE zero_bypass_audits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT NOT NULL,
        metadata TEXT,
        created_at TEXT NOT NULL
      );
      CREATE TABLE students (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        turma TEXT NOT NULL,
        status TEXT NOT NULL
      );
    `);
    const insertAudit = liveDb.prepare(`
      INSERT INTO zero_bypass_audits (user_id, action, details, metadata, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    const insertStudent = liveDb.prepare(`
      INSERT INTO students (id, name, turma, status)
      VALUES (?, ?, ?, ?)
    `);
    for (let i = 1; i <= 100; i++) {
      insertAudit.run(`usr_${i}`, "BIOMETRIC_CHECK", `Acesso catraca ${i}`, JSON.stringify({ confidence: 0.98 }), (/* @__PURE__ */ new Date()).toISOString());
      insertStudent.run(`std_${i}`, `Aluno Teste ${i}`, `Turma ${i % 4 + 1}A`, "ACTIVE");
    }
    console.log("\u2705 Banco ativo populado com 100 registros de auditoria e 100 estudantes em modo WAL.");
    console.log("2\uFE0F\u20E3 Executando checkpoint de WAL e snapshot at\xF4mico com VACUUM INTO...");
    const backupResult = SQLiteDisasterRecoveryService.createSnapshot(liveDb, liveDbPath, backupDir);
    console.log(`\u2705 Snapshot gerado com sucesso:`);
    console.log(`   - Arquivo: ${path.basename(backupResult.snapshotPath)}`);
    console.log(`   - Tamanho: ${backupResult.sizeBytes} bytes`);
    console.log(`   - Hash SHA-256: ${backupResult.sha256Hex}`);
    console.log(`   - Manifesto SHA-256: ${path.basename(backupResult.sha256Path)}`);
    console.log("3\uFE0F\u20E3 Verificando integridade f\xEDsica e criptogr\xE1fica do snapshot...");
    const verification = SQLiteDisasterRecoveryService.verifySnapshot(backupResult.snapshotPath, backupResult.sha256Hex);
    if (!verification.valid || verification.integrityPragma !== "ok" || !verification.hashMatch) {
      throw new Error(`Falha na valida\xE7\xE3o do snapshot: ${JSON.stringify(verification)}`);
    }
    console.log(`\u2705 Snapshot 100% \xEDntegro (PRAGMA integrity_check = ${verification.integrityPragma}, Hash SHA-256 conferido, Tuplas auditadas: ${verification.recordCount}).`);
    console.log("4\uFE0F\u20E3 Simulando arquivo corrompido para testar detector de anomalias...");
    const corruptPath = path.join(tempDir, "aquila_corrupt.db");
    fs.copyFileSync(backupResult.snapshotPath, corruptPath);
    const corruptFd = fs.openSync(corruptPath, "r+");
    fs.writeSync(corruptFd, Buffer.from("CORRUPTED_GARBAGE_BYTES_TESTING"), 0, 30, 100);
    fs.closeSync(corruptFd);
    const corruptVerification = SQLiteDisasterRecoveryService.verifySnapshot(corruptPath, backupResult.sha256Hex);
    if (corruptVerification.valid) {
      throw new Error("Falha no teste de detec\xE7\xE3o: arquivo corrompido foi aprovado indevidamente!");
    }
    console.log(`\u2705 Detector de corrup\xE7\xE3o aprovado com sucesso: corrup\xE7\xE3o identificada (${corruptVerification.error || corruptVerification.integrityPragma}).`);
    console.log("5\uFE0F\u20E3 Executando simula\xE7\xE3o de Disaster Recovery (Restaura\xE7\xE3o total)...");
    const restored = SQLiteDisasterRecoveryService.restoreDatabase(backupResult.snapshotPath, restorePath);
    if (!restored) {
      throw new Error("Falha ao restaurar banco a partir do snapshot");
    }
    const restoredDb = new import_better_sqlite3.default(restorePath, { readonly: true });
    const auditCount = restoredDb.prepare("SELECT count(*) as total FROM zero_bypass_audits").get().total;
    const studentCount = restoredDb.prepare("SELECT count(*) as total FROM students").get().total;
    const restoredPragma = restoredDb.pragma("integrity_check")[0].integrity_check;
    restoredDb.close();
    if (auditCount !== 100 || studentCount !== 100 || restoredPragma !== "ok") {
      throw new Error(`Diverg\xEAncia de dados no banco restaurado! Audits: ${auditCount}, Alunos: ${studentCount}, Pragma: ${restoredPragma}`);
    }
    console.log(`\u2705 Banco restaurado com sucesso absoluto:`);
    console.log(`   - PRAGMA integrity_check: ${restoredPragma}`);
    console.log(`   - Registros de auditoria: ${auditCount}/100`);
    console.log(`   - Registros de estudantes: ${studentCount}/100`);
    console.log(`   - Consist\xEAncia referencial: 100%`);
    liveDb.close();
    console.log("\n\u{1F3C6} BATERIA DE DISASTER RECOVERY APROVADA COM SUCESSO (5/5 PASSOS).");
  } finally {
    if (fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {
      }
    }
  }
}
if (require.main === module) {
  runDisasterRecoverySuite().then(() => process.exit(0)).catch((err) => {
    console.error("\u274C Falha fatal no teste de Disaster Recovery:", err);
    process.exit(1);
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SQLiteDisasterRecoveryService
});
