/**
 * GeminiNotebookService — cliente da API de notebooks do Gemini Notebook Enterprise
 * (NotebookLM Enterprise, Discovery Engine v1alpha, pré-GA).
 *
 * Métodos cobertos (documentação "Criar e gerenciar notebooks (API)"):
 *   notebooks.create | notebooks.get | notebooks.listRecentlyViewed | notebooks.batchDelete | notebooks:share
 *
 * Governança (AGENTS.md):
 *  - Nuvem Google é perímetro externo: desligado por padrão (opt-in via AQUILA_GEMINI_NOTEBOOK_ENABLED=1).
 *  - Título do notebook é sanitizado e NUNCA pode carregar dado de aluno (nome, CPF, e-mail).
 *  - Exclusão exige confirmação humana explícita (HITL) e é auditada.
 *  - Toda mutação grava trilha em zero_bypass_audits.
 *
 * Configuração por variáveis de ambiente (nenhum segredo no código):
 *  AQUILA_GEMINI_NOTEBOOK_ENABLED, AQUILA_GCP_PROJECT_NUMBER, AQUILA_GEMINI_NOTEBOOK_LOCATION (global|us|eu),
 *  AQUILA_GEMINI_NOTEBOOK_ACCESS_TOKEN (opcional; senão usa `gcloud auth print-access-token`).
 */
import { execFile } from 'child_process';
import { ZeroBypassAuditService } from './ZeroBypassAuditService';

export type NotebookRole =
  | 'PROJECT_ROLE_OWNER'
  | 'PROJECT_ROLE_WRITER'
  | 'PROJECT_ROLE_READER'
  | 'PROJECT_ROLE_NOT_SHARED';

export interface NotebookSummary {
  title: string;
  notebookId: string;
  emoji?: string;
  name?: string;
  metadata?: { userRole?: string; isShared?: boolean; isShareable?: boolean; lastViewed?: string };
}

export interface GeminiNotebookResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  code?: 'DISABLED' | 'NOT_CONFIGURED' | 'AUTH' | 'VALIDATION' | 'HTTP' | 'HITL_REQUIRED';
}

const PII_PATTERNS: RegExp[] = [
  /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/, // CPF
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i, // e-mail
  /\b(?:\+?55)?\s?\(?\d{2}\)?\s?9?\d{4}-?\d{4}\b/, // telefone BR
];

export class GeminiNotebookService {
  private static instance: GeminiNotebookService | null = null;

  public static getInstance(db?: any): GeminiNotebookService {
    if (!GeminiNotebookService.instance) {
      GeminiNotebookService.instance = new GeminiNotebookService(db);
    }
    return GeminiNotebookService.instance;
  }

  private readonly audit: ZeroBypassAuditService;
  private readonly fetchImpl: typeof fetch;

  public constructor(db?: any, fetchImpl?: typeof fetch) {
    this.audit = ZeroBypassAuditService.getInstance(db);
    this.fetchImpl = fetchImpl || (globalThis.fetch as typeof fetch);
  }

  // ---------------------------------------------------------------- config
  public getStatus(): { enabled: boolean; configured: boolean; location: string; projectNumber: string | null } {
    const enabled = process.env.AQUILA_GEMINI_NOTEBOOK_ENABLED === '1';
    const projectNumber = process.env.AQUILA_GCP_PROJECT_NUMBER || null;
    return {
      enabled,
      configured: enabled && !!projectNumber,
      location: process.env.AQUILA_GEMINI_NOTEBOOK_LOCATION || 'global',
      projectNumber,
    };
  }

  private baseUrl(): string {
    const { location, projectNumber } = this.getStatus();
    // Doc: ENDPOINT_LOCATION-discoveryengine.googleapis.com (us | eu | global)
    const host = `https://${location === 'us' || location === 'eu' ? location : 'global'}-discoveryengine.googleapis.com`;
    return `${host}/v1alpha/projects/${projectNumber}/locations/${location}`;
  }

  private gate(): GeminiNotebookResult | null {
    const s = this.getStatus();
    if (!s.enabled) {
      return { ok: false, code: 'DISABLED', error: 'Integração Gemini Notebook desligada (AQUILA_GEMINI_NOTEBOOK_ENABLED=1 para habilitar).' };
    }
    if (!s.projectNumber) {
      return { ok: false, code: 'NOT_CONFIGURED', error: 'Defina AQUILA_GCP_PROJECT_NUMBER.' };
    }
    return null;
  }

  private async token(): Promise<string> {
    if (process.env.AQUILA_GEMINI_NOTEBOOK_ACCESS_TOKEN) return process.env.AQUILA_GEMINI_NOTEBOOK_ACCESS_TOKEN;
    return new Promise((resolve, reject) => {
      execFile('gcloud', ['auth', 'print-access-token'], { shell: process.platform === 'win32', timeout: 15000 }, (err, stdout) => {
        if (err) return reject(new Error('Falha ao obter token (gcloud auth login necessário).'));
        resolve(String(stdout).trim());
      });
    });
  }

  // ---------------------------------------------------------------- helpers
  public static sanitizeTitle(raw: string): GeminiNotebookResult<string> {
    const title = String(raw || '').replace(/[\u0000-\u001F]/g, ' ').trim().slice(0, 120);
    if (!title) return { ok: false, code: 'VALIDATION', error: 'Título vazio.' };
    if (PII_PATTERNS.some(re => re.test(title))) {
      return { ok: false, code: 'VALIDATION', error: 'Título contém dado pessoal (CPF/e-mail/telefone). Bloqueado (LGPD).' };
    }
    return { ok: true, data: title };
  }

  private async call<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<GeminiNotebookResult<T>> {
    let token: string;
    try {
      token = await this.token();
    } catch (e: any) {
      return { ok: false, code: 'AUTH', error: e.message };
    }
    try {
      const res = await this.fetchImpl(`${this.baseUrl()}${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};
      if (!res.ok) {
        return { ok: false, code: 'HTTP', error: json?.error?.message || `HTTP ${res.status}` };
      }
      return { ok: true, data: json as T };
    } catch (e: any) {
      return { ok: false, code: 'HTTP', error: e.message };
    }
  }

  private async record(userId: string, action: string, details: string, metadata: Record<string, unknown>) {
    try {
      await this.audit.record({ userId, action, details, metadata, legalBasis: 'SECURITY_DEFENSE' });
    } catch {
      /* auditoria nunca deve derrubar a UI, mas falha fica no log do serviço de auditoria */
    }
  }

  // ---------------------------------------------------------------- API
  public async createNotebook(userId: string, title: string): Promise<GeminiNotebookResult<NotebookSummary>> {
    const blocked = this.gate();
    if (blocked) return blocked as GeminiNotebookResult<NotebookSummary>;
    const t = GeminiNotebookService.sanitizeTitle(title);
    if (!t.ok) return t as unknown as GeminiNotebookResult<NotebookSummary>;
    const r = await this.call<NotebookSummary>('POST', '/notebooks', { title: t.data });
    if (r.ok) await this.record(userId, 'GEMINI_NOTEBOOK_CREATED', `Notebook criado: ${t.data}`, { notebookId: r.data?.notebookId });
    return r;
  }

  public async getNotebook(notebookId: string): Promise<GeminiNotebookResult<NotebookSummary>> {
    const blocked = this.gate();
    if (blocked) return blocked as GeminiNotebookResult<NotebookSummary>;
    return this.call<NotebookSummary>('GET', `/notebooks/${encodeURIComponent(notebookId)}`);
  }

  public async listRecentNotebooks(pageSize = 20): Promise<GeminiNotebookResult<{ notebooks: NotebookSummary[] }>> {
    const blocked = this.gate();
    if (blocked) return blocked as GeminiNotebookResult<{ notebooks: NotebookSummary[] }>;
    const size = Math.min(Math.max(1, pageSize), 100);
    const r = await this.call<{ notebooks?: NotebookSummary[] }>('GET', `/notebooks:listRecentlyViewed?pageSize=${size}`);
    return r.ok ? { ok: true, data: { notebooks: r.data?.notebooks || [] } } : (r as any);
  }

  public async shareNotebook(
    userId: string,
    notebookId: string,
    recipients: Array<{ email: string; role: NotebookRole }>,
  ): Promise<GeminiNotebookResult> {
    const blocked = this.gate();
    if (blocked) return blocked;
    const valid = recipients.filter(r => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email));
    if (!valid.length) return { ok: false, code: 'VALIDATION', error: 'Nenhum e-mail válido.' };
    const r = await this.call('POST', `/notebooks/${encodeURIComponent(notebookId)}:share`, {
      accountAndRoles: valid.map(v => ({ email: v.email, role: v.role })),
    });
    if (r.ok) {
      // e-mails não vão para o log em claro: só contagem + hash curto é suficiente para rastrear
      await this.record(userId, 'GEMINI_NOTEBOOK_SHARED', `Notebook ${notebookId} compartilhado`, { notebookId, recipients: valid.length });
    }
    return r;
  }

  /** Exclusão definitiva: exige aprovação humana registrada (HITL). */
  public async deleteNotebook(userId: string, notebookId: string, humanApproval: { approvedBy: string; confirm: boolean }): Promise<GeminiNotebookResult> {
    const blocked = this.gate();
    if (blocked) return blocked;
    if (!humanApproval?.confirm || !humanApproval.approvedBy) {
      return { ok: false, code: 'HITL_REQUIRED', error: 'Exclusão exige aprovação humana (responsável + confirmação).' };
    }
    const { projectNumber, location } = this.getStatus();
    const name = `projects/${projectNumber}/locations/${location}/notebooks/${notebookId}`;
    const r = await this.call('POST', '/notebooks:batchDelete', { names: [name] });
    if (r.ok) {
      await this.record(userId, 'GEMINI_NOTEBOOK_DELETED', `Notebook ${notebookId} excluído`, { notebookId, approvedBy: humanApproval.approvedBy });
    }
    return r;
  }
}

export default GeminiNotebookService;
