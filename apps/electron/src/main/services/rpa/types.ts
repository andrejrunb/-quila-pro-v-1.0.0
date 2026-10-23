/**
 * Áquila Pro — RPA & External Integrations Engine
 * Definições de Tipos para SigaWeb (Acadêmico/Frequência) e Domínio Sistemas (Contábil/Financeiro)
 */

export type RpaWorkerType = 'SIGAWEB' | 'DOMINIO';
export type RpaTriggerType = 'MANUAL' | 'CRON' | 'EVENT';
export type RpaExecutionStatus = 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'RUNNING';

export interface SigaWebConfig {
  portalUrl: string;
  institutionCode: string;
  username: string;
  encryptedPassword?: string;
  autoSyncEnabled: boolean;
  dailySyncCron: string; // ex: '0 30 18 * * 1-5' (Seg a Sex às 18:30)
  retryAttempts: number;
  timeoutMs: number;
  headless: boolean;
}

export interface DominioConfig {
  integrationType: 'HOT_FOLDER' | 'DIRECT_API' | 'BOTH';
  hotFolderPath: string; // ex: 'C:\\Dominio\\Importador\\Entrada'
  apiEndpoint?: string;
  apiToken?: string;
  companyCode: string; // Código da Empresa no Domínio (ex: '0001')
  filialCode: string;  // Código da Filial (ex: '001')
  bankAccountCode: string; // Conta Contábil Bancária (ex: '1.1.1.02.001')
  incomeAccountCode: string; // Conta Contábil de Receita (ex: '3.1.1.01.001')
  receivableAccountCode: string; // Conta de Clientes a Receber (ex: '1.1.2.01.001')
  costCenterCode?: string;
  autoSyncEnabled: boolean;
  dailySyncCron: string; // ex: '0 55 23 * * *' (Todo dia às 23:55)
}

export interface RpaExecutionLog {
  id: string;
  workerType: RpaWorkerType;
  triggerType: RpaTriggerType;
  status: RpaExecutionStatus;
  recordsCount: number;
  durationMs: number;
  details: string;
  protocol?: string;
  checksum?: string;
  error?: string;
  createdAt: string;
}

export interface AttendanceStudentEntry {
  studentId: string;
  studentName: string;
  registrationNumber: string; // RA do aluno
  status: 'present' | 'absent';
  timeInClassMinutes?: number;
  facialConfidence?: number;
}

export interface SigaWebJournalBatch {
  classId: string;
  className: string;
  sigaClassCode?: string;
  date: string; // YYYY-MM-DD
  teacherId?: string;
  teacherName?: string;
  discipline?: string;
  period?: string;
  totalPresent: number;
  totalAbsent: number;
  students: AttendanceStudentEntry[];
  batchChecksum: string;
}

export interface SigaWebSyncResult {
  success: boolean;
  classId: string;
  date: string;
  protocol: string;
  presentCount: number;
  absentCount: number;
  discrepancies?: string[];
  durationMs: number;
  message: string;
}

export interface DominioInvoiceEntry {
  id: string;
  studentId: string;
  studentName: string;
  registrationNumber: string;
  cpfCnpj?: string;
  titleNumber: string; // Número do Título (ex: FAT202610-02)
  quota: number;       // Parcela (ex: 10)
  amount: number;
  issueDate: string;   // YYYY-MM-DD
  dueDate: string;     // YYYY-MM-DD
  paidDate?: string;   // YYYY-MM-DD
  status: 'pending' | 'paid' | 'overdue';
  paymentMethod?: 'PIX' | 'BOLETO' | 'CARTAO' | 'DINHEIRO';
  pixEndToEndId?: string;
}

export interface DominioExportResult {
  success: boolean;
  periodStart: string;
  periodEnd: string;
  totalRecords: number;
  totalAmount: number;
  accountingFilePath?: string;
  financialFilePath?: string;
  apiSynced: boolean;
  batchChecksum: string;
  durationMs: number;
  message: string;
}
