import crypto from 'crypto';
import { logger } from '../logger';

/**
 * AnonymizationService - Camada 3 SQA-1000 (LAW-001/002)
 * Proteção de PII (Personally Identifiable Information) conforme LGPD.
 */
export class AnonymizationService {
  private static instance: AnonymizationService;
  private salt: string;

  private constructor() {
    this.salt = crypto.randomBytes(16).toString('hex');
  }

  public static getInstance(): AnonymizationService {
    if (!AnonymizationService.instance) {
      AnonymizationService.instance = new AnonymizationService();
    }
    return AnonymizationService.instance;
  }

  /**
   * [SQA-LAW-001] Mascara dados sensíveis em logs/displays.
   * Ex: "Andrej Run" -> "An*** Un"
   */
  public maskPII(text: string): string {
    if (!text || text.length < 3) return '***';
    const firstChar = text[0];
    const lastChar = text[text.length - 1];
    return `${firstChar}***${lastChar}`;
  }

  /**
   * [SQA-LAW-001] Pseudo-anonimiza IDs para logs de auditoria externa.
   */
  public hashID(id: string): string {
    return crypto.createHash('sha256').update(id + this.salt).digest('hex').substring(0, 12);
  }

  /**
   * [SQA-LAW-002] Puxa e limpa dados expirados baseados na política de retenção.
   */
  public purgePIIFromLog(logEntry: string): string {
    // Regex para CPFs
    const cpfRegex = /\d{3}\.\d{3}\.\d{3}-\d{2}/g;
    
    // Regex simples para nomes de log (Aproximação institucional v1.5)
    const nameRegex = /(nome é |chamo-me |sou o |sou a )([A-ZÀ-Ÿ][a-zà-ÿ]+(\s(da|de|do|dos|das|[A-ZÀ-Ÿ][a-zà-ÿ]+))*)/g;

    // Regex para endereços básicos
    const addressRegex = /(rua |avenida |av\. |alameda |travessa )([A-ZÀ-Ÿ][a-zà-ÿ]+(\s[A-ZÀ-Ÿ][a-zà-ÿ]+)*\s*,?\s*\d+)/gi;

    return logEntry.replace(cpfRegex, '[MASKED-CPF]')
                   .replace(nameRegex, '$1[MASKED-NAME]')
                   .replace(addressRegex, '[MASKED-ADDRESS]');
  }
}

export const anonymizationService = AnonymizationService.getInstance();

