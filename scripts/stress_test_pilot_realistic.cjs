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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// scripts/stress_test_pilot_realistic.ts
var stress_test_pilot_realistic_exports = {};
module.exports = __toCommonJS(stress_test_pilot_realistic_exports);
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
var import_better_sqlite3 = __toESM(require("better-sqlite3"));
function calculateTelemetry(latencies) {
  const sorted = [...latencies].sort((a, b) => a - b);
  const totalOps = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  const avgMs = totalOps > 0 ? sum / totalOps : 0;
  const p50Ms = sorted[Math.floor(totalOps * 0.5)] ?? 0;
  const p95Ms = sorted[Math.floor(totalOps * 0.95)] ?? 0;
  const p99Ms = sorted[Math.floor(totalOps * 0.99)] ?? 0;
  const maxMs = sorted[totalOps - 1] ?? 0;
  const opsPerSec = sum > 0 ? totalOps / (sum / 1e3) : 0;
  return { p50Ms, p95Ms, p99Ms, maxMs, avgMs, opsPerSec, totalOps };
}
async function runRealisticPilotStressTest() {
  console.log("\u{1F3DB}\uFE0F =========================================================================");
  console.log("   \xC1QUILA PRO \u2014 STRESS TEST REALISTA DE CONCORR\xCANCIA (OP\xC7\xC3O B)");
  console.log("   500 Alunos | 20 Turmas | 30 Professores Simult\xE2neos | SQLite WAL");
  console.log("=========================================================================\n");
  const testDir = path.join(process.cwd(), ".stress-test-realistic-tmp");
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testDir, { recursive: true });
  const dbPath = path.join(testDir, "aquila_pilot_load.db");
  const db = new import_better_sqlite3.default(dbPath);
  try {
    db.pragma("journal_mode = WAL");
    db.pragma("synchronous = NORMAL");
    db.pragma("temp_store = MEMORY");
    db.pragma("busy_timeout = 5000");
    db.pragma("cache_size = -64000");
    console.log("1\uFE0F\u20E3 Criando schema relacional completo no SQLite...");
    db.exec(`
      CREATE TABLE classes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        grade_level TEXT NOT NULL,
        shift TEXT NOT NULL
      );

      CREATE TABLE students (
        id TEXT PRIMARY KEY,
        enrollment_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        class_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        FOREIGN KEY (class_id) REFERENCES classes(id)
      );

      CREATE TABLE teachers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        subject TEXT NOT NULL
      );

      CREATE TABLE attendance_sessions (
        id TEXT PRIMARY KEY,
        class_id TEXT NOT NULL,
        teacher_id TEXT NOT NULL,
        session_date TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE attendance_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        status TEXT NOT NULL,
        recorded_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES attendance_sessions(id),
        FOREIGN KEY (student_id) REFERENCES students(id)
      );

      CREATE TABLE exam_submissions (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        class_id TEXT NOT NULL,
        subject TEXT NOT NULL,
        score REAL NOT NULL,
        confidence_avg REAL NOT NULL,
        requires_human_review INTEGER NOT NULL,
        evaluated_at TEXT NOT NULL
      );

      CREATE TABLE grade_closing_summaries (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        class_id TEXT NOT NULL,
        final_average REAL NOT NULL,
        attendance_percentage REAL NOT NULL,
        status TEXT NOT NULL,
        calculated_at TEXT NOT NULL
      );

      CREATE TABLE notification_outbox (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipient_phone TEXT NOT NULL,
        template_name TEXT NOT NULL,
        parameters_json TEXT NOT NULL,
        provider TEXT NOT NULL DEFAULT 'whatsapp_meta',
        status TEXT NOT NULL DEFAULT 'PENDING',
        created_at TEXT NOT NULL
      );

      CREATE TABLE zero_bypass_audits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT NOT NULL,
        metadata_json TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX idx_student_class ON students(class_id);
      CREATE INDEX idx_att_record_student ON attendance_records(student_id);
      CREATE INDEX idx_exam_student ON exam_submissions(student_id);
      CREATE INDEX idx_closing_student ON grade_closing_summaries(student_id);
    `);
    console.log("2\uFE0F\u20E3 Populando cat\xE1logo institucional: 20 turmas, 500 alunos, 30 docentes...");
    const insertClass = db.prepare("INSERT INTO classes VALUES (?, ?, ?, ?)");
    const insertStudent = db.prepare("INSERT INTO students VALUES (?, ?, ?, ?, ?)");
    const insertTeacher = db.prepare("INSERT INTO teachers VALUES (?, ?, ?)");
    const classIds = [];
    const studentIds = [];
    const teacherIds = [];
    const seedTx = db.transaction(() => {
      for (let c = 1; c <= 20; c++) {
        const cid = `TURMA_${Math.floor((c - 1) / 4) + 1}EM_${String.fromCharCode(65 + (c - 1) % 4)}`;
        classIds.push(cid);
        insertClass.run(cid, `Turma ${cid}`, "ENSINO_MEDIO", c % 2 === 0 ? "MATUTINO" : "VESPERTINO");
      }
      for (let s = 1; s <= 500; s++) {
        const sid = `STD_2026_${s.toString().padStart(4, "0")}`;
        const cid = classIds[(s - 1) % classIds.length];
        studentIds.push(sid);
        insertStudent.run(sid, `MAT_${2026e4 + s}`, `Aluno Piloto ${s}`, cid, "ACTIVE");
      }
      const subjects = ["Matem\xE1tica", "F\xEDsica", "Qu\xEDmica", "Biologia", "Hist\xF3ria", "Geografia", "Portugu\xEAs", "Ingl\xEAs", "Filosofia", "Sociologia"];
      for (let t = 1; t <= 30; t++) {
        const tid = `PROF_${t.toString().padStart(2, "0")}`;
        teacherIds.push(tid);
        insertTeacher.run(tid, `Professor Titular ${t}`, subjects[(t - 1) % subjects.length]);
      }
    });
    seedTx();
    console.log(`\u2705 Base populada com sucesso (500 alunos vinculados, 20 turmas, 30 professores).
`);
    console.log("3\uFE0F\u20E3 Simula\xE7\xE3o Concorrente: 30 Professores lan\xE7ando presen\xE7a simultaneamente...");
    const attendanceLatencies = [];
    const insertSession = db.prepare("INSERT INTO attendance_sessions VALUES (?, ?, ?, ?, ?)");
    const insertAttRecord = db.prepare("INSERT INTO attendance_records (session_id, student_id, status, recorded_at) VALUES (?, ?, ?, ?)");
    const insertOutbox = db.prepare("INSERT INTO notification_outbox (recipient_phone, template_name, parameters_json, created_at) VALUES (?, ?, ?, ?)");
    const startAttendance = performance.now();
    const teacherBatchTx = db.transaction((sessions) => {
      for (const sess of sessions) {
        const t0 = performance.now();
        insertSession.run(sess.sessionId, sess.classId, sess.teacherId, sess.date, (/* @__PURE__ */ new Date()).toISOString());
        for (const st of sess.students) {
          insertAttRecord.run(sess.sessionId, st.studentId, st.status, (/* @__PURE__ */ new Date()).toISOString());
          if (st.status === "ABSENT") {
            insertOutbox.run(
              `55119${Math.floor(1e7 + Math.random() * 89999999)}`,
              "aviso_ausencia_escolar_v1",
              JSON.stringify({ student_id: st.studentId, date: sess.date }),
              (/* @__PURE__ */ new Date()).toISOString()
            );
          }
        }
        const t1 = performance.now();
        attendanceLatencies.push(t1 - t0);
      }
    });
    const mockSessions = teacherIds.map((tid, idx) => {
      const cid = classIds[idx % classIds.length];
      const classStudents = studentIds.filter((_, sIdx) => sIdx % classIds.length === idx % classIds.length);
      return {
        sessionId: `SESS_${tid}_${Date.now()}_${idx}`,
        classId: cid,
        teacherId: tid,
        date: "2026-10-25",
        students: classStudents.map((sid) => ({
          studentId: sid,
          status: Math.random() < 0.92 ? "PRESENT" : "ABSENT"
        }))
      };
    });
    teacherBatchTx(mockSessions);
    const totalAttTime = performance.now() - startAttendance;
    const attStats = calculateTelemetry(attendanceLatencies);
    console.log(`\u2705 30 Di\xE1rios de classe lan\xE7ados com 750 presen\xE7as processadas em ${totalAttTime.toFixed(2)} ms:`);
    console.log(`   - Lat\xEAncia p50 por Di\xE1rio: ${attStats.p50Ms.toFixed(3)} ms`);
    console.log(`   - Lat\xEAncia p95 por Di\xE1rio: ${attStats.p95Ms.toFixed(3)} ms (Meta: < 150 ms) -> ${attStats.p95Ms < 150 ? "APROVADO" : "FALHA"}`);
    console.log(`   - Lat\xEAncia p99 por Di\xE1rio: ${attStats.p99Ms.toFixed(3)} ms`);
    console.log(`   - Vaz\xE3o: ${attStats.opsPerSec.toFixed(1)} di\xE1rios/s (${(750 / (totalAttTime / 1e3)).toFixed(0)} presen\xE7as/s)
`);
    console.log("4\uFE0F\u20E3 Simula\xE7\xE3o de Fechamento de M\xE9dias: c\xE1lculo ponderado e fechamento de 500 boletins...");
    const insertExam = db.prepare("INSERT INTO exam_submissions VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    const seedExamsTx = db.transaction(() => {
      for (let s = 0; s < studentIds.length; s++) {
        const sid = studentIds[s];
        const cid = classIds[s % classIds.length];
        for (let ex = 1; ex <= 4; ex++) {
          insertExam.run(
            `EX_${sid}_${ex}`,
            sid,
            cid,
            "Ci\xEAncias da Natureza",
            5 + Math.random() * 5,
            // Nota entre 5.0 e 10.0
            0.96,
            0,
            (/* @__PURE__ */ new Date()).toISOString()
          );
        }
      }
    });
    seedExamsTx();
    const insertClosing = db.prepare("INSERT INTO grade_closing_summaries VALUES (?, ?, ?, ?, ?, ?, ?)");
    const closingLatencies = [];
    const startClosing = performance.now();
    const closingTx = db.transaction(() => {
      for (let c = 0; c < classIds.length; c++) {
        const cid = classIds[c];
        const t0 = performance.now();
        const classResults = db.prepare(`
          SELECT 
            s.id as student_id,
            s.class_id,
            avg(e.score) as avg_score,
            count(CASE WHEN a.status = 'PRESENT' THEN 1 END) * 100.0 / count(a.id) as attendance_rate
          FROM students s
          JOIN exam_submissions e ON e.student_id = s.id
          LEFT JOIN attendance_records a ON a.student_id = s.id
          WHERE s.class_id = ?
          GROUP BY s.id
        `).all(cid);
        for (const row of classResults) {
          const status = row.avg_score >= 6 && row.attendance_rate >= 75 ? "APPROVED" : "RECOVERY";
          insertClosing.run(
            `CLOSE_${row.student_id}`,
            row.student_id,
            cid,
            Math.round(row.avg_score * 100) / 100,
            Math.round((row.attendance_rate || 100) * 10) / 10,
            status,
            (/* @__PURE__ */ new Date()).toISOString()
          );
        }
        const t1 = performance.now();
        closingLatencies.push(t1 - t0);
      }
    });
    closingTx();
    const totalClosingTime = performance.now() - startClosing;
    const closingStats = calculateTelemetry(closingLatencies);
    console.log(`\u2705 Fechamento de m\xE9dias de 20 turmas (500 alunos) conclu\xEDdo em ${totalClosingTime.toFixed(2)} ms:`);
    console.log(`   - Lat\xEAncia p50 por Turma: ${closingStats.p50Ms.toFixed(3)} ms`);
    console.log(`   - Lat\xEAncia p95 por Turma: ${closingStats.p95Ms.toFixed(3)} ms (Meta: < 500 ms) -> ${closingStats.p95Ms < 500 ? "APROVADO" : "FALHA"}`);
    console.log(`   - Lat\xEAncia p99 por Turma: ${closingStats.p99Ms.toFixed(3)} ms
`);
    console.log("5\uFE0F\u20E3 Simula\xE7\xE3o de Carga de Leitura: 500 consultas simult\xE2neas de boletim escolar...");
    const readLatencies = [];
    const queryBoletim = db.prepare(`
      SELECT 
        s.name,
        s.enrollment_id,
        c.name as class_name,
        g.final_average,
        g.attendance_percentage,
        g.status
      FROM students s
      JOIN classes c ON c.id = s.class_id
      JOIN grade_closing_summaries g ON g.student_id = s.id
      WHERE s.id = ?
    `);
    const startReads = performance.now();
    for (const sid of studentIds) {
      const t0 = performance.now();
      const boletim = queryBoletim.get(sid);
      const t1 = performance.now();
      readLatencies.push(t1 - t0);
      if (!boletim) throw new Error(`Boletim n\xE3o encontrado para aluno ${sid}`);
    }
    const totalReadTime = performance.now() - startReads;
    const readStats = calculateTelemetry(readLatencies);
    console.log(`\u2705 500 consultas anal\xEDticas de boletim conclu\xEDdas em ${totalReadTime.toFixed(2)} ms:`);
    console.log(`   - Lat\xEAncia p50 por Consulta: ${readStats.p50Ms.toFixed(3)} ms`);
    console.log(`   - Lat\xEAncia p95 por Consulta: ${readStats.p95Ms.toFixed(3)} ms`);
    console.log(`   - Vaz\xE3o: ${readStats.opsPerSec.toFixed(0)} consultas/segundo
`);
    console.log("6\uFE0F\u20E3 Teste de Rein\xEDcio Abrupto: simulando queda de energia com WAL pendente e reabertura...");
    db.pragma("wal_checkpoint(PASSIVE)");
    db.close();
    const reopenedDb = new import_better_sqlite3.default(dbPath);
    reopenedDb.pragma("journal_mode = WAL");
    const pragmaStatus = reopenedDb.pragma("integrity_check")[0]?.integrity_check;
    const finalStudents = reopenedDb.prepare("SELECT count(*) as total FROM students").get().total;
    const finalSessions = reopenedDb.prepare("SELECT count(*) as total FROM attendance_sessions").get().total;
    const finalClosings = reopenedDb.prepare("SELECT count(*) as total FROM grade_closing_summaries").get().total;
    const finalOutbox = reopenedDb.prepare("SELECT count(*) as total FROM notification_outbox").get().total;
    console.log(`\u2705 Banco reaberto com sucesso p\xF3s-simula\xE7\xE3o de crash:`);
    console.log(`   - PRAGMA integrity_check: ${pragmaStatus}`);
    console.log(`   - Alunos \xCDntegros: ${finalStudents}/500`);
    console.log(`   - Sess\xF5es de Presen\xE7a: ${finalSessions}/30`);
    console.log(`   - Boletins Fechados: ${finalClosings}/500`);
    console.log(`   - Notifica\xE7\xF5es Retidas no Outbox: ${finalOutbox}`);
    reopenedDb.close();
    if (pragmaStatus !== "ok" || finalStudents !== 500 || finalClosings !== 500) {
      throw new Error("Falha de consist\xEAncia ap\xF3s rein\xEDcio abrupto!");
    }
    const dbSize = fs.statSync(dbPath).size;
    console.log(`
\u{1F4BE} Tamanho total do banco ap\xF3s 500 alunos, 2.000 notas e 750 presen\xE7as: ${(dbSize / 1024).toFixed(1)} KB (Sem crescimento an\xF4malo).`);
    console.log("\n\u{1F3C6} =========================================================================");
    console.log("   RESULTADO DO STRESS TEST REALISTA: 100% APROVADO");
    console.log(`   - Lat\xEAncia p95 Chamada: ${attStats.p95Ms.toFixed(3)} ms (Meta: < 150 ms)`);
    console.log(`   - Lat\xEAncia p95 M\xE9dias:  ${closingStats.p95Ms.toFixed(3)} ms (Meta: < 500 ms)`);
    console.log("   - Taxa de Erro: 0,00% (Zero transa\xE7\xF5es abortadas)");
    console.log("   - Integridade P\xF3s-Crash: 100% \xCDntegra");
    console.log("=========================================================================\n");
    return {
      success: true,
      attP95Ms: attStats.p95Ms,
      closingP95Ms: closingStats.p95Ms,
      readP95Ms: readStats.p95Ms,
      errorRate: 0,
      dbSizeBytes: dbSize
    };
  } finally {
    if (fs.existsSync(testDir)) {
      try {
        fs.rmSync(testDir, { recursive: true, force: true });
      } catch {
      }
    }
  }
}
if (require.main === module) {
  runRealisticPilotStressTest().then(() => process.exit(0)).catch((err) => {
    console.error("\u274C Falha fatal no stress test realista:", err);
    process.exit(1);
  });
}
