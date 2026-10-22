/**
 * [SQA-SEC-990] RateLimiter.ts
 * Utilitário soberano para prevenção de abuso e ataques de força bruta.
 * Implementa um algoritmo de Sliding Window em memória.
 */

export interface RateLimitOptions {
  windowMs: number; // Janela de tempo em milissegundos
  max: number;      // Máximo de requisições por janela
  message?: string; // Mensagem de erro customizada
}

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  /**
   * Verifica se uma chave (IP, UserID, ou Nome do Comando) excedeu o limite.
   * @returns true se o limite foi atingido, false caso contrário.
   */
  public isRateLimited(key: string, options: RateLimitOptions): boolean {
    const now = Date.now();
    const windowStart = now - options.windowMs;

    // Obter timestamps das requisições anteriores para esta chave
    let timestamps = this.requests.get(key) || [];

    // Filtrar timestamps fora da janela atual
    timestamps = timestamps.filter(ts => ts > windowStart);

    if (timestamps.length >= options.max) {
      return true;
    }

    // Adicionar nova requisição
    timestamps.push(now);
    this.requests.set(key, timestamps);

    return false;
  }

  /**
   * Limpa chaves antigas da memória (opcional, para evitar vazamento).
   */
  public cleanup() {
    const now = Date.now();
    // Limpeza agressiva: remove chaves inativas por mais de 1 hora
    const expiry = now - 60 * 60 * 1000; 
    
    for (const [key, timestamps] of this.requests.entries()) {
      const activeTimestamps = timestamps.filter(ts => ts > expiry);
      if (activeTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, activeTimestamps);
      }
    }
  }

  /**
   * Reseta o limite para uma chave específica (ex: após login bem sucedido).
   */
  public reset(key: string) {
    this.requests.delete(key);
  }

  /**
   * Retorna o número de requisições restantes para uma chave.
   */
  public getRemainingRequests(key: string, options: RateLimitOptions): number {
    const now = Date.now();
    const windowStart = now - options.windowMs;
    const timestamps = this.requests.get(key) || [];
    const active = timestamps.filter(ts => ts > windowStart);
    return Math.max(0, options.max - active.length);
  }
}

// Instância única para ser compartilhada entre todos os handlers
export const globalRateLimiter = new RateLimiter();
