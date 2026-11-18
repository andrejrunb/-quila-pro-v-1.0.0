import { NextResponse } from 'next/server';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

interface BucketEntry {
  timestamps: number[];
}

const buckets = new Map<string, BucketEntry>();
const MAX_BUCKETS = 2000;

/**
 * Proteção PRELIMINAR de rate limit em memória (sliding window por instância Node/Serverless).
 *
 * Limitação arquitetural explícita: em deploys multi-instância (Vercel Serverless) ou após
 * cold starts/reinicializações, os buckets em `Map` não são compartilhados entre workers.
 * Produção multi-instância exige camada distribuída (Redis/Upstash ou Vercel Firewall/WAF).
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
  now = Date.now()
): RateLimitResult {
  const cutoff = now - config.windowMs;
  const existing = buckets.get(key);
  const recent = existing ? existing.timestamps.filter((ts) => ts > cutoff) : [];

  if (recent.length >= config.maxRequests) {
    const oldest = recent[0] ?? now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + config.windowMs - now) / 1000));
    buckets.set(key, { timestamps: recent });
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  recent.push(now);
  if (!existing && buckets.size >= MAX_BUCKETS) {
    const firstKey = buckets.keys().next().value;
    if (firstKey !== undefined) {
      buckets.delete(firstKey);
    }
  }
  buckets.set(key, { timestamps: recent });

  return {
    allowed: true,
    remaining: Math.max(0, config.maxRequests - recent.length),
    retryAfterSeconds: 0,
  };
}

export function resetRateLimitBuckets(): void {
  buckets.clear();
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip')?.trim();
  return realIp || 'local';
}

export function getRateLimitBackendMode(): 'memory_sliding_window' | 'upstash_rest_configured' {
  return process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? 'upstash_rest_configured'
    : 'memory_sliding_window';
}

/**
 * Aplica proteção de rate limiting por rota e sujeito (IP + usuário/credencial) no BFF Next.js,
 * devolvendo HTTP 429 com `Retry-After` quando o limite da janela deslizante é excedido.
 */
export function enforceApiRateLimit(
  request: Request,
  scope: string,
  config: RateLimitConfig,
  subjectKey?: string
): NextResponse | null {
  const ip = getClientIp(request);
  const bucketKey = `${scope}:${subjectKey ?? 'anon'}:${ip}`;
  const result = checkRateLimit(bucketKey, config);
  if (result.allowed) {
    return null;
  }

  return NextResponse.json(
    {
      error: 'Limite temporário de requisições excedido para este endpoint. Aguarde antes de tentar novamente.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfterSeconds: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSeconds),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Backend': getRateLimitBackendMode(),
      },
    }
  );
}
