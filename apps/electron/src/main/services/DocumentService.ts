import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import path from 'path';
import fs from 'fs';

export interface ReportCardPDFOptions {
  className?: string;
  ra?: string;
  period?: string;
  frequency?: {
    rate?: number;
    absences?: number;
    totalDays?: number;
  };
  parecer?: string;
  outputPath?: string;
}

/** Normalizes text for PDF StandardFonts (WinAnsi / Latin-1) so unsupported Unicode symbols never crash pdf-lib. */
export function sanitizeWinAnsi(text: unknown): string {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/\r\n|\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/\u00A0/g, ' ')
    .replace(/[\u2014\u2013]/g, '-')
    .replace(/\u2022/g, '*')
    .replace(/\u00B7/g, '-')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u2026/g, '...')
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '')
    .trim();
}

function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const clean = sanitizeWinAnsi(text);
  if (!clean) return [];
  const paragraphs = clean.split('\n');
  const lines: string[] = [];

  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      continue;
    }
    let currentLine = '';
    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
        currentLine = candidate;
      } else {
        if (currentLine) lines.push(currentLine);
        if (font.widthOfTextAtSize(word, fontSize) <= maxWidth) {
          currentLine = word;
        } else {
          let chunk = '';
          for (const ch of word) {
            if (font.widthOfTextAtSize(chunk + ch, fontSize) <= maxWidth) {
              chunk += ch;
            } else {
              if (chunk) lines.push(chunk);
              chunk = ch;
            }
          }
          currentLine = chunk;
        }
      }
    }
    if (currentLine) lines.push(currentLine);
  }
  return lines;
}

export class DocumentService {
  private reportsPath: string;

  constructor(reportsPath: string) {
    this.reportsPath = reportsPath;
    if (!fs.existsSync(this.reportsPath)) {
      fs.mkdirSync(this.reportsPath, { recursive: true });
    }
  }

  async generateTranscript(student: any, type: string = 'DECLARAÇÃO'): Promise<string> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Header
    page.drawText('SISTEMA ÁQUILA PRO', { x: 50, y: height - 50, size: 20, font, color: rgb(0, 0.2, 0.5) });
    page.drawText('GESTÃO EDUCACIONAL SOBERANA', { x: 50, y: height - 70, size: 8, font: regularFont, color: rgb(0.4, 0.4, 0.4) });

    // Title
    page.drawText(type.toUpperCase(), { x: width / 2 - 50, y: height - 150, size: 18, font });

    // Content
    const contentY = height - 250;
    const text = `Declaramos para os devidos fins que o(a) aluno(a) ${student.name}, 
matriculado(a) sob o registro ${student.matricula || 'N/A'}, frequenta regularmente 
o estabelecimento de ensino Áquila School na turma ${student.room || 'Pend'}.`;

    page.drawText(text, { 
      x: 50, 
      y: contentY, 
      size: 12, 
      font: regularFont,
      lineHeight: 20,
      maxWidth: 500
    });

    // Date & Signature
    const date = new Date().toLocaleDateString('pt-BR');
    page.drawText(`Gerado em: ${date}`, { x: 50, y: 100, size: 10, font: regularFont });
    page.drawRectangle({ x: width / 2 - 100, y: 150, width: 200, height: 1, color: rgb(0,0,0) });
    page.drawText('ASSINATURA DA SECRETARIA', { x: width / 2 - 60, y: 135, size: 8, font });

    // Save
    const fileName = `${type.toLowerCase()}_${student.id}_${Date.now()}.pdf`;
    const filePath = path.join(this.reportsPath, fileName);
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(filePath, pdfBytes);

    return filePath;
  }

  async generatePaystub(staff: any, payroll: any): Promise<string> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Header
    page.drawText('ÁQUILA PRO - HOLERITE AUTÔNOMO', { x: 50, y: height - 40, size: 14, font });
    page.drawRectangle({ x: 50, y: height - 50, width: 500, height: 1, color: rgb(0,0,0) });

    // Staff Info
    page.drawText(`Colaborador: ${staff.name}`, { x: 50, y: height - 80, size: 10, font });
    page.drawText(`Cargo: ${staff.role}`, { x: 50, y: height - 100, size: 10, font: regularFont });
    page.drawText(`Mês de Referência: ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`, { x: 350, y: height - 80, size: 10, font: regularFont });

    // Table Header
    page.drawRectangle({ x: 50, y: height - 140, width: 500, height: 20, color: rgb(0.9, 0.9, 0.9) });
    page.drawText('DESCRIÇÃO', { x: 60, y: height - 135, size: 8, font });
    page.drawText('PROVENTOS', { x: 350, y: height - 135, size: 8, font });
    page.drawText('DESCONTOS', { x: 450, y: height - 135, size: 8, font });

    // Values
    page.drawText('Salário Base', { x: 60, y: height - 165, size: 10, font: regularFont });
    page.drawText(`R$ ${payroll.gross?.toLocaleString()}`, { x: 350, y: height - 165, size: 10, font: regularFont });

    page.drawText('Impostos / Encargos', { x: 60, y: height - 185, size: 10, font: regularFont });
    page.drawText(`R$ ${payroll.tax?.toLocaleString()}`, { x: 450, y: height - 185, size: 10, font: regularFont });

    // Total
    page.drawRectangle({ x: 50, y: 100, width: 500, height: 30, color: rgb(0, 0.2, 0.4) });
    page.drawText('LÍQUIDO A RECEBER:', { x: 60, y: 110, size: 12, font, color: rgb(1,1,1) });
    page.drawText(`R$ ${payroll.net?.toLocaleString()}`, { x: 380, y: 110, size: 14, font, color: rgb(1,1,1) });

    // Save
    const fileName = `holerite_${staff.id}_${Date.now()}.pdf`;
    const filePath = path.join(this.reportsPath, fileName);
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(filePath, pdfBytes);

    return filePath;
  }

  async generateTeacherCard(teacher: any): Promise<string> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([250, 400]); // A6-ish vertical size
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Border
    page.drawRectangle({
      x: 5,
      y: 5,
      width: width - 10,
      height: height - 10,
      borderColor: rgb(0.06, 0.72, 0.50), // emerald green accent
      borderWidth: 2,
    });

    // Top Header Banner
    page.drawRectangle({
      x: 6,
      y: height - 80,
      width: width - 12,
      height: 74,
      color: rgb(0.06, 0.72, 0.50),
    });

    // School Title
    page.drawText('ÁQUILA PRO', { x: width / 2 - 45, y: height - 40, size: 14, font, color: rgb(1, 1, 1) });
    page.drawText('IDENTIDADE DOCENTE', { x: width / 2 - 55, y: height - 60, size: 8, font: regularFont, color: rgb(0.9, 0.9, 0.9) });

    // Photo Box Placeholder
    page.drawRectangle({
      x: width / 2 - 40,
      y: height - 190,
      width: 80,
      height: 90,
      color: rgb(0.9, 0.9, 0.95),
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1,
    });
    page.drawText('FOTO', { x: width / 2 - 15, y: height - 145, size: 10, font, color: rgb(0.5, 0.5, 0.5) });

    // Teacher Details
    page.drawText(teacher.name.toUpperCase(), { x: 20, y: height - 230, size: 11, font, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(`E-mail: ${teacher.email || 'N/A'}`, { x: 20, y: height - 250, size: 8, font: regularFont, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(`ID: ${teacher.id.toUpperCase()}`, { x: 20, y: height - 270, size: 8, font: regularFont, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(`Cargo: ${teacher.role === 'docente' ? 'Professor' : teacher.role}`, { x: 20, y: height - 290, size: 8, font: regularFont, color: rgb(0.3, 0.3, 0.3) });
    
    const isActive = (teacher.status || 'active') === 'active';
    page.drawText(`Status: ${isActive ? 'ATIVO' : 'INATIVO'}`, { 
      x: 20, 
      y: height - 310, 
      size: 8, 
      font, 
      color: isActive ? rgb(0, 0.5, 0) : rgb(0.7, 0, 0) 
    });

    // Footer with QR Code Placeholder
    page.drawRectangle({
      x: width / 2 - 20,
      y: 20,
      width: 40,
      height: 40,
      color: rgb(0.1, 0.1, 0.1),
    });
    page.drawText('VALIDAÇÃO SOBERANA', { x: width / 2 - 40, y: 10, size: 6, font: regularFont, color: rgb(0.5, 0.5, 0.5) });

    // Save
    const fileName = `cracha_${teacher.id}_${Date.now()}.pdf`;
    const filePath = path.join(this.reportsPath, fileName);
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(filePath, pdfBytes);

    return filePath;
  }

  async generateScheduleTemplate(filePath: string): Promise<string> {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Template Grade Horária');

    sheet.columns = [
      { header: 'Disciplina (Subject)', key: 'subject', width: 25 },
      { header: 'Nome do Professor (TeacherName)', key: 'teacherName', width: 30 },
      { header: 'Nome da Turma (ClassName)', key: 'className', width: 20 },
      { header: 'Nome da Sala (RoomName)', key: 'roomName', width: 20 },
      { header: 'Dia da Semana (DayOfWeek 1-5)', key: 'dayOfWeek', width: 25 },
      { header: 'Hora de Início (StartTime HH:MM)', key: 'startTime', width: 25 },
      { header: 'Hora de Fim (EndTime HH:MM)', key: 'endTime', width: 25 },
    ];

    // Example Row
    sheet.addRow({
      subject: 'Matemática',
      teacherName: 'Prof. Carlos de Souza',
      className: '1º Ano A',
      roomName: 'Sala 101',
      dayOfWeek: 1,
      startTime: '07:30',
      endTime: '08:20'
    });

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0078D4' } };

    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

  async generateReportCardPDF(
    student: any,
    grades: any[],
    options?: ReportCardPDFOptions
  ): Promise<string> {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595.28, 841.89]); // A4
    let { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const safeGrades = Array.isArray(grades) ? grades : [];
    const studentName = sanitizeWinAnsi(student?.name || `Aluno ${student?.id || ''}`) || 'Estudante';
    const studentId = sanitizeWinAnsi(student?.id || 'N/A');
    const className = sanitizeWinAnsi(options?.className || student?.className || '');
    const ra = sanitizeWinAnsi(options?.ra || student?.ra || '');
    const period = sanitizeWinAnsi(options?.period || '');

    // Header
    page.drawText('BOLETIM ESCOLAR BIMESTRAL', { x: 50, y: height - 50, size: 19, font, color: rgb(0.06, 0.55, 0.38) });
    page.drawText('AQUILA PRO - GESTAO EDUCACIONAL SOBERANA', { x: 50, y: height - 68, size: 8, font: regularFont, color: rgb(0.4, 0.4, 0.45) });

    // Student Info
    let y = height - 102;
    page.drawText(`Aluno: ${studentName}`, { x: 50, y, size: 12, font, color: rgb(0.1, 0.12, 0.16) });
    y -= 18;
    const metaParts = [`Matricula: ${studentId}`];
    if (ra) metaParts.push(`RA: ${ra}`);
    if (className) metaParts.push(`Turma: ${className}`);
    if (period) metaParts.push(`Periodo: ${period}`);
    page.drawText(metaParts.join('  |  '), { x: 50, y, size: 9.5, font: regularFont, color: rgb(0.25, 0.28, 0.35) });

    const isBimesterFormat = safeGrades.some(
      (g) => g && (g.avg !== undefined || g.b1 !== undefined || g.b2 !== undefined || g.b3 !== undefined || g.b4 !== undefined)
    );

    const ensurePageSpace = (minY: number) => {
      if (y < minY) {
        page = pdfDoc.addPage([595.28, 841.89]);
        ({ width, height } = page.getSize());
        y = height - 55;
      }
    };

    // Table Header
    y -= 28;
    page.drawRectangle({ x: 50, y: y - 5, width: width - 100, height: 22, color: rgb(0.92, 0.94, 0.97) });
    if (isBimesterFormat) {
      page.drawText('DISCIPLINA', { x: 60, y, size: 9.5, font, color: rgb(0.15, 0.18, 0.24) });
      page.drawText('1B', { x: 265, y, size: 9.5, font, color: rgb(0.15, 0.18, 0.24) });
      page.drawText('2B', { x: 315, y, size: 9.5, font, color: rgb(0.15, 0.18, 0.24) });
      page.drawText('3B', { x: 365, y, size: 9.5, font, color: rgb(0.15, 0.18, 0.24) });
      page.drawText('4B', { x: 415, y, size: 9.5, font, color: rgb(0.15, 0.18, 0.24) });
      page.drawText('MEDIA', { x: 475, y, size: 9.5, font, color: rgb(0.15, 0.18, 0.24) });
    } else {
      page.drawText('DISCIPLINA', { x: 60, y, size: 9.5, font, color: rgb(0.15, 0.18, 0.24) });
      page.drawText('TIPO', { x: 250, y, size: 9.5, font, color: rgb(0.15, 0.18, 0.24) });
      page.drawText('NOTA', { x: 380, y, size: 9.5, font, color: rgb(0.15, 0.18, 0.24) });
      page.drawText('PESO', { x: 480, y, size: 9.5, font, color: rgb(0.15, 0.18, 0.24) });
    }
    y -= 24;

    // Grades Loop
    let sumGrades = 0;
    let countGrades = 0;
    const fmtGrade = (val: unknown) => {
      if (val === null || val === undefined || val === '') return '-';
      const n = Number(val);
      return Number.isFinite(n) ? n.toFixed(1) : '-';
    };

    for (const g of safeGrades) {
      ensurePageSpace(95);
      const subjectLabel = sanitizeWinAnsi(g?.subject || 'Geral').slice(0, 34);
      if (isBimesterFormat) {
        const avgNum = Number(g?.avg ?? g?.value ?? 0);
        page.drawText(subjectLabel, { x: 60, y, size: 9, font: regularFont, color: rgb(0.12, 0.14, 0.18) });
        page.drawText(fmtGrade(g?.b1), { x: 265, y, size: 9, font: regularFont, color: rgb(0.2, 0.22, 0.28) });
        page.drawText(fmtGrade(g?.b2), { x: 315, y, size: 9, font: regularFont, color: rgb(0.2, 0.22, 0.28) });
        page.drawText(fmtGrade(g?.b3), { x: 365, y, size: 9, font: regularFont, color: rgb(0.2, 0.22, 0.28) });
        page.drawText(fmtGrade(g?.b4), { x: 415, y, size: 9, font: regularFont, color: rgb(0.2, 0.22, 0.28) });
        page.drawText(Number.isFinite(avgNum) ? avgNum.toFixed(1) : '-', { x: 475, y, size: 9, font, color: rgb(0.06, 0.45, 0.32) });
        if (Number.isFinite(avgNum)) {
          sumGrades += avgNum;
          countGrades++;
        }
      } else {
        const val = Number(g?.value ?? g?.avg ?? 0);
        const weight = Number(g?.weight ?? 1);
        page.drawText(subjectLabel, { x: 60, y, size: 9, font: regularFont, color: rgb(0.12, 0.14, 0.18) });
        page.drawText(sanitizeWinAnsi(g?.type || 'P1'), { x: 250, y, size: 9, font: regularFont, color: rgb(0.2, 0.22, 0.28) });
        page.drawText(Number.isFinite(val) ? val.toFixed(1) : '0.0', { x: 380, y, size: 9, font: regularFont, color: rgb(0.12, 0.14, 0.18) });
        page.drawText(Number.isFinite(weight) ? weight.toFixed(1) : '1.0', { x: 480, y, size: 9, font: regularFont, color: rgb(0.2, 0.22, 0.28) });
        if (Number.isFinite(val)) {
          sumGrades += val;
          countGrades++;
        }
      }

      y -= 18;
      page.drawLine({
        start: { x: 50, y: y + 5 },
        end: { x: width - 50, y: y + 5 },
        thickness: 0.5,
        color: rgb(0.88, 0.9, 0.94),
      });
    }

    // Average
    ensurePageSpace(110);
    const avg = countGrades > 0 ? sumGrades / countGrades : 0;
    y -= 12;
    page.drawRectangle({ x: 50, y: y - 6, width: width - 100, height: 24, color: rgb(0.06, 0.62, 0.43) });
    page.drawText('MEDIA GLOBAL:', { x: 60, y, size: 11, font, color: rgb(1, 1, 1) });
    page.drawText(avg.toFixed(2), { x: 475, y, size: 11.5, font, color: rgb(1, 1, 1) });

    // Frequency section (if provided)
    if (options?.frequency) {
      ensurePageSpace(95);
      y -= 34;
      const rate = options.frequency.rate ?? 0;
      const absences = options.frequency.absences ?? 0;
      const totalDays = options.frequency.totalDays ?? 0;
      page.drawText('FREQUENCIA ESCOLAR', { x: 50, y, size: 10, font, color: rgb(0.15, 0.18, 0.24) });
      y -= 16;
      page.drawText(
        sanitizeWinAnsi(`Taxa de Presenca: ${rate}%   |   Faltas Totais: ${absences}   |   Dias Letivos: ${totalDays}`),
        { x: 50, y, size: 9.5, font: regularFont, color: rgb(0.22, 0.25, 0.32) }
      );
    }

    // Parecer Pedagogico (wrapped multi-line)
    const parecerLines = options?.parecer ? wrapText(options.parecer, regularFont, 9.5, width - 116) : [];
    if (parecerLines.length > 0) {
      ensurePageSpace(95);
      y -= 30;
      page.drawText('PARECER PEDAGOGICO', { x: 50, y, size: 10, font, color: rgb(0.15, 0.18, 0.24) });
      y -= 16;
      for (const line of parecerLines) {
        ensurePageSpace(55);
        if (line) {
          page.drawText(line, { x: 58, y, size: 9.5, font: regularFont, color: rgb(0.2, 0.22, 0.28) });
        }
        y -= 14;
      }
    }

    // Save
    const safeId = studentId.replace(/[^a-zA-Z0-9_-]+/g, '_') || 'aluno';
    const fileName = `boletim_${safeId}_${Date.now()}.pdf`;
    const filePath = options?.outputPath
      ? path.resolve(options.outputPath)
      : path.join(this.reportsPath, fileName);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(filePath, pdfBytes);

    return filePath;
  }
}

