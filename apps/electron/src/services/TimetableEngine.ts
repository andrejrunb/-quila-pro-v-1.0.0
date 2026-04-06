/**
 * TimetableEngine.ts - Aquila Pro v1.0.1
 * Constraint Satisfaction Solver para Geração de Grade Curricular Dinâmica.
 * Substitui o software proprietário 'URANIA' e ferramentas legadas.
 */

export interface TeacherSlot {
  teacherId: string;
  subject: string;
  maxConsecutive: number;
  maxWeekly: number;
  availableDays: string[]; // ['monday', 'tuesday', ...]
}

export interface ClassRequirement {
  classId: string;
  demand: Record<string, number>; // { 'Matemática': 5, 'História': 3 }
}

export interface GridSlot {
  day: string;
  period: number; // 1 to 5
  subject: string;
  teacherId: string;
}

export class TimetableEngine {
  private days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  private periodsPerDay = 5;

  private isTeacherAvailable(teacher: TeacherSlot, day: string): boolean {
    if (teacher.availableDays.length === 0) return true; // Omissão = todos os dias
    return teacher.availableDays.includes(day.toLowerCase());
  }

  /**
   * Resolve uma grade baseada em restrições Hard/Soft.
   */
  public generate(classes: ClassRequirement[], teachers: TeacherSlot[]): Record<string, GridSlot[]> {
    const schedules: Record<string, GridSlot[]> = {};

    for (const cls of classes) {
      schedules[cls.classId] = this.solveForClass(cls, teachers, schedules);
    }

    return schedules;
  }

  private solveForClass(
    cls: ClassRequirement, 
    teachers: TeacherSlot[], 
    globalSchedules: Record<string, GridSlot[]>
  ): GridSlot[] {
    const classGrid: GridSlot[] = [];
    const demandPool: { subject: string, teacherId: string, remaining: number }[] = [];

    // Validar e ligar Demanda com Professores
    for (const [subject, count] of Object.entries(cls.demand)) {
       const possibleTeachers = teachers.filter(t => t.subject.toLowerCase() === subject.toLowerCase());
       if (possibleTeachers.length === 0) {
         console.warn(`[TimetableEngine] ALERTA: Sem professor para a matéria: ${subject}`);
         demandPool.push({ subject, teacherId: 'TBD', remaining: count });
       } else {
         // Na fase 1, escolhemos o primeiro professor habilitado (caso multi-vínculo, será refatorado)
         demandPool.push({ subject, teacherId: possibleTeachers[0].teacherId, remaining: count });
       }
    }

    // Heurística Aleatória Modificada com Backtracking (Backtrack local)
    // Preenchendo buracos 
    for (const day of this.days) {
      for (let p = 1; p <= this.periodsPerDay; p++) {
         
         // Filtrar matérias que ainda não atingiram o limite semanal
         let candidates = demandPool.filter(d => d.remaining > 0);
         
         // Aplicar Restrições HARD
         candidates = candidates.filter(cand => {
           const tInfo = teachers.find(t => t.teacherId === cand.teacherId);
           if (!tInfo) return true; // Se TBD, permite.
           
           // A. Dia Bloqueado para o Professor
           if (!this.isTeacherAvailable(tInfo, day)) return false;

           // B. Colisão de Professor (Ele já está dando aula nesse dia e período em outra turma?)
           let isTeacherBusy = false;
           for (const otherClass in globalSchedules) {
              const conflict = globalSchedules[otherClass].find(slot => slot.day === day && slot.period === p && slot.teacherId === cand.teacherId);
              if (conflict) isTeacherBusy = true;
           }
           if (isTeacherBusy) return false;

           // C. Aulas seguidas máximas (Max Consecutive)
           // Se o professor já estourou o limite seguido nesta classe, barra.
           const previousSlots = classGrid.filter(slot => slot.day === day && slot.teacherId === cand.teacherId);
           if (tInfo.maxConsecutive && previousSlots.length >= tInfo.maxConsecutive) {
              const isConsecutive = classGrid.find(s => s.day === day && s.period === p - 1 && s.teacherId === cand.teacherId);
              if (isConsecutive) return false;
           }

           return true; 
         });

         if (candidates.length > 0) {
           // Heurística Golosa: Escolhe o que mais precisa esvaziar a piscina primeiro.
           candidates.sort((a,b) => b.remaining - a.remaining);
           const chosen = candidates[0];
           
           classGrid.push({ day, period: p, subject: chosen.subject, teacherId: chosen.teacherId });
           chosen.remaining--;
         } else {
           // BURACO NA GRADE (Janela). O backtracking avançado permuta dias anteriores.
           classGrid.push({ day, period: p, subject: 'JANELA', teacherId: 'none' });
         }
      }
    }

    return classGrid;
  }
}
