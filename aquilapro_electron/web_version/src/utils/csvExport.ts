/**
 * Utilitário para exportar dados em formato CSV
 */

interface ExportOptions {
  filename?: string;
  delimiter?: string;
  includeHeaders?: boolean;
}

/**
 * Converte um array de objetos para formato CSV
 */
export function convertToCSV(
  data: Record<string, unknown>[],
  options: ExportOptions = {}
): string {
  const {
    delimiter = ",",
    includeHeaders = true,
  } = options;

  if (!data || data.length === 0) {
    return "";
  }

  // Obter headers
  const headers = Object.keys(data[0]);

  // Criar linhas CSV
  const lines: string[] = [];

  // Adicionar headers se solicitado
  if (includeHeaders) {
    lines.push(headers.map((h) => escapeCSV(h)).join(delimiter));
  }

  // Adicionar dados
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      return escapeCSV(String(value ?? ""));
    });
    lines.push(values.join(delimiter));
  }

  return lines.join("\n");
}

/**
 * Escapa valores CSV para evitar problemas com delimitadores e quebras de linha
 */
function escapeCSV(value: string): string {
  // Se contém delimitador, quebra de linha ou aspas, envolver em aspas
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Baixa um arquivo CSV
 */
export function downloadCSV(
  csvContent: string,
  filename: string = "export.csv"
): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Exporta dados em CSV e baixa o arquivo
 */
export function exportToCSV(
  data: Record<string, unknown>[],
  filename: string = "export.csv",
  options: ExportOptions = {}
): void {
  const csvContent = convertToCSV(data, {
    ...options,
    filename,
  });

  if (!csvContent) {
    console.warn("Nenhum dado para exportar");
    return;
  }

  downloadCSV(csvContent, filename);
}

/**
 * Formata dados de contatos para exportação
 */
export function formatContactsForExport(
  contacts: Array<{
    id: number;
    name: string;
    email: string;
    phone?: string;
    schoolName?: string;
    subject: string;
    message: string;
    status: string;
    createdAt: Date | string;
    responseMessage?: string;
    respondedAt?: Date | string;
  }>
) {
  return contacts.map((contact) => ({
    ID: contact.id,
    Nome: contact.name,
    Email: contact.email,
    Telefone: contact.phone || "",
    Escola: contact.schoolName || "",
    Assunto: contact.subject,
    Mensagem: contact.message,
    Status: formatStatus(contact.status),
    "Data de Submissão": formatDate(contact.createdAt),
    "Mensagem de Resposta": contact.responseMessage || "",
    "Data de Resposta": contact.respondedAt ? formatDate(contact.respondedAt) : "",
  }));
}

/**
 * Formata status para exibição
 */
function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    new: "Novo",
    read: "Lido",
    responded: "Respondido",
    archived: "Arquivado",
  };
  return statusMap[status] || status;
}

/**
 * Formata data para exibição
 */
function formatDate(date: Date | string): string {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Gera nome de arquivo com timestamp
 */
export function generateFilename(prefix: string = "export"): string {
  const now = new Date();
  const timestamp = now.toISOString().split("T")[0];
  const time = now.toTimeString().split(" ")[0].replace(/:/g, "-");
  return `${prefix}_${timestamp}_${time}.csv`;
}
