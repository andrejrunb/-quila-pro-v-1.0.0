export type StudentAcademicStage =
  | 'EDUCACAO_INFANTIL'
  | 'ENSINO_FUNDAMENTAL_ANOS_INICIAIS'
  | 'ENSINO_FUNDAMENTAL_ANOS_FINAIS'
  | 'ENSINO_MEDIO'
  | 'NAO_IDENTIFICADO';

export interface StudentAiPolicyInput {
  grade?: number | null;
  className?: string | null;
  dateOfBirth?: string | null;
  referenceDate?: Date;
}

export interface StudentAiPolicyResult {
  blocked: boolean;
  stage: StudentAcademicStage;
  ageYears: number | null;
  reason: string | null;
}

const EARLY_CHILDHOOD_RE = /(creche|pr[eé][- ]?escola|infantil|maternal|ber[cç][aá]rio|jardim)/i;
const EARLY_EF_ANO_RE = /\b[1-5][º°]?\s*ano\b/i;
const HIGH_SCHOOL_OR_LATE_RE = /(ensino\s*m[eé]dio|\bm[eé]dio\b|s[eé]rie|\b[6-9][º°])/i;
const HIGH_SCHOOL_EXPLICIT_RE = /(ensino\s*m[eé]dio|\bm[eé]dio\b|\b[1-3][ªaº°]?\s*s[eé]rie\b)/i;
const LATE_EF_ANO_RE = /\b[6-9][º°]?\s*ano\b/i;

function calculateAgeYears(dateOfBirth?: string | null, referenceDate = new Date()): number | null {
  if (!dateOfBirth) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOfBirth.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  let age = referenceDate.getUTCFullYear() - year;
  const monthDiff = referenceDate.getUTCMonth() + 1 - month;
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getUTCDate() < day)) {
    age -= 1;
  }
  return age >= 0 && age <= 120 ? age : null;
}

function buildBlockReason(stage: StudentAcademicStage, ageYears: number | null): string {
  if (stage === 'NAO_IDENTIFICADO') {
    return 'Parecer CNE/CP nº 15/2026 (fail-closed): etapa escolar ou faixa etária não identificada; acesso autônomo à IA generativa bloqueado até vinculação à turma compatível.';
  }
  if (ageYears !== null && ageYears < 11) {
    return `Parecer CNE/CP nº 15/2026: acesso autônomo ao Tutor IA e Laboratório de Redação bloqueado para estudantes menores de 11 anos (${ageYears} anos) ou matriculados na Educação Infantil / 1º–5º ano EF.`;
  }
  return 'Parecer CNE/CP nº 15/2026: acesso autônomo de estudantes à IA generativa é proibido na Educação Infantil e nos Anos Iniciais (1º ao 5º ano EF); utilize apenas atividades conduzidas pelo docente.';
}

/**
 * Avalia no servidor se o estudante está sujeito ao bloqueio etário/etapa do Parecer CNE/CP nº 15/2026
 * para uso autônomo de IA generativa (Tutor IA / Laboratório de Redação). Opera em modo fail-closed.
 */
export function evaluateStudentStageAiPolicy(input: StudentAiPolicyInput): StudentAiPolicyResult {
  const ageYears = calculateAgeYears(input.dateOfBirth, input.referenceDate);
  const cleanClass = (input.className ?? '').trim();

  if (cleanClass && EARLY_CHILDHOOD_RE.test(cleanClass)) {
    return {
      blocked: true,
      stage: 'EDUCACAO_INFANTIL',
      ageYears,
      reason: buildBlockReason('EDUCACAO_INFANTIL', ageYears),
    };
  }

  let stage: StudentAcademicStage = 'NAO_IDENTIFICADO';
  let stageBlocked = true;

  if (typeof input.grade === 'number' && Number.isFinite(input.grade)) {
    if (input.grade <= 0) {
      stage = 'EDUCACAO_INFANTIL';
      stageBlocked = true;
    } else if (input.grade <= 5) {
      stage = 'ENSINO_FUNDAMENTAL_ANOS_INICIAIS';
      stageBlocked = true;
    } else if (input.grade <= 9) {
      stage = 'ENSINO_FUNDAMENTAL_ANOS_FINAIS';
      stageBlocked = false;
    } else {
      stage = 'ENSINO_MEDIO';
      stageBlocked = false;
    }
  } else if (cleanClass) {
    if (EARLY_EF_ANO_RE.test(cleanClass) && !HIGH_SCHOOL_OR_LATE_RE.test(cleanClass)) {
      stage = 'ENSINO_FUNDAMENTAL_ANOS_INICIAIS';
      stageBlocked = true;
    } else if (HIGH_SCHOOL_EXPLICIT_RE.test(cleanClass)) {
      stage = 'ENSINO_MEDIO';
      stageBlocked = false;
    } else if (LATE_EF_ANO_RE.test(cleanClass)) {
      stage = 'ENSINO_FUNDAMENTAL_ANOS_FINAIS';
      stageBlocked = false;
    } else if (ageYears !== null && ageYears < 11) {
      stage = ageYears < 6 ? 'EDUCACAO_INFANTIL' : 'ENSINO_FUNDAMENTAL_ANOS_INICIAIS';
      stageBlocked = true;
    }
  } else if (ageYears !== null && ageYears < 11) {
    stage = ageYears < 6 ? 'EDUCACAO_INFANTIL' : 'ENSINO_FUNDAMENTAL_ANOS_INICIAIS';
    stageBlocked = true;
  }

  const ageBlocked = ageYears !== null && ageYears < 11;
  const blocked = stageBlocked || ageBlocked;

  return {
    blocked,
    stage,
    ageYears,
    reason: blocked ? buildBlockReason(stage, ageYears) : null,
  };
}
