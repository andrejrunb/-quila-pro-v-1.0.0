import Database from '../../database/Database';
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

  async importExcel(filePath: string): Promise<{ imported: number; errors: string[] }> {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.getWorksheet(1); // get first sheet
    const errors: string[] = [];
    let importedCount = 0;

    if (!sheet) {
      return { imported: 0, errors: ['Nenhuma planilha encontrada no arquivo Excel.'] };
    }

    // Colunas esperadas:
    // A: Disciplina (subject)
    // B: Nome do Professor (teacherName)
    // C: Nome da Turma (className)
    // D: Nome da Sala (roomName)
    // E: Dia da Semana (1-5)
    // F: Hora de Início (HH:MM)
    // G: Hora de Fim (HH:MM)

    for (let r = 2; r <= sheet.rowCount; r++) {
      const row = sheet.getRow(r);
      const subject = row.getCell(1).text?.trim();
      const teacherName = row.getCell(2).text?.trim();
      const className = row.getCell(3).text?.trim();
      const roomName = row.getCell(4).text?.trim();
      const dayStr = row.getCell(5).text?.trim();
      const startTime = row.getCell(6).text?.trim();
      const endTime = row.getCell(7).text?.trim();

      if (!subject && !teacherName && !className) {
        continue; // skip empty lines
      }

      if (!subject || !teacherName || !className || !roomName || !dayStr || !startTime || !endTime) {
        errors.push(`Erro na linha [${r}]: Dados incompletos.`);
        continue;
      }

      try {
        // 1. Encontrar ClassId, RoomId e TeacherId no DB
        const classObj = await this.db.get(`SELECT id FROM classes WHERE name = ?`, [className]);
        const roomObj = await this.db.get(`SELECT id FROM rooms WHERE name = ?`, [roomName]);
        const teacherObj = await this.db.get(`SELECT id FROM staff WHERE name = ?`, [teacherName]);

        if (!classObj) {
          errors.push(`Erro na linha [${r}]: Turma '${className}' não encontrada.`);
          continue;
        }
        if (!roomObj) {
          errors.push(`Erro na linha [${r}]: Sala '${roomName}' não encontrada.`);
          continue;
        }
        if (!teacherObj) {
          errors.push(`Erro na linha [${r}]: Professor '${teacherName}' não encontrado.`);
          continue;
        }

        // 2. Inserir na tabela schedules
        await this.db.run(`
          INSERT INTO schedules (id, classId, roomId, subject, teacherId, dayOfWeek, startTime, endTime)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          `sch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          classObj.id,
          roomObj.id,
          subject,
          teacherObj.id,
          parseInt(dayStr),
          startTime,
          endTime
        ]);

        importedCount++;
      } catch (err: any) {
        errors.push(`Erro na linha [${r}]: ${err.message}`);
      }
    }

    return { imported: importedCount, errors };
  }
}

