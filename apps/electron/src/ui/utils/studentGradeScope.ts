/**
 * Áquila Pro — Escopo Estrito de Série/Turma do Estudante, Autorização & Datas Escolares
 *
 * Regras (Missão Consolidada Itens 2 e 3):
 * 1. Contexto ausente ou inválido NÃO produz fallback para 'ALL' nem libera catálogo.
 * 2. Prefixos BNCC amplos (EF15, EF67, EF69, EF89, EM13) isolados não bastam como prova de série exata
 *    quando a série diverge; itens sem metadados suficientes são rejeitados (false).
 * 3. Preserva exceção pedagógica rastreável: professor autorizado pode atribuir revisão de outra série
 *    (crossGradeAssignment) com identificação docente, motivo pedagógico e alvo explícito.
 * 4. Datas inválidas ou ausentes NUNCA são substituídas por 'Recente' (usam 'Data não informada').
 * 5. Referência temporal explícita da escola (America/Sao_Paulo) para evitar virada de dia incorreta em UTC.
 */

import { STUDENTS } from '../../database/studentsData';

export type EducationStageScope = 'EF_ANOS_INICIAIS' | 'EF_ANOS_FINAIS' | 'ENSINO_MEDIO' | 'UNVERIFIED';

export const DEFAULT_SCHOOL_TIMEZONE = 'America/Sao_Paulo';

export interface CrossGradeReviewAssignment {
  assignedByTeacherId: string;
  assignedByTeacherName?: string;
  targetStudentId?: string;
  targetClassId?: string;
  originSeriesLabel: string;
  pedagogicalReason: string;
  assignedAt: string;
}

export interface StudentGradeContext {
  studentId: string;
  registrationNumber: string;
  studentName: string;
  classId: string;
  className: string;
  seriesNumber: number; // 1..9 (EF) ou 1..3 (EM), 0 se inválido
  seriesLabel: string;  // ex: '7º Ano EF' ou '3ª Série EM'
  stage: EducationStageScope;
  exactBnccPrefix: string; // ex: 'EF07' ou 'EM13'
  bnccPrefixes: string[];  // prefixos compatíveis com a etapa
  isContextValid: boolean;
  validationError?: string;
}

interface ClassCatalogEntry {
  className: string;
  seriesNumber: number;
  seriesLabel: string;
  stage: Exclude<EducationStageScope, 'UNVERIFIED'>;
  exactBnccPrefix: string;
  bnccPrefixes: string[];
}

export const CLASS_METADATA: Record<string, ClassCatalogEntry> = {
  'F-EF11A': { className: '1º Ano A — Fundamental I', seriesNumber: 1, seriesLabel: '1º Ano EF', stage: 'EF_ANOS_INICIAIS', exactBnccPrefix: 'EF01', bnccPrefixes: ['EF01', 'EF15'] },
  'F-EF12A': { className: '2º Ano A — Fundamental I', seriesNumber: 2, seriesLabel: '2º Ano EF', stage: 'EF_ANOS_INICIAIS', exactBnccPrefix: 'EF02', bnccPrefixes: ['EF02', 'EF15'] },
  'F-EF13A': { className: '3º Ano A — Fundamental I', seriesNumber: 3, seriesLabel: '3º Ano EF', stage: 'EF_ANOS_INICIAIS', exactBnccPrefix: 'EF03', bnccPrefixes: ['EF03', 'EF15'] },
  'F-EF14A': { className: '4º Ano A — Fundamental I', seriesNumber: 4, seriesLabel: '4º Ano EF', stage: 'EF_ANOS_INICIAIS', exactBnccPrefix: 'EF04', bnccPrefixes: ['EF04', 'EF15'] },
  'F-EF15A': { className: '5º Ano A — Fundamental I', seriesNumber: 5, seriesLabel: '5º Ano EF', stage: 'EF_ANOS_INICIAIS', exactBnccPrefix: 'EF05', bnccPrefixes: ['EF05', 'EF15'] },
  'F-EF26A': { className: '6º Ano A — Fundamental II', seriesNumber: 6, seriesLabel: '6º Ano EF', stage: 'EF_ANOS_FINAIS', exactBnccPrefix: 'EF06', bnccPrefixes: ['EF06', 'EF67', 'EF69'] },
  'F-EF26B': { className: '6º Ano B — Fundamental II', seriesNumber: 6, seriesLabel: '6º Ano EF', stage: 'EF_ANOS_FINAIS', exactBnccPrefix: 'EF06', bnccPrefixes: ['EF06', 'EF67', 'EF69'] },
  'F-EF27A': { className: '7º Ano A — Fundamental II', seriesNumber: 7, seriesLabel: '7º Ano EF', stage: 'EF_ANOS_FINAIS', exactBnccPrefix: 'EF07', bnccPrefixes: ['EF07', 'EF67', 'EF69'] },
  'F-EF27B': { className: '7º Ano B — Fundamental II', seriesNumber: 7, seriesLabel: '7º Ano EF', stage: 'EF_ANOS_FINAIS', exactBnccPrefix: 'EF07', bnccPrefixes: ['EF07', 'EF67', 'EF69'] },
  'F-EF28A': { className: '8º Ano A — Fundamental II', seriesNumber: 8, seriesLabel: '8º Ano EF', stage: 'EF_ANOS_FINAIS', exactBnccPrefix: 'EF08', bnccPrefixes: ['EF08', 'EF89', 'EF69'] },
  'F-EF28B': { className: '8º Ano B — Fundamental II', seriesNumber: 8, seriesLabel: '8º Ano EF', stage: 'EF_ANOS_FINAIS', exactBnccPrefix: 'EF08', bnccPrefixes: ['EF08', 'EF89', 'EF69'] },
  'F-EF29A': { className: '9º Ano A — Fundamental II', seriesNumber: 9, seriesLabel: '9º Ano EF', stage: 'EF_ANOS_FINAIS', exactBnccPrefix: 'EF09', bnccPrefixes: ['EF09', 'EF89', 'EF69'] },
  'F-EF29B': { className: '9º Ano B — Fundamental II', seriesNumber: 9, seriesLabel: '9º Ano EF', stage: 'EF_ANOS_FINAIS', exactBnccPrefix: 'EF09', bnccPrefixes: ['EF09', 'EF89', 'EF69'] },
  'F-EM1A':  { className: '1ª Série A — Ensino Médio', seriesNumber: 1, seriesLabel: '1ª Série EM', stage: 'ENSINO_MEDIO', exactBnccPrefix: 'EM13', bnccPrefixes: ['EM13'] },
  'M-EM1A':  { className: '1ª Série A — Ensino Médio', seriesNumber: 1, seriesLabel: '1ª Série EM', stage: 'ENSINO_MEDIO', exactBnccPrefix: 'EM13', bnccPrefixes: ['EM13'] },
  'F-EM2A':  { className: '2ª Série A — Ensino Médio', seriesNumber: 2, seriesLabel: '2ª Série EM', stage: 'ENSINO_MEDIO', exactBnccPrefix: 'EM13', bnccPrefixes: ['EM13'] },
  'M-EM2A':  { className: '2ª Série A — Ensino Médio', seriesNumber: 2, seriesLabel: '2ª Série EM', stage: 'ENSINO_MEDIO', exactBnccPrefix: 'EM13', bnccPrefixes: ['EM13'] },
  'F-EM3A':  { className: '3ª Série A — Ensino Médio', seriesNumber: 3, seriesLabel: '3ª Série EM', stage: 'ENSINO_MEDIO', exactBnccPrefix: 'EM13', bnccPrefixes: ['EM13'] },
  'M-EM3A':  { className: '3ª Série A — Ensino Médio', seriesNumber: 3, seriesLabel: '3ª Série EM', stage: 'ENSINO_MEDIO', exactBnccPrefix: 'EM13', bnccPrefixes: ['EM13'] },
};

const KNOWN_DEMO_STUDENT_ALIASES: Record<string, { registrationNumber: string; name: string; classId: string }> = {
  demo_student_001: { registrationNumber: '20261001', name: 'Gabriel Rocha', classId: 'M-EM3A' },
  stu_gabriel_3a:   { registrationNumber: '20261001', name: 'Gabriel Rocha', classId: 'M-EM3A' },
  stu_lucas_7a:     { registrationNumber: '20260701', name: 'Lucas Andrade', classId: 'F-EF27A' },
  stu_sofia_3ef:    { registrationNumber: '20260301', name: 'Sofia Martins', classId: 'F-EF13A' },
};

function buildInvalidContext(reason: string, rawStudentId = '', rawClassId = ''): StudentGradeContext {
  return {
    studentId: rawStudentId || 'UNVERIFIED',
    registrationNumber: '',
    studentName: 'Estudante não identificado',
    classId: rawClassId || 'UNVERIFIED',
    className: 'Turma não validada',
    seriesNumber: 0,
    seriesLabel: 'Série não identificada',
    stage: 'UNVERIFIED',
    exactBnccPrefix: '',
    bnccPrefixes: [],
    isContextValid: false,
    validationError: reason,
  };
}

/**
 * Resolve o contexto curricular do estudante com validação estrita.
 * Contexto ausente ou inválido NUNCA cai em 'ALL'.
 */
export function resolveStudentGradeContext(
  studentId?: string | null,
  overrideClassId?: string | null
): StudentGradeContext {
  const cleanStudentId = typeof studentId === 'string' ? studentId.trim() : '';
  const cleanOverrideClass = typeof overrideClassId === 'string' ? overrideClassId.trim() : '';

  // Se overrideClassId foi fornecido explicitamente mas é inválido (ex: 'ALL', 'INVALID', etc.), rejeita imediatamente
  if (cleanOverrideClass && !CLASS_METADATA[cleanOverrideClass]) {
    return buildInvalidContext(`Turma inválida ou não reconhecida: ${cleanOverrideClass}`, cleanStudentId, cleanOverrideClass);
  }

  // Busca em STUDENTS ou aliases sintéticos homologados
  const matchedStudent = cleanStudentId
    ? STUDENTS.find(
        (s) =>
          s.registrationNumber === cleanStudentId ||
          s.name.toLowerCase() === cleanStudentId.toLowerCase()
      )
    : undefined;

  const aliasStudent = cleanStudentId ? KNOWN_DEMO_STUDENT_ALIASES[cleanStudentId] : undefined;

  // Se nenhum identificador de aluno nem turma válida foi informado, contexto é ausente (não libera 'ALL')
  if (!cleanStudentId && !cleanOverrideClass) {
    return buildInvalidContext('Contexto de estudante e turma ausente.');
  }

  // Se studentId foi passado mas não existe no cadastro nem possui overrideClassId válido, rejeita
  if (cleanStudentId && !matchedStudent && !aliasStudent && !cleanOverrideClass) {
    return buildInvalidContext(`Estudante não localizado no cadastro escolar: ${cleanStudentId}`, cleanStudentId);
  }

  const resolvedClassId = cleanOverrideClass || matchedStudent?.classId || aliasStudent?.classId || '';
  const meta = CLASS_METADATA[resolvedClassId];
  if (!meta) {
    return buildInvalidContext(`Turma vinculada inválida: ${resolvedClassId}`, cleanStudentId, resolvedClassId);
  }

  return {
    studentId: cleanStudentId || matchedStudent?.registrationNumber || aliasStudent?.registrationNumber || 'UNVERIFIED',
    registrationNumber: matchedStudent?.registrationNumber || aliasStudent?.registrationNumber || cleanStudentId,
    studentName: matchedStudent?.name || aliasStudent?.name || `Estudante (${meta.seriesLabel})`,
    classId: resolvedClassId,
    className: meta.className,
    seriesNumber: meta.seriesNumber,
    seriesLabel: meta.seriesLabel,
    stage: meta.stage,
    exactBnccPrefix: meta.exactBnccPrefix,
    bnccPrefixes: meta.bnccPrefixes,
    isContextValid: true,
  };
}

/**
 * Extrai a série exata (número e etapa) de um rótulo textual de série/gradeLevel.
 */
function extractSeriesFromLabel(label: string): { stage?: Exclude<EducationStageScope, 'UNVERIFIED'>; seriesNumber?: number } {
  const lower = label.toLowerCase();
  const isEM =
    lower.includes('ensino médio') ||
    lower.includes('ensino medio') ||
    lower.includes('série em') ||
    lower.includes('serie em') ||
    /\b[1-3][ªaºo]?\s*s[eé]rie\b/.test(lower) ||
    /\b[1-3]em\b/.test(lower);

  if (isEM) {
    const m = lower.match(/\b([1-3])[ªaºo]?\s*(?:s[eé]rie|ano|em)\b/);
    return { stage: 'ENSINO_MEDIO', seriesNumber: m ? Number(m[1]) : undefined };
  }

  const efMatch = lower.match(/\b([1-9])[ºoªa]?\s*ano\b/);
  if (efMatch) {
    const num = Number(efMatch[1]);
    return {
      stage: num <= 5 ? 'EF_ANOS_INICIAIS' : 'EF_ANOS_FINAIS',
      seriesNumber: num,
    };
  }

  if (lower.includes('fundamental ii') || lower.includes('anos finais')) {
    return { stage: 'EF_ANOS_FINAIS' };
  }
  if (lower.includes('fundamental i') || lower.includes('anos iniciais')) {
    return { stage: 'EF_ANOS_INICIAIS' };
  }

  return {};
}

/**
 * Valida se uma atribuição docente de revisão cruzada (outra série) é autêntica e destinada ao aluno/turma.
 */
export function isValidCrossGradeAssignment(
  assignment: CrossGradeReviewAssignment | undefined | null,
  ctx: StudentGradeContext
): boolean {
  if (!assignment || !ctx.isContextValid) return false;
  if (!assignment.assignedByTeacherId || typeof assignment.assignedByTeacherId !== 'string' || !assignment.assignedByTeacherId.trim()) {
    return false;
  }
  if (!assignment.pedagogicalReason || typeof assignment.pedagogicalReason !== 'string' || assignment.pedagogicalReason.trim().length < 5) {
    return false;
  }
  if (!assignment.assignedAt || formatSafeDatePtBr(assignment.assignedAt) === 'Data não informada') {
    return false;
  }
  const matchesStudent =
    Boolean(assignment.targetStudentId) &&
    (assignment.targetStudentId === ctx.studentId || assignment.targetStudentId === ctx.registrationNumber);
  const matchesClass =
    Boolean(assignment.targetClassId) &&
    assignment.targetClassId.replace(/^F-EM/, 'M-EM') === ctx.classId.replace(/^F-EM/, 'M-EM');

  return matchesStudent || matchesClass;
}

/**
 * Verifica se um item (tarefa, playlist, applet, cápsula, habilidade) pertence à série/turma exata do aluno,
 * ou se possui atribuição pedagógica explícita de revisão por professor autorizado.
 */
export function matchesStudentGradeScope(
  item: {
    classId?: string;
    stage?: string;
    gradeLevel?: string;
    seriesLabel?: string;
    bnccCode?: string;
    bnccCodes?: string[];
    crossGradeAssignment?: CrossGradeReviewAssignment | null;
  },
  ctx: StudentGradeContext
): boolean {
  // 0. Contexto inválido ou ausente NUNCA libera itens
  if (!ctx || !ctx.isContextValid || ctx.stage === 'UNVERIFIED') {
    return false;
  }
  if (!item || typeof item !== 'object') {
    return false;
  }

  // 1. Exceção pedagógica rastreável: revisão atribuída explicitamente por professor autorizado
  if (item.crossGradeAssignment) {
    return isValidCrossGradeAssignment(item.crossGradeAssignment, ctx);
  }

  let hasVerifiableMetadata = false;

  // 2. Se o item especifica classId explícita (diferente de 'all'/'ALL'), deve coincidir com a turma/série do aluno
  if (item.classId && item.classId.toLowerCase() !== 'all') {
    hasVerifiableMetadata = true;
    const itemMeta = CLASS_METADATA[item.classId];
    if (!itemMeta) return false;
    const normalizedItemClass = item.classId.replace(/^F-EM/, 'M-EM');
    const normalizedStudentClass = ctx.classId.replace(/^F-EM/, 'M-EM');
    if (normalizedItemClass !== normalizedStudentClass && item.classId !== ctx.classId) {
      return false;
    }
  }

  // 3. Se o item especifica stage explícito, deve coincidir com a etapa do aluno
  if (item.stage && item.stage.toUpperCase() !== 'ALL') {
    hasVerifiableMetadata = true;
    const normalizedStage = item.stage.toUpperCase();
    if (ctx.stage === 'ENSINO_MEDIO') {
      if (normalizedStage !== 'ENSINO_MEDIO' && normalizedStage !== 'VESTIBULAR_MEDICINA') {
        return false;
      }
    } else if (normalizedStage !== ctx.stage) {
      return false;
    }
  }

  // 4. Se o item especifica gradeLevel ou seriesLabel textual, verifica série exata quando presente
  const textLabel = [item.gradeLevel, item.seriesLabel].filter(Boolean).join(' ');
  const extractedTextSeries = textLabel ? extractSeriesFromLabel(textLabel) : {};
  if (textLabel.trim()) {
    if (extractedTextSeries.stage) {
      hasVerifiableMetadata = true;
      if (extractedTextSeries.stage !== ctx.stage) return false;
    }
    if (extractedTextSeries.seriesNumber !== undefined) {
      hasVerifiableMetadata = true;
      if (extractedTextSeries.seriesNumber !== ctx.seriesNumber) return false;
    }
  }

  // 5. Validação de códigos BNCC: prefixos amplos (EF15, EF67, EF69, EF89, EM13) NÃO servem sozinhos como prova
  //    de série exata quando a série não foi confirmada ou diverge.
  const codes: string[] = [];
  if (item.bnccCode) codes.push(item.bnccCode.toUpperCase().trim());
  if (Array.isArray(item.bnccCodes)) {
    item.bnccCodes.forEach((c) => {
      if (c) codes.push(String(c).toUpperCase().trim());
    });
  }

  if (codes.length > 0) {
    // Verifica se há código de série exata do Ensino Fundamental (EF01..EF09)
    const exactEfMatches = codes.filter((c) => /^EF0[1-9]/.test(c));
    const broadEfMatches = codes.filter((c) => /^EF(15|67|69|89)/.test(c));
    const emMatches = codes.filter((c) => c.startsWith('EM13'));

    if (ctx.stage === 'EF_ANOS_INICIAIS' || ctx.stage === 'EF_ANOS_FINAIS') {
      if (emMatches.length > 0 && exactEfMatches.length === 0 && broadEfMatches.length === 0) {
        return false;
      }
      if (exactEfMatches.length > 0) {
        // Exige que pelo menos um código exato coincida com a série exata do aluno (ex: EF07 para 7º Ano)
        const matchesExact = exactEfMatches.some((c) => c.startsWith(ctx.exactBnccPrefix));
        if (!matchesExact) return false;
        hasVerifiableMetadata = true;
      } else if (broadEfMatches.length > 0) {
        // Prefixo amplo (ex: EF67, EF69, EF15) exige compatibilidade com a faixa E confirmação da série exata via turma/gradeLevel
        const matchesBroadBand = broadEfMatches.some((c) => ctx.bnccPrefixes.some((pref) => c.startsWith(pref)));
        if (!matchesBroadBand) return false;
        const hasExactSeriesConfirmation =
          (item.classId && item.classId.toLowerCase() !== 'all') ||
          extractedTextSeries.seriesNumber === ctx.seriesNumber;
        if (!hasExactSeriesConfirmation) {
          return false;
        }
        hasVerifiableMetadata = true;
      }
    } else if (ctx.stage === 'ENSINO_MEDIO') {
      if (!emMatches.some((c) => c.startsWith('EM13'))) {
        return false;
      }
      // Se o item tem apenas EM13 (amplo para 1ª..3ª série), exige ou turma compatível, ou série textual compatível, ou etapa EM sem série conflitante
      if (extractedTextSeries.seriesNumber !== undefined && extractedTextSeries.seriesNumber !== ctx.seriesNumber) {
        return false;
      }
      hasVerifiableMetadata = true;
    }
  }

  // 6. Metadados insuficientes são tratados explicitamente como rejeitados (false)
  return hasVerifiableMetadata;
}

/**
 * Autorização de acesso a dados curriculares/acadêmicos (Frontend + IPC Backend Guard).
 * Impede que um estudante consulte dados de outro aluno ou de outra turma manipulando studentId/classId.
 */
export function authorizeStudentDataAccess(
  sessionUser: { id?: string; username?: string; role?: string; studentId?: string; classId?: string } | null | undefined,
  requestedStudentId?: string | null,
  requestedClassId?: string | null
): { authorized: boolean; reason?: string; enforcedStudentId?: string; enforcedClassId?: string } {
  if (!sessionUser || !sessionUser.role) {
    return { authorized: false, reason: 'UNAUTHENTICATED_SESSION' };
  }

  const role = sessionUser.role.toLowerCase();
  const isStaff = ['admin', 'director', 'coordinator', 'coordenacao', 'teacher', 'docente', 'secretary', 'secretaria'].includes(role);

  if (isStaff) {
    return {
      authorized: true,
      enforcedStudentId: requestedStudentId || undefined,
      enforcedClassId: requestedClassId || undefined,
    };
  }

  if (role === 'student' || role === 'aluno' || role === 'parent' || role === 'responsavel') {
    const ownStudentId = sessionUser.studentId || sessionUser.id || '';
    const ownCtx = resolveStudentGradeContext(ownStudentId, sessionUser.classId);
    if (!ownCtx.isContextValid) {
      return { authorized: false, reason: 'INVALID_SESSION_STUDENT_CONTEXT' };
    }

    if (
      requestedStudentId &&
      requestedStudentId !== ownCtx.studentId &&
      requestedStudentId !== ownCtx.registrationNumber &&
      requestedStudentId !== sessionUser.id
    ) {
      return {
        authorized: false,
        reason: `CROSS_STUDENT_ACCESS_DENIED: ${ownCtx.studentId} tentou acessar ${requestedStudentId}`,
      };
    }

    if (
      requestedClassId &&
      requestedClassId.toLowerCase() !== 'all' &&
      requestedClassId.replace(/^F-EM/, 'M-EM') !== ownCtx.classId.replace(/^F-EM/, 'M-EM')
    ) {
      return {
        authorized: false,
        reason: `CROSS_CLASS_ACCESS_DENIED: turma ${ownCtx.classId} tentou consultar ${requestedClassId}`,
      };
    }

    return {
      authorized: true,
      enforcedStudentId: ownCtx.studentId,
      enforcedClassId: ownCtx.classId,
    };
  }

  return { authorized: false, reason: `UNSUPPORTED_ROLE: ${role}` };
}

/**
 * Retorna a data civil (YYYY-MM-DD) na referência temporal oficial da escola (America/Sao_Paulo por padrão).
 */
export function getSchoolTodayIsoDate(
  refDate: Date = new Date(),
  timeZone: string = DEFAULT_SCHOOL_TIMEZONE
): string {
  if (!(refDate instanceof Date) || Number.isNaN(refDate.getTime())) {
    return getSchoolTodayIsoDate(new Date(), timeZone);
  }
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(refDate);
    const y = parts.find((p) => p.type === 'year')?.value;
    const m = parts.find((p) => p.type === 'month')?.value;
    const d = parts.find((p) => p.type === 'day')?.value;
    if (y && m && d) return `${y}-${m}-${d}`;
  } catch {
    // Fallback para UTC-3 caso timeZone inválido seja passado
  }
  const year = refDate.getFullYear();
  const month = String(refDate.getMonth() + 1).padStart(2, '0');
  const day = String(refDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLocalTodayIsoDate(refDate: Date = new Date(), timeZone: string = DEFAULT_SCHOOL_TIMEZONE): string {
  return getSchoolTodayIsoDate(refDate, timeZone);
}

/**
 * Formata uma data com segurança em pt-BR usando o fuso escolar (America/Sao_Paulo).
 * NUNCA exibe 'Invalid Date' e NUNCA mascara data desconhecida/inválida como 'Recente'.
 */
export function formatSafeDatePtBr(
  rawDate: unknown,
  fallback = 'Data não informada',
  timeZone: string = DEFAULT_SCHOOL_TIMEZONE
): string {
  // Proíbe substituir data inválida/ausente por 'Recente' (Item 3 da Missão)
  const safeFallback =
    !fallback || fallback.trim().toLowerCase() === 'recente' ? 'Data não informada' : fallback;

  if (rawDate === null || rawDate === undefined) return safeFallback;

  if (typeof rawDate === 'string') {
    const trimmed = rawDate.trim();
    if (!trimmed) return safeFallback;

    // Rótulos relativos explícitos válidos
    if (/^(hoje|amanh[ãa]|ontem|atrasado|pr[óo]xima\s+\w+|sexta-feira|segunda-feira)$/i.test(trimmed)) {
      return trimmed;
    }

    // Formato DD/MM/YYYY ou DD/MM
    const brMatch = trimmed.match(/^(\d{2})\/(\d{2})(?:\/(\d{4}))?$/);
    if (brMatch) {
      const dd = Number(brMatch[1]);
      const mm = Number(brMatch[2]);
      const yyyy = brMatch[3] ? Number(brMatch[3]) : 2026;
      if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return safeFallback;
      const check = new Date(Date.UTC(yyyy, mm - 1, dd, 12, 0, 0));
      if (check.getUTCMonth() !== mm - 1 || check.getUTCDate() !== dd) return safeFallback;
      return trimmed;
    }

    // Data civil YYYY-MM-DD sem hora (não deve sofrer deslocamento de fuso)
    const isoDateOnly = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoDateOnly) {
      const yyyy = Number(isoDateOnly[1]);
      const mm = Number(isoDateOnly[2]);
      const dd = Number(isoDateOnly[3]);
      if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return safeFallback;
      const check = new Date(Date.UTC(yyyy, mm - 1, dd, 12, 0, 0));
      if (check.getUTCFullYear() !== yyyy || check.getUTCMonth() !== mm - 1 || check.getUTCDate() !== dd) {
        return safeFallback;
      }
      return `${String(dd).padStart(2, '0')}/${String(mm).padStart(2, '0')}/${yyyy}`;
    }

    // Timestamp ISO / SQLite estrito (ex: '2026-11-04 02:30:00' ou '2026-11-04T02:30:00Z')
    if (/^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}/.test(trimmed)) {
      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.getTime())) {
        try {
          return new Intl.DateTimeFormat('pt-BR', {
            timeZone,
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }).format(parsed);
        } catch {
          return parsed.toLocaleDateString('pt-BR');
        }
      }
    }
    return safeFallback;
  }

  if (rawDate instanceof Date) {
    if (Number.isNaN(rawDate.getTime())) return safeFallback;
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        timeZone,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(rawDate);
    } catch {
      return rawDate.toLocaleDateString('pt-BR');
    }
  }

  if (typeof rawDate === 'number' && Number.isFinite(rawDate)) {
    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) return safeFallback;
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        timeZone,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(parsed);
    } catch {
      return parsed.toLocaleDateString('pt-BR');
    }
  }

  return safeFallback;
}

/**
 * Classifica o status de prazo ("HOJE", "AMANHÃ", "ATRASADO", "FUTURO", "DATA_NAO_INFORMADA")
 * usando a data civil na referência temporal da escola (America/Sao_Paulo).
 */
export function classifyDueDateStatus(
  rawDueDate: unknown,
  refDate: Date = new Date(),
  timeZone: string = DEFAULT_SCHOOL_TIMEZONE
): 'HOJE' | 'AMANHÃ' | 'ATRASADO' | 'FUTURO' | 'DATA_NAO_INFORMADA' {
  if (!rawDueDate) return 'DATA_NAO_INFORMADA';
  if (typeof rawDueDate === 'string') {
    const lower = rawDueDate.trim().toLowerCase();
    if (!lower) return 'DATA_NAO_INFORMADA';
    if (lower === 'hoje') return 'HOJE';
    if (lower === 'amanhã' || lower === 'amanha') return 'AMANHÃ';
    if (lower === 'atrasado') return 'ATRASADO';
  }

  const formattedPtBr = formatSafeDatePtBr(rawDueDate, 'Data não informada', timeZone);
  if (formattedPtBr === 'Data não informada') return 'DATA_NAO_INFORMADA';

  const parts = formattedPtBr.split('/');
  if (parts.length !== 3) return 'DATA_NAO_INFORMADA';
  const targetIso = `${parts[2]}-${parts[1]}-${parts[0]}`;
  const todayIso = getSchoolTodayIsoDate(refDate, timeZone);

  if (targetIso === todayIso) return 'HOJE';

  const todayMs = Date.parse(`${todayIso}T12:00:00Z`);
  const targetMs = Date.parse(`${targetIso}T12:00:00Z`);
  const diffDays = Math.round((targetMs - todayMs) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'AMANHÃ';
  if (diffDays < 0) return 'ATRASADO';
  return 'FUTURO';
}
