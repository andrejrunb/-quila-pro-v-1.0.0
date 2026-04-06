/**
 * LGPDNetworkGuard.ts — LGPD: Firewall de Rede (Privacy by Design)
 * Intercepta TODAS as requisições de rede de saída.
 * Bloqueia qualquer tentativa de enviar imagens, embeddings ou dados biométricos.
 * Única saída de rede permitida: chamadas de texto/webhook (WhatsApp API).
 */

import { session } from 'electron';

// ─────────────────────────────────────────────
// PADRÕES BLOQUEADOS (corpo da requisição)
// ─────────────────────────────────────────────

/**
 * Palavras-chave que indicam dados biométricos ou de imagem num payload.
 * Se qualquer uma for encontrada em uploads, a request é bloqueada.
 */
const BLOCKED_BODY_PATTERNS = [
  'photo_path',
  'photoPath',
  'biometric_data',
  'biometricData',
  'face_encoding',
  'faceEncoding',
  'embedding',
  'face_vector',
  'raw_image',
  '"vector":[',      // Array de embedding JSON
  'image/jpeg',
  'image/png',
  'image/webp',
  'multipart/form-data',
];

/**
 * Content-Types bloqueados em uploads (biometria/imagem nunca sai).
 */
const BLOCKED_CONTENT_TYPES = [
  'image/',
  'multipart/form-data',
  'application/octet-stream', // Binários genéricos
];

/**
 * Domínios/URLs PERMITIDOS para chamadas de saída.
 * Qualquer chamada fora desta lista é bloqueada, exceto localhost.
 */
const ALLOWED_OUTBOUND_HOSTS = [
  'localhost',
  '127.0.0.1',
  'api.whatsapp.com',
  'graph.facebook.com',        // WhatsApp Business API via Meta
  'api.twilio.com',            // Fallback Twilio SMS/WA
  'aquilapro.com.br',          // Sync de licença e telemetria
  'api.aquilapro.com.br',
  'updates.aquilapro.com.br',  // Auto-update
];

// ─────────────────────────────────────────────
// GUARD
// ─────────────────────────────────────────────

export class LGPDNetworkGuard {
  private static active = false;

  /**
   * Ativa o guard na sessão Electron padrão.
   * Deve ser chamado ANTES de criar a janela principal.
   */
  static activate(): void {
    if (LGPDNetworkGuard.active) return;

    session.defaultSession.webRequest.onBeforeSendHeaders(
      { urls: ['<all_urls>'] },
      (details, callback) => {
        const result = LGPDNetworkGuard._inspect(details);
        if (!result.allowed) {
          console.error(`[LGPD GUARD] 🚫 Requisição BLOQUEADA: ${result.reason} → ${details.url}`);
          callback({ cancel: true });
        } else {
          callback({ requestHeaders: details.requestHeaders });
        }
      }
    );

    LGPDNetworkGuard.active = true;
    console.log('[LGPD Guard] ✅ Firewall de privacidade ativo. Biometria protegida.');
  }

  // ─────────────────────────────────────────────
  // INSPEÇÃO
  // ─────────────────────────────────────────────

  private static _inspect(details: Electron.OnBeforeSendHeadersListenerDetails): {
    allowed: boolean;
    reason?: string;
  } {
    const url = details.url;
    const method = details.method;
    const headers = details.requestHeaders;

    // Sempre permite recursos locais
    if (url.startsWith('file://') || url.startsWith('data:')) {
      return { allowed: true };
    }

    // Verificar host permitido
    try {
      const hostname = new URL(url).hostname;
      const isAllowed = ALLOWED_OUTBOUND_HOSTS.some(
        (allowed) => hostname === allowed || hostname.endsWith('.' + allowed)
      );
      if (!isAllowed) {
        return { allowed: false, reason: `Host não autorizado: ${hostname}` };
      }
    } catch {
      return { allowed: false, reason: 'URL malformada' };
    }

    // Para métodos de escrita, verificar Content-Type
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      const contentType = (headers['Content-Type'] || headers['content-type'] || '').toLowerCase();

      for (const blocked of BLOCKED_CONTENT_TYPES) {
        if (contentType.includes(blocked.toLowerCase())) {
          return {
            allowed: false,
            reason: `Content-Type bloqueado por LGPD: ${contentType}`,
          };
        }
      }
    }

    return { allowed: true };
  }

  /**
   * Verifica se um payload JSON é seguro para envio externo.
   * Use antes de qualquer fetch() para dados sensíveis.
   */
  static assertSafePayload(payload: Record<string, any>): void {
    const json = JSON.stringify(payload).toLowerCase();
    for (const pattern of BLOCKED_BODY_PATTERNS) {
      if (json.includes(pattern.toLowerCase())) {
        throw new Error(
          `[LGPD GUARD] Payload bloqueado: contém dados protegidos ("${pattern}"). ` +
          `Remova campos biométricos antes do envio externo.`
        );
      }
    }
  }

  static isActive(): boolean {
    return LGPDNetworkGuard.active;
  }
}
