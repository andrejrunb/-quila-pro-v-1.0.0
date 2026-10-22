import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as schedule from 'node-schedule';
import Database from '../../database/Database';
import { WhatsAppQueue } from './WhatsAppQueue';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

/**
 * WeeklyReportService — Item 56
 * Gera relatórios semanais em PDF e envia para os pais via WhatsApp.
 */
export class WeeklyReportService {
  private job: schedule.Job | null = null;
  private readonly reportsDir: string;

  constructor(
    private readonly db: Database,
    private readonly whatsapp: WhatsAppQueue
  ) {
    this.reportsDir = path.join(app.getPath('userData'), 'reports', 'weekly');
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Inicia o agendamento (Toda Segunda às 08:00)
   */
  start(): void {
    if (this.job) return;
    
    // Teste: '*/5 * * * *' (a cada 5 min) | Produção: '0 8 * * 1'
    this.job = schedule.scheduleJob('0 8 * * 1', () => {
      console.log('[WeeklyReportService] Iniciando geração de relatórios semanais...');
      this.generateAllReports();
    });
  }

  stop(): void {
    if (this.job) {
      this.job.cancel();
      this.job = null;
    }
  }

  async generateAllReports(): Promise<void> {
    const students = await this.db.getStudents();
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    for (const student of students) {
      if (student.phone) {
        try {
          const pdfPath = await this.generateStudentPDF(student, lastWeek);
          this.whatsapp.enqueue({
            to: student.phone,
            body: `Olá! Segue o resumo semanal de presença do aluno ${student.name}.`,
            student_id: student.id,
            event_type: 'WEEKLY_REPORT'
          });
          console.log(`[WeeklyReportService] Relatório agendado para ${student.name}`);
        } catch (err) {
          console.error(`[WeeklyReportService] Erro ao gerar relatório para ${student.id}:`, err);
        }
      }
    }
  }

  private async generateStudentPDF(student: any, startDate: Date): Promise<string> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Mock de dados de presença para demonstração (Step 56 Pilot)
    const logs = await this.db.all(
      `SELECT logged_at, type FROM attendance_logs 
       WHERE student_id = ? AND logged_at > ? 
       ORDER BY logged_at DESC`,
      [student.id, startDate.toISOString()]
    );

    page.drawText('Áquila Pro - Resumo Semanal', { x: 50, y: height - 50, size: 20, font, color: rgb(0.2, 0.4, 0.8) });
    page.drawText(`Aluno: ${student.name}`, { x: 50, y: height - 80, size: 14 });
    page.drawText(`Período: ${startDate.toLocaleDateString()} - ${new Date().toLocaleDateString()}`, { x: 50, y: height - 100, size: 12 });

    let yOffset = height - 150;
    page.drawText('Registros Detectados:', { x: 50, y: yOffset, size: 12, font });
    yOffset -= 20;

    if (logs.length === 0) {
      page.drawText('- Nenhuma atividade detectada nesta semana.', { x: 50, y: yOffset, size: 10 });
    } else {
      for (const log of logs.slice(0, 10)) {
        const date = new Date(log.logged_at).toLocaleString();
        page.drawText(`• ${date} - ${log.type === 'entry' ? 'Entrada' : 'Saída'}`, { x: 60, y: yOffset, size: 10 });
        yOffset -= 15;
      }
      if (logs.length > 10) {
        page.drawText(`... e mais ${logs.length - 10} registros.`, { x: 60, y: yOffset, size: 10 });
      }
    }

    const pdfBytes = await pdfDoc.save();
    const filePath = path.join(this.reportsDir, `Weekly_${student.id}_${Date.now()}.pdf`);
    fs.writeFileSync(filePath, pdfBytes);
    
    return filePath;
  }
}

