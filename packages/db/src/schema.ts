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
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'teacher', 'coordinator', 'parent', 'student'] }).notNull(),
  institutionId: text('institution_id').notNull().references(() => institutions.id),
  avatarUrl: text('avatar_url'),
  phone: text('phone'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  institutionIdx: index('users_institution_idx').on(table.institutionId),
  emailIdx: index('users_email_idx').on(table.email),
}));

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
  dateOfBirth: text('date_of_birth').notNull(),
  photoUrl: text('photo_url'),
  faceEncoding: blob('face_encoding'),
  status: text('status', { enum: ['active', 'inactive', 'graduated', 'transferred'] }).notNull().default('active'),
  enrolledAt: integer('enrolled_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  classIdx: index('students_class_idx').on(table.classId),
  institutionIdx: index('students_institution_idx').on(table.institutionId),
  parentIdx: index('students_parent_idx').on(table.parentUserId),
}));

export const attendance = sqliteTable('attendance', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id),
  classId: text('class_id').notNull().references(() => classes.id),
  date: text('date').notNull(),
  status: text('status', { enum: ['present', 'absent', 'late', 'justified'] }).notNull(),
  detectedBy: text('detected_by', { enum: ['manual', 'camera', 'nfc'] }).notNull(),
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
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  entityIdx: index('audit_logs_entity_idx').on(table.entity, table.entityId),
  userIdx: index('audit_logs_user_idx').on(table.userId),
}));
