import { EventEmitter } from 'events';
import Database from '../database/Database';

/**
 * Interface para registro de presença
 */
export interface PresenceRecord {
  studentId: string;
  classId: string;
  date: Date;
  entryTime: Date;
  exitTime?: Date;
  duration: number; // em minutos
  status: 'present' | 'absent' | 'late';
  confidence: number;
}

/**
 * Classe para rastrear presença de alunos
 */
export class PresenceTracker extends EventEmitter {
  private db: Database;
  private activeStudents: Map<string, { entryTime: Date; cameraId: string }> = new Map();
  private presenceThreshold: number = 0.75; // 75% de presença = presente
  private classSchedule: Map<string, { startTime: Date; endTime: Date }> = new Map();

  constructor(db: Database) {
    super();
    this.db = db;
  }

  /**
   * Registra entrada de aluno
   */
  async recordEntry(studentId: string, classId: string, cameraId: string): Promise<void> {
    const key = `${studentId}-${classId}`;

    if (this.activeStudents.has(key)) {
      // Aluno já está registrado, atualizar câmera
      const existing = this.activeStudents.get(key)!;
      existing.cameraId = cameraId;
      return;
    }

    const now = new Date();
    this.activeStudents.set(key, { entryTime: now, cameraId });

    try {
      // Registrar no banco de dados
      await this.db.recordPresenceEntry({
        studentId,
        classId,
        entryTime: now,
        cameraId,
      });

      this.emit('entry', {
        studentId,
        classId,
        timestamp: now,
        cameraId,
      });

      console.log(`Entrada registrada: Aluno ${studentId} em sala ${classId}`);
    } catch (error) {
      this.emit('error', {
        type: 'entry',
        studentId,
        classId,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  /**
   * Registra saída de aluno
   */
  async recordExit(studentId: string, classId: string): Promise<void> {
    const key = `${studentId}-${classId}`;
    const entry = this.activeStudents.get(key);

    if (!entry) {
      console.warn(`Nenhuma entrada registrada para ${studentId} em ${classId}`);
      return;
    }

    const now = new Date();
    const duration = Math.round((now.getTime() - entry.entryTime.getTime()) / 60000); // em minutos

    this.activeStudents.delete(key);

    try {
      // Registrar no banco de dados
      await this.db.recordPresenceExit({
        studentId,
        classId,
        exitTime: now,
        duration,
      });

      this.emit('exit', {
        studentId,
        classId,
        timestamp: now,
        duration,
      });

      console.log(`Saída registrada: Aluno ${studentId} de sala ${classId} (${duration}min)`);
    } catch (error) {
      this.emit('error', {
        type: 'exit',
        studentId,
        classId,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  /**
   * Calcula presença de um aluno em uma aula
   */
  async calculatePresence(studentId: string, classId: string, date: Date): Promise<PresenceRecord | null> {
    try {
      const record = await this.db.getPresenceRecord(studentId, classId, date);

      if (!record) {
        return null;
      }

      // Calcular duração total em sala
      const classSchedule = this.classSchedule.get(classId);
      if (!classSchedule) {
        console.warn(`Horário da aula não configurado para ${classId}`);
        return null;
      }

      const totalClassDuration = Math.round(
        (classSchedule.endTime.getTime() - classSchedule.startTime.getTime()) / 60000
      );

      const attendancePercentage = (record.duration / totalClassDuration) * 100;

      const status = attendancePercentage >= this.presenceThreshold * 100 ? 'present' : 'absent';

      return {
        studentId,
        classId,
        date,
        entryTime: record.entryTime,
        exitTime: record.exitTime,
        duration: record.duration,
        status,
        confidence: Math.min(attendancePercentage / 100, 1),
      };
    } catch (error) {
      this.emit('error', {
        type: 'calculate',
        studentId,
        classId,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      return null;
    }
  }

  /**
   * Define horário de uma aula
   */
  setClassSchedule(classId: string, startTime: Date, endTime: Date): void {
    this.classSchedule.set(classId, { startTime, endTime });
  }

  /**
   * Obtém alunos ativos em sala
   */
  getActiveStudents(classId?: string): Array<{ studentId: string; classId: string; duration: number }> {
    const result: Array<{ studentId: string; classId: string; duration: number }> = [];
    const now = new Date();

    for (const [key, entry] of this.activeStudents) {
      const [studentId, cId] = key.split('-');

      if (classId && cId !== classId) {
        continue;
      }

      const duration = Math.round((now.getTime() - entry.entryTime.getTime()) / 60000);
      result.push({ studentId, classId: cId, duration });
    }

    return result;
  }

  /**
   * Define limiar de presença
   */
  setPresenceThreshold(threshold: number): void {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Limiar deve estar entre 0 e 1');
    }
    this.presenceThreshold = threshold;
  }

  /**
   * Limpa dados de rastreamento
   */
  clear(): void {
    this.activeStudents.clear();
    this.classSchedule.clear();
  }
}

export default PresenceTracker;
