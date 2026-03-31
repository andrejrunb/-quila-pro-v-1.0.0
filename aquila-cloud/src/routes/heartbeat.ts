import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool';
import { createHash } from 'crypto';

const router = Router();

/**
 * Step 128 — Middleware de autenticação por API Key
 * Toda rota protegida deve passar por este middleware.
 * Header esperado: X-Aquila-Api-Key e X-Aquila-Cloud-Id
 */
export async function requireApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKey  = req.headers['x-aquila-api-key']  as string;
  const cloudId = req.headers['x-aquila-cloud-id'] as string;

  if (!apiKey || !cloudId) {
    res.status(401).json({ error: 'Credenciais ausentes (X-Aquila-Api-Key / X-Aquila-Cloud-Id).' });
    return;
  }

  const apiKeyHash = createHash('sha256').update(apiKey).digest('hex');

  const result = await pool.query(
    `SELECT id FROM schools WHERE cloud_id = $1 AND api_key_hash = $2 AND is_active = TRUE`,
    [cloudId, apiKeyHash]
  );

  if (result.rowCount === 0) {
    res.status(401).json({ error: 'API Key inválida ou escola não matriculada.' });
    return;
  }

  // Anexar schoolId ao request para uso nas rotas
  (req as any).schoolDbId = result.rows[0].id;
  (req as any).cloudId    = cloudId;

  // Atualizar last_seen_at
  pool.query(
    `UPDATE schools SET last_seen_at = NOW() WHERE cloud_id = $1`,
    [cloudId]
  ).catch(() => {}); // fire and forget

  next();
}

/**
 * Step 124 — POST /heartbeat
 * Recebe métricas de hardware da escola (sem PII).
 * Body: { uptime, memory: { freeMB, totalMB }, cpu }
 */
router.post('/', requireApiKey, async (req: Request, res: Response): Promise<void> => {
  const { uptime, memory, cpu, timestamp } = req.body;
  const schoolDbId = (req as any).schoolDbId;

  try {
    await pool.query(
      `INSERT INTO heartbeats (school_id, cpu_avg, mem_free_mb, mem_total_mb, uptime_sec)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        schoolDbId,
        cpu ?? null,
        memory?.freeMB  ?? memory?.free  ?? null,
        memory?.totalMB ?? memory?.total ?? null,
        uptime ?? null,
      ]
    );

    // Manter apenas últimas 1.000 entradas por escola (rotação automática)
    pool.query(
      `DELETE FROM heartbeats
       WHERE school_id = $1
         AND id NOT IN (
           SELECT id FROM heartbeats
           WHERE school_id = $1
           ORDER BY recorded_at DESC
           LIMIT 1000
         )`,
      [schoolDbId]
    ).catch(() => {});

    res.json({ ok: true, received_at: new Date().toISOString() });
  } catch (err: any) {
    console.error('[heartbeat] DB error:', err.message);
    res.status(500).json({ error: 'Erro ao registrar heartbeat.' });
  }
});

export default router;
