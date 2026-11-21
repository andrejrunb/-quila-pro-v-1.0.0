import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'crypto';

export const MVP01_DEMO_SCHOOL_ID = 'school-aquila-01';
export const MVP01_SEED_FLAG = 'mvp01-demo-v1';

export interface Mvp01DbLike {
  run: Function;
  get: Function;
  all: Function;
  transaction?: Function;
}

const ensuredDbCache = new WeakMap<object, Promise<void>>();
const manualTxTails = new WeakMap<object, Promise<any>>();
const manualTxStores = new WeakMap<object, AsyncLocalStorage<{ depth: number }>>();
let manualSavepointSeq = 0;

function getManualTxStore(db: object): AsyncLocalStorage<{ depth: number }> {
  let store = manualTxStores.get(db);
  if (!store) {
    store = new AsyncLocalStorage<{ depth: number }>();
    manualTxStores.set(db, store);
  }
  return store;
}

export async function mvp01Run(db: Mvp01DbLike, sql: string, params: unknown[] = []): Promise<any> {
  return await (db.run as (s: string, p?: unknown[]) => Promise<any>)(sql, params);
}

export async function mvp01Get<T = any>(
  db: Mvp01DbLike,
  sql: string,
  params: unknown[] = []
): Promise<T | undefined> {
  return await (db.get as (s: string, p?: unknown[]) => Promise<T | undefined>)(sql, params);
}

export async function mvp01All<T = any>(
  db: Mvp01DbLike,
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const rows = await (db.all as (s: string, p?: unknown[]) => Promise<T[] | undefined>)(sql, params);
  return Array.isArray(rows) ? rows : [];
}

/**
 * Executa trabalho em transação usando db.transaction() quando disponível
 * ou serialização por fila + AsyncLocalStorage (SAVEPOINT apenas para reentrância) via db.run().
 */
export async function withMvp01Transaction<T>(
  db: Mvp01DbLike,
  work: () => Promise<T>
): Promise<T> {
  if (typeof db.transaction === 'function') {
    return await (db.transaction as <R>(fn: () => Promise<R>) => Promise<R>)(work);
  }

  const txStore = getManualTxStore(db);
  const current = txStore.getStore();

  if (current) {
    const savepoint = `mvp01_sp_${current.depth}_${++manualSavepointSeq}`;
    await mvp01Run(db, `SAVEPOINT ${savepoint}`);
    try {
      const result = await txStore.run({ depth: current.depth + 1 }, work);
      await mvp01Run(db, `RELEASE SAVEPOINT ${savepoint}`);
      return result;
    } catch (err) {
      try {
        await mvp01Run(db, `ROLLBACK TO SAVEPOINT ${savepoint}`);
        await mvp01Run(db, `RELEASE SAVEPOINT ${savepoint}`);
      } catch {
        // Evita mascarar o erro original caso o rollback já tenha sido aplicado pelo driver
      }
      throw err;
    }
  }

  const prev = manualTxTails.get(db) ?? Promise.resolve();
  let release!: () => void;
  const tail = new Promise<void>((resolve) => {
    release = resolve;
  });
  manualTxTails.set(db, tail);

  await prev;
  try {
    try {
      await mvp01Run(db, 'BEGIN IMMEDIATE');
    } catch {
      await mvp01Run(db, 'BEGIN');
    }

    try {
      const result = await txStore.run({ depth: 1 }, work);
      await mvp01Run(db, 'COMMIT');
      return result;
    } catch (err) {
      try {
        await mvp01Run(db, 'ROLLBACK');
      } catch {
        // Evita mascarar o erro original caso o rollback já tenha sido aplicado pelo driver
      }
      throw err;
    }
  } finally {
    release();
  }
}

const MVP01_DDL_STATEMENTS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS mvp01_schools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cnpj TEXT,
    city TEXT,
    state TEXT,
    is_demo INTEGER DEFAULT 0,
    seed_flag TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS mvp01_academic_years (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    stage TEXT NOT NULL CHECK(stage IN ('FUNDAMENTAL','MEDIO')),
    min_days INTEGER DEFAULT 200,
    min_hours INTEGER DEFAULT 800,
    planned_days INTEGER,
    planned_hours INTEGER,
    completed_hours REAL DEFAULT 0,
    legal_basis TEXT,
    status TEXT NOT NULL CHECK(status IN ('DRAFT','OPEN','CLOSED')) DEFAULT 'OPEN'
  )`,
  `CREATE TABLE IF NOT EXISTS mvp01_academic_periods (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    academic_year_id TEXT NOT NULL,
    name TEXT NOT NULL,
    start_date TEXT,
    end_date TEXT,
    status TEXT NOT NULL CHECK(status IN ('OPEN','CLOSED')) DEFAULT 'OPEN',
    closed_by TEXT,
    closed_at TEXT,
    reopen_reason TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS mvp01_memberships (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    person_name TEXT,
    email TEXT,
    school_id TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('ACTIVE','INACTIVE')) DEFAULT 'ACTIVE',
    valid_until TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS mvp01_user_invitations (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    user_id TEXT,
    membership_id TEXT,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    invite_token_hash TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('PENDING','ACCEPTED','REVOKED','EXPIRED')) DEFAULT 'PENDING',
    expires_at TEXT,
    created_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS mvp01_classes (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    academic_year_id TEXT NOT NULL,
    stage TEXT,
    name TEXT NOT NULL,
    shift TEXT,
    room TEXT,
    capacity INTEGER NOT NULL CHECK(capacity > 0),
    status TEXT NOT NULL CHECK(status IN ('DRAFT','ACTIVE','CLOSED')) DEFAULT 'ACTIVE'
  )`,
  `CREATE TABLE IF NOT EXISTS mvp01_teaching_assignments (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    teacher_user_id TEXT NOT NULL,
    teacher_name TEXT,
    class_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    academic_year_id TEXT,
    valid_from TEXT,
    valid_until TEXT,
    active INTEGER DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS mvp01_coordination_assignments (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    coordinator_user_id TEXT NOT NULL,
    class_id TEXT,
    stage TEXT,
    active INTEGER DEFAULT 1
  )`,
  `CREATE TABLE IF NOT EXISTS mvp01_guardian_student_links (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    guardian_user_id TEXT NOT NULL,
    guardian_name TEXT,
    guardian_phone TEXT,
    guardian_email TEXT,
    student_id TEXT NOT NULL,
    relationship TEXT,
    is_legal_guardian INTEGER DEFAULT 0,
    can_view_portal INTEGER DEFAULT 0,
    is_emergency_contact INTEGER DEFAULT 0,
    can_pickup INTEGER DEFAULT 0,
    is_financial_responsible INTEGER DEFAULT 0,
    has_judicial_restriction INTEGER DEFAULT 0,
    revoked_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS mvp01_students (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    user_id TEXT,
    full_name TEXT NOT NULL,
    birth_date TEXT,
    registration_code TEXT,
    photo_url TEXT,
    health_summary_restricted TEXT,
    allergies TEXT,
    pickup_notes TEXT,
    is_demo INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS mvp01_enrollment_drafts (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    student_id TEXT,
    student_name TEXT NOT NULL,
    academic_year_id TEXT NOT NULL,
    stage TEXT,
    class_id TEXT,
    status TEXT NOT NULL CHECK(status IN ('RASCUNHO','EM_CONFERENCIA','CONFIRMADA','CANCELADA')) DEFAULT 'RASCUNHO',
    doc_status TEXT NOT NULL CHECK(doc_status IN ('PENDENTE','EM_ANALISE','ACEITA','RECUSADA')) DEFAULT 'PENDENTE',
    doc_checklist_json TEXT,
    payload_json TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    confirmed_enrollment_id TEXT,
    updated_by TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS mvp01_enrollments (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    academic_year_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('ATIVA','TRANSFERIDA','CONCLUIDA','CANCELADA')) DEFAULT 'ATIVA',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 1
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_mvp01_one_active_enrollment
    ON mvp01_enrollments(school_id, student_id, academic_year_id)
    WHERE status = 'ATIVA'`,
  `CREATE TABLE IF NOT EXISTS mvp01_class_memberships (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    enrollment_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    reason TEXT,
    started_at TEXT NOT NULL,
    ended_at TEXT
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_mvp01_one_current_class
    ON mvp01_class_memberships(school_id, enrollment_id)
    WHERE ended_at IS NULL`,
  `CREATE TABLE IF NOT EXISTS mvp01_grading_policy_versions (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    class_id TEXT,
    subject TEXT,
    version_number INTEGER NOT NULL,
    weights_json TEXT NOT NULL,
    scale_max REAL DEFAULT 10,
    rounding_rule TEXT,
    passing_grade REAL DEFAULT 6,
    recovery_rule TEXT,
    created_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS mvp01_grade_entries (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    enrollment_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    period_id TEXT NOT NULL,
    policy_version_id TEXT,
    n1 REAL,
    n2 REAL,
    n3 REAL,
    recovery REAL,
    entry_state TEXT NOT NULL CHECK(entry_state IN ('PENDING','GRADED','EXEMPT')) DEFAULT 'PENDING',
    final_average REAL,
    published INTEGER DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 1,
    updated_by TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_mvp01_grade_entry_unique
    ON mvp01_grade_entries(school_id, enrollment_id, subject, period_id)`,
  `CREATE TABLE IF NOT EXISTS mvp01_attendance_sheets (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    lesson_date TEXT NOT NULL,
    teacher_user_id TEXT NOT NULL,
    lesson_topic TEXT,
    homework_note TEXT,
    sync_state TEXT NOT NULL CHECK(sync_state IN ('LOCAL_SAVED','PENDING_SYNC','SERVER_CONFIRMED','CONFLICT')) DEFAULT 'SERVER_CONFIRMED',
    version INTEGER NOT NULL DEFAULT 1,
    finalized INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_mvp01_attendance_sheet_unique
    ON mvp01_attendance_sheets(school_id, class_id, subject, lesson_date)`,
  `CREATE TABLE IF NOT EXISTS mvp01_attendance_records (
    id TEXT PRIMARY KEY,
    sheet_id TEXT NOT NULL,
    school_id TEXT NOT NULL,
    enrollment_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('PRESENT','ABSENT','LATE','JUSTIFIED')),
    correction_reason TEXT,
    updated_by TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sheet_id, enrollment_id)
  )`,
  `CREATE TABLE IF NOT EXISTS mvp01_absence_justifications (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    guardian_user_id TEXT NOT NULL,
    absence_date TEXT NOT NULL,
    reason TEXT NOT NULL,
    attachment_name TEXT,
    attachment_size_bytes INTEGER,
    status TEXT NOT NULL CHECK(status IN ('PENDING_REVIEW','APPROVED','REJECTED')) DEFAULT 'PENDING_REVIEW',
    reviewed_by TEXT,
    review_note TEXT,
    reviewed_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS mvp01_incidents (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    class_id TEXT,
    category TEXT NOT NULL CHECK(category IN ('DISCIPLINARY','PEDAGOGICAL','HEALTH_CARE','PRAISE')),
    title TEXT NOT NULL,
    internal_notes TEXT,
    published_summary TEXT,
    published_to_family INTEGER DEFAULT 0,
    responsible_user_id TEXT,
    due_date TEXT,
    resolution_note TEXT,
    status TEXT NOT NULL CHECK(status IN ('OPEN','IN_PROGRESS','RESOLVED')) DEFAULT 'OPEN',
    family_ack_at TEXT,
    family_ack_by TEXT,
    created_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS mvp01_communications (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    target_scope TEXT NOT NULL,
    target_class_id TEXT,
    target_student_id TEXT,
    requires_authorization INTEGER DEFAULT 0,
    authorization_version INTEGER DEFAULT 1,
    status TEXT NOT NULL CHECK(status IN ('DRAFT','PUBLISHED')) DEFAULT 'PUBLISHED',
    published_by TEXT,
    published_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS mvp01_communication_receipts (
    id TEXT PRIMARY KEY,
    communication_id TEXT NOT NULL,
    school_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK(event_type IN ('DELIVERED','OPENED','ACKNOWLEDGED','AUTHORIZED','DENIED')),
    note TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(communication_id, user_id, student_id, event_type)
  )`,
  `CREATE TABLE IF NOT EXISTS mvp01_issued_documents (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    enrollment_id TEXT,
    doc_type TEXT NOT NULL CHECK(doc_type IN ('DECLARACAO_MATRICULA','DECLARACAO_FREQUENCIA','FICHA_INDIVIDUAL','BOLETIM')),
    version INTEGER NOT NULL DEFAULT 1,
    policy_version_id TEXT,
    snapshot_json TEXT NOT NULL,
    content_hash_sha256 TEXT NOT NULL,
    verification_token TEXT UNIQUE NOT NULL,
    issuer_user_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('ACTIVE','REVOKED')) DEFAULT 'ACTIVE',
    revoked_reason TEXT,
    issued_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS mvp01_tasks (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    subject TEXT,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT,
    teacher_user_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS mvp01_task_completions (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_id, student_id)
  )`,
  `CREATE TABLE IF NOT EXISTS mvp01_practice_sessions (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    skill_code TEXT NOT NULL,
    skill_name TEXT,
    questions_answered INTEGER NOT NULL DEFAULT 0,
    independent_correct INTEGER NOT NULL DEFAULT 0,
    hints_used INTEGER NOT NULL DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    completed_reason TEXT,
    consecutive_errors INTEGER DEFAULT 0,
    estimated_level TEXT,
    confidence_label TEXT CHECK(confidence_label IN ('BAIXA','MEDIA','ALTA')),
    needs_teacher_review INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS mvp01_mastery_estimates (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    skill_code TEXT NOT NULL,
    skill_name TEXT,
    questions_answered INTEGER NOT NULL DEFAULT 0,
    independent_correct INTEGER NOT NULL DEFAULT 0,
    hints_used INTEGER NOT NULL DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    completed_reason TEXT,
    estimated_level TEXT,
    confidence_label TEXT CHECK(confidence_label IN ('BAIXA','MEDIA','ALTA')),
    needs_teacher_review INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(school_id, student_id, subject, skill_code)
  )`,
  `CREATE TABLE IF NOT EXISTS mvp01_calendar_holidays (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    academic_year_id TEXT NOT NULL,
    date TEXT NOT NULL,
    name TEXT NOT NULL,
    origin TEXT NOT NULL CHECK(origin IN ('BRASIL_API','ESCOLA','ESTADUAL','MUNICIPAL')),
    status TEXT NOT NULL CHECK(status IN ('CANDIDATE','APPROVED','REJECTED')) DEFAULT 'CANDIDATE',
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_mvp01_calendar_holiday_unique
    ON mvp01_calendar_holidays(school_id, academic_year_id, date)`,
  `CREATE TABLE IF NOT EXISTS mvp01_timetable_slots (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    academic_year_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    day_of_week INTEGER NOT NULL,
    slot_index INTEGER NOT NULL,
    start_time TEXT,
    end_time TEXT,
    subject TEXT NOT NULL,
    teacher_user_id TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    published INTEGER DEFAULT 1
  )`,
  `CREATE INDEX IF NOT EXISTS idx_mvp01_timetable_class
    ON mvp01_timetable_slots(school_id, class_id, day_of_week, slot_index)`,
  `CREATE TABLE IF NOT EXISTS mvp01_idempotency_operations (
    idempotency_key TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    response_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS mvp01_audit_events (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    reason TEXT,
    metadata_json TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS mvp01_outbox_events (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    resource_id TEXT,
    payload_json TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('PENDING','PROCESSED','FAILED')) DEFAULT 'PENDING',
    attempts INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_mvp01_memberships_user ON mvp01_memberships(user_id, school_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_mvp01_guardian_links_user ON mvp01_guardian_student_links(school_id, guardian_user_id, student_id)`,
  `CREATE INDEX IF NOT EXISTS idx_mvp01_teaching_user ON mvp01_teaching_assignments(school_id, teacher_user_id, class_id, active)`,
  `CREATE INDEX IF NOT EXISTS idx_mvp01_incidents_school_student ON mvp01_incidents(school_id, student_id, published_to_family)`,
  `CREATE INDEX IF NOT EXISTS idx_mvp01_audit_school_created ON mvp01_audit_events(school_id, created_at)`,
];

/**
 * Cria todas as tabelas compartilhadas do MVP 0.1 de maneira idempotente usando db.run().
 */
export async function ensureMvp01Schema(db: Mvp01DbLike): Promise<void> {
  if (!db || typeof db.run !== 'function') {
    throw new Error('[Mvp01Schema] Instância de banco inválida.');
  }

  const cached = ensuredDbCache.get(db);
  if (cached) {
    return await cached;
  }

  const runPromise = (async () => {
    for (const stmt of MVP01_DDL_STATEMENTS) {
      await mvp01Run(db, stmt);
    }
    try {
      await syncLegacySchoolDataToMvp01(db);
    } catch (syncErr) {
      console.warn('[Mvp01Schema] Aviso ao sincronizar dados legados para MVP 0.1:', syncErr);
    }
  })().catch((err) => {
    ensuredDbCache.delete(db);
    throw err;
  });

  ensuredDbCache.set(db, runPromise);
  return await runPromise;
}

/**
 * Popula dados iniciais de demonstração marcados com is_demo = 1 / seed_flag
 * exclusivamente quando mvp01_schools estiver vazia.
 */
export async function seedMvp01DemoData(db: Mvp01DbLike): Promise<boolean> {
  await ensureMvp01Schema(db);

  const countRow = await mvp01Get<{ total: number }>(
    db,
    'SELECT COUNT(*) as total FROM mvp01_schools'
  );
  if ((countRow?.total ?? 0) > 0) {
    return false;
  }

  const now = new Date().toISOString();

  await withMvp01Transaction(db, async () => {
    const doubleCheck = await mvp01Get<{ total: number }>(
      db,
      'SELECT COUNT(*) as total FROM mvp01_schools'
    );
    if ((doubleCheck?.total ?? 0) > 0) {
      return;
    }

    await mvp01Run(
      db,
      `INSERT OR IGNORE INTO mvp01_schools (id, name, cnpj, city, state, is_demo, seed_flag, created_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      [MVP01_DEMO_SCHOOL_ID, 'Colégio Áquila Modelo', '12.345.678/0001-90', 'Brasília', 'DF', MVP01_SEED_FLAG, now]
    );

    const academicYears = [
      [
        'ay-2026-fund',
        MVP01_DEMO_SCHOOL_ID,
        2026,
        'FUNDAMENTAL',
        200,
        800,
        205,
        840,
        460,
        'LDB Art. 24, I (200 dias letivos / 800 horas)',
        'OPEN',
      ],
      [
        'ay-2026-med',
        MVP01_DEMO_SCHOOL_ID,
        2026,
        'MEDIO',
        200,
        1000,
        205,
        1025,
        560,
        'LDB Art. 24, I c/c Lei 13.415/2017 (200 dias letivos / 1000 horas)',
        'OPEN',
      ],
    ];
    for (const row of academicYears) {
      await mvp01Run(
        db,
        `INSERT OR IGNORE INTO mvp01_academic_years
         (id, school_id, year, stage, min_days, min_hours, planned_days, planned_hours, completed_hours, legal_basis, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        row
      );
    }

    const periods = [
      ['period-demo-1', MVP01_DEMO_SCHOOL_ID, 'ay-2026-fund', '1º Bimestre', '2026-02-02', '2026-04-17', 'CLOSED', 'user-demo-coord', '2026-04-20T18:00:00.000Z', null],
      ['period-demo-2', MVP01_DEMO_SCHOOL_ID, 'ay-2026-fund', '2º Bimestre', '2026-04-20', '2026-07-03', 'CLOSED', 'user-demo-coord', '2026-07-06T18:00:00.000Z', null],
      ['period-demo-3', MVP01_DEMO_SCHOOL_ID, 'ay-2026-fund', '3º Bimestre', '2026-08-03', '2026-10-09', 'OPEN', null, null, null],
      ['period-demo-4', MVP01_DEMO_SCHOOL_ID, 'ay-2026-fund', '4º Bimestre', '2026-10-13', '2026-12-18', 'OPEN', null, null, null],
      ['period-med-1', MVP01_DEMO_SCHOOL_ID, 'ay-2026-med', '1º Bimestre', '2026-02-02', '2026-04-17', 'CLOSED', 'user-demo-coord', '2026-04-20T18:00:00.000Z', null],
      ['period-med-2', MVP01_DEMO_SCHOOL_ID, 'ay-2026-med', '2º Bimestre', '2026-04-20', '2026-07-03', 'CLOSED', 'user-demo-coord', '2026-07-06T18:00:00.000Z', null],
      ['period-med-3', MVP01_DEMO_SCHOOL_ID, 'ay-2026-med', '3º Bimestre', '2026-08-03', '2026-10-09', 'OPEN', null, null, null],
      ['period-med-4', MVP01_DEMO_SCHOOL_ID, 'ay-2026-med', '4º Bimestre', '2026-10-13', '2026-12-18', 'OPEN', null, null, null],
    ];
    for (const row of periods) {
      await mvp01Run(
        db,
        `INSERT OR IGNORE INTO mvp01_academic_periods
         (id, school_id, academic_year_id, name, start_date, end_date, status, closed_by, closed_at, reopen_reason)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        row
      );
    }

    const classes = [
      ['class-7a', MVP01_DEMO_SCHOOL_ID, 'ay-2026-fund', 'FUNDAMENTAL', '7A', 'MATUTINO', 'Sala 101', 30, 'ACTIVE'],
      ['class-1em-b', MVP01_DEMO_SCHOOL_ID, 'ay-2026-med', 'MEDIO', '1EM-B', 'MATUTINO', 'Sala 204', 30, 'ACTIVE'],
    ];
    for (const row of classes) {
      await mvp01Run(
        db,
        `INSERT OR IGNORE INTO mvp01_classes
         (id, school_id, academic_year_id, stage, name, shift, room, capacity, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        row
      );
    }

    // Usuários multi-papel demo (inclusive docente que também é responsável)
    const memberships = [
      ['mem-demo-sec', 'user-demo-sec', 'Ana Paula Secretaria', 'secretaria@aquila.demo', MVP01_DEMO_SCHOOL_ID, 'secretary', 'ACTIVE', null],
      ['mem-demo-coord', 'user-demo-coord', 'Carlos Henrique Coordenação', 'coordenacao@aquila.demo', MVP01_DEMO_SCHOOL_ID, 'coordinator', 'ACTIVE', null],
      ['mem-demo-dir', 'user-demo-dir', 'Beatriz Almeida Direção', 'direcao@aquila.demo', MVP01_DEMO_SCHOOL_ID, 'director', 'ACTIVE', null],
      ['mem-demo-multi-teacher', 'user-demo-multi', 'Prof. Ricardo Mendes', 'ricardo@aquila.demo', MVP01_DEMO_SCHOOL_ID, 'teacher', 'ACTIVE', null],
      ['mem-demo-multi-parent', 'user-demo-multi', 'Ricardo Mendes (Responsável)', 'ricardo@aquila.demo', MVP01_DEMO_SCHOOL_ID, 'parent', 'ACTIVE', null],
      ['mem-demo-parent', 'user-demo-parent', 'Mariana Costa', 'mariana@aquila.demo', MVP01_DEMO_SCHOOL_ID, 'parent', 'ACTIVE', null],
      ['mem-demo-student', 'user-demo-student', 'Lucas Costa', 'lucas@aquila.demo', MVP01_DEMO_SCHOOL_ID, 'student', 'ACTIVE', null],
    ];
    for (const row of memberships) {
      await mvp01Run(
        db,
        `INSERT OR IGNORE INTO mvp01_memberships
         (id, user_id, person_name, email, school_id, role, status, valid_until)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        row
      );
    }

    const students = [
      [
        'student-demo-1',
        MVP01_DEMO_SCHOOL_ID,
        'user-demo-student',
        'Lucas Costa',
        '2013-04-12',
        'AQ-2026-001',
        null,
        'Asma leve intermitente; broncodilatador disponível na enfermaria.',
        'Amendoim',
        'Retirada somente pela mãe Mariana Costa.',
        1,
        now,
      ],
      [
        'student-demo-2',
        MVP01_DEMO_SCHOOL_ID,
        null,
        'Sofia Mendes',
        '2013-08-25',
        'AQ-2026-002',
        null,
        null,
        null,
        'Retirada autorizada pelo responsável Ricardo Mendes.',
        1,
        now,
      ],
      [
        'student-demo-3',
        MVP01_DEMO_SCHOOL_ID,
        null,
        'Gabriel Oliveira',
        '2010-02-19',
        'AQ-2026-003',
        null,
        'Uso contínuo de óculos corretivos.',
        'Dipirona',
        'Saída autônoma autorizada pela família.',
        1,
        now,
      ],
    ];
    for (const row of students) {
      await mvp01Run(
        db,
        `INSERT OR IGNORE INTO mvp01_students
         (id, school_id, user_id, full_name, birth_date, registration_code, photo_url, health_summary_restricted, allergies, pickup_notes, is_demo, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        row
      );
    }

    const enrollments = [
      ['enr-demo-1', MVP01_DEMO_SCHOOL_ID, 'student-demo-1', 'ay-2026-fund', 'ATIVA', now, 1],
      ['enr-demo-2', MVP01_DEMO_SCHOOL_ID, 'student-demo-2', 'ay-2026-fund', 'ATIVA', now, 1],
      ['enr-demo-3', MVP01_DEMO_SCHOOL_ID, 'student-demo-3', 'ay-2026-med', 'ATIVA', now, 1],
    ];
    for (const row of enrollments) {
      await mvp01Run(
        db,
        `INSERT OR IGNORE INTO mvp01_enrollments (id, school_id, student_id, academic_year_id, status, created_at, version)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        row
      );
    }

    const classMemberships = [
      ['cm-demo-1', MVP01_DEMO_SCHOOL_ID, 'enr-demo-1', 'class-7a', 'MATRICULA_INICIAL', now, null],
      ['cm-demo-2', MVP01_DEMO_SCHOOL_ID, 'enr-demo-2', 'class-7a', 'MATRICULA_INICIAL', now, null],
      ['cm-demo-3', MVP01_DEMO_SCHOOL_ID, 'enr-demo-3', 'class-1em-b', 'MATRICULA_INICIAL', now, null],
    ];
    for (const row of classMemberships) {
      await mvp01Run(
        db,
        `INSERT OR IGNORE INTO mvp01_class_memberships (id, school_id, enrollment_id, class_id, reason, started_at, ended_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        row
      );
    }

    const guardianLinks = [
      ['glink-demo-1', MVP01_DEMO_SCHOOL_ID, 'user-demo-parent', 'Mariana Costa', '(61) 99900-1122', 'mariana@aquila.demo', 'student-demo-1', 'Mãe', 1, 1, 1, 1, 1, 0, null, now],
      ['glink-demo-2', MVP01_DEMO_SCHOOL_ID, 'user-demo-multi', 'Ricardo Mendes', '(61) 99900-3344', 'ricardo@aquila.demo', 'student-demo-2', 'Pai', 1, 1, 1, 1, 1, 0, null, now],
    ];
    for (const row of guardianLinks) {
      await mvp01Run(
        db,
        `INSERT OR IGNORE INTO mvp01_guardian_student_links
         (id, school_id, guardian_user_id, guardian_name, guardian_phone, guardian_email, student_id, relationship, is_legal_guardian, can_view_portal, is_emergency_contact, can_pickup, is_financial_responsible, has_judicial_restriction, revoked_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        row
      );
    }

    const teachingAssignments = [
      ['ta-demo-1', MVP01_DEMO_SCHOOL_ID, 'user-demo-multi', 'Prof. Ricardo Mendes', 'class-7a', 'Matemática', 'ay-2026-fund', '2026-02-01', '2026-12-20', 1],
      ['ta-demo-2', MVP01_DEMO_SCHOOL_ID, 'user-demo-multi', 'Prof. Ricardo Mendes', 'class-1em-b', 'Física', 'ay-2026-med', '2026-02-01', '2026-12-20', 1],
    ];
    for (const row of teachingAssignments) {
      await mvp01Run(
        db,
        `INSERT OR IGNORE INTO mvp01_teaching_assignments
         (id, school_id, teacher_user_id, teacher_name, class_id, subject, academic_year_id, valid_from, valid_until, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        row
      );
    }

    const coordAssignments = [
      ['ca-demo-1', MVP01_DEMO_SCHOOL_ID, 'user-demo-coord', 'class-7a', 'FUNDAMENTAL', 1],
      ['ca-demo-2', MVP01_DEMO_SCHOOL_ID, 'user-demo-coord', 'class-1em-b', 'MEDIO', 1],
    ];
    for (const row of coordAssignments) {
      await mvp01Run(
        db,
        `INSERT OR IGNORE INTO mvp01_coordination_assignments
         (id, school_id, coordinator_user_id, class_id, stage, active)
         VALUES (?, ?, ?, ?, ?, ?)`,
        row
      );
    }

    await mvp01Run(
      db,
      `INSERT OR IGNORE INTO mvp01_grading_policy_versions
       (id, school_id, class_id, subject, version_number, weights_json, scale_max, rounding_rule, passing_grade, recovery_rule, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'policy-demo-v1',
        MVP01_DEMO_SCHOOL_ID,
        'class-7a',
        'Matemática',
        1,
        JSON.stringify({ n1: 0.4, n2: 0.4, n3: 0.2 }),
        10,
        'HALF_UP_0_5',
        6.0,
        'MAX_WITH_RECOVERY',
        'user-demo-coord',
        now,
      ]
    );

    const tasks = [
      ['task-demo-1', MVP01_DEMO_SCHOOL_ID, 'class-7a', 'Matemática', 'Lista de Equações do 1º Grau', 'Resolver os exercícios 1 a 8 do caderno.', '2026-08-22', 'user-demo-multi', now],
      ['task-demo-2', MVP01_DEMO_SCHOOL_ID, 'class-1em-b', 'Física', 'Estudo Dirigido de Cinemática', 'Revisar gráficos de MRU e MRUV.', '2026-08-25', 'user-demo-multi', now],
    ];
    for (const row of tasks) {
      await mvp01Run(
        db,
        `INSERT OR IGNORE INTO mvp01_tasks
         (id, school_id, class_id, subject, title, description, due_date, teacher_user_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        row
      );
    }

    const communications = [
      ['comm-demo-1', MVP01_DEMO_SCHOOL_ID, 'Plantão Pedagógico do 3º Bimestre', 'Convidamos as famílias para o acompanhamento bimestral presencial na escola.', 'ALL_SCHOOL', null, null, 0, 1, 'PUBLISHED', 'user-demo-coord', now],
      ['comm-demo-2', MVP01_DEMO_SCHOOL_ID, 'Autorização: Visita ao Planetário', 'Solicitamos autorização do responsável legal para a saída pedagógica da turma 7A.', 'CLASS', 'class-7a', null, 1, 1, 'PUBLISHED', 'user-demo-coord', now],
    ];
    for (const row of communications) {
      await mvp01Run(
        db,
        `INSERT OR IGNORE INTO mvp01_communications
         (id, school_id, title, body, target_scope, target_class_id, target_student_id, requires_authorization, authorization_version, status, published_by, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        row
      );
    }

    await mvp01Run(
      db,
      `INSERT OR IGNORE INTO mvp01_audit_events
       (id, school_id, user_id, role, action, resource_type, resource_id, reason, metadata_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        MVP01_DEMO_SCHOOL_ID,
        'SYSTEM_SEED',
        'system',
        'DEMO_SEED_APPLIED',
        'school',
        MVP01_DEMO_SCHOOL_ID,
        'Inicialização idempotente de dados demonstrativos MVP 0.1',
        JSON.stringify({ seedFlag: MVP01_SEED_FLAG, isDemo: 1 }),
        now,
      ]
    );
  });

  return true;
}

function mapLegacyRoleToMvp01Canonical(role?: string | null): string | null {
  const raw = String(role || '').trim().toLowerCase();
  const map: Record<string, string> = {
    admin: 'admin',
    director: 'director',
    diretoria: 'director',
    secretary: 'secretary',
    secretaria: 'secretary',
    hr: 'secretary',
    rh: 'secretary',
    coordinator: 'coordinator',
    coordenacao: 'coordinator',
    teacher: 'teacher',
    docente: 'teacher',
    professor: 'teacher',
    parent: 'parent',
    responsavel: 'parent',
    pais: 'parent',
    student: 'student',
    aluno: 'student',
  };
  return map[raw] ?? null;
}

function inferLegacyStage(id?: string | null, name?: string | null, grade?: string | null): 'FUNDAMENTAL' | 'MEDIO' {
  const combined = `${id || ''} ${name || ''} ${grade || ''}`;
  return /\bEM\b|F-EM|M-EM|S[EÉ]RIE|M[EÉ]DIO/i.test(combined) ? 'MEDIO' : 'FUNDAMENTAL';
}

function sanitizeKeySlug(raw: string): string {
  return String(raw || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

function resolveTimetableSlotIndex(startTime?: string | null, fallbackIndex = 1): number {
  const map: Record<string, number> = {
    '07:00': 1,
    '07:30': 1,
    '07:50': 2,
    '08:20': 2,
    '08:40': 3,
    '09:10': 3,
    '09:30': 4,
    '10:00': 4,
    '10:20': 5,
    '11:10': 6,
    '12:00': 7,
    '13:30': 8,
    '14:20': 9,
    '15:10': 10,
  };
  const key = String(startTime || '').trim();
  return map[key] || fallbackIndex;
}

async function getLegacyTableSet(db: Mvp01DbLike): Promise<Set<string>> {
  const rows = await mvp01All<{ name: string }>(
    db,
    `SELECT name FROM sqlite_master WHERE type = 'table'`
  );
  return new Set(rows.map((r) => String(r.name)));
}

async function getLegacyColumnSet(db: Mvp01DbLike, tableName: string): Promise<Set<string>> {
  const rows = await mvp01All<{ name: string }>(db, `PRAGMA table_info("${tableName}")`);
  return new Set(rows.map((r) => String(r.name)));
}

/**
 * Projeta de forma idempotente turmas, estudantes, vínculos docentes, usuários e horários
 * já presentes nas tabelas legadas (classes, students, users, teacher_classes, schedules)
 * para as tabelas compartilhadas mvp01_* quando o MVP 0.1 ainda não foi populado.
 */
export async function syncLegacySchoolDataToMvp01(db: Mvp01DbLike): Promise<boolean> {
  const tables = await getLegacyTableSet(db);
  if (!tables.has('classes') || !tables.has('mvp01_classes')) {
    return false;
  }

  const demoSchoolRow = await mvp01Get<{ total: number }>(
    db,
    'SELECT COUNT(*) as total FROM mvp01_schools WHERE is_demo = 1'
  );
  if ((demoSchoolRow?.total ?? 0) > 0) {
    return false;
  }

  const legacyClassCountRow = await mvp01Get<{ total: number }>(
    db,
    'SELECT COUNT(*) as total FROM classes'
  );
  if ((legacyClassCountRow?.total ?? 0) === 0) {
    return false;
  }

  const mvpClassCountRow = await mvp01Get<{ total: number }>(
    db,
    'SELECT COUNT(*) as total FROM mvp01_classes'
  );
  const mvpTeachingCountRow = await mvp01Get<{ total: number }>(
    db,
    'SELECT COUNT(*) as total FROM mvp01_teaching_assignments'
  );
  const alreadyHasClasses = (mvpClassCountRow?.total ?? 0) > 0;
  const alreadyHasTeaching = (mvpTeachingCountRow?.total ?? 0) > 0;
  if (alreadyHasClasses && alreadyHasTeaching) {
    return false;
  }

  let schoolName = 'Colégio Visão';
  let schoolCnpj: string | null = null;
  if (tables.has('settings')) {
    try {
      const nameRow = await mvp01Get<{ value: string }>(
        db,
        `SELECT value FROM settings WHERE id = 'schoolName' LIMIT 1`
      );
      if (nameRow?.value) {
        try {
          const parsed = JSON.parse(nameRow.value);
          if (typeof parsed === 'string' && parsed.trim()) schoolName = parsed.trim();
        } catch {
          if (String(nameRow.value).trim()) schoolName = String(nameRow.value).trim();
        }
      }
      const cnpjRow = await mvp01Get<{ value: string }>(
        db,
        `SELECT value FROM settings WHERE id = 'cnpj' LIMIT 1`
      );
      if (cnpjRow?.value) {
        try {
          const parsed = JSON.parse(cnpjRow.value);
          if (typeof parsed === 'string' && parsed.trim()) schoolCnpj = parsed.trim();
        } catch {
          if (String(cnpjRow.value).trim()) schoolCnpj = String(cnpjRow.value).trim();
        }
      }
    } catch {
      // Ignora settings incompatíveis
    }
  }

  let syncedAny = false;

  await withMvp01Transaction(db, async () => {
    const classCols = await getLegacyColumnSet(db, 'classes');
    const legacyClasses = await mvp01All<any>(
      db,
      `SELECT id, name${classCols.has('grade') ? ', grade' : ''} FROM classes`
    );
    const classStageMap = new Map<string, 'FUNDAMENTAL' | 'MEDIO'>();

    if (!alreadyHasClasses) {
      await mvp01Run(
        db,
        `INSERT OR IGNORE INTO mvp01_schools (id, name, cnpj, is_demo, created_at)
         VALUES (?, ?, ?, 0, ?)`,
        [MVP01_DEMO_SCHOOL_ID, schoolName, schoolCnpj, new Date().toISOString()]
      );

      const currentYear = new Date().getFullYear();
      await mvp01Run(
        db,
        `INSERT OR IGNORE INTO mvp01_academic_years
         (id, school_id, year, stage, min_days, min_hours, planned_days, planned_hours, completed_hours, legal_basis, status)
         VALUES (?, ?, ?, 'FUNDAMENTAL', 200, 800, 200, 800, 0, 'LDB Art. 24, I (200 dias letivos / 800 horas)', 'OPEN')`,
        ['ay-2026-fund', MVP01_DEMO_SCHOOL_ID, currentYear]
      );
      await mvp01Run(
        db,
        `INSERT OR IGNORE INTO mvp01_academic_years
         (id, school_id, year, stage, min_days, min_hours, planned_days, planned_hours, completed_hours, legal_basis, status)
         VALUES (?, ?, ?, 'MEDIO', 200, 1000, 200, 1000, 0, 'LDB Art. 24, I c/c Lei 13.415/2017 (200 dias letivos / 1000 horas)', 'OPEN')`,
        ['ay-2026-med', MVP01_DEMO_SCHOOL_ID, currentYear]
      );

      const defaultPeriods = [
        ['period-2026-1', 'ay-2026-fund', '1º Bimestre', `${currentYear}-02-02`, `${currentYear}-04-17`],
        ['period-2026-2', 'ay-2026-fund', '2º Bimestre', `${currentYear}-04-20`, `${currentYear}-07-03`],
        ['period-2026-3', 'ay-2026-fund', '3º Bimestre', `${currentYear}-08-03`, `${currentYear}-10-09`],
        ['period-2026-4', 'ay-2026-fund', '4º Bimestre', `${currentYear}-10-13`, `${currentYear}-12-18`],
        ['period-2026-m1', 'ay-2026-med', '1º Bimestre', `${currentYear}-02-02`, `${currentYear}-04-17`],
        ['period-2026-m2', 'ay-2026-med', '2º Bimestre', `${currentYear}-04-20`, `${currentYear}-07-03`],
        ['period-2026-m3', 'ay-2026-med', '3º Bimestre', `${currentYear}-08-03`, `${currentYear}-10-09`],
        ['period-2026-m4', 'ay-2026-med', '4º Bimestre', `${currentYear}-10-13`, `${currentYear}-12-18`],
      ];
      for (const [pId, ayId, pName, startDate, endDate] of defaultPeriods) {
        await mvp01Run(
          db,
          `INSERT OR IGNORE INTO mvp01_academic_periods
           (id, school_id, academic_year_id, name, start_date, end_date, status)
           VALUES (?, ?, ?, ?, ?, ?, 'OPEN')`,
          [pId, MVP01_DEMO_SCHOOL_ID, ayId, pName, startDate, endDate]
        );
      }

      for (const cls of legacyClasses) {
        const cId = String(cls.id || '').trim();
        if (!cId) continue;
        const stage = inferLegacyStage(cId, cls.name, cls.grade);
        classStageMap.set(cId, stage);
        const academicYearId = stage === 'MEDIO' ? 'ay-2026-med' : 'ay-2026-fund';
        await mvp01Run(
          db,
          `INSERT OR IGNORE INTO mvp01_classes
           (id, school_id, academic_year_id, stage, name, shift, room, capacity, status)
           VALUES (?, ?, ?, ?, ?, 'Matutino', ?, 60, 'ACTIVE')`,
          [cId, MVP01_DEMO_SCHOOL_ID, academicYearId, stage, String(cls.name || cId), `Sala ${String(cls.name || cId)}`]
        );
      }
      syncedAny = true;
    } else {
      for (const cls of legacyClasses) {
        const cId = String(cls.id || '').trim();
        if (cId) classStageMap.set(cId, inferLegacyStage(cId, cls.name, cls.grade));
      }
    }

    if (!alreadyHasClasses && tables.has('students')) {
      const studentCols = await getLegacyColumnSet(db, 'students');
      const hasReg = studentCols.has('registrationNumber');
      const legacyStudents = await mvp01All<any>(
        db,
        `SELECT id, name, classId${hasReg ? ', registrationNumber' : ''} FROM students`
      );
      const startedAt = `${new Date().getFullYear()}-02-01`;
      for (const st of legacyStudents) {
        const sId = String(st.id || '').trim();
        const sName = String(st.name || '').trim();
        if (!sId || !sName) continue;
        const cId = String(st.classId || '').trim();
        const stage = classStageMap.get(cId) || inferLegacyStage(cId, null, null);
        const academicYearId = stage === 'MEDIO' ? 'ay-2026-med' : 'ay-2026-fund';
        const regCode = hasReg && st.registrationNumber ? String(st.registrationNumber).trim() : null;

        await mvp01Run(
          db,
          `INSERT OR IGNORE INTO mvp01_students
           (id, school_id, user_id, full_name, registration_code, is_demo)
           VALUES (?, ?, NULL, ?, ?, 0)`,
          [sId, MVP01_DEMO_SCHOOL_ID, sName, regCode]
        );

        const enrollmentId = `enr-leg-${sId}`;
        await mvp01Run(
          db,
          `INSERT OR IGNORE INTO mvp01_enrollments
           (id, school_id, student_id, academic_year_id, status)
           VALUES (?, ?, ?, ?, 'ATIVA')`,
          [enrollmentId, MVP01_DEMO_SCHOOL_ID, sId, academicYearId]
        );

        if (cId && classStageMap.has(cId)) {
          await mvp01Run(
            db,
            `INSERT OR IGNORE INTO mvp01_class_memberships
             (id, school_id, enrollment_id, class_id, reason, started_at, ended_at)
             VALUES (?, ?, ?, ?, 'Importação inicial do cadastro escolar', ?, NULL)`,
            [`cm-leg-${sId}`, MVP01_DEMO_SCHOOL_ID, enrollmentId, cId, startedAt]
          );
        }
      }
    }

    const userNameById = new Map<string, string>();
    if (tables.has('users')) {
      const userCols = await getLegacyColumnSet(db, 'users');
      const hasEmail = userCols.has('email');
      const hasIsActive = userCols.has('isActive');
      const hasStatus = userCols.has('status');
      const legacyUsers = await mvp01All<any>(
        db,
        `SELECT id, username, name, role${hasEmail ? ', email' : ''}${hasIsActive ? ', isActive' : ''}${hasStatus ? ', status' : ''} FROM users`
      );
      const existingMems = await mvp01All<{ user_id: string; school_id: string }>(
        db,
        'SELECT user_id, school_id FROM mvp01_memberships'
      );
      const existingMemSet = new Set(existingMems.map((m) => `${m.user_id}::${m.school_id}`));

      for (const u of legacyUsers) {
        const uId = String(u.id || '').trim();
        if (!uId) continue;
        const uName = String(u.name || u.username || uId).trim();
        userNameById.set(uId, uName);

        if ((hasIsActive && (u.isActive === 0 || u.isActive === false)) || (hasStatus && u.status === 'inactive')) {
          continue;
        }

        const canonicalRole = mapLegacyRoleToMvp01Canonical(u.role);
        if (!canonicalRole) continue;

        if (!existingMemSet.has(`${uId}::${MVP01_DEMO_SCHOOL_ID}`)) {
          await mvp01Run(
            db,
            `INSERT OR IGNORE INTO mvp01_memberships
             (id, user_id, person_name, email, school_id, role, status, valid_until)
             VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', NULL)`,
            [`mem-leg-${uId}`, uId, uName, hasEmail ? u.email ?? null : null, MVP01_DEMO_SCHOOL_ID, canonicalRole]
          );
          existingMemSet.add(`${uId}::${MVP01_DEMO_SCHOOL_ID}`);
        }

        if (canonicalRole === 'coordinator') {
          await mvp01Run(
            db,
            `INSERT OR IGNORE INTO mvp01_coordination_assignments
             (id, school_id, coordinator_user_id, class_id, stage, active)
             VALUES (?, ?, ?, NULL, 'FUNDAMENTAL', 1)`,
            [`ca-leg-${uId}-fund`, MVP01_DEMO_SCHOOL_ID, uId]
          );
          await mvp01Run(
            db,
            `INSERT OR IGNORE INTO mvp01_coordination_assignments
             (id, school_id, coordinator_user_id, class_id, stage, active)
             VALUES (?, ?, ?, NULL, 'MEDIO', 1)`,
            [`ca-leg-${uId}-med`, MVP01_DEMO_SCHOOL_ID, uId]
          );
        }
      }
    }

    if (!alreadyHasTeaching) {
      const seenAssignments = new Set<string>();
      const currentYear = new Date().getFullYear();
      const validFrom = `${currentYear}-01-01`;
      const validUntil = `${currentYear}-12-31`;

      const upsertAssignment = async (teacherIdRaw: any, classIdRaw: any, subjectRaw: any, teacherNameFallback?: string) => {
        const teacherId = String(teacherIdRaw || '').trim();
        const classId = String(classIdRaw || '').trim();
        const subject = String(subjectRaw || '').trim() || 'Disciplina';
        if (!teacherId || !classId || teacherId === 'none') return;
        const dedupKey = `${teacherId}::${classId}::${subject.toLowerCase()}`;
        if (seenAssignments.has(dedupKey)) return;
        seenAssignments.add(dedupKey);

        const stage = classStageMap.get(classId) || inferLegacyStage(classId, null, null);
        const academicYearId = stage === 'MEDIO' ? 'ay-2026-med' : 'ay-2026-fund';
        const teacherName = userNameById.get(teacherId) || teacherNameFallback || teacherId;
        const taId = `ta-leg-${sanitizeKeySlug(teacherId)}-${sanitizeKeySlug(classId)}-${sanitizeKeySlug(subject)}`;

        await mvp01Run(
          db,
          `INSERT OR IGNORE INTO mvp01_teaching_assignments
           (id, school_id, teacher_user_id, teacher_name, class_id, subject, academic_year_id, valid_from, valid_until, active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [taId, MVP01_DEMO_SCHOOL_ID, teacherId, teacherName, classId, subject, academicYearId, validFrom, validUntil]
        );
        syncedAny = true;
      };

      if (tables.has('teacher_classes')) {
        const tcRows = await mvp01All<any>(
          db,
          'SELECT teacherId, classId, subjectId FROM teacher_classes'
        );
        for (const tc of tcRows) {
          await upsertAssignment(tc.teacherId, tc.classId, tc.subjectId);
        }
      }

      if (tables.has('schedules')) {
        const schRows = await mvp01All<any>(
          db,
          'SELECT classId, teacherId, subject, teacher, dayOfWeek, startTime, endTime FROM schedules'
        );
        const existingSlotCountRow = await mvp01Get<{ total: number }>(
          db,
          'SELECT COUNT(*) as total FROM mvp01_timetable_slots'
        );
        const shouldImportSlots = (existingSlotCountRow?.total ?? 0) === 0;
        const seenSlots = new Set<string>();
        const dayCounters = new Map<string, number>();

        for (const sch of schRows) {
          await upsertAssignment(sch.teacherId, sch.classId, sch.subject, sch.teacher);

          if (shouldImportSlots) {
            const classId = String(sch.classId || '').trim();
            const dayOfWeek = Number(sch.dayOfWeek || 1);
            if (!classId || !dayOfWeek) continue;
            const dayKey = `${classId}::${dayOfWeek}`;
            const nextFallback = (dayCounters.get(dayKey) || 0) + 1;
            dayCounters.set(dayKey, nextFallback);
            const slotIndex = resolveTimetableSlotIndex(sch.startTime, nextFallback);
            const slotKey = `${classId}::${dayOfWeek}::${slotIndex}`;
            if (seenSlots.has(slotKey)) continue;
            seenSlots.add(slotKey);

            const stage = classStageMap.get(classId) || inferLegacyStage(classId, null, null);
            const academicYearId = stage === 'MEDIO' ? 'ay-2026-med' : 'ay-2026-fund';
            const slotId = `slot-leg-${sanitizeKeySlug(classId)}-d${dayOfWeek}-s${slotIndex}`;

            await mvp01Run(
              db,
              `INSERT OR IGNORE INTO mvp01_timetable_slots
               (id, school_id, academic_year_id, class_id, day_of_week, slot_index, start_time, end_time, subject, teacher_user_id, version, published)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`,
              [
                slotId,
                MVP01_DEMO_SCHOOL_ID,
                academicYearId,
                classId,
                dayOfWeek,
                slotIndex,
                sch.startTime ? String(sch.startTime) : null,
                sch.endTime ? String(sch.endTime) : null,
                String(sch.subject || 'Disciplina'),
                sch.teacherId ? String(sch.teacherId) : null,
              ]
            );
          }
        }
      }
    }
  });

  return syncedAny;
}
