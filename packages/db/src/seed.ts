import type { AquilaDatabase } from './index';
import { hashPasswordScrypt } from './scrypt';
import {
  institutions,
  users,
  classes,
  students,
  guardiansStudents,
  attendance,
  grades,
  invoices,
  notifications,
  lessonDiaries,
  assessments,
  assessmentSubmissions,
  occurrences,
  schedules,
  studentMissions,
} from './schema';
import { count } from 'drizzle-orm';

const now = new Date('2026-11-11T10:00:00.000Z');
export const DEMO_INSTITUTION_ID = 'inst_aquila_demo';

const UNLOGINABLE_PLACEHOLDER = '!unprovisioned-account!';

export const seedInstitutions = [
  {
    id: DEMO_INSTITUTION_ID,
    name: 'Colégio Águia Dourada',
    cnpj: '12.345.678/0001-90',
    address: 'Rua das Palmeiras, 1234 - Centro, São Paulo - SP',
    phone: '(11) 3456-7890',
    email: 'contato@aguiadourada.edu.br',
    logoUrl: null,
    plan: 'professional' as const,
    createdAt: now,
  },
];

export const seedUsers = [
  { id: 'usr_admin_01', name: 'Dr. Ricardo Mendes', username: 'admin.ricardo', email: 'ricardo@aguiadourada.edu.br', passwordHash: UNLOGINABLE_PLACEHOLDER, role: 'admin' as const, institutionId: DEMO_INSTITUTION_ID, phone: '(11) 99999-0001', active: true, createdAt: now },
  { id: 'usr_coord_01', name: 'Profa. Juliana Medeiros', username: 'coord.juliana', email: 'juliana@aguiadourada.edu.br', passwordHash: UNLOGINABLE_PLACEHOLDER, role: 'coordinator' as const, institutionId: DEMO_INSTITUTION_ID, phone: '(11) 99999-0002', active: true, createdAt: now },
  { id: 'usr_teacher_01', name: 'Prof. Ricardo Silva', username: 'prof.ricardo', email: 'ricardo.silva@aguiadourada.edu.br', passwordHash: UNLOGINABLE_PLACEHOLDER, role: 'teacher' as const, institutionId: DEMO_INSTITUTION_ID, phone: '(11) 99999-0003', active: true, createdAt: now },
  { id: 'usr_teacher_02', name: 'Profa. Ana Beatriz', username: 'prof.ana', email: 'ana@aguiadourada.edu.br', passwordHash: UNLOGINABLE_PLACEHOLDER, role: 'teacher' as const, institutionId: DEMO_INSTITUTION_ID, phone: '(11) 99999-0004', active: true, createdAt: now },
  { id: 'usr_parent_01', name: 'Sra. Patrícia Andrade', username: 'pais.patricia', email: 'patricia@familia.edu.br', passwordHash: UNLOGINABLE_PLACEHOLDER, role: 'parent' as const, institutionId: DEMO_INSTITUTION_ID, phone: '(11) 98765-4321', active: true, createdAt: now },
  { id: 'usr_parent_02', name: 'Sr. Roberto Lima', username: 'pais.roberto', email: 'roberto@familia.edu.br', passwordHash: UNLOGINABLE_PLACEHOLDER, role: 'parent' as const, institutionId: DEMO_INSTITUTION_ID, phone: '(11) 98765-1234', active: true, createdAt: now },
  { id: 'usr_student_01', name: 'Lucas Andrade', username: 'aluno.lucas', email: 'lucas.andrade@aluno.aguiadourada.edu.br', passwordHash: UNLOGINABLE_PLACEHOLDER, role: 'student' as const, institutionId: DEMO_INSTITUTION_ID, phone: null, active: true, createdAt: now },
  { id: 'usr_student_02', name: 'Matheus Lima', username: 'aluno.matheus', email: 'matheus.lima@aluno.aguiadourada.edu.br', passwordHash: UNLOGINABLE_PLACEHOLDER, role: 'student' as const, institutionId: DEMO_INSTITUTION_ID, phone: null, active: true, createdAt: now },
  { id: 'usr_student_03', name: 'Sofia Martins (EF I)', username: 'aluno.sofia.ef', email: 'sofia.ef@aluno.aguiadourada.edu.br', passwordHash: UNLOGINABLE_PLACEHOLDER, role: 'student' as const, institutionId: DEMO_INSTITUTION_ID, phone: null, active: true, createdAt: now },
];

export const seedClasses = [
  { id: 'cls_2b', name: '2º Ano B', grade: 11, shift: 'morning' as const, year: 2026, institutionId: DEMO_INSTITUTION_ID, teacherId: 'usr_teacher_01', roomId: 'SALA 08', maxStudents: 35 },
  { id: 'cls_3a', name: '3º Ano A', grade: 12, shift: 'morning' as const, year: 2026, institutionId: DEMO_INSTITUTION_ID, teacherId: 'usr_teacher_02', roomId: 'SALA 12', maxStudents: 35 },
  { id: 'cls_2ef', name: '2º Ano A — EF I', grade: 2, shift: 'morning' as const, year: 2026, institutionId: DEMO_INSTITUTION_ID, teacherId: 'usr_teacher_02', roomId: 'SALA 02', maxStudents: 25 },
];

export const seedStudents = [
  { id: 'std_001', name: 'Lucas Andrade', registrationNumber: '2026-0842', classId: 'cls_2b', institutionId: DEMO_INSTITUTION_ID, parentUserId: 'usr_parent_01', studentUserId: 'usr_student_01', dateOfBirth: '2010-03-15', status: 'active' as const, enrolledAt: now },
  { id: 'std_002', name: 'Sofia Costa', registrationNumber: '2026-0843', classId: 'cls_2b', institutionId: DEMO_INSTITUTION_ID, parentUserId: null, studentUserId: null, dateOfBirth: '2010-07-22', status: 'active' as const, enrolledAt: now },
  { id: 'std_003', name: 'Gabriel Santos', registrationNumber: '2026-0844', classId: 'cls_2b', institutionId: DEMO_INSTITUTION_ID, parentUserId: null, studentUserId: null, dateOfBirth: '2010-01-10', status: 'active' as const, enrolledAt: now },
  { id: 'std_004', name: 'Helena Oliveira', registrationNumber: '2026-0845', classId: 'cls_2b', institutionId: DEMO_INSTITUTION_ID, parentUserId: null, studentUserId: null, dateOfBirth: '2010-11-05', status: 'active' as const, enrolledAt: now },
  { id: 'std_005', name: 'Matheus Lima', registrationNumber: '2026-0846', classId: 'cls_2b', institutionId: DEMO_INSTITUTION_ID, parentUserId: 'usr_parent_02', studentUserId: 'usr_student_02', dateOfBirth: '2010-09-18', status: 'active' as const, enrolledAt: now },
  { id: 'std_006', name: 'Sofia Martins', registrationNumber: '2026-0201', classId: 'cls_2ef', institutionId: DEMO_INSTITUTION_ID, parentUserId: null, studentUserId: 'usr_student_03', dateOfBirth: '2019-04-12', status: 'active' as const, enrolledAt: now },
];

export const seedGuardiansStudents = [
  { id: 'gs_001', guardianUserId: 'usr_parent_01', studentId: 'std_001', institutionId: DEMO_INSTITUTION_ID, relationship: 'mae', isFinancialResponsible: true, isPedagogicalResponsible: true, createdAt: now },
  { id: 'gs_002', guardianUserId: 'usr_parent_02', studentId: 'std_005', institutionId: DEMO_INSTITUTION_ID, relationship: 'pai', isFinancialResponsible: true, isPedagogicalResponsible: true, createdAt: now },
];

export const seedAttendance = [
  { id: 'att_001', studentId: 'std_001', classId: 'cls_2b', date: '2026-11-11', status: 'present' as const, detectedBy: 'qr_badge' as const, confidence: 1.0, timestamp: now },
  { id: 'att_002', studentId: 'std_002', classId: 'cls_2b', date: '2026-11-11', status: 'present' as const, detectedBy: 'qr_badge' as const, confidence: 1.0, timestamp: now },
  { id: 'att_003', studentId: 'std_003', classId: 'cls_2b', date: '2026-11-11', status: 'present' as const, detectedBy: 'manual' as const, confidence: 1.0, timestamp: now },
  { id: 'att_004', studentId: 'std_004', classId: 'cls_2b', date: '2026-11-11', status: 'present' as const, detectedBy: 'qr_badge' as const, confidence: 1.0, timestamp: now },
  { id: 'att_005', studentId: 'std_005', classId: 'cls_2b', date: '2026-11-11', status: 'absent' as const, detectedBy: 'manual' as const, confidence: 0, timestamp: now },
];

export const seedGrades = [
  { id: 'grd_001', studentId: 'std_001', classId: 'cls_2b', subject: 'Matemática Aplicada', evaluationType: 'prova' as const, score: 9.2, maxScore: 10, period: '4bim' as const, teacherId: 'usr_teacher_01', status: 'published' as const, reviewedByTeacherId: 'usr_teacher_01', propagationStatus: 'applied_by_edge' as const, contestationStatus: 'none' as const, createdAt: now },
  { id: 'grd_002', studentId: 'std_001', classId: 'cls_2b', subject: 'Física Aplicada', evaluationType: 'prova' as const, score: 8.9, maxScore: 10, period: '4bim' as const, teacherId: 'usr_teacher_01', status: 'published' as const, reviewedByTeacherId: 'usr_teacher_01', propagationStatus: 'applied_by_edge' as const, contestationStatus: 'none' as const, createdAt: now },
  { id: 'grd_003', studentId: 'std_001', classId: 'cls_2b', subject: 'Redação Dissertativa', evaluationType: 'trabalho' as const, score: 9.6, maxScore: 10, period: '4bim' as const, teacherId: 'usr_teacher_02', status: 'published' as const, reviewedByTeacherId: 'usr_teacher_02', propagationStatus: 'applied_by_edge' as const, contestationStatus: 'none' as const, createdAt: now },
  { id: 'grd_004', studentId: 'std_002', classId: 'cls_2b', subject: 'Física Aplicada', evaluationType: 'prova' as const, score: 8.4, maxScore: 10, period: '4bim' as const, teacherId: 'usr_teacher_01', status: 'published' as const, reviewedByTeacherId: 'usr_teacher_01', propagationStatus: 'applied_by_edge' as const, contestationStatus: 'none' as const, createdAt: now },
  { id: 'grd_005', studentId: 'std_005', classId: 'cls_2b', subject: 'Física Aplicada', evaluationType: 'prova' as const, score: 6.2, maxScore: 10, period: '4bim' as const, teacherId: 'usr_teacher_01', status: 'draft_ai' as const, reviewedByTeacherId: null, propagationStatus: 'received_by_server' as const, contestationStatus: 'none' as const, createdAt: now },
];

export const seedInvoices = [
  {
    id: 'inv_001',
    studentId: 'std_001',
    institutionId: DEMO_INSTITUTION_ID,
    description: 'Mensalidade Escolar • Parcela 11/12 (Novembro/2026)',
    amount: 148000,
    dueDate: '2026-11-10',
    paidAt: null,
    status: 'pending' as const,
    paymentMethod: null,
    pixPayload: '00020126580014BR.GOV.BCB.PIX0136aquila-demo-nov-202652040000530398654071480.005802BR',
    receiptHashSha256: null,
    createdAt: now,
  },
  {
    id: 'inv_002',
    studentId: 'std_002',
    institutionId: DEMO_INSTITUTION_ID,
    description: 'Mensalidade Escolar • Parcela 11/12 (Novembro/2026)',
    amount: 148000,
    dueDate: '2026-11-10',
    paidAt: new Date('2026-11-03T10:00:00Z'),
    status: 'paid' as const,
    paymentMethod: 'pix',
    pixPayload: null,
    receiptHashSha256: 'b4f8c1d2e3a4958677112233445566778899aabbccddeeff0011223344556677',
    createdAt: now,
  },
  {
    id: 'inv_003',
    studentId: 'std_005',
    institutionId: DEMO_INSTITUTION_ID,
    description: 'Mensalidade Escolar • Parcela 10/12 (Outubro/2026)',
    amount: 148000,
    dueDate: '2026-10-10',
    paidAt: null,
    status: 'overdue' as const,
    paymentMethod: null,
    pixPayload: '00020126580014BR.GOV.BCB.PIX0136aquila-demo-out-202652040000530398654071480.005802BR',
    receiptHashSha256: null,
    createdAt: now,
  },
];

export const seedNotifications = [
  { id: 'ntf_001', recipientUserId: 'usr_parent_01', title: 'Entrada Confirmada • Portaria Sul', message: 'Lucas Andrade registrou presença via Crachá QR às 07:12 (2º Ano B).', type: 'attendance' as const, readAt: null, createdAt: now },
  { id: 'ntf_002', recipientUserId: 'usr_parent_01', title: 'Nova Nota Homologada', message: 'A nota de Física Aplicada (4º Bimestre) foi revisada pelo docente: 8.9/10.', type: 'grade' as const, readAt: null, createdAt: now },
  { id: 'ntf_003', recipientUserId: 'usr_parent_02', title: 'Aviso de Frequência Preventivo', message: 'Identificada ausência em Física Aplicada (2º Ano B). Verifique justificativa.', type: 'attendance' as const, readAt: null, createdAt: now },
];

export const seedDiaries = [
  {
    id: 'dry_001',
    classId: 'cls_2b',
    teacherId: 'usr_teacher_01',
    institutionId: DEMO_INSTITUTION_ID,
    date: '2026-11-11',
    subject: 'Física Aplicada',
    topic: 'Primeira Lei da Termodinâmica & Ciclos Térmicos',
    content: 'Conservação de Energia em transformações gasosas isobáricas, isocóricas e isotérmicas. Resolução comentada de questões ENEM.',
    bnccCodesJson: JSON.stringify(['EM13CNT301', 'EM13CNT302', 'EM13MAT305']),
    homework: 'Resolver exercícios 1 a 8 da página 142. Lista TRI disponível no Portal do Aluno.',
    dinnerPrompt: 'Como o princípio da conservação de energia explica o funcionamento da geladeira e dos motores elétricos no dia a dia?',
    status: 'published' as const,
    propagationStatus: 'applied_by_edge' as const,
    signatureHashSha256: null,
    signedAt: null,
    createdAt: now,
  },
];

export const seedAssessments = [
  {
    id: 'asm_001',
    classId: 'cls_2b',
    teacherId: 'usr_teacher_01',
    institutionId: DEMO_INSTITUTION_ID,
    title: 'Avaliação Bimestral de Física Aplicada — 2º Ano B',
    instructions: 'Utilize caneta esferográfica preta no cartão OMR. Tempo de prova: 50 minutos.',
    subject: 'Física Aplicada',
    bimestre: '4bim' as const,
    questionsJson: JSON.stringify([
      {
        id: 'q1',
        bncc: 'EM13CNT301',
        stem: 'Um gás ideal sofre expansão isotérmica reversível recebendo 600 J de calor. Qual o trabalho realizado e a variação ΔU?',
        options: ['A) W = 600 J e ΔU = 0 J', 'B) W = 0 J e ΔU = 600 J', 'C) W = 300 J e ΔU = 300 J', 'D) W = -600 J e ΔU = 600 J'],
        answer: 'A',
      },
      {
        id: 'q2',
        bncc: 'EM13CNT302',
        stem: 'Uma máquina de Carnot opera entre 600 K e 300 K. Qual o rendimento máximo teórico?',
        options: ['A) 25%', 'B) 50%', 'C) 75%', 'D) 80%'],
        answer: 'B',
      },
    ]),
    status: 'approved' as const,
    approvedByUserId: 'usr_teacher_01',
    approvedAt: now,
    createdAt: now,
  },
];

export const seedSubmissions = [
  {
    id: 'sub_001',
    assessmentId: 'asm_001',
    studentId: 'std_005',
    institutionId: DEMO_INSTITUTION_ID,
    answersJson: JSON.stringify({ q1: 'A', q2: 'C' }),
    autoScore: 5.0,
    finalScore: null,
    reviewStatus: 'draft_ai' as const,
    feedback: 'Sugestão de pré-correção OMR/IA: revisar rendimento de Carnot (1 - T_f/T_q).',
    reviewedByTeacherId: null,
    reviewedAt: null,
    submittedAt: now,
  },
];

export const seedOccurrences = [
  {
    id: 'occ_001',
    studentId: 'std_001',
    classId: 'cls_2b',
    institutionId: DEMO_INSTITUTION_ID,
    createdByUserId: 'usr_teacher_01',
    category: 'pedagogical' as const,
    severity: 'medium' as const,
    title: 'Orientação Complementar: Termodinâmica & Trabalho Gasoso',
    description: 'Sugestão de lista de reforço conceitual sobre transformações isobáricas e isotérmicas.',
    recommendedAction: 'Aplicar lista de reforço conceitual sobre Trabalho em Processos Gasosos.',
    actionApplied: null,
    signedByParentUserId: null,
    signedAt: null,
    signatureHashSha256: null,
    propagationStatus: 'applied_by_edge' as const,
    createdAt: now,
  },
  {
    id: 'occ_002',
    studentId: 'std_005',
    classId: 'cls_2b',
    institutionId: DEMO_INSTITUTION_ID,
    createdByUserId: 'usr_teacher_01',
    category: 'attendance' as const,
    severity: 'high' as const,
    title: '2 faltas consecutivas sem justificativa prévia (Radar LDB)',
    description: 'Ausência consecutiva detectada no 2º Ano B.',
    recommendedAction: 'Notificar coordenação pedagógica para acolhimento familiar.',
    actionApplied: null,
    signedByParentUserId: null,
    signedAt: null,
    signatureHashSha256: null,
    propagationStatus: 'applied_by_edge' as const,
    createdAt: now,
  },
];

export const seedSchedules = [
  { id: 'sch_001', classId: 'cls_2b', institutionId: DEMO_INSTITUTION_ID, dayOfWeek: 1, timeSlot: '07:00 - 07:50', subject: 'Matemática Aplicada', room: 'SALA 08', teacherName: 'Prof. Ricardo Silva' },
  { id: 'sch_002', classId: 'cls_2b', institutionId: DEMO_INSTITUTION_ID, dayOfWeek: 1, timeSlot: '07:50 - 08:40', subject: 'Matemática Aplicada', room: 'SALA 08', teacherName: 'Prof. Ricardo Silva' },
  { id: 'sch_003', classId: 'cls_2b', institutionId: DEMO_INSTITUTION_ID, dayOfWeek: 1, timeSlot: '08:40 - 09:30', subject: 'Física Aplicada', room: 'LAB 03', teacherName: 'Prof. Ricardo Silva' },
  { id: 'sch_004', classId: 'cls_2b', institutionId: DEMO_INSTITUTION_ID, dayOfWeek: 1, timeSlot: '09:50 - 10:40', subject: 'Redação & Linguagens', room: 'SALA 08', teacherName: 'Profa. Ana Beatriz' },
];

export const seedMissions = [
  {
    id: 'mis_001',
    studentId: 'std_001',
    institutionId: DEMO_INSTITUTION_ID,
    title: 'Simulado Express: Eletrodinâmica & Termodinâmica',
    description: '5 questões estilo TRI do ENEM com revisão passo a passo.',
    subject: 'Física Aplicada',
    bnccCode: 'EM13CNT301',
    rewardXp: 150,
    rewardCoins: 40,
    progress: 60,
    completed: false,
    updatedAt: now,
  },
  {
    id: 'mis_002',
    studentId: 'std_001',
    institutionId: DEMO_INSTITUTION_ID,
    title: 'Revisão Espaçada SRS: Biologia Celular',
    description: '12 flashcards pendentes para consolidação de longo prazo.',
    subject: 'Biologia',
    bnccCode: 'EM13CNT202',
    rewardXp: 80,
    rewardCoins: 20,
    progress: 100,
    completed: true,
    updatedAt: now,
  },
  {
    id: 'mis_003',
    studentId: 'std_001',
    institutionId: DEMO_INSTITUTION_ID,
    title: 'Ensaio Redação: IA & Soberania de Dados na Educação',
    description: 'Estruturação de tese, repertório sociocultural e proposta de intervenção.',
    subject: 'Redação',
    bnccCode: 'EM13LP05',
    rewardXp: 250,
    rewardCoins: 60,
    progress: 25,
    completed: false,
    updatedAt: now,
  },
];

export interface SeedPasswordsByUsername {
  [username: string]: string;
}

export async function seedAcademicFixtures(
  db: AquilaDatabase,
  passwords: SeedPasswordsByUsername = {}
): Promise<void> {
  const existingCount = await db.select({ total: count() }).from(institutions);
  if ((existingCount[0]?.total ?? 0) > 0 && Object.keys(passwords).length === 0) {
    return;
  }

  for (const inst of seedInstitutions) {
    await db.insert(institutions).values(inst).onConflictDoNothing();
  }
  for (const usr of seedUsers) {
    const customPassword = passwords[usr.username] || passwords[usr.email];
    const passwordHash = customPassword ? hashPasswordScrypt(customPassword) : usr.passwordHash;
    await db.insert(users).values({ ...usr, passwordHash }).onConflictDoNothing();
  }
  for (const cls of seedClasses) {
    await db.insert(classes).values(cls).onConflictDoNothing();
  }
  for (const std of seedStudents) {
    await db.insert(students).values(std).onConflictDoNothing();
  }
  for (const link of seedGuardiansStudents) {
    await db.insert(guardiansStudents).values(link).onConflictDoNothing();
  }
  for (const att of seedAttendance) {
    await db.insert(attendance).values(att).onConflictDoNothing();
  }
  for (const grd of seedGrades) {
    await db.insert(grades).values(grd).onConflictDoNothing();
  }
  for (const inv of seedInvoices) {
    await db.insert(invoices).values(inv).onConflictDoNothing();
  }
  for (const ntf of seedNotifications) {
    await db.insert(notifications).values(ntf).onConflictDoNothing();
  }
  for (const dry of seedDiaries) {
    await db.insert(lessonDiaries).values(dry).onConflictDoNothing();
  }
  for (const asm of seedAssessments) {
    await db.insert(assessments).values(asm).onConflictDoNothing();
  }
  for (const sub of seedSubmissions) {
    await db.insert(assessmentSubmissions).values(sub).onConflictDoNothing();
  }
  for (const occ of seedOccurrences) {
    await db.insert(occurrences).values(occ).onConflictDoNothing();
  }
  for (const sch of seedSchedules) {
    await db.insert(schedules).values(sch).onConflictDoNothing();
  }
  for (const mis of seedMissions) {
    await db.insert(studentMissions).values(mis).onConflictDoNothing();
  }
}
