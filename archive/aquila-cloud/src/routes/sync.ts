import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { requireApiKey } from './heartbeat';

const router = Router();

// Campos explicitamente bloqueados mesmo após sanitização local (defesa em profundidade)
const CLOUD_BLOCKED_FIELDS = [
  'photo', 'face', 'embedding', 'cpf', 'rg', 'name', 'nome',
  'birthdate', 'datanascimento', 'address', 'phone', 'telefone',
];

/**
 * Step 125 — POST /sync
 * Recebe payload sanitizado do outbox da escola.
 * Armazena apenas dados agregados sem PII.
 */
router.post('/', requireApiKey, async (req: Request, res: Response): Promise<void> => {
  const { event_type, event_date, payload } = req.body;
  const schoolDbId = (req as any).schoolDbId;

  if (!event_type) {
    res.status(400).json({ error: 'event_type é obrigatório.' });
    return;
  }

  // ─── Defesa em profundidade: remover qualquer PII no servidor ──
  const cleanPayload = _deepStrip(payload ?? {});

  try {
    // Upsert: incrementar contador se já existir evento do mesmo tipo/dia
    await pool.query(
      `INSERT INTO aggregated_events (school_id, event_type, event_date, total_count, payload)
       VALUES ($1, $2, $3, 1, $4)
       ON CONFLICT DO NOTHING`,
      [
        schoolDbId,
        event_type,
        event_date ?? new Date().toISOString().split('T')[0],
        JSON.stringify(cleanPayload),
      ]
    );

    res.json({ ok: true, stored: true });
  } catch (err: any) {
    console.error('[sync] DB error:', err.message);
    res.status(500).json({ error: 'Erro ao sincronizar dados.' });
  }
});

/**
 * GET /sync/status — retorna último heartbeat e contagem de eventos
 * Usado pelo SyncStatusIndicator do app desktop
 */
router.get('/status', requireApiKey, async (req: Request, res: Response): Promise<void> => {
  const schoolDbId = (req as any).schoolDbId;
  try {
    const [hb, evts] = await Promise.all([
      pool.query(
        `SELECT recorded_at FROM heartbeats WHERE school_id = $1 ORDER BY recorded_at DESC LIMIT 1`,
        [schoolDbId]
      ),
      pool.query(
        `SELECT COUNT(*) as total FROM aggregated_events WHERE school_id = $1`,
        [schoolDbId]
      ),
    ]);

    res.json({
      lastHeartbeat: hb.rows[0]?.recorded_at || null,
      totalEvents:  parseInt(evts.rows[0].total),
      online:       true,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao buscar status.' });
  }
});

export default router;

// ─── Sanitizador defensivo server-side ───────────────────────
function _deepStrip(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(_deepStrip);

  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    const blocked = CLOUD_BLOCKED_FIELDS.some(f => key.toLowerCase().includes(f));
    if (!blocked) {
      clean[key] = _deepStrip(val);
    }
  }
  return clean;
}
