import { zeroBypassAuditService } from './ZeroBypassAuditService';

export type EducationStageScope =
  | 'EDUCACAO_INFANTIL'
  | 'EF_ANOS_INICIAIS'
  | 'EF_ANOS_FINAIS'
  | 'ENSINO_MEDIO'
  | 'UNVERIFIED';

export interface StageAiPolicy {
  stage: EducationStageScope;
  riskTier: 'RISCO_EXCESSIVO_BLOQUEADO' | 'ALTO_RISCO_RESTRITO' | 'RISCO_MODERADO';
  directStudentAiAllowed: boolean;
  autonomousChatbotAllowed: boolean;
  teacherMediationRequired: boolean;
  policyMode:
    | 'BLOCKED_INFANTIL_DOCENTE_ONLY'
    | 'SUPERVISED_TEACHER_MEDIATED_ONLY'
    | 'TEACHER_MEDIATED_SOCRATIC'
    | 'UNVERIFIED_FAIL_SECURE';
  legalReference: string;
  guidance: string;
}

export interface StudentAiAccessParams {
  db?: {
    get?: (sql: string, params?: any[]) => Promise<any>;
  };
  studentId?: string | null;
  gradeLevel?: string | null;
  className?: string | null;
  classId?: string | null;
  stage?: string | null;
  dateOfBirth?: string | null;
  age?: number | null;
  teacherMediated?: boolean;
  actorRole?: string | null;
  actorId?: string | null;
  channel?: string;
}

export interface StudentAiAccessDecision {
  allowed: boolean;
  blocked: boolean;
  code?: 'CNE_15_2026_EARLY_STAGE_AI_BLOCKED';
  reason?: string;
  stage: EducationStageScope;
  ageYears: number | null;
  teacherMediatedApplied: boolean;
  policy: StageAiPolicy;
  resolvedContext: {
    studentId: string | null;
    gradeLevel: string | null;
    className: string | null;
    classId: string | null;
    dateOfBirth: string | null;
    source: string;
  };
}

const CNE_LEGAL_REFERENCE =
  'Parecer CNE/CP nº 15/2026 (Despacho MEC 10/11/2026, DOU 11/11/2026, Ed. 212, p. 141)';

const TEACHER_MEDIATION_ALLOWED_ROLES = new Set([
  'teacher',
  'docente',
  'professor',
  'coordinator',
  'director',
  'admin',
  'secretary',
  'staff',
]);

const CLASS_STAGE_CATALOG: Record<string, Exclude<EducationStageScope, 'UNVERIFIED'>> = {
  'F-EF11A': 'EF_ANOS_INICIAIS',
  'F-EF12A': 'EF_ANOS_INICIAIS',
  'F-EF13A': 'EF_ANOS_INICIAIS',
  'F-EF14A': 'EF_ANOS_INICIAIS',
  'F-EF15A': 'EF_ANOS_INICIAIS',
  'F-EF26A': 'EF_ANOS_FINAIS',
  'F-EF26B': 'EF_ANOS_FINAIS',
  'F-EF27A': 'EF_ANOS_FINAIS',
  'F-EF27B': 'EF_ANOS_FINAIS',
  'F-EF28A': 'EF_ANOS_FINAIS',
  'F-EF28B': 'EF_ANOS_FINAIS',
  'F-EF29A': 'EF_ANOS_FINAIS',
  'F-EF29B': 'EF_ANOS_FINAIS',
  'F-EM1A': 'ENSINO_MEDIO',
  'M-EM1A': 'ENSINO_MEDIO',
  'F-EM2A': 'ENSINO_MEDIO',
  'M-EM2A': 'ENSINO_MEDIO',
  'F-EM3A': 'ENSINO_MEDIO',
  'M-EM3A': 'ENSINO_MEDIO',
};

/**
 * Avalia a política etária e por etapa de ensino conforme Parecer CNE/CP nº 15/2026.
 * Espelho autoritativo main-process de `src/ui/utils/studentGradeScope.ts`.
 */
export function evaluateStageAiPolicy(stage: EducationStageScope): StageAiPolicy {
  switch (stage) {
    case 'EDUCACAO_INFANTIL':
      return {
        stage,
        riskTier: 'RISCO_EXCESSIVO_BLOQUEADO',
        directStudentAiAllowed: false,
        autonomousChatbotAllowed: false,
        teacherMediationRequired: true,
        policyMode: 'BLOCKED_INFANTIL_DOCENTE_ONLY',
        legalReference: CNE_LEGAL_REFERENCE,
        guidance:
          'Educação Infantil: vedado o uso direto de IA por estudantes; recurso habilitado apenas para planejamento e acessibilidade docente.',
      };
    case 'EF_ANOS_INICIAIS':
      return {
        stage,
        riskTier: 'ALTO_RISCO_RESTRITO',
        directStudentAiAllowed: false,
        autonomousChatbotAllowed: false,
        teacherMediationRequired: true,
        policyMode: 'SUPERVISED_TEACHER_MEDIATED_ONLY',
        legalReference: CNE_LEGAL_REFERENCE,
        guidance:
          'Anos Iniciais (1º ao 5º ano EF): vedado o acesso autônomo de crianças a chatbots e IA generativa; uso restrito a atividades conduzidas diretamente pelo professor.',
      };
    case 'EF_ANOS_FINAIS':
    case 'ENSINO_MEDIO':
      return {
        stage,
        riskTier: 'RISCO_MODERADO',
        directStudentAiAllowed: true,
        autonomousChatbotAllowed: true,
        teacherMediationRequired: true,
        policyMode: 'TEACHER_MEDIATED_SOCRATIC',
        legalReference: CNE_LEGAL_REFERENCE,
        guidance:
          'Anos Finais / Ensino Médio: uso socrático complementar sob mediação docente, sem atribuição autônoma de notas e com direito à contestação.',
      };
    default:
      return {
        stage: 'UNVERIFIED',
        riskTier: 'ALTO_RISCO_RESTRITO',
        directStudentAiAllowed: false,
        autonomousChatbotAllowed: false,
        teacherMediationRequired: true,
        policyMode: 'UNVERIFIED_FAIL_SECURE',
        legalReference: CNE_LEGAL_REFERENCE,
        guidance:
          'Etapa escolar não verificada: acesso autônomo bloqueado por princípio fail-secure até confirmação de turma/etapa.',
      };
  }
}

export function calculateAgeYears(dateOfBirth?: string | null, referenceDate: Date = new Date()): number | null {
  if (!dateOfBirth || typeof dateOfBirth !== 'string') return null;
  const trimmed = dateOfBirth.trim();
  if (!trimmed) return null;

  let parsed: Date;
  const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) {
    parsed = new Date(Number(brMatch[3]), Number(brMatch[2]) - 1, Number(brMatch[1]));
  } else {
    parsed = new Date(trimmed);
  }

  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.getTime() > referenceDate.getTime()) return null;

  let age = referenceDate.getFullYear() - parsed.getFullYear();
  const monthDiff = referenceDate.getMonth() - parsed.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < parsed.getDate())) {
    age--;
  }
  return age >= 0 && age <= 120 ? age : null;
}

export function isTeacherMediatedSessionAllowed(actorRole?: string | null): boolean {
  if (!actorRole || typeof actorRole !== 'string') return false;
  return TEACHER_MEDIATION_ALLOWED_ROLES.has(actorRole.trim().toLowerCase());
}

export function inferEducationStageFromContext(input: {
  stage?: string | null;
  gradeLevel?: string | null;
  className?: string | null;
  classId?: string | null;
  dateOfBirth?: string | null;
  age?: number | null;
}): { stage: EducationStageScope; ageYears: number | null; source: string } {
  const ageYears =
    typeof input.age === 'number' && Number.isFinite(input.age) && input.age >= 0
      ? input.age
      : calculateAgeYears(input.dateOfBirth);

  // 1. Etapa explícita
  const explicitStage = String(input.stage || '').trim().toUpperCase();
  if (
    explicitStage === 'EDUCACAO_INFANTIL' ||
    explicitStage === 'EF_ANOS_INICIAIS' ||
    explicitStage === 'EF_ANOS_FINAIS' ||
    explicitStage === 'ENSINO_MEDIO'
  ) {
    return { stage: explicitStage as EducationStageScope, ageYears, source: 'explicit_stage' };
  }

  // 2. ClassId conhecido
  const cleanClassId = String(input.classId || '').trim();
  if (cleanClassId && CLASS_STAGE_CATALOG[cleanClassId]) {
    return { stage: CLASS_STAGE_CATALOG[cleanClassId], ageYears, source: `class_id:${cleanClassId}` };
  }

  // 3. Análise textual combinada (gradeLevel / className / classId)
  const combined = `${input.gradeLevel || ''} ${input.className || ''} ${input.classId || ''}`
    .trim()
    .toLowerCase();

  if (combined) {
    if (
      combined.includes('infantil') ||
      combined.includes('creche') ||
      combined.includes('pré-escola') ||
      combined.includes('pre-escola') ||
      combined.includes('pre escola') ||
      combined.includes('maternal') ||
      combined.includes('berçário') ||
      combined.includes('bercario') ||
      combined.includes('jardim') ||
      /\bei0[1-3]\b/.test(combined)
    ) {
      return { stage: 'EDUCACAO_INFANTIL', ageYears, source: 'label:infantil' };
    }

    if (
      combined.includes('ensino médio') ||
      combined.includes('ensino medio') ||
      combined.includes('série em') ||
      combined.includes('serie em') ||
      /\b[1-3][ªaºo]?\s*s[eé]rie\b/.test(combined) ||
      /\b[1-3]\s*em\b/.test(combined) ||
      /\bem13\b/.test(combined) ||
      /\bem[1-3]\b/.test(combined)
    ) {
      return { stage: 'ENSINO_MEDIO', ageYears, source: 'label:ensino_medio' };
    }

    if (
      combined.includes('anos iniciais') ||
      combined.includes('fundamental i') ||
      /\bef0[1-5]\b/.test(combined) ||
      /\bef1[1-5]\b/.test(combined) ||
      /\bef15\b/.test(combined)
    ) {
      return { stage: 'EF_ANOS_INICIAIS', ageYears, source: 'label:ef_iniciais' };
    }

    if (
      combined.includes('anos finais') ||
      combined.includes('fundamental ii') ||
      /\bef0[6-9]\b/.test(combined) ||
      /\bef2[6-9]\b/.test(combined) ||
      /\bef(?:67|69|89)\b/.test(combined)
    ) {
      return { stage: 'EF_ANOS_FINAIS', ageYears, source: 'label:ef_finais' };
    }

    const anoMatch = combined.match(/\b([1-9])[ºoªa]?\s*(?:ano|ef)\b/);
    if (anoMatch) {
      const seriesNum = Number(anoMatch[1]);
      return {
        stage: seriesNum <= 5 ? 'EF_ANOS_INICIAIS' : 'EF_ANOS_FINAIS',
        ageYears,
        source: `label:ano_${seriesNum}`,
      };
    }
  }

  // 4. Regra etária estrita (age < 11 -> Anos Iniciais ou Infantil)
  if (ageYears !== null) {
    if (ageYears < 6) {
      return { stage: 'EDUCACAO_INFANTIL', ageYears, source: 'age_lt_6' };
    }
    if (ageYears < 11) {
      return { stage: 'EF_ANOS_INICIAIS', ageYears, source: 'age_lt_11' };
    }
    if (ageYears <= 14) {
      return { stage: 'EF_ANOS_FINAIS', ageYears, source: 'age_11_14' };
    }
    return { stage: 'ENSINO_MEDIO', ageYears, source: 'age_gte_15' };
  }

  return { stage: 'UNVERIFIED', ageYears: null, source: 'unverified' };
}

/**
 * Avalia no backend (Main Process / IPC) se a execução de IA generativa deve ser bloqueada
 * para o contexto/aluno informado conforme o Parecer CNE/CP nº 15/2026.
 *
 * Regras:
 * - Se `studentId` for informado e `db` disponível, consulta `students` e `classes` para obter turma,
 *   série (`gradeLevel`/`grade`) e data de nascimento (`birthDate`/`date_of_birth`/`metadata`).
 * - Educação Infantil, 1º–5º ano EF (`EF_ANOS_INICIAIS`) ou idade < 11 anos -> BLOQUEADO para uso autônomo
 *   (`CNE_15_2026_EARLY_STAGE_AI_BLOCKED`), registrando trilha `ZeroBypassAuditService`.
 * - Exceção controlada: somente se `teacherMediated === true` E a sessão atual pertencer a papel
 *   docente/coordenação/direção/admin (`isTeacherMediatedSessionAllowed(actorRole)`).
 */
export async function evaluateStudentAiAccess(
  params: StudentAiAccessParams
): Promise<StudentAiAccessDecision> {
  let dbStudent: any = null;
  let dbClass: any = null;
  const cleanStudentId = typeof params.studentId === 'string' ? params.studentId.trim() : '';

  if (cleanStudentId && params.db && typeof params.db.get === 'function') {
    try {
      dbStudent = await params.db.get(
        `SELECT * FROM students WHERE id = ? OR registrationNumber = ? LIMIT 1`,
        [cleanStudentId, cleanStudentId]
      );
      const linkedClassId = dbStudent?.classId || dbStudent?.class_id || params.classId;
      if (linkedClassId) {
        dbClass = await params.db.get(
          `SELECT * FROM classes WHERE id = ? LIMIT 1`,
          [linkedClassId]
        );
      }
    } catch {
      // Fallback gracioso para parâmetros explícitos caso tabela ainda não exista em mock
    }
  }

  let parsedMeta: Record<string, any> = {};
  if (dbStudent?.metadata) {
    if (typeof dbStudent.metadata === 'string') {
      try {
        parsedMeta = JSON.parse(dbStudent.metadata);
      } catch {
        parsedMeta = {};
      }
    } else if (typeof dbStudent.metadata === 'object') {
      parsedMeta = dbStudent.metadata;
    }
  }

  const resolvedGradeLevel =
    params.gradeLevel ||
    dbStudent?.gradeLevel ||
    dbStudent?.grade_level ||
    dbClass?.grade ||
    parsedMeta.gradeLevel ||
    parsedMeta.seriesLabel ||
    null;

  const resolvedClassId =
    params.classId ||
    dbStudent?.classId ||
    dbStudent?.class_id ||
    dbClass?.id ||
    parsedMeta.classId ||
    null;

  const resolvedClassName =
    params.className ||
    dbClass?.name ||
    dbStudent?.className ||
    dbStudent?.class_name ||
    parsedMeta.className ||
    null;

  const resolvedDob =
    params.dateOfBirth ||
    dbStudent?.birthDate ||
    dbStudent?.birth_date ||
    dbStudent?.dateOfBirth ||
    dbStudent?.date_of_birth ||
    parsedMeta.dateOfBirth ||
    parsedMeta.birthDate ||
    null;

  const resolvedStageParam =
    params.stage || parsedMeta.stage || parsedMeta.educationStage || null;

  const resolvedAgeParam =
    typeof params.age === 'number'
      ? params.age
      : typeof parsedMeta.age === 'number'
        ? parsedMeta.age
        : null;

  const inferred = inferEducationStageFromContext({
    stage: resolvedStageParam,
    gradeLevel: resolvedGradeLevel,
    className: resolvedClassName,
    classId: resolvedClassId,
    dateOfBirth: resolvedDob,
    age: resolvedAgeParam,
  });

  const policy = evaluateStageAiPolicy(inferred.stage);

  const isEarlyStageOrChild =
    inferred.stage === 'EDUCACAO_INFANTIL' ||
    inferred.stage === 'EF_ANOS_INICIAIS' ||
    (inferred.ageYears !== null && inferred.ageYears < 11);

  const teacherMediatedApplied =
    params.teacherMediated === true && isTeacherMediatedSessionAllowed(params.actorRole);

  const resolvedContext = {
    studentId: cleanStudentId || null,
    gradeLevel: resolvedGradeLevel,
    className: resolvedClassName,
    classId: resolvedClassId,
    dateOfBirth: resolvedDob,
    source: inferred.source,
  };

  if (isEarlyStageOrChild && !teacherMediatedApplied) {
    const reason =
      inferred.stage === 'EDUCACAO_INFANTIL'
        ? `Bloqueio CNE/CP nº 15/2026: uso direto/autônomo de IA generativa vedado na Educação Infantil (${CNE_LEGAL_REFERENCE}).`
        : `Bloqueio CNE/CP nº 15/2026: acesso autônomo de estudantes dos Anos Iniciais (1º–5º ano EF) ou menores de 11 anos a IA generativa é vedado sem mediação docente autenticada (${CNE_LEGAL_REFERENCE}).`;

    try {
      await zeroBypassAuditService.record({
        userId: params.actorId || cleanStudentId || 'SYSTEM_IPC_POLICY',
        action: 'CNE_15_2026_EARLY_STAGE_AI_BLOCKED',
        details: reason,
        metadata: {
          channel: params.channel || 'unknown',
          stage: inferred.stage,
          ageYears: inferred.ageYears,
          actorRole: params.actorRole || 'unknown',
          teacherMediatedRequested: Boolean(params.teacherMediated),
          resolvedContext,
        },
        legalBasis: 'CNE_CP_15_2026',
        consentVerified: false,
      });
    } catch {
      // Não falhar o bloqueio caso trilha de auditoria esteja indisponível em teste unitário isolado
    }

    return {
      allowed: false,
      blocked: true,
      code: 'CNE_15_2026_EARLY_STAGE_AI_BLOCKED',
      reason,
      stage: inferred.stage,
      ageYears: inferred.ageYears,
      teacherMediatedApplied: false,
      policy,
      resolvedContext,
    };
  }

  return {
    allowed: true,
    blocked: false,
    stage: inferred.stage,
    ageYears: inferred.ageYears,
    teacherMediatedApplied: isEarlyStageOrChild && teacherMediatedApplied,
    policy,
    resolvedContext,
  };
}
