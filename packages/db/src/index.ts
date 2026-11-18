import { drizzle as drizzleBetterSqlite } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzleSqliteProxy, type SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy';
import type Database from 'better-sqlite3';
import * as schema from './schema';
import { ensureSchema, type SqlExecutor } from './bootstrap';

export * from './schema';
export * from './scrypt';
export * from './seed';
export { ensureSchema, type SqlExecutor } from './bootstrap';

export type AquilaDatabase = SqliteRemoteDatabase<typeof schema>;

interface NodeSqliteStatement {
  setReturnArrays?: (enabled: boolean) => void;
  run: (...params: unknown[]) => unknown;
  get: (...params: unknown[]) => unknown;
  all: (...params: unknown[]) => unknown[];
}

interface NodeSqliteDb {
  exec: (sql: string) => void;
  prepare: (sql: string) => NodeSqliteStatement;
}

interface NodeSqliteModule {
  DatabaseSync: new (path: string) => NodeSqliteDb;
}

function normalizeSqlParam(value: unknown): unknown {
  if (value === undefined || value === null) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (value instanceof Date) return Math.floor(value.getTime() / 1000);
  return value;
}

function getNodeSqliteModule(): NodeSqliteModule | null {
  try {
    const getBuiltin = (process as unknown as { getBuiltinModule?: (id: string) => unknown }).getBuiltinModule;
    if (typeof getBuiltin === 'function') {
      const mod = getBuiltin('node:sqlite') as NodeSqliteModule | undefined;
      if (mod?.DatabaseSync) return mod;
    }
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const dynamicRequire = new Function('id', 'return require(id)') as (id: string) => unknown;
    const mod = dynamicRequire('node:sqlite') as NodeSqliteModule | undefined;
    return mod?.DatabaseSync ? mod : null;
  } catch {
    return null;
  }
}

export function createDb(dbPath: string = './aquila.db') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const BetterSqlite3 = require('better-sqlite3') as typeof Database;
  const sqlite = new BetterSqlite3(dbPath);
  return drizzleBetterSqlite(sqlite, { schema });
}

export function createLocalExecutor(sqlite: Database.Database): SqlExecutor {
  return async (sqlText, params = [], method = 'all') => {
    const normalized = params.map(normalizeSqlParam);
    const stmt = sqlite.prepare(sqlText);
    if (method === 'run') {
      stmt.run(...normalized);
      return { rows: [] };
    }
    if (method === 'get') {
      const row = stmt.raw().get(...normalized);
      return { rows: row as unknown[] };
    }
    const rows = stmt.raw().all(...normalized);
    return { rows };
  };
}

export function createNodeSqliteExecutor(sqlite: NodeSqliteDb): SqlExecutor {
  return async (sqlText, params = [], method = 'all') => {
    const normalized = params.map(normalizeSqlParam);
    const stmt = sqlite.prepare(sqlText);
    if (method === 'run') {
      stmt.run(...normalized);
      return { rows: [] };
    }
    stmt.setReturnArrays?.(true);
    if (method === 'get') {
      const row = stmt.get(...normalized);
      return { rows: row as unknown[] };
    }
    const rows = stmt.all(...normalized);
    return { rows };
  };
}

export function createSqliteProxyDb(sqlite: Database.Database): {
  db: AquilaDatabase;
  execute: SqlExecutor;
} {
  const execute = createLocalExecutor(sqlite);
  const db = drizzleSqliteProxy(async (sqlText, params, method) => {
    return execute(sqlText, params, method);
  }, { schema });
  return { db, execute };
}

function createLocalFileOrMemoryProxyDb(dbPath: string): {
  db: AquilaDatabase;
  execute: SqlExecutor;
} {
  const nodeSqlite = getNodeSqliteModule();
  if (nodeSqlite) {
    const sqlite = new nodeSqlite.DatabaseSync(dbPath);
    if (dbPath !== ':memory:') {
      sqlite.exec('PRAGMA journal_mode = WAL');
    }
    const execute = createNodeSqliteExecutor(sqlite);
    const db = drizzleSqliteProxy(async (sqlText, params, method) => {
      return execute(sqlText, params, method);
    }, { schema });
    return { db, execute };
  }

  // Fallback for Node < 22 with matching better-sqlite3 ABI
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const BetterSqlite3 = require('better-sqlite3') as typeof Database;
  const sqlite = new BetterSqlite3(dbPath);
  if (dbPath !== ':memory:') {
    sqlite.pragma('journal_mode = WAL');
  }
  return createSqliteProxyDb(sqlite);
}

function encodeTursoArg(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) {
    return { type: 'null' };
  }
  if (typeof value === 'boolean') {
    return { type: 'integer', value: value ? '1' : '0' };
  }
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { type: 'integer', value: String(value) }
      : { type: 'float', value };
  }
  if (value instanceof Date) {
    return { type: 'integer', value: String(Math.floor(value.getTime() / 1000)) };
  }
  if (value instanceof Uint8Array) {
    return { type: 'blob', base64: Buffer.from(value).toString('base64') };
  }
  return { type: 'text', value: String(value) };
}

function decodeTursoCell(cell: { type?: string; value?: string | number | null; base64?: string }): unknown {
  if (!cell || cell.type === 'null') return null;
  if (cell.type === 'integer' || cell.type === 'float') return Number(cell.value);
  if (cell.type === 'blob' && typeof cell.base64 === 'string') {
    return Buffer.from(cell.base64, 'base64');
  }
  return cell.value ?? null;
}

export function createTursoHttpDb(databaseUrl: string, authToken?: string): {
  db: AquilaDatabase;
  execute: SqlExecutor;
} {
  const normalizedBase = databaseUrl.replace(/^libsql:\/\//i, 'https://').replace(/\/+$/, '');
  const endpoint = `${normalizedBase}/v2/pipeline`;

  const execute: SqlExecutor = async (sqlText, params = [], method = 'all') => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        requests: [
          {
            type: 'execute',
            stmt: {
              sql: sqlText,
              args: params.map(encodeTursoArg),
            },
          },
          { type: 'close' },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`LibSQL HTTP error ${response.status}: ${errorText}`);
    }

    const payload = (await response.json()) as {
      results?: Array<{
        type?: string;
        error?: { message?: string };
        response?: {
          result?: {
            rows?: Array<Array<{ type?: string; value?: string | number | null; base64?: string }>>;
          };
        };
      }>;
    };

    const firstResult = payload.results?.[0];
    if (firstResult?.type === 'error') {
      throw new Error(firstResult.error?.message || 'LibSQL execution failed.');
    }

    if (method === 'run') {
      return { rows: [] };
    }

    const rawRows = firstResult?.response?.result?.rows ?? [];
    const mapped = rawRows.map((row) => row.map(decodeTursoCell));
    if (method === 'get') {
      return { rows: (mapped[0] as unknown[]) ?? (undefined as unknown as unknown[]) };
    }
    return { rows: mapped };
  };

  const db = drizzleSqliteProxy(async (sqlText, params, method) => {
    return execute(sqlText, params, method);
  }, { schema });

  return { db, execute };
}

let cachedWebDbPromise: Promise<AquilaDatabase> | null = null;

export async function getWebDb(): Promise<AquilaDatabase> {
  if (!cachedWebDbPromise) {
    cachedWebDbPromise = (async () => {
      const remoteUrl = (process.env.AQUILA_DATABASE_URL || process.env.TURSO_DATABASE_URL)?.trim();
      const authToken = (process.env.AQUILA_DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN)?.trim();

      if (remoteUrl) {
        const { db, execute } = createTursoHttpDb(remoteUrl, authToken);
        await ensureSchema(execute);
        return db;
      }

      const explicitLocalPath = process.env.AQUILA_WEB_DB_PATH?.trim();
      const isVercelServerless =
        process.env.VERCEL === '1' ||
        process.env.VERCEL === 'true' ||
        Boolean(process.env.VERCEL_ENV);

      if (isVercelServerless && explicitLocalPath !== ':memory:') {
        throw new Error(
          'PERSISTENCE_NOT_CONFIGURED: SQLite local/efêmero não é suportado como banco compartilhado na Vercel. Configure AQUILA_DATABASE_URL / TURSO_DATABASE_URL (banco remoto gerenciado).'
        );
      }

      const dbPath = explicitLocalPath || './aquila-web.db';
      const { db, execute } = createLocalFileOrMemoryProxyDb(dbPath);
      await ensureSchema(execute);
      return db;
    })();
  }
  return cachedWebDbPromise;
}

export function resetWebDbCacheForTests(): void {
  cachedWebDbPromise = null;
}

export async function createMemoryDb(): Promise<AquilaDatabase> {
  const { db, execute } = createLocalFileOrMemoryProxyDb(':memory:');
  await ensureSchema(execute);
  return db;
}
