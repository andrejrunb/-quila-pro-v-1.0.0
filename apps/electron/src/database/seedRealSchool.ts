/**
 * seedRealSchool.ts — Seed de Dados Reais para Teste Piloto
 * ==========================================================
 * Popula o banco com professores, turmas, salas e grade horária reais
 * extraídos do PDF "HORÁRIO 04 DE MAIO GERAL".
 *
 * Login = nome do professor (lowercase, sem acento)
 * Senha = nome do professor (lowercase, sem acento)
 */

import Database from './Database';
import * as crypto from 'crypto';
import { STUDENTS } from './studentsData';

// ─────────────────────────────────────────────
// HASH HELPER (Scrypt — mesmo padrão do AuthService)
// ─────────────────────────────────────────────
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  return `scrypt$16384$8$1$${salt}$${hash}`;
}

function normalizeUsername(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Remove acentos
    .replace(/\s+/g, '.')             // Espaços viram pontos
    .replace(/[^a-z0-9.]/g, '');      // Remove caracteres especiais
}

// ─────────────────────────────────────────────
// DADOS DOS PROFESSORES
// ─────────────────────────────────────────────
const TEACHERS = [
  // Ensino Fundamental I (Regentes Polivalentes)
  { name: 'KARINE',     subject: 'Polivalente',     segment: 'Fund. I' },
  { name: 'CELIA',      subject: 'Polivalente',     segment: 'Fund. I' },
  { name: 'MILENE',     subject: 'Polivalente',     segment: 'Fund. I' },
  { name: 'JANETE',     subject: 'Polivalente',     segment: 'Fund. I' },
  { name: 'KELE',       subject: 'Polivalente',     segment: 'Fund. I' },
  { name: 'LENE',       subject: 'Polivalente',     segment: 'Fund. I' },
  { name: 'SANDRA',     subject: 'Polivalente',     segment: 'Fund. I' },
  { name: 'ELAINE',     subject: 'Polivalente',     segment: 'Fund. I' },
  { name: 'ANA MARIA',  subject: 'Polivalente',     segment: 'Fund. I' },
  { name: 'ROBERTA',    subject: 'Polivalente',     segment: 'Fund. I/II' },
  { name: 'ANA FLAVIA', subject: 'Polivalente',     segment: 'Fund. I/II' },
  { name: 'LUDIMILA',   subject: 'Polivalente',     segment: 'Fund. I/II' },
  { name: 'CLAUDIA',    subject: 'Polivalente',     segment: 'Fund. I' },

  // Ensino Fundamental II / Ensino Médio (Especialistas)
  { name: 'DANIELLE',   subject: 'Português',       segment: 'Fund. II / EM' },
  { name: 'DANIELE',    subject: 'Espanhol',         segment: 'Fund. II / EM' },
  { name: 'LARISSA',    subject: 'Disciplina II',    segment: 'Fund. II / EM' },
  { name: 'SAMARA',     subject: 'Disciplina III',   segment: 'Fund. II / EM' },
  { name: 'MOISES',     subject: 'Disciplina IV',    segment: 'Fund. II / EM' },
  { name: 'M.ISABEL',   subject: 'Disciplina V',     segment: 'Fund. II / EM' },
  { name: 'THYAGO',     subject: 'Disciplina VI',    segment: 'Fund. II / EM' },
  { name: 'LAURA',      subject: 'Disciplina VII',   segment: 'Fund. II / EM' },
  { name: 'J.B',        subject: 'Disciplina VIII',  segment: 'Fund. II / EM' },
  { name: 'IAMANDRO',   subject: 'Disciplina IX',    segment: 'Fund. II / EM' },
  { name: 'ANITA',      subject: 'Disciplina X',     segment: 'Fund. II / EM' },
  { name: 'ANDRE',      subject: 'Disciplina XI',    segment: 'Fund. II / EM' },
  { name: 'JESSICA',    subject: 'Disciplina XII',   segment: 'Fund. II / EM' },
  { name: 'ANA INGLES', subject: 'Inglês',           segment: 'Especialista' },

  // Ensino Médio (exclusivos de tarde / séries)
  { name: 'CHEBINHA',   subject: 'EM Disciplina I',  segment: 'Ensino Médio' },
  { name: 'LUIZ ARTE',  subject: 'Arte',             segment: 'Especialista' },
  { name: 'FILIPE',     subject: 'EM Disciplina II', segment: 'Ensino Médio' },
  { name: 'GUILHERME',  subject: 'EM Disciplina III',segment: 'Ensino Médio' },
  { name: 'BETY',       subject: 'EM Disciplina IV', segment: 'Ensino Médio' },
  { name: 'LANDER',     subject: 'EM Disciplina V',  segment: 'Ensino Médio' },
  { name: 'HANS',       subject: 'EM Disciplina VI', segment: 'Ensino Médio' },
  { name: 'MARCONDES',  subject: 'EM Disciplina VII',segment: 'Ensino Médio' },
  { name: 'NORTHON',    subject: 'EM Disciplina VIII',segment: 'Ensino Médio' },
  { name: 'FERREIRA',   subject: 'EM Disciplina IX', segment: 'Ensino Médio' },
  { name: 'GABRIELA',   subject: 'EM Disciplina X',  segment: 'Ensino Médio' },
  { name: 'DIGAO',      subject: 'EM Disciplina XI', segment: 'Ensino Médio' },
  { name: 'WEIGUI',     subject: 'EM Disciplina XII',segment: 'Ensino Médio' },
  { name: 'IGOR',       subject: 'EM Disciplina XIII',segment: 'Ensino Médio' },
];

// ─────────────────────────────────────────────
// TURMAS (22 turmas)
// ─────────────────────────────────────────────
const CLASSES = [
  { id: 'F-EF11A',    name: '1 ANO A',    grade: '1º Ano' },
  { id: 'F-EF11B',    name: '1 ANO B',    grade: '1º Ano' },
  { id: 'F-EF12A',    name: '2 ANO A',    grade: '2º Ano' },
  { id: 'F-EF12B',    name: '2 ANO B',    grade: '2º Ano' },
  { id: 'F-EF13A',    name: '3 ANO A',    grade: '3º Ano' },
  { id: 'F-EF13B',    name: '3 ANO B',    grade: '3º Ano' },
  { id: 'F-EF14A',    name: '4 ANO A',    grade: '4º Ano' },
  { id: 'F-EF14B',    name: '4 ANO B',    grade: '4º Ano' },
  { id: 'F-EF15A',    name: '5 ANO A',    grade: '5º Ano' },
  { id: 'F-EF15B',    name: '5 ANO B',    grade: '5º Ano' },
  { id: 'F-EF26A',    name: '6 ANO A',    grade: '6º Ano' },
  { id: 'F-EF26B',    name: '6 ANO B',    grade: '6º Ano' },
  { id: 'F-EF27A',    name: '7 ANO A',    grade: '7º Ano' },
  { id: 'F-EF27B',    name: '7 ANO B',    grade: '7º Ano' },
  { id: 'F-EF28A',    name: '8 ANO A',    grade: '8º Ano' },
  { id: 'F-EF28B',    name: '8 ANO B',    grade: '8º Ano' },
  { id: 'F-EF29A',    name: '9 ANO A',    grade: '9º Ano' },
  { id: 'F-EF29B',    name: '9 ANO B',    grade: '9º Ano' },
  { id: 'F-EM1A',     name: '1 SERIE A',  grade: '1ª Série EM' },
  { id: 'F-EM1B',     name: '1 SERIE B',  grade: '1ª Série EM' },
  { id: 'F-EM2A',     name: '2 SERIE A',  grade: '2ª Série EM' },
  { id: 'F-EM3A',     name: '3 SERIE A',  grade: '3ª Série EM' },
];

// Mapeamento nome da turma no PDF → id da turma no banco
const CLASS_NAME_TO_ID: Record<string, string> = {};
CLASSES.forEach(c => { CLASS_NAME_TO_ID[c.name] = c.id; });

// ─────────────────────────────────────────────
// GRADE HORÁRIA COMPLETA (extraída do PDF)
// ─────────────────────────────────────────────
// dayOfWeek: 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex
const CLASS_HEADERS = [
  '1 ANO A','1 ANO B','2 ANO A','2 ANO B','3 ANO A','3 ANO B',
  '4 ANO A','4 ANO B','5 ANO A','5 ANO B','6 ANO A','6 ANO B',
  '7 ANO A','7 ANO B','8 ANO A','8 ANO B','9 ANO A','9 ANO B',
  '1 SERIE A','1 SERIE B','2 SERIE A','3 SERIE A'
];

const TIME_SLOTS: Record<string, string> = {
  '07:30': '08:20',
  '08:20': '09:10',
  '09:10': '10:00',
  '10:30': '11:10',
  '11:10': '12:00',
  '12:00': '12:50',
  '14:20': '15:10',
  '15:10': '16:00',
  '16:20': '17:10',
  '17:10': '18:00',
};

// Dados brutos da grade (exatamente como extraídos do PDF)
const SCHEDULE_RAW: Array<{ day: number; time: string; teachers: string[] }> = [
  // ═══════════ SEGUNDA-FEIRA ═══════════
  { day: 1, time: '07:30', teachers: ['MILENE','CELIA','JANETE','KELE','LENE','SANDRA','ANA MARIA','ROBERTA','ED. FISICA 1','ED. FISICA 1','ANA FLAVIA','LUDIMILA','DANIELLE','ANDRE','LARISSA','SAMARA','MOISES','THYAGO','CHEBINHA','M.ISABEL','LUIZ ARTE','LAURA'] },
  { day: 1, time: '08:20', teachers: ['KARINE','CELIA','MILENE','KELE','LENE','SANDRA','ROBERTA','ANA INGLES','ANA MARIA','ANA FLAVIA','LUDIMILA','DANIELLE','ANITA','THYAGO','SAMARA','LARISSA','ANDRE','M.ISABEL','LAURA','CHEBINHA','LUIZ ARTE','JESSICA'] },
  { day: 1, time: '09:10', teachers: ['KARINE','CELIA','JANETE','MILENE','LENE','ANA INGLES','ANA MARIA','ANA FLAVIA','LUDIMILA','ROBERTA','DANIELLE','SAMARA','THYAGO','LARISSA','ANDRE','ANITA','M.ISABEL','MOISES','LUIZ ARTE','CHEBINHA','LAURA','JESSICA'] },
  { day: 1, time: '10:30', teachers: ['KARINE','MILENE','JANETE','KELE','ANA INGLES','SANDRA','ROBERTA','ANA FLAVIA','ANA MARIA','LUDIMILA','SAMARA','ANITA','LARISSA','DANIELLE','THYAGO','M.ISABEL','LAURA','ANDRE','CHEBINHA','LUIZ ARTE','MOISES','JESSICA'] },
  { day: 1, time: '11:10', teachers: ['KARINE','CELIA','JANETE','KELE','LENE','SANDRA','ANA INGLES','ROBERTA','ANA FLAVIA','ANA MARIA','THYAGO','DANIELLE','ED. FISICA 1','ED. FISICA 1','ANITA','ANDRE','LARISSA','LAURA','JESSICA','MOISES','M.ISABEL','CHEBINHA'] },
  { day: 1, time: '12:00', teachers: ['-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','THYAGO','LARISSA','LAURA','CHEBINHA','ANDRE','MOISES'] },

  // ═══════════ TERÇA-FEIRA ═══════════
  { day: 2, time: '07:30', teachers: ['KARINE','CELIA','MILENE','KELE','LENE','SANDRA','ED. FISICA 1','ED. FISICA 1','ROBERTA','LUDIMILA','ANA FLAVIA','IAMANDRO','J.B','DANIELLE','M.ISABEL','MOISES','LARISSA','ANDRE','LANDER','BETY','GUILHERME','FILIPE'] },
  { day: 2, time: '08:20', teachers: ['KARINE','CELIA','JANETE','MILENE','LENE','SANDRA','ANA INGLES','ROBERTA','ANA FLAVIA','ANA MARIA','LUDIMILA','DANIELLE','MOISES','J.B','LARISSA','IAMANDRO','ANDRE','M.ISABEL','GUILHERME','FILIPE','LANDER','BETY'] },
  { day: 2, time: '09:10', teachers: ['MILENE','CELIA','JANETE','KELE','ANA INGLES','SANDRA','ANA FLAVIA','ELAINE','ANA MARIA','ROBERTA','DANIELLE','LUDIMILA','ANDRE','MOISES','IAMANDRO','J.B','M.ISABEL','LARISSA','BETY','GUILHERME','FILIPE','LANDER'] },
  { day: 2, time: '10:30', teachers: ['KARINE','MILENE','JANETE','KELE','LENE','ANA INGLES','ELAINE','ANA MARIA','LUDIMILA','ROBERTA','ANA FLAVIA','DANIELLE','ANDRE','IAMANDRO','J.B','LARISSA','MOISES','M.ISABEL','GUILHERME','LANDER','FILIPE','BETY'] },
  { day: 2, time: '11:10', teachers: ['KARINE','CELIA','JANETE','KELE','LENE','SANDRA','ANA MARIA','ANA INGLES','ROBERTA','ELAINE','J.B','ANA FLAVIA','LARISSA','DANIELLE','MOISES','M.ISABEL','ANITA','IAMANDRO','FILIPE','ANDRE','BETY','GUILHERME'] },
  { day: 2, time: '12:00', teachers: ['-','-','-','-','-','-','-','-','-','-','ROBERTA','J.B','IAMANDRO','LARISSA','ANDRE','ANA FLAVIA','ED. FISICA 1','ED. FISICA 1','M.ISABEL','BETY','GUILHERME','FILIPE'] },
  { day: 2, time: '14:20', teachers: ['-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','BETY','GUILHERME','MARCONDES','HANS'] },
  { day: 2, time: '15:10', teachers: ['-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','HANS','MARCONDES','BETY','GUILHERME'] },
  { day: 2, time: '16:20', teachers: ['-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','LARISSA','ANDRE','HANS','ROBERTA'] },
  { day: 2, time: '17:10', teachers: ['-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','ROBERTA','HANS','ANDRE','LARISSA'] },

  // ═══════════ QUARTA-FEIRA ═══════════
  { day: 3, time: '07:30', teachers: ['KARINE','CELIA','MILENE','KELE','ED. FISICA 1','ED. FISICA 1','ROBERTA','ANA MARIA','LUDIMILA','ELAINE','DANIELLE','J.B','THYAGO','SAMARA','ANA FLAVIA','LARISSA','M.ISABEL','MOISES','DANIELE','LAURA','JESSICA','ANDRE'] },
  { day: 3, time: '08:20', teachers: ['MILENE','CELIA','JANETE','KELE','LENE','SANDRA','ELAINE','ANA INGLES','ROBERTA','ANA MARIA','LUDIMILA','SAMARA','DANIELLE','J.B','DANIELE','ANDRE','LARISSA','THYAGO','M.ISABEL','ANA FLAVIA','LAURA','MOISES'] },
  { day: 3, time: '09:10', teachers: ['KARINE','CELIA','JANETE','MILENE','LENE','SANDRA','ANA INGLES','ANA MARIA','ELAINE','LUDIMILA','DANIELLE','ANA FLAVIA','SAMARA','LARISSA','J.B','THYAGO','LAURA','ROBERTA','ANDRE','MOISES','DANIELE','M.ISABEL'] },
  { day: 3, time: '10:30', teachers: ['KARINE','MILENE','JANETE','KELE','LENE','ANA INGLES','ROBERTA','ELAINE','ANA MARIA','ANA FLAVIA','J.B','LUDIMILA','DANIELLE','DANIELE','THYAGO','SAMARA','IAMANDRO','LARISSA','LAURA','M.ISABEL','MOISES','ANDRE'] },
  { day: 3, time: '11:10', teachers: ['KARINE','CELIA','JANETE','KELE','ANA INGLES','SANDRA','ANA MARIA','ANA FLAVIA','ELAINE','ROBERTA','ED. FISICA 1','ED. FISICA 1','J.B','DANIELLE','LARISSA','ANDRE','THYAGO','IAMANDRO','MOISES','DANIELE','M.ISABEL','LAURA'] },
  { day: 3, time: '12:00', teachers: ['-','-','-','-','-','-','-','-','-','-','IAMANDRO','THYAGO','LARISSA','ANDRE','M.ISABEL','J.B','ROBERTA','LAURA','ED. FISICA 1','ED. FISICA 1','ANA FLAVIA','DANIELE'] },

  // ═══════════ QUINTA-FEIRA ═══════════
  { day: 4, time: '07:30', teachers: ['ED. FISICA 1','ED. FISICA 1','JANETE','MILENE','CLAUDIA','SANDRA','ANA MARIA','ELAINE','ANA FLAVIA','ROBERTA','LUDIMILA','J.B','MOISES','IAMANDRO','SAMARA','M.ISABEL','DANIELE','LARISSA','FERREIRA','GABRIELA','DIGAO','NORTHON'] },
  { day: 4, time: '08:20', teachers: ['MILENE','CLAUDIA','JANETE','KELE','ANA INGLES','SANDRA','ANA FLAVIA','ANA MARIA','ROBERTA','ELAINE','SAMARA','LUDIMILA','J.B','LARISSA','MOISES','IAMANDRO','M.ISABEL','DANIELE','DIGAO','FERREIRA','NORTHON','GABRIELA'] },
  { day: 4, time: '09:10', teachers: ['CLAUDIA','MILENE','JANETE','KELE','LENE','SANDRA','ANA INGLES','ROBERTA','LUDIMILA','ANA MARIA','J.B','DANIELLE','SAMARA','MOISES','M.ISABEL','LARISSA','IAMANDRO','ANA FLAVIA','NORTHON','DIGAO','GABRIELA','FERREIRA'] },
  { day: 4, time: '10:30', teachers: ['KARINE','CELIA','MILENE','CLAUDIA','LENE','ANA INGLES','ANA FLAVIA','ANA MARIA','ROBERTA','LUDIMILA','DANIELLE','IAMANDRO','LARISSA','SAMARA','J.B','MOISES','M.ISABEL','ANITA','GABRIELA','NORTHON','FERREIRA','DIGAO'] },
  { day: 4, time: '11:10', teachers: ['KARINE','CELIA','JANETE','KELE','LENE','SANDRA','ELAINE','ANA INGLES','CLAUDIA','ANA MARIA','ROBERTA','ANA FLAVIA','DANIELLE','ANITA','M.ISABEL','J.B','LARISSA','MOISES','DIGAO','FERREIRA','NORTHON','MARCONDES'] },
  { day: 4, time: '12:00', teachers: ['-','-','-','-','-','-','-','-','-','-','ANITA','ROBERTA','ANA FLAVIA','J.B','LARISSA','DANIELLE','MOISES','M.ISABEL','MARCONDES','NORTHON','DIGAO','FERREIRA'] },
  { day: 4, time: '14:20', teachers: ['-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','FERREIRA','DIGAO','HANS','NORTHON'] },
  { day: 4, time: '15:10', teachers: ['-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','NORTHON','HANS','FERREIRA','DIGAO'] },
  { day: 4, time: '16:20', teachers: ['-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','ANA FLAVIA','ROBERTA','LARISSA','HANS'] },
  { day: 4, time: '17:10', teachers: ['-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','HANS','LARISSA','ROBERTA','ANA FLAVIA'] },

  // ═══════════ SEXTA-FEIRA ═══════════
  { day: 5, time: '07:30', teachers: ['KARINE','MILENE','ED. FISICA 1','ED. FISICA 1','LENE','SANDRA','CLAUDIA','ANA MARIA','ELAINE','ANA FLAVIA','LUDIMILA','DANIELLE','IAMANDRO','LARISSA','ANDRE','THYAGO','ROBERTA','M.ISABEL','JESSICA','LANDER','WEIGUI','IGOR'] },
  { day: 5, time: '08:20', teachers: ['KARINE','CELIA','CLAUDIA','MILENE','LENE','SANDRA','ANA INGLES','ELAINE','ANA MARIA','LUDIMILA','IAMANDRO','ANA FLAVIA','DANIELLE','THYAGO','LARISSA','M.ISABEL','ANDRE','ROBERTA','IGOR','JESSICA','LANDER','WEIGUI'] },
  { day: 5, time: '09:10', teachers: ['KARINE','CELIA','MILENE','KELE','ANA INGLES','SANDRA','ANA MARIA','ROBERTA','ELAINE','CLAUDIA','THYAGO','LUDIMILA','ANDRE','DANIELLE','M.ISABEL','LARISSA','ANA FLAVIA','IAMANDRO','GABRIELA','WEIGUI','JESSICA','LANDER'] },
  { day: 5, time: '10:30', teachers: ['MILENE','CELIA','JANETE','KELE','LENE','CLAUDIA','ELAINE','ANA INGLES','LUDIMILA','ANA MARIA','DANIELLE','ROBERTA','LARISSA','ANA FLAVIA','IAMANDRO','M.ISABEL','THYAGO','ANDRE','LANDER','JESSICA','IGOR','GABRIELA'] },
  { day: 5, time: '11:10', teachers: ['KARINE','CELIA','JANETE','KELE','LENE','SANDRA','ROBERTA','CLAUDIA','ANA MARIA','ELAINE','ANA FLAVIA','THYAGO','DANIELLE','ANDRE','ED. FISICA 1','ED. FISICA 1','IAMANDRO','LARISSA','WEIGUI','IGOR','GABRIELA','M.ISABEL'] },
  { day: 5, time: '12:00', teachers: ['-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','LARISSA','THYAGO','ED. FISICA 1','ED. FISICA 1','ANA FLAVIA','ANDRE'] },
];

// ─────────────────────────────────────────────
// ESCOLA
// ─────────────────────────────────────────────
const SCHOOL = {
  id: 'school-visao',
  name: 'Colégio Visão',
  type: 'private',
  plan: 'pro',
};

// ─────────────────────────────────────────────
// FUNÇÃO PRINCIPAL DE SEED
// ─────────────────────────────────────────────
export async function seedRealSchool(db: Database): Promise<{
  teachersCreated: number;
  classesCreated: number;
  roomsCreated: number;
  schedulesCreated: number;
  credentials: Array<{ name: string; login: string; password: string; role: string }>;
}> {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  🦅 ÁQUILA PRO — SEED PILOTO ESCOLA REAL         ║');
  console.log('║  Horário 04 de Maio — Grade Completa              ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  const credentials: Array<{ name: string; login: string; password: string; role: string }> = [];
  let teachersCreated = 0;
  let classesCreated = 0;
  let roomsCreated = 0;
  let schedulesCreated = 0;

  // Limpa registros antigos do DF (Distrito Federal) para garantir remoção completa
  await db.run("DELETE FROM students WHERE classId LIKE 'DF-%'");
  await db.run("DELETE FROM classes WHERE id LIKE 'DF-%'");
  await db.run("DELETE FROM rooms WHERE id LIKE 'room-DF-%'");

  // ── 1. ESCOLA ──
  const existingSchool = await db.get('SELECT id FROM schools WHERE id = ?', [SCHOOL.id]);
  if (!existingSchool) {
    await db.run(
      'INSERT INTO schools (id, name, type, plan) VALUES (?, ?, ?, ?)',
      [SCHOOL.id, SCHOOL.name, SCHOOL.type, SCHOOL.plan]
    );
    console.log(`✅ Escola criada: ${SCHOOL.name}`);
  }

  // ── 1.5 DISCIPLINAS (subjects) & LIMPEZA DE VÍNCULOS ──
  console.log('\n📚 Criando disciplinas (subjects)...');
  await db.run('DELETE FROM subjects');
  await db.run('DELETE FROM teacher_classes');
  
  const uniqueSubjects = new Set(TEACHERS.map(t => t.subject));
  for (const sub of uniqueSubjects) {
    await db.run(
      'INSERT OR IGNORE INTO subjects (id, name) VALUES (?, ?)',
      [sub, sub]
    );
  }

  // ── 2. PROFESSORES (como usuários com role = 'docente') ──
  console.log('\n📋 Criando professores...');
  const teacherIdMap: Record<string, string> = {};

  for (const t of TEACHERS) {
    const username = normalizeUsername(t.name);
    const userId = `teacher-${username.replace(/\./g, '-')}`;
    teacherIdMap[t.name] = userId;

    const existing = await db.get('SELECT id FROM users WHERE username = ?', [username]);
    if (!existing) {
      const passwordHash = hashPassword(username); // Senha = login
      await db.run(
        'INSERT INTO users (id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)',
        [userId, username, passwordHash, t.name, 'docente']
      );
      
      // Também insere na tabela staff para HR
      await db.run(
        'INSERT OR IGNORE INTO staff (id, name, role, status) VALUES (?, ?, ?, ?)',
        [userId, t.name, 'docente', 'active']
      );
      
      credentials.push({ name: t.name, login: username, password: username, role: 'docente' });
      teachersCreated++;
      console.log(`  ✅ ${t.name} → login: ${username} | senha: ${username}`);
    } else {
      teacherIdMap[t.name] = existing.id;
      console.log(`  ⏩ ${t.name} já existe (${username})`);
    }
  }

  // ── 3. TURMAS ──
  console.log('\n🏫 Criando turmas...');
  for (const c of CLASSES) {
    const existing = await db.get('SELECT id FROM classes WHERE id = ?', [c.id]);
    if (!existing) {
      await db.run(
        'INSERT INTO classes (id, schoolId, name, grade) VALUES (?, ?, ?, ?)',
        [c.id, SCHOOL.id, c.name, c.grade]
      );
      classesCreated++;
      console.log(`  ✅ ${c.name} (${c.grade})`);
    } else {
      console.log(`  ⏩ ${c.name} já existe`);
    }
  }

  // Adiciona turmas extras extraídas dos alunos (Filtrados para remover DF)
  const visaoStudents = STUDENTS.filter(s => !s.classId.startsWith('DF-'));
  const studentClasses = new Set<string>();
  for (const student of visaoStudents) {
    studentClasses.add(student.classId);
  }

  for (const classId of studentClasses) {
    const existing = await db.get('SELECT id FROM classes WHERE id = ?', [classId]);
    if (!existing) {
      const match = classId.match(/EF1(\d)/);
      let grade = 'Fundamental';
      if (match) {
        if (match[1] === '3') grade = '3º Ano';
        else if (match[1] === '4') grade = '4º Ano';
        else if (match[1] === '5') grade = '5º Ano';
      }
      await db.run(
        'INSERT INTO classes (id, schoolId, name, grade) VALUES (?, ?, ?, ?)',
        [classId, SCHOOL.id, classId, grade]
      );
      classesCreated++;
      console.log(`  ✅ Turma dos Alunos: ${classId} (${grade})`);
    }
  }

  // ── 4. SALAS (1 sala por turma para simplificar) ──
  console.log('\n🚪 Criando salas...');
  const ALL_CLASSES_IDS = [...CLASSES.map(c => c.id), ...studentClasses];
  for (const cid of ALL_CLASSES_IDS) {
    const roomId = `room-${cid}`;
    const roomName = `Sala ${cid}`;
    const existing = await db.get('SELECT id FROM rooms WHERE id = ?', [roomId]);
    if (!existing) {
      await db.run(
        'INSERT INTO rooms (id, schoolId, name, capacity, status) VALUES (?, ?, ?, ?, ?)',
        [roomId, SCHOOL.id, roomName, 35, 'active']
      );
      roomsCreated++;
    }
  }
  console.log(`  ✅ ${roomsCreated} salas criadas`);

  // ── 5. GRADE HORÁRIA ──
  console.log('\n📅 Inserindo grade horária...');
  
  // Limpa horários antigos do piloto para evitar duplicatas
  await db.run("DELETE FROM schedules WHERE id LIKE 'pilot-%'");
  
  for (const slot of SCHEDULE_RAW) {
    const endTime = TIME_SLOTS[slot.time] || '00:00';
    
    for (let i = 0; i < slot.teachers.length; i++) {
      const teacherName = slot.teachers[i];
      if (teacherName === '-' || teacherName === 'ED. FISICA 1') continue;
      
      const className = CLASS_HEADERS[i];
      const classId = CLASS_NAME_TO_ID[className];
      const teacherId = teacherIdMap[teacherName] || `teacher-${normalizeUsername(teacherName)}`;
      const roomId = `room-${classId}`;
      const scheduleId = `pilot-${slot.day}-${slot.time.replace(':', '')}-${classId}`;

      // Usa o subject do professor ou o nome como fallback
      const teacher = TEACHERS.find(t => t.name === teacherName);
      const subject = teacher?.subject || teacherName;

      await db.run(
        `INSERT OR REPLACE INTO schedules (id, classId, roomId, teacherId, subject, teacher, dayOfWeek, startTime, endTime)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [scheduleId, classId, roomId, teacherId, subject, teacherName, slot.day, slot.time, endTime]
      );
      schedulesCreated++;

      // Vincular o professor a essa turma no teacher_classes
      const linkId = `tc-${teacherId}-${classId}-${subject}`;
      await db.run(
        'INSERT OR IGNORE INTO teacher_classes (id, teacherId, classId, subjectId) VALUES (?, ?, ?, ?)',
        [linkId, teacherId, classId, subject]
      );
    }
  }
  console.log(`  ✅ ${schedulesCreated} registros de horário inseridos`);

  // ── 5.5 USUÁRIOS ADMINISTRATIVOS PERSONALIZADOS ──
  console.log('\n🔐 Criando usuários de gestão...');
  const customUsers = [
    { id: 'user-tarley', username: 'tarley', name: 'Tarley', role: 'director' },
    { id: 'user-fabiana', username: 'fabiana', name: 'Fabiana', role: 'coordinator' },
    { id: 'user-mara', username: 'mara', name: 'Mara', role: 'coordinator' },
    { id: 'user-pedro', username: 'pedro', name: 'Pedro', role: 'secretary' }
  ];

  for (const u of customUsers) {
    const existing = await db.get('SELECT id FROM users WHERE username = ?', [u.username]);
    if (!existing) {
      const passwordHash = hashPassword(u.username);
      await db.run(
        'INSERT INTO users (id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)',
        [u.id, u.username, passwordHash, u.name, u.role]
      );
      await db.run(
        'INSERT OR IGNORE INTO staff (id, name, role, status) VALUES (?, ?, ?, ?)',
        [u.id, u.name, u.role, 'active']
      );
      credentials.push({ name: u.name, login: u.username, password: u.username, role: u.role });
      console.log(`  ✅ Gestor criado: ${u.name} → login: ${u.username} | senha: ${u.username} (${u.role})`);
    }
  }

  // ── 6. ADMIN PADRÃO (caso não exista) ──
  const adminExists = await db.get("SELECT id FROM users WHERE username = 'admin'");
  if (!adminExists) {
    const adminHash = hashPassword('Admin@2026!');
    await db.run(
      'INSERT INTO users (id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)',
      ['user-admin', 'admin', adminHash, 'Administrador Áquila', 'admin']
    );
    credentials.push({ name: 'Administrador', login: 'admin', password: 'Admin@2026!', role: 'admin' });
    console.log('\n🔐 Admin criado: admin / Admin@2026!');
  }

  // ── 7. ALUNOS ──
  console.log('\n👥 Criando alunos...');
  let studentsCreated = 0;
  await db.run("DELETE FROM students WHERE id LIKE 'stud-%'");
  
  // Agrupar alunos por turma para embaralhamento de posições
  const studentsByClass: Record<string, typeof visaoStudents> = {};
  for (const s of visaoStudents) {
    if (!studentsByClass[s.classId]) {
      studentsByClass[s.classId] = [];
    }
    studentsByClass[s.classId].push(s);
  }

  for (const classId of Object.keys(studentsByClass)) {
    const classStudents = studentsByClass[classId];
    
    // Gerar as 48 posições possíveis de assento (6 linhas x 8 colunas)
    const positions: Array<{ row: number; col: number }> = [];
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 8; c++) {
        positions.push({ row: r, col: c });
      }
    }
    
    // Embaralhar posições usando Fisher-Yates
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = positions[i];
      positions[i] = positions[j];
      positions[j] = temp;
    }
    
    // Inserir alunos com posições embaralhadas exclusivas
    for (let i = 0; i < classStudents.length; i++) {
      const s = classStudents[i];
      const studentId = `stud-${s.registrationNumber}`;
      
      let row = 0;
      let col = 0;
      if (i < positions.length) {
        row = positions[i].row;
        col = positions[i].col;
      } else {
        row = Math.floor(i / 8);
        col = i % 8;
      }

      await db.run(
        `INSERT OR REPLACE INTO students (id, classId, name, registrationNumber, status, row, col, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [studentId, classId, s.name, s.registrationNumber, 'active', row, col, JSON.stringify({ cpf: s.cpf })]
      );
      studentsCreated++;
    }
  }
  console.log(`  ✅ ${studentsCreated} alunos inseridos com sucesso`);

  // ── 7. SEED DO CALENDÁRIO UNIFICADO ──
  console.log('\n📅 Inserindo dados de teste no calendário unificado...');
  await db.run('DELETE FROM unified_calendar');

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const nextWeekStr = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  const nextMonthStr = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  const calendarSeeds = [
    {
      id: 'seed-evt-anual-1',
      title: 'Início do Ano Letivo',
      description: 'Boas-vindas a todos os alunos e professores no ecossistema Áquila.',
      date: '2026-02-02',
      type: 'anual',
      classId: null,
      subject: null,
      teacherId: null
    },
    {
      id: 'seed-evt-bimestral-1',
      title: 'Avaliações do Período Letivo',
      description: 'Período oficial de provas bimestrais. Preparem seus resumos!',
      date: todayStr,
      type: 'bimestral',
      classId: null,
      subject: null,
      teacherId: null
    },
    {
      id: 'seed-evt-esportes-1',
      title: 'Campeonato Interclasses de Futebol',
      description: 'Quadra Poliesportiva da escola. Lembrem-se do espírito esportivo.',
      date: nextWeekStr,
      type: 'esportes',
      classId: null,
      subject: null,
      teacherId: null
    },
    {
      id: 'seed-evt-eventos-1',
      title: 'Feira de Ciências Áquila Pro',
      description: 'Apresentação pública dos protótipos de robótica e modelos de IA locais.',
      date: nextMonthStr,
      type: 'eventos',
      classId: null,
      subject: null,
      teacherId: null
    },
    {
      id: 'seed-evt-geral-1',
      title: 'Reunião Geral de Pais e Mestres',
      description: 'Feedback de desempenho e diretrizes do conselho de classe.',
      date: tomorrowStr,
      type: 'geral',
      classId: null,
      subject: null,
      teacherId: null
    },
    {
      id: 'seed-evt-tarefa-1',
      title: 'Matemática: Equações do 2º Grau',
      description: 'Resolver os exercícios de 1 a 10 da página 45 da apostila de matemática.',
      date: todayStr,
      type: 'tarefa',
      classId: 'class-1a',
      subject: 'Matemática',
      teacherId: 'teacher-docente1'
    },
    {
      id: 'seed-evt-tarefa-2',
      title: 'História: Resumo - Brasil Império',
      description: 'Escrever texto dissertativo de até 30 linhas sobre a Proclamação da República.',
      date: tomorrowStr,
      type: 'tarefa',
      classId: 'class-1a',
      subject: 'História',
      teacherId: 'teacher-docente2'
    },
    {
      id: 'seed-evt-tarefa-3',
      title: 'Física: Leis de Newton',
      description: 'Escrever no caderno 3 exemplos práticos de aplicação da Primeira e Terceira Lei de Newton.',
      date: tomorrowStr,
      type: 'tarefa',
      classId: 'class-2a',
      subject: 'Física',
      teacherId: 'teacher-docente1'
    }
  ];

  let calendarCreated = 0;
  for (const evt of calendarSeeds) {
    await db.run(
      `INSERT OR REPLACE INTO unified_calendar (id, title, description, date, type, classId, subject, teacherId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [evt.id, evt.title, evt.description, evt.date, evt.type, evt.classId, evt.subject, evt.teacherId]
    );
    calendarCreated++;
  }
  console.log(`  ✅ ${calendarCreated} eventos e tarefas inseridos no calendário unificado`);



  // ── RESUMO ──
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log(`║  ✅ Professores criados: ${teachersCreated.toString().padStart(3)}`);
  console.log(`║  ✅ Turmas criadas:      ${classesCreated.toString().padStart(3)}`);
  console.log(`║  ✅ Salas criadas:       ${roomsCreated.toString().padStart(3)}`);
  console.log(`║  ✅ Horários inseridos:  ${schedulesCreated.toString().padStart(3)}`);
  console.log(`║  ✅ Alunos criados:      ${studentsCreated.toString().padStart(3)}`);
  console.log(`║  ✅ Eventos criados:     ${calendarCreated.toString().padStart(3)}`);
  console.log('╚══════════════════════════════════════════════════╝\n');

  return { teachersCreated, classesCreated, roomsCreated, schedulesCreated, credentials };
}
