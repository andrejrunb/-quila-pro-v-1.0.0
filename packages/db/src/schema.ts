import { sqliteTable, text, integer, real, blob, index } from "drizzle-orm/sqlite-core";

export const institutions = sqliteTable('institutions', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  cnpj: text('cnpj').notNull(),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  logoUrl: text('logo_url'),
  plan: text('plan', { enum: ['starter', 'professional', 'sovereign'] }).notNull().default('starter'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  username: text('username').unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'teacher', 'coordinator', 'parent', 'student'] }).notNull(),
  institutionId: text('institution_id').notNull().references(() => institutions.id),
  avatarUrl: text('avatar_url'),
  phone: text('phone'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  sessionRevokedBefore: integer('session_revoked_before'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  institutionIdx: index('users_institution_idx').on(table.institutionId),
  emailIdx: index('users_email_idx').on(table.email),
  usernameIdx: index('users_username_idx').on(table.username),
}));

export const userInstitutions = sqliteTable('user_institutions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  institutionId: text('institution_id').notNull().references(() => institutions.id),
  role: text('role', { enum: ['admin', 'teacher', 'coordinator', 'parent', 'student'] }).notNull(),
  status: text('status', { enum: ['active', 'revoked'] }).notNull().default('active'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  userIdx: index('user_institutions_user_idx').on(table.userId),
  instIdx: index('user_institutions_inst_idx').on(table.institutionId),
}));

export const revokedSessions = sqliteTable('revoked_sessions', {
  jti: text('jti').primaryKey(),
  userId: text('user_id'),
  reason: text('reason').notNull().default('logout'),
  revokedAt: integer('revoked_at', { mode: 'timestamp' }).notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

export const classes = sqliteTable('classes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  grade: integer('grade').notNull(),
  shift: text('shift', { enum: ['morning', 'afternoon', 'night'] }).notNull(),
  year: integer('year').notNull(),
  institutionId: text('institution_id').notNull().references(() => institutions.id),
  teacherId: text('teacher_id').references(() => users.id),
  roomId: text('room_id'),
  maxStudents: integer('max_students').notNull(),
}, (table) => ({
  institutionIdx: index('classes_institution_idx').on(table.institutionId),
  teacherIdx: index('classes_teacher_idx').on(table.teacherId),
}));

export const students = sqliteTable('students', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  registrationNumber: text('registration_number').notNull(),
  classId: text('class_id').references(() => classes.id),
  institutionId: text('institution_id').notNull().references(() => institutions.id),
  parentUserId: text('parent_user_id').references(() => users.id),
  studentUserId: text('student_user_id').references(() => users.id),
  dateOfBirth: text('date_of_birth').notNull(),
  photoUrl: text('photo_url'),
  // [LGPD Art. 14 / SECURITY.md] Vetor 512-D cifrado em repouso (AES-256-GCM / DPAPI local) e hash unidirecional SHA-256.
  // Desativado por padrão no perfil do piloto H-01 (quarentena biométrica ativa) e nunca sincronizado à nuvem.
  faceEncoding: blob('face_encoding'),
  faceEmbeddingHash: text('face_embedding_hash'),
  status: text('status', { enum: ['active', 'inactive', 'graduated', 'transferred'] }).notNull().default('active'),
  enrolledAt: integer('enrolled_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  classIdx: index('students_class_idx').on(table.classId),
  institutionIdx: index('students_institution_idx').on(table.institutionId),
  parentIdx: index('students_parent_idx').on(table.parentUserId),
  studentUserIdx: index('students_user_idx').on(table.studentUserId),
}));

export const guardiansStudents = sqliteTable('guardians_students', {
  id: text('id').primaryKey(),
  guardianUserId: text('guardian_user_id').notNull().references(() => users.id),
  studentId: text('student_id').notNull().references(() => students.id),
  institutionId: text('institution_id').notNull().references(() => institutions.id),
  relationship: text('relationship').notNull().default('responsavel_legal'),
  isFinancialResponsible: integer('is_financial_responsible', { mode: 'boolean' }).notNull().default(true),
  isPedagogicalResponsible: integer('is_pedagogical_responsible', { mode: 'boolean' }).notNull().default(true),
  status: text('status', { enum: ['active', 'revoked'] }).notNull().default('active'),
  revokedAt: integer('revoked_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  guardianIdx: index('guardians_students_guardian_idx').on(table.guardianUserId),
  studentIdx: index('guardians_students_student_idx').on(table.studentId),
  institutionIdx: index('guardians_students_institution_idx').on(table.institutionId),
}));

export const attendance = sqliteTable('attendance', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id),
  classId: text('class_id').notNull().references(() => classes.id),
  date: text('date').notNull(),
  status: text('status', { enum: ['present', 'absent', 'late', 'justified'] }).notNull(),
  detectedBy: text('detected_by', { enum: ['manual', 'camera', 'nfc', 'qr_badge'] }).notNull(),
  confidence: real('confidence'),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  studentIdx: index('attendance_student_idx').on(table.studentId),
  classDateIdx: index('attendance_class_date_idx').on(table.classId, table.date),
}));

export const grades = sqliteTable('grades', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id),
  classId: text('class_id').notNull().references(() => classes.id),
  subject: text('subject').notNull(),
  evaluationType: text('evaluation_type', { enum: ['prova', 'trabalho', 'participacao'] }).notNull(),
  score: real('score').notNull(),
  maxScore: real('max_score').notNull(),
  period: text('period', { enum: ['1bim', '2bim', '3bim', '4bim'] }).notNull(),
  teacherId: text('teacher_id').notNull().references(() => users.id),
  status: text('status', { enum: ['draft_ai', 'pending_review', 'published'] }).notNull().default('published'),
  reviewedByTeacherId: text('reviewed_by_teacher_id').references(() => users.id),
  propagationStatus: text('propagation_status', {
    enum: ['received_by_server', 'pending_at_edge', 'applied_by_edge', 'failed'],
  }).notNull().default('pending_at_edge'),
  edgeCommandId: text('edge_command_id'),
  contestationStatus: text('contestation_status', {
    enum: ['none', 'contested', 'resolved'],
  }).notNull().default('none'),
  contestationReason: text('contestation_reason'),
  contestedAt: integer('contested_at', { mode: 'timestamp' }),
  contestedByUserId: text('contested_by_user_id').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  studentClassIdx: index('grades_student_class_idx').on(table.studentId, table.classId),
  teacherIdx: index('grades_teacher_idx').on(table.teacherId),
}));

export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id),
  institutionId: text('institution_id').notNull().references(() => institutions.id),
  description: text('description').notNull(),
  amount: integer('amount').notNull(),
  dueDate: text('due_date').notNull(),
  paidAt: integer('paid_at', { mode: 'timestamp' }),
  status: text('status', { enum: ['pending', 'paid', 'overdue', 'cancelled'] }).notNull().default('pending'),
  paymentMethod: text('payment_method'),
  pixPayload: text('pix_payload'),
  receiptHashSha256: text('receipt_hash_sha256'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  studentIdx: index('invoices_student_idx').on(table.studentId),
  institutionIdx: index('invoices_institution_idx').on(table.institutionId),
  statusDueDateIdx: index('invoices_status_due_date_idx').on(table.status, table.dueDate),
}));

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  recipientUserId: text('recipient_user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type', { enum: ['attendance', 'grade', 'finance', 'system'] }).notNull(),
  readAt: integer('read_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  recipientIdx: index('notifications_recipient_idx').on(table.recipientUserId),
  typeIdx: index('notifications_type_idx').on(table.type),
}));

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id').notNull(),
  details: text('details'),
  ipAddress: text('ip_address'),
  integrityHashSha256: text('integrity_hash_sha256'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  entityIdx: index('audit_logs_entity_idx').on(table.entity, table.entityId),
  userIdx: index('audit_logs_user_idx').on(table.userId),
}));

/**
 * LGPD Art. 14 — Registro Formal de Consentimento Biométrico de Menores
 */
export const biometricConsentLogs = sqliteTable('biometric_consent_logs', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id),
  institutionId: text('institution_id').notNull().references(() => institutions.id),
  guardianCpf: text('guardian_cpf').notNull(),
  guardianName: text('guardian_name').notNull(),
  consentVersion: text('consent_version').notNull().default('v2.1'),
  purpose: text('purpose').notNull().default('optional_biometric_portaria_local_edge'),
  manifestationType: text('manifestation_type', { enum: ['OPT_IN_CONSENT', 'REVOCATION'] }).notNull().default('OPT_IN_CONSENT'),
  propagationStatus: text('propagation_status', { enum: ['received_by_server', 'pending_at_edge', 'applied_by_edge', 'failed'] }).notNull().default('pending_at_edge'),
  status: text('status', { enum: ['granted', 'revoked', 'expired'] }).notNull().default('granted'),
  grantedAt: integer('granted_at', { mode: 'timestamp' }).notNull(),
  recordedAtMs: integer('recorded_at_ms'),
  revokedAt: integer('revoked_at', { mode: 'timestamp' }),
  edgeCommandId: text('edge_command_id'),
  auditSignatureSha256: text('audit_signature_sha256').notNull(),
}, (table) => ({
  studentIdx: index('biometric_consent_student_idx').on(table.studentId),
  institutionIdx: index('biometric_consent_institution_idx').on(table.institutionId),
  guardianIdx: index('biometric_consent_guardian_idx').on(table.guardianCpf),
}));

/**
 * LGPD Art. 16 — Registro Auditável de Expurgo/Destruição de Dados Biométricos
 */
export const biometricPurgeLogs = sqliteTable('biometric_purge_logs', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull(),
  institutionId: text('institution_id').notNull().references(() => institutions.id),
  reason: text('reason', { enum: ['graduation', 'transfer', 'consent_revoked', 'court_order', 'retention_ttl_expired'] }).notNull(),
  status: text('status', { enum: ['purge_requested', 'applied_by_edge', 'failed'] }).notNull().default('purge_requested'),
  edgeCommandId: text('edge_command_id'),
  notes: text('notes'),
  purgedByUserId: text('purged_by_user_id').references(() => users.id),
  purgedAt: integer('purged_at', { mode: 'timestamp' }).notNull(),
  evidenceHashSha256: text('evidence_hash_sha256').notNull(),
}, (table) => ({
  studentIdx: index('biometric_purge_student_idx').on(table.studentId),
  institutionIdx: index('biometric_purge_institution_idx').on(table.institutionId),
}));

export const lessonDiaries = sqliteTable('lesson_diaries', {
  id: text('id').primaryKey(),
  classId: text('class_id').notNull().references(() => classes.id),
  teacherId: text('teacher_id').notNull().references(() => users.id),
  institutionId: text('institution_id').notNull().references(() => institutions.id),
  date: text('date').notNull(),
  subject: text('subject').notNull(),
  topic: text('topic').notNull(),
  content: text('content').notNull(),
  bnccCodesJson: text('bncc_codes_json').notNull(),
  homework: text('homework'),
  dinnerPrompt: text('dinner_prompt'),
  status: text('status', { enum: ['draft', 'published'] }).notNull().default('draft'),
  propagationStatus: text('propagation_status', {
    enum: ['received_by_server', 'pending_at_edge', 'applied_by_edge', 'failed'],
  }).notNull().default('pending_at_edge'),
  edgeCommandId: text('edge_command_id'),
  signatureHashSha256: text('signature_hash_sha256'),
  signedAt: integer('signed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  classDateIdx: index('lesson_diaries_class_date_idx').on(table.classId, table.date),
  teacherIdx: index('lesson_diaries_teacher_idx').on(table.teacherId),
}));

export const assessments = sqliteTable('assessments', {
  id: text('id').primaryKey(),
  classId: text('class_id').notNull().references(() => classes.id),
  teacherId: text('teacher_id').notNull().references(() => users.id),
  institutionId: text('institution_id').notNull().references(() => institutions.id),
  title: text('title').notNull(),
  instructions: text('instructions').notNull(),
  subject: text('subject').notNull(),
  bimestre: text('bimestre', { enum: ['1bim', '2bim', '3bim', '4bim'] }).notNull(),
  questionsJson: text('questions_json').notNull(),
  status: text('status', { enum: ['draft_ai', 'pending_review', 'approved', 'published'] }).notNull().default('draft_ai'),
  approvedByUserId: text('approved_by_user_id').references(() => users.id),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  classIdx: index('assessments_class_idx').on(table.classId),
  teacherIdx: index('assessments_teacher_idx').on(table.teacherId),
}));

export const assessmentSubmissions = sqliteTable('assessment_submissions', {
  id: text('id').primaryKey(),
  assessmentId: text('assessment_id').notNull().references(() => assessments.id),
  studentId: text('student_id').notNull().references(() => students.id),
  institutionId: text('institution_id').notNull().references(() => institutions.id),
  answersJson: text('answers_json').notNull(),
  autoScore: real('auto_score'),
  finalScore: real('final_score'),
  reviewStatus: text('review_status', { enum: ['draft_ai', 'teacher_reviewed', 'published'] }).notNull().default('draft_ai'),
  feedback: text('feedback'),
  reviewedByTeacherId: text('reviewed_by_teacher_id').references(() => users.id),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
  submittedAt: integer('submitted_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  assessmentIdx: index('assessment_submissions_assessment_idx').on(table.assessmentId),
  studentIdx: index('assessment_submissions_student_idx').on(table.studentId),
}));

export const occurrences = sqliteTable('occurrences', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id),
  classId: text('class_id').notNull().references(() => classes.id),
  institutionId: text('institution_id').notNull().references(() => institutions.id),
  createdByUserId: text('created_by_user_id').references(() => users.id),
  category: text('category', { enum: ['pedagogical', 'behavioral', 'attendance', 'commendation'] }).notNull(),
  severity: text('severity', { enum: ['low', 'medium', 'high'] }).notNull().default('low'),
  title: text('title').notNull(),
  description: text('description').notNull(),
  recommendedAction: text('recommended_action'),
  actionApplied: text('action_applied'),
  signedByParentUserId: text('signed_by_parent_user_id').references(() => users.id),
  signedAt: integer('signed_at', { mode: 'timestamp' }),
  signatureHashSha256: text('signature_hash_sha256'),
  manifestationType: text('manifestation_type', { enum: ['SCIENCE_ACKNOWLEDGED', 'DISAGREEMENT_CONTESTATION'] }),
  contestationReason: text('contestation_reason'),
  documentVersion: text('document_version').default('occ-v1'),
  propagationStatus: text('propagation_status', {
    enum: ['received_by_server', 'pending_at_edge', 'applied_by_edge', 'failed'],
  }).notNull().default('pending_at_edge'),
  edgeCommandId: text('edge_command_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  studentIdx: index('occurrences_student_idx').on(table.studentId),
  classIdx: index('occurrences_class_idx').on(table.classId),
}));

export const schedules = sqliteTable('schedules', {
  id: text('id').primaryKey(),
  classId: text('class_id').notNull().references(() => classes.id),
  institutionId: text('institution_id').notNull().references(() => institutions.id),
  dayOfWeek: integer('day_of_week').notNull(),
  timeSlot: text('time_slot').notNull(),
  subject: text('subject').notNull(),
  room: text('room').notNull(),
  teacherName: text('teacher_name').notNull(),
}, (table) => ({
  classIdx: index('schedules_class_idx').on(table.classId),
}));

export const studentMissions = sqliteTable('student_missions', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id),
  institutionId: text('institution_id').notNull().references(() => institutions.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  subject: text('subject').notNull(),
  bnccCode: text('bncc_code'),
  rewardXp: integer('reward_xp').notNull().default(50),
  rewardCoins: integer('reward_coins').notNull().default(15),
  progress: integer('progress').notNull().default(0),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  studentIdx: index('student_missions_student_idx').on(table.studentId),
}));

export const studySessions = sqliteTable('study_sessions', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id),
  institutionId: text('institution_id').notNull().references(() => institutions.id),
  mode: text('mode', {
    enum: ['focus_sprint_3min', 'kumon_3min', 'flashcards_srs', 'essay_lab', 'socratic_tutor'],
  }).notNull(),
  durationSeconds: integer('duration_seconds').notNull().default(0),
  earnedXp: integer('earned_xp').notNull().default(0),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  studentIdx: index('study_sessions_student_idx').on(table.studentId),
}));

export const leads = sqliteTable('leads', {
  id: text('id').primaryKey(),
  protocol: text('protocol').notNull(),
  type: text('type').notNull(),
  name: text('name').notNull(),
  school: text('school').notNull(),
  role: text('role'),
  email: text('email').notNull(),
  message: text('message'),
  context: text('context'),
  lgpdConsent: integer('lgpd_consent', { mode: 'boolean' }).notNull().default(true),
  deliveryMode: text('delivery_mode').notNull(),
  status: text('status', { enum: ['new', 'contacted', 'qualified'] }).notNull().default('new'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  emailIdx: index('leads_email_idx').on(table.email),
}));

export const edgeSyncEvents = sqliteTable('edge_sync_events', {
  id: text('id').primaryKey(),
  eventId: text('event_id').notNull().unique(),
  schoolCloudId: text('school_cloud_id').notNull(),
  institutionId: text('institution_id'),
  deviceId: text('device_id'),
  contractVersion: text('contract_version').default('2026-11-v1'),
  sequenceNumber: integer('sequence_number'),
  eventType: text('event_type').notNull(),
  payloadJson: text('payload_json').notNull(),
  status: text('status', { enum: ['accepted', 'rejected_lgpd', 'rejected_schema'] }).notNull().default('accepted'),
  receivedAt: integer('received_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  schoolIdx: index('edge_sync_school_idx').on(table.schoolCloudId),
}));

export const edgeCredentials = sqliteTable('edge_credentials', {
  id: text('id').primaryKey(),
  keyId: text('key_id').notNull().unique(),
  deviceId: text('device_id').notNull(),
  institutionId: text('institution_id').notNull().references(() => institutions.id),
  schoolCloudId: text('school_cloud_id').notNull(),
  secretHashSha256: text('secret_hash_sha256').notNull(),
  status: text('status', { enum: ['active', 'grace_rotation', 'revoked'] }).notNull().default('active'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  revokedAt: integer('revoked_at', { mode: 'timestamp' }),
}, (table) => ({
  instIdx: index('edge_cred_inst_idx').on(table.institutionId),
  deviceIdx: index('edge_cred_device_idx').on(table.deviceId),
}));

export const edgeSyncCommands = sqliteTable('edge_sync_commands', {
  id: text('id').primaryKey(),
  commandId: text('command_id').notNull().unique(),
  institutionId: text('institution_id').notNull().references(() => institutions.id),
  schoolCloudId: text('school_cloud_id').notNull(),
  targetDomain: text('target_domain', {
    enum: ['attendance', 'lesson_diary', 'grade_publication', 'consent', 'occurrence_ack', 'finance'],
  }).notNull(),
  action: text('action').notNull(),
  payloadJson: text('payload_json').notNull(),
  actorUserId: text('actor_user_id').references(() => users.id),
  status: text('status', {
    enum: ['received_by_server', 'pending_at_edge', 'applied_by_edge', 'rejected_by_edge', 'failed'],
  }).notNull().default('pending_at_edge'),
  conflictPolicy: text('conflict_policy').notNull().default('edge_authoritative_timestamp'),
  resultJson: text('result_json'),
  edgeAckAt: integer('edge_ack_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  instStatusIdx: index('edge_cmd_inst_status_idx').on(table.institutionId, table.status),
  schoolIdx: index('edge_cmd_school_idx').on(table.schoolCloudId),
}));
