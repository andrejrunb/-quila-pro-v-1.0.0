import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { logger } from '../logger';

export interface SettlementData {
  studentName: string;
  studentId: string;
  totalDebt: number;
  settlementType: string;
  installments: number;
  installmentValue: number;
  totalSettlement: number;
}

/**
 * LEGAL DOCUMENT SERVICE (v407)
 * ----------------------------
 * Automação de documentos jurídicos soberanos.
 * Gera termos de confissão de dívida e acordos via PDF-Lib.
 */
export class LegalDocumentService {
  private static instance: LegalDocumentService;
  private docsPath: string;

  constructor() {
    this.docsPath = path.join(app.getPath('userData'), 'legal_docs');
    if (!fs.existsSync(this.docsPath)) {
      fs.mkdirSync(this.docsPath, { recursive: true });
    }
  }

  public static getInstance(): LegalDocumentService {
    if (!LegalDocumentService.instance) {
      LegalDocumentService.instance = new LegalDocumentService();
    }
    return LegalDocumentService.instance;
  }

  /**
   * Gera um PDF de Confissão de Dívida.
   */
  public async generateSettlementPDF(data: SettlementData): Promise<string> {
    logger.info(`[Legal] Gerando PDF para ${data.studentName} (${data.settlementType})`);

    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 800]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const { width, height } = page.getSize();
      const fontSize = 12;

      // Header
      page.drawText('ÁQUILA PRO - SISTEMA DE GESTÃO ESCOLAR SOBERANA', {
        x: 50,
        y: height - 50,
        size: 14,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.4),
      });

      page.drawText('TERMO DE CONFISSÃO E PARCELAMENTO DE DÍVIDA', {
        x: 50,
        y: height - 80,
        size: 12,
        font: boldFont,
      });

      // Body
      let cursorY = height - 120;
      const margin = 50;

      const lines = [
        `Pelo presente instrumento, o aluno(a) ${data.studentName} (ID: ${data.studentId}),`,
        `doravante denominado DEVEDOR, reconhece e confessa a dívida no valor de`,
        `R$ ${data.totalDebt.toFixed(2)} junto à Instituição de Ensino.`,
        '',
        `CONDIÇÕES DO ACORDO (Modalidade: ${data.settlementType}):`,
        `- Valor Total do Acordo: R$ ${data.totalSettlement.toFixed(2)}`,
        `- Parcelamento: ${data.installments}x de R$ ${data.installmentValue.toFixed(2)}`,
        '',
        'O não pagamento de qualquer parcela implicará no vencimento antecipado',
        'do saldo devedor e na rescisão imediata do presente acordo.',
        '',
        `Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`,
        '',
        '',
        '__________________________________________',
        'Assinatura do Responsável / Devedor',
        '',
        '__________________________________________',
        'Áquila Pro - Autonomous Financial Controller'
      ];

      for (const line of lines) {
        page.drawText(line, {
          x: margin,
          y: cursorY,
          size: fontSize,
          font: line.includes(':') ? boldFont : font,
        });
        cursorY -= 20;
      }

      const pdfBytes = await pdfDoc.save();
      const fileName = `Acordo_${data.studentId}_${Date.now()}.pdf`;
      const filePath = path.join(this.docsPath, fileName);

      fs.writeFileSync(filePath, pdfBytes);
      logger.info(`[Legal] PDF Salvo em: ${filePath}`);

      return filePath;
    } catch (error) {
      logger.error(`[Legal] Erro ao gerar PDF: ${error}`);
      throw error;
    }
  }
}
