/**
 * TimetableEngine.ts — Áquila Pro Sovereign Urânia+ Engine (v2.0)
 * ===============================================================
 * Motor CSP Híbrido + Busca Local Meta-Heurística (3 Fases) inspirado na
 * engenharia reversa do URÂNIA+ (v1.30.30):
 *  - Suporte aos 10 períodos do Colégio Áquila Modelo (1º ao 6º Manhã + 7º ao 10º Contraturno Tarde EM)
 *  - Matriz de Disponibilidade por Aula (AVAILABLE, UNAVAILABLE, AVOID, HAF)
 *  - Tipos de Geminação (Dobradinhas Ideais vs Aceitáveis, sem cruzar recreio/interturno)
 *  - LAP (Limite de Aulas por Professor na mesma Turma/Dia)
 *  - Aulas Coincidentes (ex: ED. FISICA 1 e FERREIRA em turmas simultâneas)
 *  - Avaliador de Troca Inteligente 2-opt ("Arrastar e Soltar / Clique Guiado Urânia" Verde/Amarelo/Vermelho)
 *  - Relatório "Situação do Horário" (Índice de Qualidade 0–100%, Janelas, Aulas Únicas e Sugestões)
 */

export interface TeacherSlot {
  teacherId: string;
  subject: string;
  segment?: string;
  maxConsecutive: number;
  maxWeekly: number;
  availableDays: string[]; // Compatibilidade legada
  // Matriz avançada Urânia+: key = `${day}_${period}` -> 'UNAVAILABLE' | 'AVOID' | 'HAF'
  slotRestrictions?: Record<string, 'UNAVAILABLE' | 'AVOID' | 'HAF'>;
  preferGeminada?: boolean;
  allowCoincident?: boolean;
}

export interface ClassRequirement {
  classId: string;
  className?: string;
  segment?: 'EF1' | 'EF2' | 'EM';
  demand: Record<string, number>;
}

export interface GridSlot {
  day: string;
  period: number; // 1 to 10
  subject: string;
  teacherId: string;
  locked?: boolean; // fixarAula / desafixarAula (Cadeado Urânia)
  coincidentGroup?: string;
}

export interface SwapCandidateInfo {
  day: string;
  period: number;
  status: 'FREE_DIRECT_SWAP' | 'SOFT_WARNING_SWAP' | 'BLOCKED';
  reason: string;
  deltaQualityScore?: number;
}

export interface TeacherQualityDefect {
  teacherId: string;
  totalClasses: number;
  janelasCount: number;
  janelasLocations: string[];
  singleClassDays: string[];
  workingDaysCount: number;
  qualityScore: number;
}

export interface UraniaQualitySummary {
  globalScore: number; // 0 to 100
  totalAllocatedSlots: number;
  totalHoles: number;
  totalTeacherJanelas: number;
  totalSingleLessonDays: number;
  totalGeminadasAchieved: number;
  teacherDefects: TeacherQualityDefect[];
  suggestions: Array<{
    id: string;
    teacherId: string;
    description: string;
    impact: string;
    dayToUnlock?: string;
    periodToUnlock?: number;
  }>;
}

export const VISAO_PERIODS: Array<{
  period: number;
  label: string;
  time: string;
  shift: 'MANHÃ' | 'TARDE';
  afterBreak?: boolean;
}> = [
  { period: 1, label: '1º Horário', time: '07:30 - 08:20', shift: 'MANHÃ' },
  { period: 2, label: '2º Horário', time: '08:20 - 09:10', shift: 'MANHÃ' },
  { period: 3, label: '3º Horário', time: '09:10 - 10:00', shift: 'MANHÃ' },
  { period: 4, label: '4º Horário', time: '10:30 - 11:10', shift: 'MANHÃ', afterBreak: true },
  { period: 5, label: '5º Horário', time: '11:10 - 12:00', shift: 'MANHÃ' },
  { period: 6, label: '6º Horário', time: '12:00 - 12:50', shift: 'MANHÃ' },
  { period: 7, label: '7º Horário (T)', time: '14:20 - 15:10', shift: 'TARDE', afterBreak: true },
  { period: 8, label: '8º Horário (T)', time: '15:10 - 16:00', shift: 'TARDE' },
  { period: 9, label: '9º Horário (T)', time: '16:20 - 17:10', shift: 'TARDE', afterBreak: true },
  { period: 10, label: '10º Horário (T)', time: '17:10 - 18:00', shift: 'TARDE' }
];

export const COLEGIO_VISAO_TEACHERS_PRESET: TeacherSlot[] = [
  // Fundamental I (Regentes Polivalentes)
  { teacherId: 'KARINE', subject: 'Polivalente 1ºA', segment: 'Fund. I', maxConsecutive: 5, maxWeekly: 25, availableDays: [], preferGeminada: true },
  { teacherId: 'CELIA', subject: 'Polivalente 1ºB', segment: 'Fund. I', maxConsecutive: 5, maxWeekly: 25, availableDays: [], preferGeminada: true },
  { teacherId: 'MILENE', subject: 'Polivalente 2ºA', segment: 'Fund. I', maxConsecutive: 5, maxWeekly: 25, availableDays: [], preferGeminada: true },
  { teacherId: 'JANETE', subject: 'Polivalente 2ºB', segment: 'Fund. I', maxConsecutive: 5, maxWeekly: 25, availableDays: [], preferGeminada: true },
  { teacherId: 'KELE', subject: 'Polivalente 3ºA', segment: 'Fund. I', maxConsecutive: 5, maxWeekly: 25, availableDays: [], preferGeminada: true },
  { teacherId: 'LENE', subject: 'Polivalente 3ºB', segment: 'Fund. I', maxConsecutive: 5, maxWeekly: 25, availableDays: [], preferGeminada: true },
  { teacherId: 'SANDRA', subject: 'Polivalente 4ºA', segment: 'Fund. I', maxConsecutive: 5, maxWeekly: 25, availableDays: [], preferGeminada: true },
  { teacherId: 'ELAINE', subject: 'Polivalente 4ºB', segment: 'Fund. I', maxConsecutive: 5, maxWeekly: 25, availableDays: [], preferGeminada: true },
  { teacherId: 'ANA MARIA', subject: 'Polivalente 5ºA', segment: 'Fund. I', maxConsecutive: 5, maxWeekly: 25, availableDays: [], preferGeminada: true },
  { teacherId: 'ROBERTA', subject: 'Língua Portuguesa / Redação', segment: 'Fund. I/II', maxConsecutive: 3, maxWeekly: 25, availableDays: [], preferGeminada: true },
  { teacherId: 'ANA FLAVIA', subject: 'Geografia / Humanas', segment: 'Fund. I/II', maxConsecutive: 2, maxWeekly: 25, availableDays: [] },
  { teacherId: 'LUDIMILA', subject: 'Ciências / Matemática', segment: 'Fund. I/II', maxConsecutive: 2, maxWeekly: 25, availableDays: [] },
  { teacherId: 'CLAUDIA', subject: 'Apoio Pedagógico', segment: 'Fund. I', maxConsecutive: 3, maxWeekly: 20, availableDays: [] },

  // Fundamental II e Ensino Médio (Especialistas)
  { teacherId: 'DANIELLE', subject: 'Português & Gramática', segment: 'Fund. II / EM', maxConsecutive: 2, maxWeekly: 30, availableDays: [], preferGeminada: true },
  { teacherId: 'DANIELE', subject: 'Espanhol', segment: 'Fund. II / EM', maxConsecutive: 2, maxWeekly: 18, availableDays: [] },
  { teacherId: 'LARISSA', subject: 'Matemática I', segment: 'Fund. II / EM', maxConsecutive: 2, maxWeekly: 28, availableDays: [], preferGeminada: true },
  { teacherId: 'SAMARA', subject: 'História Geral', segment: 'Fund. II / EM', maxConsecutive: 2, maxWeekly: 26, availableDays: [] },
  { teacherId: 'MOISES', subject: 'Geografia & Geopolítica', segment: 'Fund. II / EM', maxConsecutive: 2, maxWeekly: 26, availableDays: [] },
  { teacherId: 'M.ISABEL', subject: 'Biologia & Ciências', segment: 'Fund. II / EM', maxConsecutive: 2, maxWeekly: 28, availableDays: [], preferGeminada: true },
  { teacherId: 'THYAGO', subject: 'História / Sociologia / Fil.', segment: 'Fund. II / EM', maxConsecutive: 2, maxWeekly: 28, availableDays: [] },
  { teacherId: 'LAURA', subject: 'Redação & Literatura', segment: 'Fund. II / EM', maxConsecutive: 2, maxWeekly: 26, availableDays: [], preferGeminada: true },
  { teacherId: 'J.B', subject: 'Física & Raciocínio Lógico', segment: 'Fund. II / EM', maxConsecutive: 2, maxWeekly: 22, availableDays: [] },
  { teacherId: 'IAMANDRO', subject: 'Química Geral', segment: 'Fund. II / EM', maxConsecutive: 2, maxWeekly: 22, availableDays: [] },
  { teacherId: 'ANITA', subject: 'Inglês Avançado', segment: 'Fund. II / EM', maxConsecutive: 2, maxWeekly: 20, availableDays: [] },
  { teacherId: 'ANDRE', subject: 'Educação Física II', segment: 'Fund. II / EM', maxConsecutive: 2, maxWeekly: 24, availableDays: [], allowCoincident: true },
  { teacherId: 'JESSICA', subject: 'Biologia Molecular', segment: 'Fund. II / EM', maxConsecutive: 2, maxWeekly: 24, availableDays: [] },
  { teacherId: 'ANA INGLES', subject: 'Língua Inglesa', segment: 'Especialista', maxConsecutive: 2, maxWeekly: 25, availableDays: [] },
  { teacherId: 'ED. FISICA 1', subject: 'Educação Física I', segment: 'Especialista', maxConsecutive: 2, maxWeekly: 24, availableDays: [], allowCoincident: true },

  // Ensino Médio & Pré-Vestibular
  { teacherId: 'CHEBINHA', subject: 'Química Orgânica (EM)', segment: 'Ensino Médio', maxConsecutive: 2, maxWeekly: 24, availableDays: [], preferGeminada: true },
  { teacherId: 'LUIZ ARTE', subject: 'Arte & História da Arte', segment: 'Especialista', maxConsecutive: 2, maxWeekly: 18, availableDays: [] },
  { teacherId: 'FILIPE', subject: 'Física Mecânica (EM)', segment: 'Ensino Médio', maxConsecutive: 2, maxWeekly: 20, availableDays: [], preferGeminada: true },
  { teacherId: 'GUILHERME', subject: 'Geografia do Brasil (EM)', segment: 'Ensino Médio', maxConsecutive: 2, maxWeekly: 20, availableDays: [] },
  { teacherId: 'BETY', subject: 'Literatura & Interpretação', segment: 'Ensino Médio', maxConsecutive: 2, maxWeekly: 20, availableDays: [] },
  { teacherId: 'LANDER', subject: 'Matemática Geometria (EM)', segment: 'Ensino Médio', maxConsecutive: 2, maxWeekly: 22, availableDays: [], preferGeminada: true },
  { teacherId: 'HANS', subject: 'Física Eletromagnetismo (EM)', segment: 'Ensino Médio', maxConsecutive: 2, maxWeekly: 24, availableDays: [], preferGeminada: true },
  { teacherId: 'MARCONDES', subject: 'Matemática Álgebra (EM)', segment: 'Ensino Médio', maxConsecutive: 2, maxWeekly: 22, availableDays: [], preferGeminada: true },
  { teacherId: 'NORTHON', subject: 'Biologia Genética (EM)', segment: 'Ensino Médio', maxConsecutive: 2, maxWeekly: 20, availableDays: [] },
  { teacherId: 'FERREIRA', subject: 'Ed. Física & Esportes (EM)', segment: 'Ensino Médio', maxConsecutive: 2, maxWeekly: 18, availableDays: [], allowCoincident: true },
  { teacherId: 'GABRIELA', subject: 'Redação ENEM (EM)', segment: 'Ensino Médio', maxConsecutive: 2, maxWeekly: 20, availableDays: [], preferGeminada: true },
  { teacherId: 'DIGAO', subject: 'História do Brasil (EM)', segment: 'Ensino Médio', maxConsecutive: 2, maxWeekly: 20, availableDays: [] },
  { teacherId: 'WEIGUI', subject: 'Química Físico-Química (EM)', segment: 'Ensino Médio', maxConsecutive: 2, maxWeekly: 20, availableDays: [] },
  { teacherId: 'IGOR', subject: 'Filosofia & Atualidades (EM)', segment: 'Ensino Médio', maxConsecutive: 2, maxWeekly: 18, availableDays: [] }
];

export class TimetableEngine {
  private days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

  public isTeacherAvailableAtSlot(teacher: TeacherSlot, day: string, period: number): boolean {
    const normalizedDay = day.toLowerCase();
    if (teacher.availableDays && teacher.availableDays.length > 0) {
      if (!teacher.availableDays.includes(normalizedDay)) return false;
    }
    const key = `${normalizedDay}_${period}`;
    const state = teacher.slotRestrictions?.[key];
    if (state === 'UNAVAILABLE' || state === 'HAF') return false;
    return true;
  }

  public isTeacherBusyInOtherClass(
    teacherId: string,
    day: string,
    period: number,
    excludeClassId: string,
    globalSchedules: Record<string, GridSlot[]>,
    teachers: TeacherSlot[]
  ): string | null {
    if (!teacherId || teacherId === 'none' || teacherId === 'TBD') return null;
    const tObj = teachers.find(t => t.teacherId === teacherId);
    if (tObj?.allowCoincident || teacherId === 'ED. FISICA 1' || teacherId === 'FERREIRA') {
      return null; // Permite turmas agrupadas (Aulas Coincidentes Urânia)
    }

    for (const [otherClassId, slots] of Object.entries(globalSchedules)) {
      if (otherClassId === excludeClassId) continue;
      const conflict = slots.find(
        s => s.day === day && s.period === period && s.teacherId === teacherId && s.subject !== 'JANELA'
      );
      if (conflict) return otherClassId;
    }
    return null;
  }

  /**
   * Fase 1 + Fase 2 (Urânia+ Solver):
   * Preserva aulas fixadas (locked), aloca demandas com prioridade MRV/Dobradinhas,
   * e executa busca local 2-opt para eliminar janelas e melhorar o Índice de Qualidade.
   */
  public generate(
    classes: ClassRequirement[],
    teachers: TeacherSlot[],
    existingSchedules?: Record<string, GridSlot[]>,
    optimizationWeights?: {
      weightJanelas: number;
      weightGeminadas: number;
      weightSingleClassDay: number;
      weightLAP: number;
    }
  ): Record<string, GridSlot[]> {
    const schedules: Record<string, GridSlot[]> = {};

    for (const cls of classes) {
      const existingClassSlots = existingSchedules?.[cls.classId] || [];
      schedules[cls.classId] = this.solveForClass(cls, teachers, schedules, existingClassSlots);
    }

    // Fase 2: Refinamento Meta-Heurístico Local (2-opt sem violar Hard Constraints)
    this.optimizeWithLocalSearch(schedules, teachers, optimizationWeights);

    return schedules;
  }

  private solveForClass(
    cls: ClassRequirement,
    teachers: TeacherSlot[],
    globalSchedules: Record<string, GridSlot[]>,
    existingSlots: GridSlot[]
  ): GridSlot[] {
    const classGrid: GridSlot[] = [];
    const demandPool: { subject: string; teacherId: string; remaining: number }[] = [];

    // Determinar o número máximo de períodos desta turma
    const isEM = cls.classId.includes('EM') || cls.classId.includes('SERIE');
    const maxMorningPeriod = isEM ? 6 : 5;

    for (const [subject, count] of Object.entries(cls.demand)) {
      const byExactSubject = teachers.find(
        t => t.subject.toLowerCase() === subject.toLowerCase() || t.teacherId.toLowerCase() === subject.toLowerCase()
      );
      const teacherId = byExactSubject ? byExactSubject.teacherId : subject;
      demandPool.push({ subject, teacherId, remaining: count });
    }

    // Respeitar células travadas (fixarAula / locked)
    const lockedSlots = existingSlots.filter(s => s.locked);
    for (const locked of lockedSlots) {
      classGrid.push({ ...locked });
      const poolItem = demandPool.find(
        d => d.teacherId === locked.teacherId || d.subject === locked.subject
      );
      if (poolItem && poolItem.remaining > 0) {
        poolItem.remaining--;
      }
    }

    for (const day of this.days) {
      // No Colégio Áquila Modelo, Ensino Médio tem contraturno (7..10) às Terças e Quintas
      const dayPeriods =
        isEM && (day === 'tuesday' || day === 'thursday')
          ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
          : Array.from({ length: maxMorningPeriod }, (_, i) => i + 1);

      for (const p of dayPeriods) {
        if (classGrid.some(s => s.day === day && s.period === p)) {
          continue; // Já preenchido por aula travada
        }

        let candidates = demandPool.filter(d => d.remaining > 0);

        candidates = candidates.filter(cand => {
          const tInfo = teachers.find(t => t.teacherId === cand.teacherId);
          if (tInfo && !this.isTeacherAvailableAtSlot(tInfo, day, p)) return false;

          const busyIn = this.isTeacherBusyInOtherClass(
            cand.teacherId,
            day,
            p,
            cls.classId,
            globalSchedules,
            teachers
          );
          if (busyIn) return false;

          // LAP: Limite de aulas do mesmo professor no mesmo dia na mesma turma (exceto Polivalente Fund I)
          const isPolyvalent = tInfo?.segment === 'Fund. I' || cls.classId.startsWith('F-EF1');
          const maxDailyInClass = isPolyvalent ? 5 : (tInfo?.maxConsecutive || 2);
          const countTodayInClass = classGrid.filter(
            s => s.day === day && s.teacherId === cand.teacherId
          ).length;
          if (countTodayInClass >= maxDailyInClass) return false;

          return true;
        });

        if (candidates.length > 0) {
          // Priorizar dobradinha (geminação) se o horário anterior (sem intervalo no meio) era do mesmo professor
          const prevSlot = classGrid.find(s => s.day === day && s.period === p - 1);
          const periodMeta = VISAO_PERIODS.find(vp => vp.period === p);

          candidates.sort((a, b) => {
            if (prevSlot && !periodMeta?.afterBreak) {
              if (a.teacherId === prevSlot.teacherId) return -1;
              if (b.teacherId === prevSlot.teacherId) return 1;
            }
            return b.remaining - a.remaining;
          });

          const chosen = candidates[0];
          classGrid.push({
            day,
            period: p,
            subject: chosen.subject,
            teacherId: chosen.teacherId,
            locked: false
          });
          chosen.remaining--;
        } else {
          classGrid.push({
            day,
            period: p,
            subject: 'JANELA',
            teacherId: 'none',
            locked: false
          });
        }
      }
    }

    return classGrid;
  }

  /**
   * Fase 2: Busca Local 2-opt dentro de cada turma para reduzir janelas docentes
   * e agrupar dobradinhas sem criar colisões entre turmas.
   */
  public optimizeWithLocalSearch(
    schedules: Record<string, GridSlot[]>,
    teachers: TeacherSlot[],
    _weights?: any
  ): void {
    const classIds = Object.keys(schedules);
    for (let iter = 0; iter < 3; iter++) {
      for (const classId of classIds) {
        const slots = schedules[classId];
        if (!slots || slots.length < 2) continue;

        for (let i = 0; i < slots.length; i++) {
          for (let j = i + 1; j < slots.length; j++) {
            const s1 = slots[i];
            const s2 = slots[j];
            if (s1.locked || s2.locked) continue;
            if (s1.teacherId === s2.teacherId) continue;

            // Verificar se a troca (s1 <-> s2) é 100% livre de conflito
            const check = this.evaluatePairSwap(schedules, teachers, classId, s1, s2);
            if (check.status === 'FREE_DIRECT_SWAP' && (check.deltaQualityScore || 0) > 0) {
              // Executar swap dos professores/disciplinas mantendo dia/período
              const tmpSubj = s1.subject;
              const tmpTeacher = s1.teacherId;
              s1.subject = s2.subject;
              s1.teacherId = s2.teacherId;
              s2.subject = tmpSubj;
              s2.teacherId = tmpTeacher;
            }
          }
        }
      }
    }
  }

  /**
   * Fase 3 (UX Urânia): Avalia a troca entre duas células (s1 e s2) da mesma turma
   * e retorna se é LIVRE (Verde), AVISO SOFT (Amarelo) ou BLOQUEADA (Vermelho).
   */
  public evaluatePairSwap(
    schedules: Record<string, GridSlot[]>,
    teachers: TeacherSlot[],
    classId: string,
    s1: GridSlot,
    s2: GridSlot
  ): SwapCandidateInfo {
    if (s1.locked || s2.locked) {
      return {
        day: s2.day,
        period: s2.period,
        status: 'BLOCKED',
        reason: 'Aula travada com cadeado (Fixada)'
      };
    }

    const t1 = teachers.find(t => t.teacherId === s1.teacherId);
    const t2 = teachers.find(t => t.teacherId === s2.teacherId);

    // 1. Verificar disponibilidade de t1 no slot de s2 e de t2 no slot de s1
    if (t1 && !this.isTeacherAvailableAtSlot(t1, s2.day, s2.period)) {
      return {
        day: s2.day,
        period: s2.period,
        status: 'BLOCKED',
        reason: `${s1.teacherId} bloqueado neste horário`
      };
    }
    if (t2 && !this.isTeacherAvailableAtSlot(t2, s1.day, s1.period)) {
      return {
        day: s2.day,
        period: s2.period,
        status: 'BLOCKED',
        reason: `${s2.teacherId} bloqueado no horário de origem`
      };
    }

    // 2. Verificar choque em outras turmas
    const conflict1 = this.isTeacherBusyInOtherClass(
      s1.teacherId,
      s2.day,
      s2.period,
      classId,
      schedules,
      teachers
    );
    if (conflict1) {
      return {
        day: s2.day,
        period: s2.period,
        status: 'BLOCKED',
        reason: `Choque: ${s1.teacherId} está em ${conflict1}`
      };
    }

    const conflict2 = this.isTeacherBusyInOtherClass(
      s2.teacherId,
      s1.day,
      s1.period,
      classId,
      schedules,
      teachers
    );
    if (conflict2) {
      return {
        day: s2.day,
        period: s2.period,
        status: 'BLOCKED',
        reason: `Choque: ${s2.teacherId} está em ${conflict2}`
      };
    }

    // 3. Verificar preferência soft (AVOID)
    const soft1 = t1?.slotRestrictions?.[`${s2.day}_${s2.period}`] === 'AVOID';
    const soft2 = t2?.slotRestrictions?.[`${s1.day}_${s1.period}`] === 'AVOID';
    if (soft1 || soft2) {
      return {
        day: s2.day,
        period: s2.period,
        status: 'SOFT_WARNING_SWAP',
        reason: 'Permitido, mas em horário marcado como "Evitar"',
        deltaQualityScore: -2
      };
    }

    // Bônus se s2 era JANELA e s1 preenche horário anterior, ou se aproxima aulas do mesmo professor
    const classSlots = schedules[classId] || [];
    const createsGeminada = classSlots.some(
      s =>
        s.day === s2.day &&
        Math.abs(s.period - s2.period) === 1 &&
        s.teacherId === s1.teacherId &&
        !(s.day === s1.day && s.period === s1.period)
    );

    return {
      day: s2.day,
      period: s2.period,
      status: 'FREE_DIRECT_SWAP',
      reason: createsGeminada
        ? 'Troca Livre (Forma Dobradinha Ideal!)'
        : 'Troca 100% Livre de Conflitos',
      deltaQualityScore: createsGeminada ? 10 : 2
    };
  }

  /**
   * Calcula o Relatório "Situação do Horário" (Padrão Urânia+ situacaoDoHorarioController)
   */
  public analyzeScheduleQuality(
    schedules: Record<string, GridSlot[]>,
    teachers: TeacherSlot[]
  ): UraniaQualitySummary {
    let totalAllocatedSlots = 0;
    let totalHoles = 0;
    let totalGeminadasAchieved = 0;

    // Mapear horários de cada professor: teacherId -> day -> period[]
    const teacherTimeline: Record<string, Record<string, number[]>> = {};

    for (const [_classId, slots] of Object.entries(schedules)) {
      for (const s of slots) {
        if (!s.teacherId || s.teacherId === 'none' || s.subject === 'JANELA') {
          totalHoles++;
          continue;
        }
        totalAllocatedSlots++;
        if (!teacherTimeline[s.teacherId]) {
          teacherTimeline[s.teacherId] = {};
        }
        if (!teacherTimeline[s.teacherId][s.day]) {
          teacherTimeline[s.teacherId][s.day] = [];
        }
        if (!teacherTimeline[s.teacherId][s.day].includes(s.period)) {
          teacherTimeline[s.teacherId][s.day].push(s.period);
        }

        // Checar se forma dobradinha na turma
        const nextInClass = slots.find(
          other => other.day === s.day && other.period === s.period + 1 && other.teacherId === s.teacherId
        );
        if (nextInClass) totalGeminadasAchieved++;
      }
    }

    const dayNamePt: Record<string, string> = {
      monday: 'Seg',
      tuesday: 'Ter',
      wednesday: 'Qua',
      thursday: 'Qui',
      friday: 'Sex'
    };

    let totalTeacherJanelas = 0;
    let totalSingleLessonDays = 0;
    const teacherDefects: TeacherQualityDefect[] = [];
    const suggestions: UraniaQualitySummary['suggestions'] = [];

    for (const [teacherId, daysObj] of Object.entries(teacherTimeline)) {
      let tClasses = 0;
      let tJanelas = 0;
      const janelasLocations: string[] = [];
      const singleClassDays: string[] = [];
      const workingDays = Object.keys(daysObj);

      for (const [day, periods] of Object.entries(daysObj)) {
        const sorted = [...periods].sort((a, b) => a - b);
        tClasses += sorted.length;

        if (sorted.length === 1) {
          singleClassDays.push(dayNamePt[day] || day);
          totalSingleLessonDays++;
        }

        // Calcular janelas dentro do mesmo turno (Manhã 1..6, Tarde 7..10)
        const morning = sorted.filter(p => p <= 6);
        if (morning.length >= 2) {
          for (let p = morning[0] + 1; p < morning[morning.length - 1]; p++) {
            if (!morning.includes(p)) {
              tJanelas++;
              totalTeacherJanelas++;
              janelasLocations.push(`${dayNamePt[day] || day} (${p}º Hor)`);
            }
          }
        }

        const afternoon = sorted.filter(p => p >= 7);
        if (afternoon.length >= 2) {
          for (let p = afternoon[0] + 1; p < afternoon[afternoon.length - 1]; p++) {
            if (!afternoon.includes(p)) {
              tJanelas++;
              totalTeacherJanelas++;
              janelasLocations.push(`${dayNamePt[day] || day} (${p}º Hor Tarde)`);
            }
          }
        }
      }

      const penalty = tJanelas * 8 + singleClassDays.length * 4;
      const qualityScore = Math.max(40, Math.min(100, 100 - penalty));

      teacherDefects.push({
        teacherId,
        totalClasses: tClasses,
        janelasCount: tJanelas,
        janelasLocations,
        singleClassDays,
        workingDaysCount: workingDays.length,
        qualityScore
      });

      if (tJanelas > 0) {
        suggestions.push({
          id: `sug_${teacherId}`,
          teacherId,
          description: `Permutar ${ janelasLocations[0] } de ${teacherId} ou alocar Hora-Atividade Flutuante (HAF) na janela.`,
          impact: `+${Math.min(12, tJanelas * 4)}% Qualidade Docente`
        });
      }
    }

    // verificar professores com bloqueios rígidos que possam ser flexibilizados
    for (const t of teachers) {
      if (t.availableDays && t.availableDays.length > 0 && t.availableDays.length < 4) {
        suggestions.push({
          id: `sug_unlock_${t.teacherId}`,
          teacherId: t.teacherId,
          description: `Professor(a) ${t.teacherId} possui ${5 - t.availableDays.length} dias bloqueados. Liberar 1 dia elimina janelas residuais.`,
          impact: '+8% Índice Global Urânia'
        });
      }
    }

    teacherDefects.sort((a, b) => b.janelasCount - a.janelasCount || b.totalClasses - a.totalClasses);

    const rawDeduction = totalHoles * 3 + totalTeacherJanelas * 1.5 + totalSingleLessonDays * 0.8;
    const globalScore = Math.max(55, Math.min(100, Math.round(100 - rawDeduction / Math.max(1, Object.keys(schedules).length / 4))));

    return {
      globalScore,
      totalAllocatedSlots,
      totalHoles,
      totalTeacherJanelas,
      totalSingleLessonDays,
      totalGeminadasAchieved,
      teacherDefects,
      suggestions: suggestions.slice(0, 8)
    };
  }
}
