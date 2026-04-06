/**
 * WhatsAppChatbot.ts — Serviço de Chatbot IA para WhatsApp (Lado Desktop)
 *
 * Responsabilidades:
 * - Gerar contexto do sistema (câmeras, alertas, resumo escolar)
 * - Manter histórico de conversa em memória (sessão local)
 * - Expor método para o aquila-cloud consultar dados em tempo real
 *
 * LGPD: nunca inclui fotos, dados biométricos ou CPF no contexto enviado.
 */

import Database from '../database/Database';
import Logger from './Logger';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export interface SystemContext {
  schoolName: string;
  camerasOnline: number;
  camerasTotal: number;
  activeAlerts: number;
  studentsPresent: number;
  lastUpdated: Date;
}

export class WhatsAppChatbot {
  private readonly logger: Logger;
  private history: ChatMessage[] = [];
  private readonly MAX_HISTORY = 30;

  constructor(private readonly db: Database) {
    this.logger = new Logger('WhatsAppChatbot');
  }

  // ─── Contexto do Sistema ────────────────────────────────────────────────────

  /**
   * Coleta dados em tempo real do banco para enriquecer o contexto do chatbot.
   * NÃO inclui dados biométricos (LGPD).
   */
  async getSystemContext(): Promise<SystemContext> {
    try {
      const settings = await this.db.getSettings();
      
      // Câmeras
      let camerasOnline = 0;
      let camerasTotal = 0;
      try {
        const cameras = await (this.db as any).getAllCameras?.() ?? [];
        camerasTotal = cameras.length;
        camerasOnline = cameras.filter((c: any) => c.status === 'online').length;
      } catch {
        // Método pode não existir em todas as versões
      }

      // Alertas ativos (últimas 24h)
      let activeAlerts = 0;
      try {
        const logs = await this.db.getAuditLogs(undefined as any);
        const yesterday = new Date(Date.now() - 86_400_000);
        activeAlerts = logs.filter((l: any) =>
          new Date(l.created_at) > yesterday &&
          (l.action?.includes('ALERT') || l.action?.includes('EVASAO') || l.action?.includes('ANOMAL'))
        ).length;
      } catch {
        // Silencia erro
      }

      // Alunos presentes hoje
      let studentsPresent = 0;
      try {
        const today = new Date().toISOString().slice(0, 10);
        const entries = await (this.db as any).getEntriesForDate?.(today) ?? [];
        const uniqueStudents = new Set(entries.map((e: any) => e.student_id));
        studentsPresent = uniqueStudents.size;
      } catch {
        // Silencia erro
      }

      return {
        schoolName: settings?.school_name ?? 'Escola',
        camerasOnline,
        camerasTotal,
        activeAlerts,
        studentsPresent,
        lastUpdated: new Date(),
      };
    } catch (err) {
      this.logger.error(`Erro ao coletar contexto do sistema: ${(err as Error).message}`);
      return {
        schoolName: 'Escola',
        camerasOnline: 0,
        camerasTotal: 0,
        activeAlerts: 0,
        studentsPresent: 0,
        lastUpdated: new Date(),
      };
    }
  }

  /**
   * Formata o contexto do sistema como texto para incluir no prompt do LLM.
   */
  async buildContextText(): Promise<string> {
    const ctx = await this.getSystemContext();
    return [
      `📊 *Status atual do sistema (${ctx.lastUpdated.toLocaleTimeString('pt-BR')})*`,
      `🏫 Escola: ${ctx.schoolName}`,
      `📹 Câmeras: ${ctx.camerasOnline}/${ctx.camerasTotal} online`,
      `⚠️ Alertas (últimas 24h): ${ctx.activeAlerts}`,
      `👥 Alunos presentes hoje: ${ctx.studentsPresent}`,
    ].join('\n');
  }

  // ─── Histórico de Conversa ──────────────────────────────────────────────────

  addUserMessage(text: string): void {
    this.history.push({ role: 'user', text, timestamp: new Date() });
    this._trimHistory();
  }

  addAssistantMessage(text: string): void {
    this.history.push({ role: 'assistant', text, timestamp: new Date() });
    this._trimHistory();
  }

  getHistory(): ChatMessage[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
    this.logger.info('Histórico de conversa do chatbot limpo.');
  }

  private _trimHistory(): void {
    if (this.history.length > this.MAX_HISTORY) {
      this.history = this.history.slice(-this.MAX_HISTORY);
    }
  }

  // ─── Formatação de Resposta ─────────────────────────────────────────────────

  /**
   * Formata a resposta da IA para WhatsApp:
   * - Remove markdown complexo não suportado pelo WhatsApp
   * - Mantém *negrito* e _itálico_ (suportados pelo WhatsApp)
   */
  static formatForWhatsApp(text: string): string {
    return text
      // Remove blocos de código (não renderizam bem no WhatsApp)
      .replace(/```[\s\S]*?```/g, '[ver no sistema]')
      // Remove headers markdown
      .replace(/^#{1,6}\s+/gm, '')
      // Limita linhas em branco consecutivas
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
