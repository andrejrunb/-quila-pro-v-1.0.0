import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { createHash, randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * Step 123 — POST /enroll
 * Matrícula de uma escola na plataforma cloud Áquila Pro.
 * Body: { adminToken, hostname, platform, version }
 * Retorna: { cloudId, apiKey }
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { adminToken, hostname, platform, version } = req.body;

  // Validar token master de admin (armazenado em env var)
  const validTokens = (process.env.AQUILA_ADMIN_TOKENS || '').split(',').map(t => t.trim());
  if (!adminToken || !validTokens.includes(adminToken)) {
    await _auditLog(null, 'enroll_rejected', req.ip || '', { reason: 'invalid_token' });
    res.status(401).json({ success: false, message: 'Token de administrador inválido.' });
    return;
  }

  // Gerar credenciais únicas para a escola
  const cloudId = `school_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
  const apiKeyRaw = randomBytes(32).toString('hex');
  const apiKeyHash = createHash('sha256').update(apiKeyRaw).digest('hex');

  try {
    await pool.query(
      `INSERT INTO schools (cloud_id, api_key_hash, hostname, platform, version)
       VALUES ($1, $2, $3, $4, $5)`,
      [cloudId, apiKeyHash, hostname || 'unknown', platform || 'unknown', version || '1.0.0']
    );

    await _auditLog(cloudId, 'enroll_success', req.ip || '', { hostname, platform, version });

    res.json({ success: true, cloudId, apiKey: apiKeyRaw });
  } catch (err: any) {
    console.error('[enroll] DB error:', err.message);
    res.status(500).json({ success: false, message: 'Erro interno.' });
  }
});

export default router;

// ─── Utilitário interno ──────────────────────────────────────
async function _auditLog(
  schoolId: string | null,
  action: string,
  ip: string,
  payload: Record<string, any>
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO cloud_audit (school_id, action, ip_address, payload)
       VALUES (
         (SELECT id FROM schools WHERE cloud_id = $1 LIMIT 1),
         $2, $3, $4
       )`,
      [schoolId, action, ip, JSON.stringify(payload)]
    );
  } catch {
    // Audit não pode bloquear a operação principal
  }
}

export { _auditLog };
