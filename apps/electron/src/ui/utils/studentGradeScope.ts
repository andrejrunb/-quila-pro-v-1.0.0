/**
 * Áquila Pro — Escopo Estrito de Série/Turma do Estudante & Formatação Segura de Datas
 *
 * Garante que o estudante visualize exclusivamente tarefas, cápsulas, playlists,
 * applets e habilidades da série/turma em que está matriculado, além de prevenir
 * 'Invalid Date' e desvios de fuso horário UTC vs BRT (UTC-3).
 */

import { STUDENTS } from '../../database/studentsData';

export type EducationStageScope = 'EF_ANOS_INICIAIS' | 'EF_ANOS_FINAIS' | 'ENSINO_MEDIO';

export interface StudentGradeContext {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  seriesLabel: string; // ex: '7º Ano' ou '3ª Série EM'
  stage: EducationStageScope;
  bnccPrefixes: string[]; // ex: ['EF07', 'EF67', 'EF69'] ou ['EM13']
}

const CLASS_METADATA: Record<
  string,
  { className: string; seriesLabel: string; stage: EducationStageScope; bnccPrefixes: string[] }
> = {
  'F-EF11A': { className: '1º Ano A — Fundamental I', seriesLabel: '1º Ano EF', stage: 'EF_ANOS_INICIAIS', bnccPrefixes: ['EF01', 'EF15'] },
  'F-EF12A': { className: '2º Ano A — Fundamental I', seriesLabel: '2º Ano EF', stage: 'EF_ANOS_INICIAIS', bnccPrefixes: ['EF02', 'EF15'] },
  'F-EF13A': { className: '3º Ano A — Fundamental I', seriesLabel: '3º Ano EF', stage: 'EF_ANOS_INICIAIS', bnccPrefixes: ['EF03', 'EF15'] },
  'F-EF14A': { className: '4º Ano A — Fundamental I', seriesLabel: '4º Ano EF', stage: 'EF_ANOS_INICIAIS', bnccPrefixes: ['EF04', 'EF15'] },
  'F-EF15A': { className: '5º Ano A — Fundamental I', seriesLabel: '5º Ano EF', stage: 'EF_ANOS_INICIAIS', bnccPrefixes: ['EF05', 'EF15'] },
  'F-EF26A': { className: '6º Ano A — Fundamental II', seriesLabel: '6º Ano EF', stage: 'EF_ANOS_FINAIS', bnccPrefixes: ['EF06', 'EF67', 'EF69'] },
  'F-EF26B': { className: '6º Ano B — Fundamental II', seriesLabel: '6º Ano EF', stage: 'EF_ANOS_FINAIS', bnccPrefixes: ['EF06', 'EF67', 'EF69'] },
  'F-EF27A': { className: '7º Ano A — Fundamental II', seriesLabel: '7º Ano EF', stage: 'EF_ANOS_FINAIS', bnccPrefixes: ['EF07', 'EF67', 'EF69'] },
  'F-EF27B': { className: '7º Ano B — Fundamental II', seriesLabel: '7º Ano EF', stage: 'EF_ANOS_FINAIS', bnccPrefixes: ['EF07', 'EF67', 'EF69'] },
  'F-EF28A': { className: '8º Ano A — Fundamental II', seriesLabel: '8º Ano EF', stage: 'EF_ANOS_FINAIS', bnccPrefixes: ['EF08', 'EF89', 'EF69'] },
  'F-EF29A': { className: '9º Ano A — Fundamental II', seriesLabel: '9º Ano EF', stage: 'EF_ANOS_FINAIS', bnccPrefixes: ['EF09', 'EF89', 'EF69'] },
  'F-EM1A':  { className: '1ª Série A — Ensino Médio', seriesLabel: '1ª Série EM', stage: 'ENSINO_MEDIO', bnccPrefixes: ['EM13'] },
  'M-EM1A':  { className: '1ª Série A — Ensino Médio', seriesLabel: '1ª Série EM', stage: 'ENSINO_MEDIO', bnccPrefixes: ['EM13'] },
  'F-EM2A':  { className: '2ª Série A — Ensino Médio', seriesLabel: '2ª Série EM', stage: 'ENSINO_MEDIO', bnccPrefixes: ['EM13'] },
  'M-EM2A':  { className: '2ª Série A — Ensino Médio', seriesLabel: '2ª Série EM', stage: 'ENSINO_MEDIO', bnccPrefixes: ['EM13'] },
  'F-EM3A':  { className: '3ª Série A — Ensino Médio', seriesLabel: '3ª Série EM', stage: 'ENSINO_MEDIO', bnccPrefixes: ['EM13'] },
  'M-EM3A':  { className: '3ª Série A — Ensino Médio', seriesLabel: '3ª Série EM', stage: 'ENSINO_MEDIO', bnccPrefixes: ['EM13'] },
};

export function resolveStudentGradeContext(studentId?: string, overrideClassId?: string): StudentGradeContext {
  const savedClassId =
    overrideClassId ||
    (typeof window !== 'undefined' ? localStorage.getItem('aquila_student_class_id') : null) ||
    undefined;

  const matchedStudent = studentId
    ? STUDENTS.find(
        (s) =>
          s.registrationNumber === studentId ||
          s.name.toLowerCase() === studentId.toLowerCase()
      )
    : undefined;

  const classId = savedClassId || matchedStudent?.classId || 'M-EM3A';
  const meta = CLASS_METADATA[classId] || CLASS_METADATA['M-EM3A'];

  return {
    studentId: studentId || matchedStudent?.registrationNumber || 'stu_gabriel_3a',
    studentName: matchedStudent?.name || 'Gabriel Rocha',
    classId,
    className: meta.className,
    seriesLabel: meta.seriesLabel,
    stage: meta.stage,
    bnccPrefixes: meta.bnccPrefixes,
  };
}

/**
 * Verifica se um item (tarefa, playlist, applet, cápsula) pertence exclusivamente à série/turma do aluno.
 */
export function matchesStudentGradeScope(
  item: {
    classId?: string;
    stage?: string;
    gradeLevel?: string;
    bnccCode?: string;
    bnccCodes?: string[];
  },
  ctx: StudentGradeContext
): boolean {
  // 1. Se o item especifica classId explícita (diferente de 'all'), deve coincidir com a turma do aluno
  if (item.classId && item.classId !== 'all') {
    const normalizedItemClass = item.classId.replace(/^F-EM/, 'M-EM');
    const normalizedStudentClass = ctx.classId.replace(/^F-EM/, 'M-EM');
    return normalizedItemClass === normalizedStudentClass || item.classId === ctx.classId;
  }

  // 2. Se o item especifica stage explícito (ex: EF_ANOS_INICIAIS, EF_ANOS_FINAIS, ENSINO_MEDIO)
  if (item.stage && item.stage !== 'ALL') {
    if (ctx.stage === 'ENSINO_MEDIO') {
      return item.stage === 'ENSINO_MEDIO' || item.stage === 'VESTIBULAR_MEDICINA';
    }
    return item.stage === ctx.stage;
  }

  // 3. Se o item possui código(s) BNCC, valida compatibilidade com a etapa/série do aluno
  const codes: string[] = [];
  if (item.bnccCode) codes.push(item.bnccCode.toUpperCase());
  if (Array.isArray(item.bnccCodes)) {
    item.bnccCodes.forEach((c) => codes.push(String(c).toUpperCase()));
  }

  if (codes.length > 0) {
    if (ctx.stage === 'ENSINO_MEDIO') {
      return codes.some((c) => c.startsWith('EM13'));
    }
    if (ctx.stage === 'EF_ANOS_FINAIS') {
      return codes.some((c) => ctx.bnccPrefixes.some((pref) => c.startsWith(pref)) || /^EF0[6-9]/.test(c));
    }
    if (ctx.stage === 'EF_ANOS_INICIAIS') {
      return codes.some((c) => ctx.bnccPrefixes.some((pref) => c.startsWith(pref)) || /^EF0[1-5]/.test(c));
    }
  }

  // 4. Se o item especifica gradeLevel textual (ex: 'Ensino Médio 1º Ano', 'Fundamental II 7º Ano')
  if (item.gradeLevel) {
    const gl = item.gradeLevel.toLowerCase();
    if (ctx.stage === 'ENSINO_MEDIO') {
      return gl.includes('ensino médio') || gl.includes('em') || gl.includes('enem') || gl.includes('série');
    }
    if (ctx.stage === 'EF_ANOS_FINAIS') {
      return gl.includes('fundamental ii') || gl.includes('6º') || gl.includes('7º') || gl.includes('8º') || gl.includes('9º');
    }
    if (ctx.stage === 'EF_ANOS_INICIAIS') {
      return gl.includes('fundamental i') && !gl.includes('fundamental ii');
    }
  }

  return true;
}

/**
 * Formata uma data com segurança em pt-BR, nunca exibindo 'Invalid Date'.
 */
export function formatSafeDatePtBr(rawDate: unknown, fallback = 'Data não informada'): string {
  if (!rawDate) return fallback;
  if (typeof rawDate === 'string') {
    const trimmed = rawDate.trim();
    if (!trimmed) return fallback;
    // Se já estiver no formato DD/MM/YYYY ou 'HOJE' / 'Amanhã'
    if (/^\d{2}\/\d{2}(\/\d{4})?$/.test(trimmed)) return trimmed;
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? `${trimmed}T00:00:00` : trimmed;
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('pt-BR');
    }
    return fallback;
  }
  if (rawDate instanceof Date) {
    return Number.isNaN(rawDate.getTime()) ? fallback : rawDate.toLocaleDateString('pt-BR');
  }
  if (typeof rawDate === 'number') {
    const parsed = new Date(rawDate);
    return Number.isNaN(parsed.getTime()) ? fallback : parsed.toLocaleDateString('pt-BR');
  }
  return fallback;
}

/**
 * Retorna a data local no formato YYYY-MM-DD (sem deslocamento UTC às 21h BRT).
 */
export function getLocalTodayIsoDate(refDate: Date = new Date()): string {
  const year = refDate.getFullYear();
  const month = String(refDate.getMonth() + 1).padStart(2, '0');
  const day = String(refDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
