import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

/**
 * [P0-SEC-05] Conector opcional de nuvem isolado por Feature Flag (Offline-First por padrão).
 * Nenhum tráfego externo é iniciado a menos que AQUILA_ENABLE_CLOUD_CONNECTORS === 'true'
 * e credenciais explícitas sejam fornecidas pela instituição.
 */
export const isCloudConnectorEnabled = (): boolean =>
  process.env.AQUILA_ENABLE_CLOUD_CONNECTORS === 'true' &&
  Boolean(process.env.SUPABASE_URL) &&
  Boolean(process.env.SUPABASE_ANON_KEY);

let cachedClient: SupabaseClient | null = null;

function createOfflineStub(): any {
  const blockedResponse = async () => ({
    data: null,
    error: new Error('OFFLINE_FIRST_POLICY: Cloud connector disabled (AQUILA_ENABLE_CLOUD_CONNECTORS !== true).'),
  });
  return {
    from: () => ({
      select: blockedResponse,
      upsert: blockedResponse,
      insert: blockedResponse,
      update: blockedResponse,
      delete: blockedResponse,
    }),
  };
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!isCloudConnectorEnabled()) {
      const stub = createOfflineStub();
      return stub[prop] ?? (() => stub);
    }
    if (!cachedClient) {
      cachedClient = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!,
        {
          auth: { persistSession: false, autoRefreshToken: false },
          realtime: { transport: WebSocket as any },
        }
      );
    }
    return (cachedClient as any)[prop];
  },
});
