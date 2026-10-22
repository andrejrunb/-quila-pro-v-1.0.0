import { institutions, users, classes, students, attendance, grades, invoices, notifications } from './schema';

/**
 * Seed data for Áquila Pro demonstration.
 * Run this after Drizzle migrations to populate the database with sample school data.
 */

const now = new Date();
const institutionId = 'inst_aquila_demo';

export const seedInstitutions = [
  {
    id: institutionId,
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
  { id: 'usr_admin_01', name: 'Dr. Ricardo Mendes', email: 'ricardo@aguiadourada.edu.br', passwordHash: '$2b$12$placeholder', role: 'admin' as const, institutionId, phone: '(11) 99999-0001', active: true, createdAt: now },
  { id: 'usr_coord_01', name: 'Profa. Mariana Costa', email: 'mariana@aguiadourada.edu.br', passwordHash: '$2b$12$placeholder', role: 'coordinator' as const, institutionId, phone: '(11) 99999-0002', active: true, createdAt: now },
  { id: 'usr_teacher_01', name: 'Prof. Carlos Eduardo', email: 'carlos@aguiadourada.edu.br', passwordHash: '$2b$12$placeholder', role: 'teacher' as const, institutionId, phone: '(11) 99999-0003', active: true, createdAt: now },
  { id: 'usr_teacher_02', name: 'Profa. Ana Beatriz', email: 'ana@aguiadourada.edu.br', passwordHash: '$2b$12$placeholder', role: 'teacher' as const, institutionId, phone: '(11) 99999-0004', active: true, createdAt: now },
  { id: 'usr_teacher_03', name: 'Prof. Fernando Lima', email: 'fernando@aguiadourada.edu.br', passwordHash: '$2b$12$placeholder', role: 'teacher' as const, institutionId, phone: '(11) 99999-0005', active: true, createdAt: now },
  { id: 'usr_parent_01', name: 'Sra. Patrícia Silva', email: 'patricia@gmail.com', passwordHash: '$2b$12$placeholder', role: 'parent' as const, institutionId, phone: '(11) 98765-4321', active: true, createdAt: now },
  { id: 'usr_parent_02', name: 'Sr. Roberto Santos', email: 'roberto@gmail.com', passwordHash: '$2b$12$placeholder', role: 'parent' as const, institutionId, phone: '(11) 98765-1234', active: true, createdAt: now },
];

export const seedClasses = [
  { id: 'cls_3a', name: '3º Ano A', grade: 3, shift: 'morning' as const, year: 2026, institutionId, teacherId: 'usr_teacher_01', roomId: 'Sala 101', maxStudents: 35 },
  { id: 'cls_3b', name: '3º Ano B', grade: 3, shift: 'morning' as const, year: 2026, institutionId, teacherId: 'usr_teacher_02', roomId: 'Sala 102', maxStudents: 35 },
  { id: 'cls_5a', name: '5º Ano A', grade: 5, shift: 'morning' as const, year: 2026, institutionId, teacherId: 'usr_teacher_03', roomId: 'Sala 201', maxStudents: 35 },
  { id: 'cls_7a', name: '7º Ano A', grade: 7, shift: 'afternoon' as const, year: 2026, institutionId, teacherId: 'usr_teacher_01', roomId: 'Sala 301', maxStudents: 35 },
  { id: 'cls_9a', name: '9º Ano A', grade: 9, shift: 'afternoon' as const, year: 2026, institutionId, teacherId: 'usr_teacher_02', roomId: 'Sala 401', maxStudents: 35 },
];

export const seedStudents = [
  { id: 'std_001', name: 'João Pedro Silva', registrationNumber: '2026001', classId: 'cls_3a', institutionId, parentUserId: 'usr_parent_01', dateOfBirth: '2018-03-15', status: 'active' as const, enrolledAt: now },
  { id: 'std_002', name: 'Maria Clara Santos', registrationNumber: '2026002', classId: 'cls_3a', institutionId, parentUserId: 'usr_parent_02', dateOfBirth: '2018-07-22', status: 'active' as const, enrolledAt: now },
  { id: 'std_003', name: 'Lucas Gabriel Oliveira', registrationNumber: '2026003', classId: 'cls_3b', institutionId, parentUserId: null, dateOfBirth: '2018-01-10', status: 'active' as const, enrolledAt: now },
  { id: 'std_004', name: 'Ana Sofia Lima', registrationNumber: '2026004', classId: 'cls_5a', institutionId, parentUserId: 'usr_parent_01', dateOfBirth: '2016-11-05', status: 'active' as const, enrolledAt: now },
  { id: 'std_005', name: 'Pedro Henrique Costa', registrationNumber: '2026005', classId: 'cls_7a', institutionId, parentUserId: 'usr_parent_02', dateOfBirth: '2014-09-18', status: 'active' as const, enrolledAt: now },
  { id: 'std_006', name: 'Isabella Mendes', registrationNumber: '2026006', classId: 'cls_9a', institutionId, parentUserId: null, dateOfBirth: '2012-04-30', status: 'active' as const, enrolledAt: now },
];

export const seedGrades = [
  { id: 'grd_001', studentId: 'std_001', classId: 'cls_3a', subject: 'Matemática', evaluationType: 'prova' as const, score: 8.5, maxScore: 10, period: '2bim' as const, teacherId: 'usr_teacher_01', createdAt: now },
  { id: 'grd_002', studentId: 'std_001', classId: 'cls_3a', subject: 'Português', evaluationType: 'trabalho' as const, score: 9.0, maxScore: 10, period: '2bim' as const, teacherId: 'usr_teacher_02', createdAt: now },
  { id: 'grd_003', studentId: 'std_002', classId: 'cls_3a', subject: 'Matemática', evaluationType: 'prova' as const, score: 7.0, maxScore: 10, period: '2bim' as const, teacherId: 'usr_teacher_01', createdAt: now },
  { id: 'grd_004', studentId: 'std_004', classId: 'cls_5a', subject: 'Ciências', evaluationType: 'prova' as const, score: 9.5, maxScore: 10, period: '2bim' as const, teacherId: 'usr_teacher_03', createdAt: now },
  { id: 'grd_005', studentId: 'std_005', classId: 'cls_7a', subject: 'História', evaluationType: 'participacao' as const, score: 8.0, maxScore: 10, period: '2bim' as const, teacherId: 'usr_teacher_01', createdAt: now },
];

export const seedInvoices = [
  { id: 'inv_001', studentId: 'std_001', institutionId, description: 'Mensalidade Agosto 2026', amount: 85000, dueDate: '2026-08-10', paidAt: null, status: 'pending' as const, paymentMethod: null, createdAt: now },
  { id: 'inv_002', studentId: 'std_002', institutionId, description: 'Mensalidade Agosto 2026', amount: 85000, dueDate: '2026-08-10', paidAt: new Date('2026-08-03T10:00:00Z'), status: 'paid' as const, paymentMethod: 'pix', createdAt: now },
  { id: 'inv_003', studentId: 'std_003', institutionId, description: 'Mensalidade Julho 2026', amount: 85000, dueDate: '2026-07-10', paidAt: null, status: 'overdue' as const, paymentMethod: null, createdAt: now },
  { id: 'inv_004', studentId: 'std_004', institutionId, description: 'Mensalidade Agosto 2026', amount: 95000, dueDate: '2026-08-10', paidAt: new Date('2026-08-01T14:30:00Z'), status: 'paid' as const, paymentMethod: 'credit_card', createdAt: now },
];

export const seedNotifications = [
  { id: 'ntf_001', recipientUserId: 'usr_parent_01', title: 'Frequência Atualizada', message: 'João Pedro foi registrado como presente na aula de Matemática.', type: 'attendance' as const, readAt: null, createdAt: now },
  { id: 'ntf_002', recipientUserId: 'usr_parent_01', title: 'Nova Nota Lançada', message: 'A nota de Português do 2º Bimestre foi lançada: 9.0/10.', type: 'grade' as const, readAt: null, createdAt: now },
  { id: 'ntf_003', recipientUserId: 'usr_parent_02', title: 'Mensalidade Pendente', message: 'A mensalidade de Agosto vence em 10/08. Pague via PIX com desconto.', type: 'finance' as const, readAt: null, createdAt: now },
];
