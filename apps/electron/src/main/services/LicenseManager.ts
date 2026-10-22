/**
 * LicenseManager.ts — Gestão de Planos e Limites (Tiering)
 * Valida o plano ativo e impõe hard limits sobre streams, faces e recursos.
 * Licença armazenada localmente em arquivo criptografado (AES-256 via Node crypto).
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { HardwareFingerprint } from './HardwareFingerprint';

// ─────────────────────────────────────────────
// DEFINIÇÃO DOS PLANOS
// ─────────────────────────────────────────────

export type PlanTier = 'starter' | 'pro' | 'elite' | 'perpetual';

export interface PlanLimits {
  maxCameraStreams: number;       // Streams RTSP simultâneos
  maxStudentFaces: number;        // Cadastros de faces/alunos
  whatsappQueueEnabled: boolean;  // Se true, limita envio WA
  whatsappRatePerHour: number;    // Msgs/hora (0 = ilimitado)
  heatmapEnabled: boolean;        // Módulo de heatmap de fluxo
  multiUnitEnabled: boolean;      // Suporte multi-unidade
  hrEnabled: boolean;             // Gestão de RH/Docente
  secretaryEnabled: boolean;      // Secretaria Digital
  messengerEnabled: boolean;      // Mensageiro Águia
  gamificationEnabled: boolean;   // Gamificação do Aluno
}

export const PLAN_DEFINITIONS: Record<PlanTier, PlanLimits> = {
  starter: {
    maxCameraStreams: 4,
    maxStudentFaces: 200,
    whatsappQueueEnabled: true,
    whatsappRatePerHour: 60,
    heatmapEnabled: false,
    multiUnitEnabled: false,
    hrEnabled: true,
    secretaryEnabled: true,
    messengerEnabled: false,
    gamificationEnabled: false,
  },
  pro: {
    maxCameraStreams: 12,
    maxStudentFaces: 500,
    whatsappQueueEnabled: false,
    whatsappRatePerHour: 0,
    heatmapEnabled: true,
    multiUnitEnabled: false,
    hrEnabled: true,
    secretaryEnabled: true,
    messengerEnabled: true,
    gamificationEnabled: true,
  },
  elite: {
    maxCameraStreams: Infinity,
    maxStudentFaces: Infinity,
    whatsappQueueEnabled: false,
    whatsappRatePerHour: 0,
    heatmapEnabled: true,
    multiUnitEnabled: true,
    hrEnabled: true,
    secretaryEnabled: true,
    messengerEnabled: true,
    gamificationEnabled: true,
  },
  perpetual: {
    maxCameraStreams: Infinity,
    maxStudentFaces: Infinity,
    whatsappQueueEnabled: false,
    whatsappRatePerHour: 0,
    heatmapEnabled: true,
    multiUnitEnabled: true,
    hrEnabled: true,
    secretaryEnabled: true,
    messengerEnabled: true,
    gamificationEnabled: true,
  },
};

// ─────────────────────────────────────────────
// ESTRUTURA DA LICENÇA
// ─────────────────────────────────────────────

interface LicensePayload {
  key: string;
  tier: PlanTier;
  school_id: string;
  school_name: string;
  issued_at: string;       // ISO date
  expires_at: string;      // ISO date
  hardware_id: string;     // Step 61: Unique HW Fingerprint
  signature: string;       // HMAC-SHA256 de key+tier+school_id+expires_at+hardware_id
}

const LICENSE_HMAC_SECRET = 'aquila-pro-license-v1-secret-2026';
const LICENSE_AES_KEY = crypto.scryptSync('aquila-license-key', 'aquila-salt', 32);
const LICENSE_AES_IV_LEN = 16;

// ─────────────────────────────────────────────
// MANAGER
// ─────────────────────────────────────────────

export class LicenseManager {
  private static instance: LicenseManager;
  private license: LicensePayload | null = null;
  private readonly licensePath: string;

  private constructor(userDataPath: string) {
    this.licensePath = path.join(userDataPath, 'license.enc');
  }

  static getInstance(userDataPath: string): LicenseManager {
    if (!LicenseManager.instance) {
      LicenseManager.instance = new LicenseManager(userDataPath);
    }
    return LicenseManager.instance;
  }

  // ─────────────────────────────────────────────
  // LOAD / ACTIVATE
  // ─────────────────────────────────────────────

  /** Carrega e valida a licença do disco. */
  load(): boolean {
    try {
      if (!fs.existsSync(this.licensePath)) {
        console.warn('[LicenseManager] Nenhuma licença encontrada. Rodando no plano Starter (trial).');
        return false;
      }

      const encrypted = fs.readFileSync(this.licensePath);
      const decrypted = this._decrypt(encrypted.toString('utf-8'));
      const payload: LicensePayload = JSON.parse(decrypted);

      if (!this._validateSignature(payload)) {
        console.error('[LicenseManager] Assinatura da licença inválida!');
        this.license = null;
        return false;
      }

      if (new Date(payload.expires_at) < new Date()) {
        console.warn('[LicenseManager] Licença expirada.');
        this.license = null;
        return false;
      }

      // Step 61: Hardware Lock Check
      const currentHW = HardwareFingerprint.getFingerprint();
      if (payload.hardware_id !== currentHW) {
        console.error('[LicenseManager] VIOLAÇÃO DE LICENÇA: Esta licença pertence a outro hardware!');
        this.license = null;
        return false;
      }

      this.license = payload;
      console.log(`[LicenseManager] Licença ativa: ${payload.tier.toUpperCase()} | Escola: ${payload.school_name}`);
      return true;
    } catch (err) {
      console.error('[LicenseManager] Erro ao carregar licença:', err);
      this.license = null;
      return false;
    }
  }

  /** Ativa uma nova licença a partir de uma chave de ativação JSON. */
  activate(licenseJson: string): boolean {
    try {
      const payload: LicensePayload = JSON.parse(licenseJson);

      if (!this._validateSignature(payload)) {
        throw new Error('Assinatura inválida. Licença adulterada ou falsa.');
      }

      if (new Date(payload.expires_at) < new Date()) {
        throw new Error('Esta licença já está expirada.');
      }

      const encrypted = this._encrypt(JSON.stringify(payload));
      fs.writeFileSync(this.licensePath, encrypted, 'utf-8');
      this.license = payload;
      console.log(`[LicenseManager] Licença ${payload.tier.toUpperCase()} ativada com sucesso.`);
      return true;
    } catch (err) {
      console.error('[LicenseManager] Falha ao ativar licença:', err);
      return false;
    }
  }

  // ─────────────────────────────────────────────
  // GETTERS
  // ─────────────────────────────────────────────

  getTier(): PlanTier {
    return this.license?.tier ?? 'starter';
  }

  getLimits(): PlanLimits {
    return PLAN_DEFINITIONS[this.getTier()];
  }

  isFeatureEnabled(feature: keyof PlanLimits): boolean {
    const limits = this.getLimits();
    const val = limits[feature];
    return typeof val === 'boolean' ? val : (val as number) > 0;
  }

  getLicenseInfo(): { tier: PlanTier; expires_at: string; school_name: string; active: boolean } {
    return {
      tier: this.getTier(),
      expires_at: this.license?.expires_at ?? 'N/A',
      school_name: this.license?.school_name ?? 'Modo Trial',
      active: this.license !== null,
    };
  }

  // ─────────────────────────────────────────────
  // HARD LIMIT CHECKS (usados pelos serviços)
  // ─────────────────────────────────────────────

  assertCameraLimit(currentStreams: number): void {
    const max = this.getLimits().maxCameraStreams;
    if (currentStreams >= max) {
      throw new Error(
        `[LIMITE DO PLANO] O plano ${this.getTier().toUpperCase()} permite no máximo ${max} câmeras simultâneas. ` +
        `Faça upgrade para adicionar mais câmeras.`
      );
    }
  }

  assertFaceLimit(currentFaces: number): void {
    const max = this.getLimits().maxStudentFaces;
    if (currentFaces >= max) {
      throw new Error(
        `[LIMITE DO PLANO] O plano ${this.getTier().toUpperCase()} permite no máximo ${max} alunos/faces cadastrados. ` +
        `Faça upgrade para cadastrar mais alunos.`
      );
    }
  }

  assertHeatmapEnabled(): void {
    if (!this.getLimits().heatmapEnabled) {
      throw new Error('[LIMITE DO PLANO] O módulo de Heatmap está disponível apenas no plano Pro, Elite ou Perpetual.');
    }
  }

  // ─────────────────────────────────────────────
  // CRIPTOGRAFIA LOCAL (AES-256-CBC)
  // ─────────────────────────────────────────────

  private _encrypt(text: string): string {
    const iv = crypto.randomBytes(LICENSE_AES_IV_LEN);
    const cipher = crypto.createCipheriv('aes-256-cbc', LICENSE_AES_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf-8'), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  private _decrypt(encryptedText: string): string {
    const [ivHex, dataHex] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(dataHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', LICENSE_AES_KEY, iv);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf-8');
  }

  private _validateSignature(payload: LicensePayload): boolean {
    const data = `${payload.key}|${payload.tier}|${payload.school_id}|${payload.expires_at}|${payload.hardware_id}`;
    const expected = crypto.createHmac('sha256', LICENSE_HMAC_SECRET).update(data).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(payload.signature, 'hex'), Buffer.from(expected, 'hex'));
  }
}

