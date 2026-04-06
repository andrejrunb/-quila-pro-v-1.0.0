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
}
