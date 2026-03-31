import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as dotenv from 'dotenv';

import { pool, healthCheck } from './db/pool';
import { migrate } from './db/migrate';
import enrollRouter from './routes/enroll';
import heartbeatRouter from './routes/heartbeat';
import syncRouter from './routes/sync';
import adminRouter from './routes/admin';
import parentRouter from './routes/parent';
import whatsappRouter from './routes/whatsapp';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// ─── Segurança base ──────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST'],
}));
app.use(express.json({ limit: '1mb' }));

// ─── Rate limiting (Step 128) ────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 60_000, // 1 minuto
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em 1 minuto.' },
});

const enrollLimiter = rateLimit({
  windowMs: 60 * 60_000, // 1 hora
  max: 5, // Máximo 5 matrículas por hora por IP
  message: { error: 'Número máximo de matrículas atingido.' },
});

app.use('/api', apiLimiter);

// ─── Health ──────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  const dbOk = await healthCheck();
  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'ok' : 'degraded',
    db: dbOk ? 'connected' : 'disconnected',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// ─── Rotas API (Steps 123-125, 128) ─────────────────────────
app.use('/api/enroll',    enrollLimiter, enrollRouter);
app.use('/api/heartbeat', heartbeatRouter);
app.use('/api/sync',      syncRouter);

// ─── WhatsApp Chatbot (Evolution API) ────────────────────────
app.use('/whatsapp', whatsappRouter);
app.use('/api/admin',     adminRouter);
app.use('/api/parent',    parentRouter);

// ─── Swagger UI básico (Step 130) ───────────────────────────
app.get('/api/docs', (_req, res) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'Áquila Pro Cloud API',
      version: '1.0.0',
      description: 'API REST para sincronização de dados das escolas com a nuvem Áquila Pro.',
      contact: { name: 'Áquila Pro', email: 'suporte@aquilapro.com.br' },
    },
    servers: [{ url: process.env.BASE_URL || 'http://localhost:3001' }],
    paths: {
      '/api/enroll': {
        post: {
          summary: 'Matricular escola na nuvem',
          tags: ['Matrícula'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['adminToken'],
                  properties: {
                    adminToken: { type: 'string', description: 'Token mestre de administrador' },
                    hostname:   { type: 'string' },
                    platform:   { type: 'string' },
                    version:    { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Matrícula realizada — retorna cloudId e apiKey' },
            401: { description: 'Token inválido' },
          },
        },
      },
      '/api/heartbeat': {
        post: {
          summary: 'Enviar métricas de saúde do sistema',
          tags: ['Monitoramento'],
          security: [{ ApiKeyAuth: [] }],
          responses: { 200: { description: 'Heartbeat registrado' } },
        },
      },
      '/api/sync': {
        post: {
          summary: 'Sincronizar eventos agregados',
          tags: ['Sincronização'],
          security: [{ ApiKeyAuth: [] }],
          responses: { 200: { description: 'Dados sincronizados' } },
        },
      },
      '/api/sync/status': {
        get: {
          summary: 'Obter status de conectividade da escola',
          tags: ['Sincronização'],
          security: [{ ApiKeyAuth: [] }],
          responses: { 200: { description: 'Status retornado' } },
        },
      },
      '/health': {
        get: {
          summary: 'Health check do servidor',
          tags: ['Sistema'],
          responses: { 200: { description: 'ok' }, 503: { description: 'degraded' } },
        },
      },
    },
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Aquila-Api-Key',
          description: 'Autenticação por API Key. Também requer X-Aquila-Cloud-Id.',
        },
      },
    },
  });
});

// ─── 404 handler ─────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

// ─── Global error handler ────────────────────────────────────
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('[Unhandled]', err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

// ─── Init ────────────────────────────────────────────────────
async function start() {
  try {
    await migrate();
    app.listen(PORT, () => {
      console.log(`🦅 Áquila Cloud API — http://localhost:${PORT}`);
      console.log(`📖 Documentação: http://localhost:${PORT}/api/docs`);
    });
  } catch (err) {
    console.error('Falha ao iniciar servidor:', err);
    process.exit(1);
  }
}

start();
export default app;
