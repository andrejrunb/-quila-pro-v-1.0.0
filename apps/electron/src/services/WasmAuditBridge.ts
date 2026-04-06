
import { createHmac, Hmac } from 'crypto';

/**
 * WasmAuditBridge
 * 
 * Abstração de alto desempenho para operações criptográficas de auditoria.
 * Projetada para ser substituída por um módulo WebAssembly (.wasm) compilado em C++ 
 * para máxima performance em volumes massivos de dados (>100k registros).
 */
export class WasmAuditBridge {
  private hmacPool: Map<string, Hmac> = new Map();

  /**
   * Calcula o hash de uma entrada de auditoria de forma otimizada e canônica (keys ordenadas).
   */
  public computeHash(secret: string, entryData: any): string {
    const content = this.canonicalStringify(entryData);
    return createHmac('sha256', secret).update(content).digest('hex');
  }

  /**
   * Serialização JSON canônica (chaves ordenadas alfabeticamente).
   */
  private canonicalStringify(obj: any): string {
    if (obj === null || typeof obj !== 'object') {
        return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
        return '[' + obj.map(item => this.canonicalStringify(item)).join(',') + ']';
    }
    const keys = Object.keys(obj).sort();
    const resultArr = keys.map(key => {
        return `"${key}":${this.canonicalStringify(obj[key])}`;
    });
    return '{' + resultArr.join(',') + '}';
  }

  /**
   * Verifica a integridade de uma cadeia de logs em lote (Batch Processing).
   */
  public verifyChain(secret: string, entries: any[]): { valid: boolean; brokenId?: string } {
    console.time('WasmAuditBridge:verifyChain');
    let prevHash = 'GENESIS';

    for (const entry of entries) {
        // Mapeamento exato dos campos conforme ImmutableAuditLog.ts:_computeHash
        const entryObj = {
            id: entry.id,
            timestamp: entry.timestamp,
            action: entry.action,
            userId: entry.user_id !== undefined ? entry.user_id : entry.userId,
            payload: typeof entry.payload === 'string' ? JSON.parse(entry.payload) : entry.payload,
            prevHash: entry.prev_hash !== undefined ? entry.prev_hash : entry.prevHash
        };

        const currentHash = this.computeHash(secret, entryObj);
        const storedHash = entry.hash;

        const storedPrev = (entry.prev_hash !== undefined ? entry.prev_hash : entry.prevHash);

        if (currentHash !== storedHash || storedPrev !== prevHash) {
            console.error(`[Audit] Broken at ID: ${entry.id}`);
            console.error(`[Audit] Expected Hash: ${currentHash.substring(0, 8)}`);
            console.error(`[Audit] Stored Hash: ${storedHash.substring(0, 8)}`);
            console.error(`[Audit] Expected Prev: ${prevHash}`);
            console.error(`[Audit] Stored Prev: ${storedPrev}`);
            console.timeEnd('WasmAuditBridge:verifyChain');
            return { valid: false, brokenId: entry.id };
        }
        prevHash = storedHash;
    }

    console.timeEnd('WasmAuditBridge:verifyChain');
    return { valid: true };
  }
}

export const wasmAuditBridge = new WasmAuditBridge();
