import Database from "../database/Database";
import { v4 as uuidv4 } from 'uuid';

export interface BillingEntry {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  pixCode: string;
  updatedAt: string;
}

/**
 * FinanceService (Passo 801)
 * Módulo de Gestão Financeira e Faturamento PIX.
 */
export class FinanceService {
  constructor(private db: Database) {}

  /**
   * Gera uma fatura PIX com token numérico local.
   */
  async createBilling(studentId: string, amount: number, dueDate: string): Promise<BillingEntry> {
    const student = await this.db.get('SELECT name FROM students WHERE id = ?', [studentId]);
    if (!student) throw new Error('Student not found');

    const id = uuidv4();
    // Gerar token numérico local (Ex: 0002012648...8000605051212...)
    // Para simplificar, usaremos um token de 32 caracteres numéricos.
    const pixCode = Array.from({length: 44}, () => Math.floor(Math.random() * 10)).join('');

    await this.db.run(`
      INSERT INTO billing (id, studentHash, amount, dueDate, status, pixCode, updatedAt)
      VALUES (?, ?, ?, ?, 'pending', ?, CURRENT_TIMESTAMP)
    `, [id, studentId, amount, dueDate, pixCode]);

    // Financial Glass: Audit Trail
    await this.db.run(`
      INSERT INTO audit_logs (table_name, action, record_id, data, timestamp, parent_hash, signature)
      VALUES ('billing', 'CREATE_INVOICE', ?, ?, CURRENT_TIMESTAMP, 'root', 'sig_pending')
    `, [id, JSON.stringify({ studentId, amount, pixCode: pixCode.substring(0, 10) + "..." })]);

    return {
      id,
      studentId,
      studentName: student.name,
      amount,
      dueDate,
      status: 'pending',
      pixCode,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Retorna todas as faturas pendentes ou pagas, incluindo prova de auditoria.
   */
  async getBillingHistory(studentId?: string): Promise<(BillingEntry & { auditSignature?: string })[]> {
    const query = studentId 
      ? `SELECT b.*, s.name as studentName, a.signature as auditSignature 
         FROM billing b 
         JOIN students s ON b.studentHash = s.id 
         LEFT JOIN audit_logs a ON b.id = a.record_id AND a.action = 'CREATE_INVOICE'
         WHERE b.studentHash = ? 
         ORDER BY b.dueDate DESC`
      : `SELECT b.*, s.name as studentName, a.signature as auditSignature 
         FROM billing b 
         JOIN students s ON b.studentHash = s.id 
         LEFT JOIN audit_logs a ON b.id = a.record_id AND a.action = 'CREATE_INVOICE'
         ORDER BY b.dueDate DESC`;
    
    const rows = await this.db.all(query, studentId ? [studentId] : []);
    return rows.map(r => ({
      ...r,
      studentId: r.studentHash,
      status: r.status as any,
      auditSignature: r.auditSignature
    }));
  }

  /**
   * Confirma o pagamento de uma fatura.
   */
  async confirmPayment(billingId: string): Promise<void> {
    await this.db.run(`
      UPDATE billing 
      SET status = 'paid', updatedAt = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [billingId]);
  }
}
