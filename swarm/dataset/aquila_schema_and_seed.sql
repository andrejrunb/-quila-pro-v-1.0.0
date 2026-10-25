-- Áquila Pro v2.1 — Schema Relacional Completo para Treinamento & Testes no Colab HD
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA busy_timeout = 5000;

CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grade TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  class_id TEXT NOT NULL,
  enrollment_id TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS attendance_sessions (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('PRESENT', 'ABSENT', 'LATE'))
);

CREATE TABLE IF NOT EXISTS omr_sheets (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  raw_fill_deltas TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('AUTO_APPROVED', 'PENDING_TEACHER_REVIEW', 'TEACHER_HOMOLOGATED')),
  teacher_homologation TEXT
);

CREATE TABLE IF NOT EXISTS notification_outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  idempotency_key TEXT UNIQUE NOT NULL,
  provider_message_id TEXT,
  recipient_phone TEXT NOT NULL,
  template_name TEXT NOT NULL,
  parameters_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  next_retry_at TEXT,
  last_error TEXT,
  sent_at TEXT,
  reconciled_at TEXT,
  reconciled_by TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS zero_bypass_audits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  metadata_json TEXT,
  integrity_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_outbox_status_retry ON notification_outbox(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_outbox_idempotency ON notification_outbox(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_outbox_provider_id ON notification_outbox(provider_message_id);
