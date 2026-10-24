/**
 * seed_full.ts — Seed Completo do Áquila Pro
 * Cria todos os roles de usuário + escola + turmas + alunos + staff + relações.
 * Uso: npx ts-node -e "require('./src/tests/seed_full.ts')"
 * ou via script: npm run seed
 */

import { Database } from '../database/Database';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';

// ─── Hash helper (scrypt — mesmo algoritmo do AuthService) ───────────────────
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  return `scrypt$16384$8$1$${salt}$${hash}`;
}

// ─── Seed principal ───────────────────────────────────────────────────────────
async function seedFull() {
  const db = new Database();

  await db.initialize();

  let inserted = 0;
  let skipped = 0;

  async function insert(sql: string, params: any[], label: string) {
    try {
      await db.run(sql, params);
      console.log(`[SEED][OK]      ${label}`);
      inserted++;
    } catch (err: any) {
      if (err.message?.includes('UNIQUE') || err.message?.includes('already exists')) {
        console.log(`[SEED][SKIP]    ${label} — já existe`);
        skipped++;
      } else {
        throw err;
      }
    }
  }

  console.log('\n══════ ÁQUILA PRO — SEED COMPLETO ══════\n');

  // ── 1. Escola ────────────────────────────────────────────────────────────────
  const schoolId = 'school-aquila-main';
  await insert(
    'INSERT OR IGNORE INTO schools (id, name, address, email, phone) VALUES (?, ?, ?, ?, ?)',
    [schoolId, 'Colégio Áquila Pro (Sede)', 'Av. da Inteligência, 1000 - Brasília/DF', 'contato@aquilapro.edu.br', '61 3000-0000'],
    'Escola Principal'
  );

  // ── 2. Salas ─────────────────────────────────────────────────────────────────
  const rooms = [
    { id: 'room-001', name: 'Sala 101', location: 'Bloco A', floor: '1' },
    { id: 'room-002', name: 'Sala 201', location: 'Bloco A', floor: '2' },
    { id: 'room-lab', name: 'Laboratório de IA', location: 'Bloco B', floor: '1' },
  ];
  for (const r of rooms) {
    await insert(
      'INSERT OR IGNORE INTO rooms (id, schoolId, name, location, floor, capacity, status) VALUES (?, ?, ?, ?, ?, 30, \'active\')',
      [r.id, schoolId, r.name, r.location, r.floor],
      `Sala: ${r.name}`
    );
  }

  // ── 3. Turmas ─────────────────────────────────────────────────────────────────
  const classes = [
    { id: 'class-9a', name: '9º Ano A', grade: '9º Ano' },
    { id: 'class-8b', name: '8º Ano B', grade: '8º Ano' },
    { id: 'class-7a', name: '7º Ano A', grade: '7º Ano' },
    { id: 'class-01', name: 'Turma de Teste 01', grade: 'Teste' },
  ];
  for (const c of classes) {
    await insert(
      'INSERT OR IGNORE INTO classes (id, schoolId, name, grade) VALUES (?, ?, ?, ?)',
      [c.id, schoolId, c.name, c.grade],
      `Turma: ${c.name}`
    );
  }

  // ── 4. Alunos (5 por turma = 15 total) ──────────────────────────────────────
  const studentDefs = [
    // 9A
    { id: 'stu-9a-01', classId: 'class-9a', name: 'Ana Clara Borges',    reg: 'AQ-9A-001' },
    { id: 'stu-9a-02', classId: 'class-9a', name: 'Bruno Carvalho',      reg: 'AQ-9A-002' },
    { id: 'stu-9a-03', classId: 'class-9a', name: 'Carla Diniz',         reg: 'AQ-9A-003' },
    { id: 'stu-9a-04', classId: 'class-9a', name: 'Diego Esteves',       reg: 'AQ-9A-004', observationLevel: 2 },
    { id: 'stu-9a-05', classId: 'class-9a', name: 'Eduarda Ferreira',    reg: 'AQ-9A-005' },
    // 8B
    { id: 'stu-8b-01', classId: 'class-8b', name: 'Felipe Gomes',        reg: 'AQ-8B-001' },
    { id: 'stu-8b-02', classId: 'class-8b', name: 'Giovanna Henrique',   reg: 'AQ-8B-002' },
    { id: 'stu-8b-03', classId: 'class-8b', name: 'Hugo Inocêncio',      reg: 'AQ-8B-003', observationLevel: 1 },
    { id: 'stu-8b-04', classId: 'class-8b', name: 'Isabela Jardim',      reg: 'AQ-8B-004' },
    { id: 'stu-8b-05', classId: 'class-8b', name: 'João Lacerda',        reg: 'AQ-8B-005' },
    // 7A
    { id: 'stu-7a-01', classId: 'class-7a', name: 'Karen Monteiro',      reg: 'AQ-7A-001' },
    { id: 'stu-7a-02', classId: 'class-7a', name: 'Lucas Nogueira',      reg: 'AQ-7A-002' },
    { id: 'stu-7a-03', classId: 'class-7a', name: 'Marina Oliveira',     reg: 'AQ-7A-003' },
    { id: 'stu-7a-04', classId: 'class-7a', name: 'Nelson Pereira',      reg: 'AQ-7A-004', observationLevel: 3 },
    { id: 'stu-7a-05', classId: 'class-7a', name: 'Olívia Queiroz',      reg: 'AQ-7A-005' },
    // Turma de Teste 01 (class-01)
    { id: 'stu-01-01', classId: 'class-01', name: 'Zezinho Teste',       reg: 'AQ-01-001' },
    { id: 'stu-01-02', classId: 'class-01', name: 'Luizinho Teste',      reg: 'AQ-01-002' },
    { id: 'stu-01-03', classId: 'class-01', name: 'Huguinho Teste',      reg: 'AQ-01-003' },
  ];
  for (const s of studentDefs) {
    await insert(
      'INSERT OR IGNORE INTO students (id, classId, name, registrationNumber, status, observationLevel) VALUES (?, ?, ?, ?, \'active\', ?)',
      [s.id, s.classId, s.name, s.reg, (s as any).observationLevel ?? 0],
      `Aluno: ${s.name}`
    );
    // Economia do aluno
    await db.run(
      'INSERT OR IGNORE INTO student_economy (student_id, balance, level, xp) VALUES (?, ?, ?, ?)',
      [s.id, Math.floor(Math.random() * 500), 1, Math.floor(Math.random() * 200)]
    );
  }

  // ── 5. Usuários — todos os roles do sistema ──────────────────────────────────
  const userDefs = [
    // Role: admin (acesso total ao desktop + configurações)
    { id: 'user-admin-01',  username: 'admin',       name: 'Administrador Principal',    role: 'admin',       pass: process.env.INITIAL_ADMIN_PASSWORD || 'EagleSovereign2026#Admin' },
    { id: 'user-admin-02',  username: 'diretor',     name: 'Diretor Geral',              role: 'director',    pass: 'Diretor@2026!' },
    // Role: secretary (secretaria)
    { id: 'user-sec-01',    username: 'secretaria',  name: 'Secretária Ana',             role: 'secretary',   pass: 'Sec@2026!' },
    // Role: coordinator (coordenação)
    { id: 'user-coord-01',  username: 'coord_ana',   name: 'Coord. Ana Maria',           role: 'coordinator', pass: 'Coord@2026!' },
    { id: 'user-coord-02',  username: 'coord_paulo', name: 'Coord. Paulo Henrique',      role: 'coordinator', pass: 'Coord@2026!' },
    // Role: docente (professor — acesso via TeacherPortal)
    { id: 'user-doc-01',    username: 'prof_carlos', name: 'Prof. Carlos Andrade',       role: 'docente',     pass: 'Prof@2026!' },
    { id: 'user-doc-02',    username: 'prof_julia',  name: 'Profa. Júlia Santos',        role: 'docente',     pass: 'Prof@2026!' },
    { id: 'user-doc-03',    username: 'prof_marcos', name: 'Prof. Marcos Vieira',        role: 'docente',     pass: 'Prof@2026!' },
    // Role: security (monitoramento câmeras/SOC)
    { id: 'user-sec-02',    username: 'vigilante_01', name: 'João Segurança',            role: 'security',    pass: 'Sec@2026!' },
    // Role: rh (RH — acesso via HRPortal)
    { id: 'user-rh-01',     username: 'rh_lucia',    name: 'RH Lúcia Ferreira',          role: 'rh',          pass: 'RH@2026!' },
    // Role: pais (responsável — acesso via app mobile/ParentPortal)
    { id: 'user-pai-01',    username: 'pai_stu9a01', name: 'Roberto Borges (pai Ana)',   role: 'pais',        pass: 'Pai@2026!' },
    { id: 'user-pai-02',    username: 'mae_stu9a02', name: 'Sandra Carvalho (mãe Bruno)',role: 'pais',        pass: 'Pai@2026!' },
    // Role: totem (quiosque biométrico — acesso restrito)
    { id: 'user-totem-01',  username: 'totem_entrada', name: 'Totem Portaria Principal', role: 'totem',       pass: 'Totem@2026!' },
    // Role: student (aluno — StudentPortal)
    { id: 'user-stu-9a01',  username: 'aluno_ana',   name: 'Ana Clara Borges',           role: 'student',     pass: 'Aluno@2026!' },
  ];

  for (const u of userDefs) {
    const hash = hashPassword(u.pass);
    await insert(
      'INSERT OR IGNORE INTO users (id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)',
      [u.id, u.username, hash, u.name, u.role],
      `Usuário [${u.role.padEnd(12)}] ${u.username}`
    );
  }

  // ── 6. Staff (RH — funcionários vinculados a users) ──────────────────────────
  const staffDefs = [
    { id: 'staff-doc-01', name: 'Prof. Carlos Andrade', role: 'Docente',        email: 'carlos@aquilapro.edu.br' },
    { id: 'staff-doc-02', name: 'Profa. Júlia Santos',  role: 'Docente',        email: 'julia@aquilapro.edu.br' },
    { id: 'staff-rh-01',  name: 'Lúcia Ferreira',       role: 'Gestor de RH',   email: 'lucia@aquilapro.edu.br' },
    { id: 'staff-sec-01', name: 'João Segurança',       role: 'Segurança',      email: 'joao.seg@aquilapro.edu.br' },
  ];
  for (const s of staffDefs) {
    await insert(
      'INSERT OR IGNORE INTO staff (id, name, role, email, status) VALUES (?, ?, ?, ?, \'active\')',
      [s.id, s.name, s.role, s.email],
      `Staff: ${s.name}`
    );
    await db.run(
      'INSERT OR IGNORE INTO staff_details (staffId, baseSalary, contractType, admissionDate, performanceScore) VALUES (?, ?, ?, ?, ?)',
      [s.id, 4500.00, 'CLT', '2024-02-01', 95]
    );
  }

  // ── 7. Grade Horária (professor → turma → sala) ─────────────────────────────
  const schedules = [
    { id: 'sched-001', classId: 'class-9a', roomId: 'room-001', teacherId: 'user-doc-01', subject: 'Matemática', day: 1, start: '07:30', end: '09:00' },
    { id: 'sched-002', classId: 'class-9a', roomId: 'room-001', teacherId: 'user-doc-02', subject: 'Português',  day: 2, start: '07:30', end: '09:00' },
    { id: 'sched-003', classId: 'class-8b', roomId: 'room-002', teacherId: 'user-doc-01', subject: 'Matemática', day: 1, start: '09:15', end: '10:45' },
    { id: 'sched-004', classId: 'class-7a', roomId: 'room-lab', teacherId: 'user-doc-03', subject: 'IA Aplicada', day: 3, start: '13:00', end: '14:30' },
  ];
  for (const s of schedules) {
    await insert(
      'INSERT OR IGNORE INTO schedules (id, classId, roomId, teacherId, subject, teacher, dayOfWeek, startTime, endTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [s.id, s.classId, s.roomId, s.teacherId, s.subject, s.subject, s.day, s.start, s.end],
      `Schedule: ${s.subject} — turma ${s.classId}`
    );
  }

  // ── 8. Logs comportamentais (2 por aluno de alta observação) ─────────────────
  const highObsStudents = studentDefs.filter(s => (s as any).observationLevel > 0);
  for (const s of highObsStudents) {
    for (let i = 0; i < 2; i++) {
      const logId = `blog-${s.id}-${i}`;
      await db.run(
        'INSERT OR IGNORE INTO behavioral_logs (id, studentId, stress, anxiety, aggression, fatigue, engagement, riskScore) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [logId, s.id, 0.4 + i * 0.1, 0.3, 0.2, 0.5, 0.6, 45 + i * 10]
      );
    }
  }

  // ── 9. Billing (2 cobranças por aluno) ──────────────────────────────────────
  for (const s of studentDefs.slice(0, 5)) {
    const hash = crypto.createHash('sha256').update(s.id).digest('hex');
    await db.run(
      'INSERT OR IGNORE INTO billing (id, studentHash, amount, dueDate, status) VALUES (?, ?, ?, ?, ?)',
      [`bill-${s.id}-1`, hash, 850.00, '2026-05-10', 'pending']
    );
    await db.run(
      'INSERT OR IGNORE INTO billing (id, studentHash, amount, dueDate, status) VALUES (?, ?, ?, ?, ?)',
      [`bill-${s.id}-2`, hash, 850.00, '2026-06-10', 'pending']
    );
  }

  // ── 10. Coordenações ─────────────────────────────────────────────────────────
  await insert(
    'INSERT OR IGNORE INTO coordinations (id, name, schoolId) VALUES (?, ?, ?)',
    ['coord-ensino-fund', 'Coordenação do Ensino Fundamental', schoolId],
    'Coordenação: Ensino Fundamental'
  );

  // ── 11. Período Acadêmico ────────────────────────────────────────────────────
  await insert(
    'INSERT OR IGNORE INTO academic_periods (id, name, startDate, endDate, schoolId) VALUES (?, ?, ?, ?, ?)',
    ['period-2026-1', '1º Bimestre 2026', '2026-02-01', '2026-04-30', schoolId],
    'Período: 1º Bimestre 2026'
  );
  await insert(
    'INSERT OR IGNORE INTO academic_periods (id, name, startDate, endDate, schoolId) VALUES (?, ?, ?, ?, ?)',
    ['period-2026-2', '2º Bimestre 2026', '2026-05-01', '2026-07-15', schoolId],
    'Período: 2º Bimestre 2026'
  );

  // ── 12. Configurações base ───────────────────────────────────────────────────
  const settings = [
    ['school_name',   'Colégio Áquila Modelo'],
    ['school_id',     schoolId],
    ['app_version',   '1.5.0'],
    ['setup_done',    'true'],
  ];
  for (const [k, v] of settings) {
    await db.run('INSERT OR REPLACE INTO settings (id, value) VALUES (?, ?)', [k, v]);
  }

  console.log('\n══════ RESULTADO SEED ══════');
  console.log(`  Inseridos: ${inserted}`);
  console.log(`  Ignorados (já existiam): ${skipped}`);
  console.log('══════════════════════════\n');

  process.exit(0);
}

seedFull().catch(err => {
  console.error('[SEED][FATAL]', err.message);
  process.exit(1);
});
