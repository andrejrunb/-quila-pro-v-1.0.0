/**
 * Áquila Pro v2.2 — Motor Soberano de Chamada e Auditoria de Frequência Escolar
 * apps/electron/src/db/attendance_engine.ts
 *
 * Operação 100% Edge-First, transações atômicas BEGIN IMMEDIATE, idempotência estrita
 * e trilha de auditoria criptográfica SHA-256 em conformidade com a LGPD e CNE/CEB nº 05/2011.
 */

import Database from 'better-sqlite3';
import crypto from 'crypto';

// ============================================================================
// DDL DAS TABELAS SOBERANAS DE FREQUÊNCIA (Padrão Unificado Aquila Pro)
// ============================================================================

export const ATTENDANCE_SESSIONS_DDL = `
  CREATE TABLE IF NOT EXISTS attendance_sessions (
    id TEXT PRIMARY KEY,
    classId TEXT NOT NULL,
    teacherId TEXT NOT NULL,
    date TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'COMPLETED',
    totalPresent INTEGER NOT NULL DEFAULT 0,
    totalAbsent INTEGER NOT NULL DEFAULT 0,
    idempotency_key TEXT UNIQUE NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_class_date ON attendance_sessions(classId, date);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_idempotency ON attendance_sessions(idempotency_key);
`;

export const ATTENDANCE_RECORDS_DDL = `
  CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,
    studentId TEXT NOT NULL,
    classId TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('PRESENT', 'ABSENT', 'JUSTIFIED', 'LATE')),
    notes TEXT,
    idempotency_key TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_student_class_date ON attendance(studentId, classId, date);
  CREATE INDEX IF NOT EXISTS idx_attendance_idempotency ON attendance(idempotency_key);
`;

export const DAILY_SUMMARY_DDL = `
  CREATE TABLE IF NOT EXISTS daily_attendance_summary (
    class_id TEXT NOT NULL,
    date TEXT NOT NULL,
    total_present INTEGER NOT NULL DEFAULT 0,
    total_absent INTEGER NOT NULL DEFAULT 0,
    total_justified INTEGER NOT NULL DEFAULT 0,
    attendance_rate REAL NOT NULL DEFAULT 0.0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (class_id, date)
  );
`;

export const ATTENDANCE_AUDIT_DDL = `
  CREATE TABLE IF NOT EXISTS attendance_cryptographic_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    operation_hash TEXT NOT NULL,
    record_count INTEGER NOT NULL,
    idempotency_key TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

// ============================================================================
// CONTRATOS & TIPAGENS
// ============================================================================

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'JUSTIFIED' | 'LATE';

export interface StudentAttendanceInput {
  studentId: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface AttendanceResult {
  success: boolean;
  isDuplicate: boolean;
  sessionId: string;
  classId: string;
  date: string;
  totalPresent: number;
  totalAbsent: number;
  totalJustified: number;
  attendanceRate: number; // Porcentagem de 0.0 a 100.0%
  auditHash: string;
  timestamp: string;
}

export interface ClassAttendanceSummary {
  classId: string;
  date: string;
  sessionId?: string;
  totalPresent: number;
  totalAbsent: number;
  totalJustified: number;
  attendanceRate: number;
  students: Array<{
    studentId: string;
    status: AttendanceStatus;
    notes?: string;
    updatedAt: string;
  }>;
}

// ============================================================================
// INICIALIZAÇÃO DE SCHEMA
// ============================================================================

export function initializeAttendanceSchema(db: Database.Database): void {
  db.exec(ATTENDANCE_SESSIONS_DDL);
  db.exec(ATTENDANCE_RECORDS_DDL);
  db.exec(DAILY_SUMMARY_DDL);
  db.exec(ATTENDANCE_AUDIT_DDL);
}

// ============================================================================
// REGISTRO ATÔMICO DE CHAMADA COM IDEMPOTÊNCIA E AUDITORIA SHA-256
// ============================================================================

export function recordClassAttendance(
  db: Database.Database,
  sessionId: string,
  classId: string,
  teacherId: string,
  date: string,
  records: StudentAttendanceInput[],
  idempotencyKey: string,
  startTime: string = '07:30:00',
  endTime: string = '08:20:00'
): AttendanceResult {
  initializeAttendanceSchema(db);

  // 1. Verificação prévia de idempotência
  const existingSession = db.prepare(
    `SELECT id, classId, date, status, idempotency_key FROM attendance_sessions WHERE idempotency_key = ?`
  ).get(idempotencyKey) as any;

  if (existingSession) {
    const summary = getAttendanceSheet(db, existingSession.classId, existingSession.date);
    return {
      success: true,
      isDuplicate: true,
      sessionId: existingSession.id,
      classId: existingSession.classId,
      date: existingSession.date,
      totalPresent: summary.totalPresent,
      totalAbsent: summary.totalAbsent,
      totalJustified: summary.totalJustified,
      attendanceRate: summary.attendanceRate,
      auditHash: 'IDEMPOTENT_REPLAY_CACHED',
      timestamp: new Date().toISOString()
    };
  }

  // 2. Transação Atômica em modo IMMEDIATE
  const runTransaction = db.transaction(() => {
    let present = 0;
    let absent = 0;
    let justified = 0;

    for (const r of records) {
      if (r.status === 'PRESENT') present++;
      else if (r.status === 'ABSENT') absent++;
      else if (r.status === 'JUSTIFIED') justified++;
    }

    const totalStudents = records.length;
    const rate = totalStudents > 0 ? (present / totalStudents) * 100 : 0.0;

    // Insere a sessão
    db.prepare(`
      INSERT INTO attendance_sessions (id, classId, teacherId, date, startTime, endTime, status, totalPresent, totalAbsent, idempotency_key)
      VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED', ?, ?, ?)
    `).run(sessionId, classId, teacherId, date, startTime, endTime, present, absent, idempotencyKey);

    // Insere/atualiza registros individuais na tabela attendance
    const upsertRecord = db.prepare(`
      INSERT INTO attendance (id, studentId, classId, date, status, notes, idempotency_key)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(studentId, classId, date) DO UPDATE SET
        status = excluded.status,
        notes = excluded.notes,
        idempotency_key = excluded.idempotency_key
    `);

    for (const r of records) {
      const recordId = `ATT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      upsertRecord.run(recordId, r.studentId, classId, date, r.status, r.notes || null, idempotencyKey);
    }

    // Atualiza sumário diário
    db.prepare(`
      INSERT INTO daily_attendance_summary (class_id, date, total_present, total_absent, total_justified, attendance_rate, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(class_id, date) DO UPDATE SET
        total_present = excluded.total_present,
        total_absent = excluded.total_absent,
        total_justified = excluded.total_justified,
        attendance_rate = excluded.attendance_rate,
        updated_at = datetime('now')
    `).run(classId, date, present, absent, justified, rate);

    // Trilha Criptográfica de Auditoria SHA-256
    const payloadToHash = JSON.stringify({
      sessionId,
      classId,
      teacherId,
      date,
      records: records.map(r => ({ id: r.studentId, s: r.status })),
      idempotencyKey
    });
    const auditHash = crypto.createHash('sha256').update(payloadToHash).digest('hex');

    db.prepare(`
      INSERT INTO attendance_cryptographic_audit (session_id, operation_hash, record_count, idempotency_key)
      VALUES (?, ?, ?, ?)
    `).run(sessionId, auditHash, totalStudents, idempotencyKey);

    return {
      present,
      absent,
      justified,
      rate,
      auditHash
    };
  });

  const txResult = runTransaction.immediate();

  return {
    success: true,
    isDuplicate: false,
    sessionId,
    classId,
    date,
    totalPresent: txResult.present,
    totalAbsent: txResult.absent,
    totalJustified: txResult.justified,
    attendanceRate: Math.round(txResult.rate * 10) / 10,
    auditHash: txResult.auditHash,
    timestamp: new Date().toISOString()
  };
}

// ============================================================================
// CONSULTA DE FOLHA DIÁRIA DE CHAMADA POR TURMA
// ============================================================================

export function getAttendanceSheet(
  db: Database.Database,
  classId: string,
  date: string
): ClassAttendanceSummary {
  initializeAttendanceSchema(db);

  const session = db.prepare(`
    SELECT id, totalPresent, totalAbsent FROM attendance_sessions
    WHERE classId = ? AND date = ?
    ORDER BY createdAt DESC LIMIT 1
  `).get(classId, date) as any;

  if (!session) {
    return {
      classId,
      date,
      totalPresent: 0,
      totalAbsent: 0,
      totalJustified: 0,
      attendanceRate: 0.0,
      students: []
    };
  }

  const rows = db.prepare(`
    SELECT studentId, status, notes, createdAt
    FROM attendance
    WHERE classId = ? AND date = ?
    ORDER BY studentId ASC
  `).all(classId, date) as any[];

  let present = 0;
  let absent = 0;
  let justified = 0;

  const students = rows.map(r => {
    if (r.status === 'PRESENT') present++;
    else if (r.status === 'ABSENT') absent++;
    else if (r.status === 'JUSTIFIED') justified++;
    return {
      studentId: r.studentId,
      status: r.status as AttendanceStatus,
      notes: r.notes,
      updatedAt: r.createdAt
    };
  });

  const total = students.length;
  const rate = total > 0 ? (present / total) * 100 : 0.0;

  return {
    classId,
    date,
    sessionId: session.id,
    totalPresent: present,
    totalAbsent: absent,
    totalJustified: justified,
    attendanceRate: Math.round(rate * 10) / 10,
    students
  };
}
