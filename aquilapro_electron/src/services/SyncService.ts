import { EventEmitter } from 'events';
import * as os from 'os';
import * as crypto from 'crypto';
import Database from '../database/Database';

// Campos PROIBIDOS de sair do dispositivo (LGPD Art. 11)
const LGPD_BLOCKED_FIELDS = [
  'photo_path',
  'photoPath',
  'biometric_data',
  'biometricData',
  'vector',
  'face_encoding',
  'faceEncoding',
  'embedding',
  'raw_image',
] as const;

interface OutboxItem {
  id: string;
  event_type: string;
  payload: string; // JSON string
  created_at: string;
  synced: number;
}

interface SyncResult {
  synced: number;
  failed: number;
  skipped: number;
  timestamp: string;
}

// ... (SyncService class starts here)
export class SyncService extends EventEmitter {
  private intervalHandle: NodeJS.Timeout | null = null;
  private heartbeatHandle: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL_MS = 10 * 60 * 1_000;
  private readonly HEARTBEAT_INTERVAL_MS = 5 * 60 * 1_000;
  private cloudEndpoint: string;
  private cloudApiKey: string | null = null;
  private cloudId: string | null = null;
  private isSyncing = false;
  private lastSyncTime: string | null = null;
  private retryCount = 0;
  private readonly MAX_RETRIES = 5;

  constructor(
    private readonly db: Database,
    cloudEndpoint?: string
  ) {
    super();
    this.cloudEndpoint = cloudEndpoint || process.env.CLOUD_SYNC_URL || '';
  }

  getLastSyncTime(): string | null {
    return this.lastSyncTime;
  }

  // ─────────────────────────────────────────────
  // LIFECYCLE
  // ─────────────────────────────────────────────

  async start(): Promise<void> {
    if (this.intervalHandle) return;
    
    // Carregar configurações de nuvem residindo no banco
    await this._loadCloudConfig();

    console.log('[SyncService] Motor de sincronização iniciado (intervalo: 10min).');
    // Primeira execução após 30s
    setTimeout(() => this.sync(), 30_000);
    this.intervalHandle = setInterval(() => this.sync(), this.SYNC_INTERVAL_MS);

    // Iniciar Batimento Cardíaco se estiver matriculado
    if (this.cloudId && this.cloudApiKey) {
      console.log('[SyncService] Monitoramento de saúde (Heartbeat) iniciado.');
      this.heartbeatHandle = setInterval(() => {
        this.sendHeartbeat();
        this.pollParentSignals(); // Poll de PWA app (Mobile)
        this.pollBillingData();   // Poll de Financeiro (V3)
      }, 15_000); // Poll a cada 15 segs
      
      // Primeiro batimento imediato
      this.sendHeartbeat();
      this.pollParentSignals();
      this.pollBillingData();
    }
  }

  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    if (this.heartbeatHandle) {
      clearInterval(this.heartbeatHandle);
      this.heartbeatHandle = null;
    }
    console.log('[SyncService] Motor de sincronização e heartbeat parados.');
  }

  // ─────────────────────────────────────────────
  // PARENT PWA POLLING
  // ─────────────────────────────────────────────
  private async pollParentSignals(): Promise<void> {
    if (!this.cloudId || !this.cloudEndpoint) return;
    try {
      const response = await fetch(`${this.cloudEndpoint}/parent/signals?schoolId=${this.cloudId}`, {
        headers: { 'X-Aquila-Api-Key': this.cloudApiKey || '' }
      });
      if (!response.ok) return;
      
      const data = await response.json();
      if (data.success && data.signals && data.signals.length > 0) {
        for (const signal of data.signals) {
          if (signal.signal_type === 'drive_thru_arrival') {
            console.log(`[SyncService] Drive-Thru Detectado: Aluno Hash ${signal.student_hash}`);
            this.emit('parent-arrived', signal.student_hash);
          }
        }
      }
    } catch (err) {
      // Ignora silenciosamente
    }
  }

  /**
   * Sincroniza dados financeiros da nuvem para o desktop (V3)
   */
  private async pollBillingData(): Promise<void> {
    if (!this.cloudId || !this.cloudEndpoint) return;
    try {
      // Nota: Na V3 real, teríamos uma query que retorna apenas os deltas. 
      // Para o MVP, buscamos as faturas recentes da escola.
      const response = await fetch(`${this.cloudEndpoint}/parent/billing?schoolId=${this.cloudId}`, {
        headers: { 'X-Aquila-Api-Key': this.cloudApiKey || '' }
      });
      if (!response.ok) return;

      const data = await response.json();
      if (data.success && data.billing) {
        for (const bill of data.billing) {
          await this.db.upsertBilling({
            id: bill.id,
            studentHash: bill.student_hash,
            amount: bill.amount,
            dueDate: bill.due_date,
            status: bill.status,
            pixCode: bill.pix_code
          });
        }
        this.emit('billing-synced');
      }
    } catch (err) {
      // Ignora silenciosamente
    }
  }

  // ─────────────────────────────────────────────
  // SYNC PRINCIPAL
  // ─────────────────────────────────────────────

  async sync(): Promise<SyncResult> {
    if (this.isSyncing) return { synced: 0, failed: 0, skipped: 0, timestamp: new Date().toISOString() };
    
    this.isSyncing = true;
    this.emit('sync-start');
    const result: SyncResult = { synced: 0, failed: 0, skipped: 0, timestamp: new Date().toISOString() };

    try {
      const items = await this.db.getOutboxItems();

      if (items.length === 0) {
        this.lastSyncTime = result.timestamp;
        this.emit('sync-complete', result);
        return result;
      }

      for (const item of items) {
        try {
          const sanitized = this._sanitizePayload(item);
          if (!sanitized) {
            await this.db.markOutboxSynced(item.id, 'blocked_lgpd');
            result.skipped++;
            continue;
          }

          if (this.cloudEndpoint) {
            await this._sendToCloud(sanitized);
          }

          await this.db.markOutboxSynced(item.id, 'ok');
          result.synced++;
        } catch (err) {
          result.failed++;
          this.emit('sync-error', err);
          
          // Exponential backoff se falhou por rede
          if (this.retryCount < this.MAX_RETRIES) {
             this.retryCount++;
             const delay = Math.pow(2, this.retryCount) * 1000;
             console.log(`[SyncService] Falha de rede. Retentando em ${delay}ms...`);
             setTimeout(() => this.sync(), delay);
          }
          break; // Para o loop atual em falha de rede fatal
        }
      }

      this.retryCount = 0; // Resetar após sucesso ou loop finalizado
      this.lastSyncTime = result.timestamp;
      this.emit('sync-complete', result);
    } catch (err) {
      this.emit('sync-error', err);
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  // ─────────────────────────────────────────────
  // LGPD: SANITIZAÇÃO RIGOROSA
  // ─────────────────────────────────────────────

  /**
   * Remove TODOS os campos proibidos recursivamente.
   * Retorna null se o payload for inválido.
   */
  private _sanitizePayload(item: OutboxItem): Record<string, any> | null {
    let payload: Record<string, any>;
    try {
      payload = JSON.parse(item.payload);
    } catch {
      console.warn(`[SyncService] Payload inválido no item ${item.id}`);
      return null;
    }

    const sanitized = this._deepSanitize(payload);

    return {
      event_id: item.id,
      event_type: item.event_type,
      created_at: item.created_at,
      // Apenas dados agregados — nunca identificadores biométricos
      data: sanitized,
    };
  }

  /**
   * Remove campos LGPD bloqueados em qualquer profundidade do objeto.
   */
  private _deepSanitize(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this._deepSanitize(item));
    }
    if (obj !== null && typeof obj === 'object') {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        // Bloquear campos proibidos LGPD
        if ((LGPD_BLOCKED_FIELDS as readonly string[]).includes(key)) {
          console.warn(`[SyncService][LGPD] Campo bloqueado removido: "${key}"`);
          continue;
        }
        result[key] = this._deepSanitize(value);
      }
      return result;
    }
    return obj;
  }

  // ─────────────────────────────────────────────
  // MATRÍCULA E SAÚDE
  // ─────────────────────────────────────────────

  private async _loadCloudConfig(): Promise<void> {
    try {
      const settings = await this.db.getSettings();
      this.cloudId = settings.cloud_id || null;
      this.cloudApiKey = settings.cloud_api_key || null;
      if (settings.cloud_endpoint) {
        this.cloudEndpoint = settings.cloud_endpoint;
      }
    } catch (err) {
      console.error('[SyncService] Falha ao carregar cloud_config:', err);
    }
  }

  /**
   * Realiza a matrícula da escola na nuvem Áquila.
   */
  public async enroll(adminToken: string): Promise<{ success: boolean; cloudId?: string; message?: string }> {
    console.log('[SyncService] Iniciando processo de matrícula na nuvem...');
    try {
      const response = await fetch(`${this.cloudEndpoint}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminToken,
          hostname: os.hostname(),
          platform: os.platform(),
          version: '1.0.1'
        }),
        signal: AbortSignal.timeout(10_000)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        return { success: false, message: errData.message || `Erro HTTP ${response.status}` };
      }

      const data = await response.json();
      this.cloudId = data.cloudId;
      this.cloudApiKey = data.apiKey;

      // Salvar no banco
      await this.db.saveSettings({
        cloud_id: this.cloudId,
        cloud_api_key: this.cloudApiKey
      });

      // Reiniciar batimentos
      if (this.heartbeatHandle) clearInterval(this.heartbeatHandle);
      this.heartbeatHandle = setInterval(() => this.sendHeartbeat(), this.HEARTBEAT_INTERVAL_MS);
      this.sendHeartbeat();

      return { success: true, cloudId: this.cloudId ?? undefined };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * Envia métricas de saúde e status do hardware.
   */
  public async sendHeartbeat(): Promise<void> {
    if (!this.cloudId || !this.cloudApiKey) return;

    const metrics = {
      cpu: os.loadavg()[0],
      memFree: os.freemem(),
      memTotal: os.totalmem(),
      uptime: os.uptime(),
      timestamp: new Date().toISOString()
    };

    try {
      await this._sendToCloud({
        type: 'HEARTBEAT',
        metrics
      });
      console.log('[SyncService] Heartbeat enviado com sucesso.');
    } catch (err) {
      console.warn('[SyncService] Falha ao enviar heartbeat:', err);
    }
  }

  private async _sendToCloud(payload: Record<string, any>): Promise<void> {
    if (!this.cloudEndpoint) return;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Aquila-Version': '1.0.1',
      'X-Privacy-Mode': 'lgpd-compliant',
    };

    if (this.cloudApiKey) {
      headers['X-Aquila-Api-Key'] = this.cloudApiKey;
      headers['X-Aquila-Cloud-Id'] = this.cloudId || '';
      
      // HMAC Signature (v1606 - Digital Sovereignty)
      const signature = crypto
        .createHmac('sha256', this.cloudApiKey)
        .update(JSON.stringify(payload))
        .digest('hex');
      headers['X-Aquila-HMAC-SHA256'] = signature;
    }

    const response = await fetch(this.cloudEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8_000),
    });

    if (!response || !response.ok) {
      throw new Error(`Cloud sync failed: ${response ? `HTTP ${response.status}` : 'Null response'}`);
    }
  }

  /**
   * Registra uma ação de auditoria na fila de saída para sincronização (v1606)
   */
  public async queueAuditSync(action: string, userId: string, details: string): Promise<void> {
     await this.db.addOutboxItem('AUDIT_LOG', {
       action,
       userId,
       details,
       hostname: os.hostname(),
       v: '1606'
     });
  }
}
