# 🦅 Áquila Pro — Cloud Backend

Servidor REST centralizado que recebe dados das escolas e alimenta o **Dashboard Global**.

## Stack
- **Node.js 20** + Express + TypeScript
- **PostgreSQL** (Railway ou Render)
- Helmet + CORS + Rate Limiting
- Autenticação por API Key (SHA-256)

## Deploy no Railway (Step 121)

```bash
# 1. Fork ou clone este repositório em /aquila-cloud
# 2. Criar projeto no Railway: railway.app/new
# 3. Add service: GitHub repo → aquila-cloud
# 4. Add PostgreSQL service no painel
# 5. Definir variáveis de ambiente (copiar de .env.example)
# 6. Railway detecta automaticamente: npm run build && npm start
```

## Variáveis de Ambiente Obrigatórias

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Conexão PostgreSQL (gerado pelo Railway) |
| `AQUILA_ADMIN_TOKENS` | Tokens de admin separados por vírgula |
| `PORT` | Porta (Railway injeta automaticamente) |
| `BASE_URL` | URL pública do servidor |

## Endpoints

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/health` | — | Health check |
| `GET` | `/api/docs` | — | OpenAPI 3.0 spec |
| `POST` | `/api/enroll` | Admin Token | Matricular escola |
| `POST` | `/api/heartbeat` | API Key | Métricas de hardware |
| `POST` | `/api/sync` | API Key | Sincronizar eventos |
| `GET` | `/api/sync/status` | API Key | Status de conectividade |
| `GET` | `/api/admin/schools` | Admin Token | Listar escolas |
| `GET` | `/api/admin/stats` | Admin Token | Estatísticas globais |

## Desenvolvimento Local

```bash
npm install
cp .env.example .env
# Editar .env com suas credenciais PostgreSQL locais

npm run migrate   # Criar tabelas
npm run dev       # Servidor em http://localhost:3001
```

## Segurança (Fase 10)

- ✅ **API Keys** nunca armazenadas em texto plano (SHA-256 hash)
- ✅ **Rate limiting** por IP (120 req/min, 5 enrolls/hora)
- ✅ **LGPD**: double-sanitize server-side — PII jamais persiste
- ✅ **Audit log** de todas as matrículas e acessos
- ✅ **Helmet** headers de segurança em todas as rotas
