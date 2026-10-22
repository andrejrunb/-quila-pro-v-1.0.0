/**
 * ExcelExporter.ts — Item 12: Exportador de Dados Excel
 * Gera planilhas .xlsx para exportação de dados de frequência e eventos.
 * Usa exceljs.
 */

import * as ExcelJS from 'exceljs';
import * as path from 'path';

export interface ExcelData {
  sheetName: string;
  columns: { header: string; key: string; width: number }[];
  rows: any[];
}

export class ExcelExporter {
  constructor(private readonly exportPath: string) {}

  /**
   * Exporta dados para um arquivo Excel.
   */
  async export(data: ExcelData): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(data.sheetName);

    worksheet.columns = data.columns;
    worksheet.addRows(data.rows);

    // Estilização Básica
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    const fileName = `Export_${data.sheetName}_${Date.now()}.xlsx`;
    const filePath = path.join(this.exportPath, fileName);
    
    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }
}

