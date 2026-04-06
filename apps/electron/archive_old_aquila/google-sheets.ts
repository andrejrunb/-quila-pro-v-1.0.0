import { ENV } from "../_core/env";

/**
 * Integração com Google Sheets para exportação de dados
 * Documentação: https://developers.google.com/sheets/api
 */

interface GoogleSheetsAppendResponse {
  success: boolean;
  updatedRows?: number;
  error?: string;
}

/**
 * Adiciona linhas a uma planilha do Google Sheets
 */
export async function appendToGoogleSheet(
  sheetName: string,
  values: (string | number | boolean)[][]
): Promise<GoogleSheetsAppendResponse> {
  try {
    if (!ENV.googleSheetsApiKey || !ENV.googleSheetsId) {
      throw new Error("Google Sheets não configurado");
    }

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${ENV.googleSheetsId}/values/${sheetName}!A:Z:append?key=${ENV.googleSheetsApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: values,
          majorDimension: "ROWS",
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Sheets error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return {
      success: true,
      updatedRows: data.updates?.updatedRows || values.length,
    };
  } catch (error) {
    console.error("[Google Sheets] Erro ao adicionar linhas:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Exporta contatos para Google Sheets
 */
export async function exportContactsToGoogleSheets(
  contacts: Array<{
    id: number;
    name: string;
    email: string;
    phone?: string;
    schoolName?: string;
    subject: string;
    status: string;
    createdAt: Date;
  }>
): Promise<GoogleSheetsAppendResponse> {
  const rows = contacts.map(c => [
    c.id,
    c.name,
    c.email,
    c.phone || "",
    c.schoolName || "",
    c.subject,
    c.status,
    c.createdAt.toISOString(),
  ]);

  return appendToGoogleSheet("Contatos", rows);
}

/**
 * Exporta alertas para Google Sheets
 */
export async function exportAlertsToGoogleSheets(
  alerts: Array<{
    id: number;
    type: string;
    studentName: string;
    timestamp: Date;
    location: string;
    priority: string;
    status: string;
  }>
): Promise<GoogleSheetsAppendResponse> {
  const rows = alerts.map(a => [
    a.id,
    a.type,
    a.studentName,
    a.timestamp.toISOString(),
    a.location,
    a.priority,
    a.status,
  ]);

  return appendToGoogleSheet("Alertas", rows);
}

/**
 * Exporta relatório diário para Google Sheets
 */
export async function exportDailyReportToGoogleSheets(
  date: Date,
  totalStudents: number,
  presentStudents: number,
  absentStudents: number,
  alertsCount: number,
  averageAttendance: number
): Promise<GoogleSheetsAppendResponse> {
  const rows = [[
    date.toISOString().split("T")[0],
    totalStudents,
    presentStudents,
    absentStudents,
    alertsCount,
    averageAttendance.toFixed(2),
  ]];

  return appendToGoogleSheet("Relatórios", rows);
}

/**
 * Exporta logs de mensagens para Google Sheets
 */
export async function exportMessageLogsToGoogleSheets(
  logs: Array<{
    id: number;
    type: string;
    recipient: string;
    subject: string;
    status: string;
    sentAt: Date;
  }>
): Promise<GoogleSheetsAppendResponse> {
  const rows = logs.map(l => [
    l.id,
    l.type,
    l.recipient,
    l.subject,
    l.status,
    l.sentAt.toISOString(),
  ]);

  return appendToGoogleSheet("Mensagens", rows);
}

/**
 * Cria uma nova planilha com headers
 */
export async function createGoogleSheetWithHeaders(
  sheetName: string,
  headers: string[]
): Promise<GoogleSheetsAppendResponse> {
  return appendToGoogleSheet(sheetName, [headers]);
}
