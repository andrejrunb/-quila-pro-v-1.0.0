import Database from '../database/Database';
import * as fs from 'fs';

/**
 * ScheduleImporter — Phase 910
 * Utilitário para importar grades horárias via CSV.
 */
export class ScheduleImporter {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Importa dados de um CSV para a tabela schedules.
   * Formato esperado: subject;teacherName;className;roomName;dayOfWeek;startTime;endTime
   */
  async importCSV(filePath: string): Promise<{ imported: number; errors: string[] }> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim() !== '');
    const errors: string[] = [];
    let importedCount = 0;

    // Pular cabeçalho se existir
    const dataLines = lines[0].toLowerCase().includes('subject') ? lines.slice(1) : lines;

    for (const line of dataLines) {
      const [subject, teacher, className, roomName, day, start, end] = line.split(';').map(s => s.trim());

      try {
        // 1. Resolver ClassId e RoomId (ou criar se não existir?)
        // Para simplificar, assumimos que já existem ou buscamos por nome
        const classObj = await this.db.get(`SELECT id FROM classes WHERE name = ?`, [className]);
        const roomObj = await this.db.get(`SELECT id FROM rooms WHERE name = ?`, [roomName]);

        if (!classObj || !roomObj) {
          errors.push(`Erro na linha [${line}]: Turma ou Sala não encontrada.`);
          continue;
        }

        // 2. Inserir na tabela schedules
        await this.db.run(`
          INSERT INTO schedules (id, classId, roomId, subject, teacher, dayOfWeek, startTime, endTime)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          `sch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          classObj.id,
          roomObj.id,
          subject,
          teacher,
          parseInt(day),
          start,
          end
        ]);

        importedCount++;
      } catch (err: any) {
        errors.push(`Erro ao processar linha [${line}]: ${err.message}`);
      }
    }

    return { imported: importedCount, errors };
  }
}
