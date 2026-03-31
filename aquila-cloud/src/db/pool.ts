import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Step 121 — Pool de conexão PostgreSQL
 * Configurado para Railway/Render via DATABASE_URL
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,            // PgBouncer-friendly pool size
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('[Pool] Unexpected error on idle client:', err.message);
});

export async function healthCheck(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
