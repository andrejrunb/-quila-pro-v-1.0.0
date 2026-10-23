import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { createHash } from 'crypto';

const router = Router();

// Middleware: validar token de admin diferente das APIs key das escolas
function requireAdminToken(req: Request, res: Response, next: any) {
  const token = req.headers['x-admin-token'] as string;
  const validTokens = (process.env.AQUILA_ADMIN_TOKENS || '').split(',').map(t => t.trim());
  if (!token || !validTokens.includes(token)) {
    res.status(401).json({ error: 'Token de administrador inválido.' });
    return;
  }
  next();
}

/**
 * Step 126 — GET /admin/schools
 * Dashboard Admin: lista escolas matriculadas com status online/offline.
 * Uma escola é "online" se o último heartbeat foi há menos de 10 minutos.
 */
router.get('/schools', requireAdminToken, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT
        s.cloud_id,
        s.hostname,
        s.platform,
        s.version,
        s.enrolled_at,
        s.last_seen_at,
        s.is_active,
        CASE
          WHEN s.last_seen_at > NOW() - INTERVAL '10 minutes' THEN 'online'
          WHEN s.last_seen_at > NOW() - INTERVAL '1 hour' THEN 'warning'
          ELSE 'offline'
        END AS status,
        (
          SELECT COUNT(*)::int FROM aggregated_events ae
          WHERE ae.school_id = s.id
        ) AS total_events,
        (
          SELECT hb.cpu_avg FROM heartbeats hb
          WHERE hb.school_id = s.id
          ORDER BY hb.recorded_at DESC LIMIT 1
        ) AS last_cpu
      FROM schools s
      WHERE s.is_active = TRUE
      ORDER BY s.last_seen_at DESC
    `);

    res.json({
      total: result.rowCount,
      online: result.rows.filter(r => r.status === 'online').length,
      schools: result.rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao listar escolas.' });
  }
});

/**
 * GET /admin/stats — Estatísticas globais agregadas
 */
router.get('/stats', requireAdminToken, async (_req: Request, res: Response): Promise<void> => {
  try {
    const [schoolsCount, eventsToday, eventsTotal] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int as total FROM schools WHERE is_active = TRUE`),
      pool.query(
        `SELECT COALESCE(SUM(total_count), 0)::int as total
         FROM aggregated_events
         WHERE event_date = CURRENT_DATE`
      ),
      pool.query(`SELECT COUNT(*)::int as total FROM aggregated_events`),
    ]);

    res.json({
      totalSchools: schoolsCount.rows[0].total,
      eventsToday:  eventsToday.rows[0].total,
      eventsTotal:  eventsTotal.rows[0].total,
      generatedAt:  new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao gerar estatísticas.' });
  }
});

/**
 * DELETE /admin/schools/:cloudId — Desativar escola (soft delete)
 */
router.delete('/schools/:cloudId', requireAdminToken, async (req: Request, res: Response): Promise<void> => {
  const { cloudId } = req.params;
  try {
    const result = await pool.query(
      `UPDATE schools SET is_active = FALSE WHERE cloud_id = $1`,
      [cloudId]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Escola não encontrada.' });
      return;
    }
    res.json({ ok: true, message: `Escola ${cloudId} desativada.` });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao desativar escola.' });
  }
});

export default router;
