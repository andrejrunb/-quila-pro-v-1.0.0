import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';

const router = Router();

// MOCK: Para o MVP da Fase 5, a autenticação dos pais valida um hash de estudante
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { studentHash, schoolId } = req.body;
  
  if (!studentHash || !schoolId) {
    res.status(400).json({ error: 'studentHash e schoolId são obrigatórios.' });
    return;
  }
  
  // Simula login de sucesso retornando um JWT fake e os dados iniciais
  res.json({
    success: true,
    token: `parent_token_${studentHash}_${Date.now()}`,
    studentName: 'Aluno Oculto (LGPD)',
    schoolId
  });
});

// GET /timeline: Simula os últimos eventos agregados do aluno
router.get('/timeline', async (req: Request, res: Response): Promise<void> => {
  const { studentHash } = req.query;
  // Na nuvem mantemos dados minimalistas
  const fakeTimeline = [
    { id: 1, type: 'entry', time: new Date().toISOString(), location: 'Entrada Principal' },
    { id: 2, type: 'alert', time: new Date(Date.now() - 3600000).toISOString(), location: 'Pátio' }
  ];
  
  res.json({ success: true, timeline: fakeTimeline });
});

// POST /arrive: O gatilho "Estou Chegando" (Drive-Thru)
router.post('/arrive', async (req: Request, res: Response): Promise<void> => {
  const { schoolId, studentHash } = req.body;
  if (!schoolId || !studentHash) {
    res.status(400).json({ error: 'schoolId e studentHash necessários.' });
    return;
  }

  try {
    // Insere o sinal de drive-thru na tabela
    await pool.query(
      `INSERT INTO parent_signals (school_id, student_hash, signal_type, status)
       VALUES ($1, $2, $3, 'pending')`,
      [schoolId, studentHash, 'drive_thru_arrival']
    );
    res.json({ success: true, message: 'Escola notificada com sucesso!' });
  } catch (err: any) {
    console.error('[parentRoutes] ERRO:', err.message);
    res.status(500).json({ error: 'Falha ao registrar chegada.' });
  }
});

// GET /signals: Usado pelo desktop (Áquila Pro) para fazer GET-Pooling e ver quem chegou
router.get('/signals', async (req: Request, res: Response): Promise<void> => {
  const { schoolId } = req.query;
  try {
    const result = await pool.query(
      `SELECT id, student_hash, signal_type, created_at 
       FROM parent_signals 
       WHERE school_id = $1 AND status = 'pending'
       ORDER BY created_at ASC`,
      [schoolId]
    );

    // Marca como consumido
    if (result.rows.length > 0) {
      const ids = result.rows.map(r => r.id);
      await pool.query(
        `UPDATE parent_signals SET status = 'consumed' WHERE id = ANY($1::int[])`,
        [ids]
      );
    }
    res.json({ success: true, signals: result.rows });
  } catch (err: any) {
    console.error('[parentRoutes] ERRO fetching signals:', err.message);
    res.status(500).json({ error: 'Falha ao processar.' });
  }
});

// GET /billing: Consulta faturas do aluno (V3)
router.get('/billing', async (req: Request, res: Response): Promise<void> => {
  const { studentHash, schoolId } = req.query;
  if (!studentHash || !schoolId) {
    res.status(400).json({ error: 'studentHash e schoolId são necessários.' });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT id, amount, due_date, status, pix_code 
       FROM billing 
       WHERE school_id = $1 AND student_hash = $2
       ORDER BY due_date DESC`,
      [schoolId, studentHash]
    );

    res.json({ success: true, billing: result.rows });
  } catch (err: any) {
    console.error('[parentRoutes] ERRO fetching billing:', err.message);
    res.status(500).json({ error: 'Falha ao buscar financeiro.' });
  }
});

export default router;
