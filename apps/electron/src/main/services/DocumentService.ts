import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import path from 'path';
import fs from 'fs';

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

  async generateReportCardPDF(student: any, grades: any[]): Promise<string> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Header
    page.drawText('BOLETIM ESCOLAR BIMESTRAL', { x: 50, y: height - 50, size: 20, font, color: rgb(0.06, 0.72, 0.50) });
    page.drawText('ÁQUILA PRO - GESTÃO EDUCACIONAL SOBERANA', { x: 50, y: height - 70, size: 8, font: regularFont, color: rgb(0.4, 0.4, 0.4) });

    // Student Info
    page.drawText(`Aluno: ${student.name}`, { x: 50, y: height - 120, size: 12, font });
    page.drawText(`Matrícula: ${student.id}`, { x: 50, y: height - 140, size: 10, font: regularFont });

    // Table Header
    let y = height - 180;
    page.drawRectangle({ x: 50, y: y - 5, width: width - 100, height: 20, color: rgb(0.9, 0.9, 0.95) });
    page.drawText('DISCIPLINA', { x: 60, y, size: 10, font });
    page.drawText('TIPO', { x: 250, y, size: 10, font });
    page.drawText('NOTA', { x: 380, y, size: 10, font });
    page.drawText('PESO', { x: 480, y, size: 10, font });
    y -= 25;

    // Grades Loop
    let sumGrades = 0;
    let countGrades = 0;

    for (const g of grades) {
      if (y < 80) {
        break;
      }
      page.drawText(g.subject || 'Geral', { x: 60, y, size: 9, font: regularFont });
      page.drawText(g.type || 'P1', { x: 250, y, size: 9, font: regularFont });
      page.drawText(g.value.toFixed(1), { x: 380, y, size: 9, font: regularFont });
      page.drawText(g.weight.toFixed(1), { x: 480, y, size: 9, font: regularFont });
      
      sumGrades += g.value;
      countGrades++;
      y -= 18;

      page.drawLine({
        start: { x: 50, y: y + 5 },
        end: { x: width - 50, y: y + 5 },
        thickness: 0.5,
        color: rgb(0.9, 0.9, 0.9)
      });
    }

    // Average
    const avg = countGrades > 0 ? (sumGrades / countGrades) : 0;
    y -= 20;
    page.drawRectangle({ x: 50, y: y - 5, width: width - 100, height: 25, color: rgb(0.06, 0.72, 0.50) });
    page.drawText('MÉDIA GLOBAL:', { x: 60, y, size: 11, font, color: rgb(1, 1, 1) });
    page.drawText(avg.toFixed(2), { x: 480, y, size: 12, font, color: rgb(1, 1, 1) });

    // Save
    const fileName = `boletim_${student.id}_${Date.now()}.pdf`;
    const filePath = path.join(this.reportsPath, fileName);
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(filePath, pdfBytes);

    return filePath;
  }
}

