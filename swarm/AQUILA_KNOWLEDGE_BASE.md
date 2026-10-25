# 🦅 Áquila Pro v2.1 — Base de Conhecimento Soberana (Project DNA)

Este documento é a fonte primária de verdade injetada em todos os agentes do **Swarm de Desenvolvimento Áquila Pro**.

---

## 1. Visão Geral & Arquitetura do Monorepo
O **Áquila Pro** é um ecossistema escolar *Edge-First*, *Offline-First* e *Agent-First* projetado para operar localmente dentro da escola com soberania de dados, baixo custo operacional e conformidade estrita com a LGPD (Art. 14, 16 e 18).

### Estrutura de Diretórios Principal:
- `apps/electron/`: Servidor Edge Desktop (Electron + Node.js + SQLite em modo WAL). Hospeda o motor pedagógico, OMR, mensageria resiliente, backup GFS e WebSocket Server na porta `9000`.
- `apps/web/`: Portal Web Administrativo e Pedagógico (Next.js + React + Tailwind).
- `apps/mobile/`: Aplicativo móvel para docentes e responsáveis (Capacitor / React).
- `packages/api/`: Contratos compartilhados, validações e clientes de API.
- `colab/aquila_sovereign_engine.py`: Worker GPU remoto (Google Colab / Kaggle / Modal) rodando InsightFace (ArcFace 512-D), YOLOv8n e Ollama (`aquila-specialist` / `qwen2.5-coder:7b`).
- `scripts/`: Automação de testes E2E, stress tests, backup/DR e roteamento do Swarm (`swarm_router.py`).

---

## 2. Regras Inegociáveis da Constituição (`AGENTS.md`)
1. **Soberania Local & Criptografia:**
   - Banco SQLite local (`aquila.db`) sempre em `PRAGMA journal_mode = WAL`, `PRAGMA synchronous = NORMAL`, `PRAGMA busy_timeout = 5000`.
   - Dados biométricos/credenciais e snapshots de backup cifrados com **AES-256-GCM** (PBKDF2 100.000 iterações) ou Windows DPAPI.
   - Nenhum dado biométrico cru deixa o servidor Edge; apenas vetores unidirecionais (*One-Way Embedding 512-D*).
2. **Trilha de Auditoria Imutável (`zero_bypass_audits`):**
   - Toda operação crítica (exclusão, alteração de regra, revogação de consentimento, reprocessamento manual de DLQ, arbitragem docente OMR) grava registro assinado com SHA-256 via `zeroBypassAuditService.record()`.
3. **Resiliência Térmica (`SovereignResilienceService`):**
   - Se a CPU/NPU do servidor Edge ultrapassar `75°C`, os workers de visão computacional reduzem a taxa de quadros de `30 FPS` para `10 FPS`.

---

## 3. Contratos e Tabelas Nucleares do SQLite Edge
- `students`: `(id TEXT PRIMARY KEY, name TEXT, class_id TEXT, enrollment_id TEXT UNIQUE)`
- `classes`: `(id TEXT PRIMARY KEY, name TEXT, grade TEXT)`
- `attendance_sessions`: `(id TEXT PRIMARY KEY, class_id TEXT, teacher_id TEXT, subject TEXT, date TEXT, created_at TEXT)`
- `attendance_records`: `(id INTEGER PRIMARY KEY, session_id TEXT, student_id TEXT, status TEXT ['PRESENT'|'ABSENT'|'LATE'])`
- `exam_submissions` & `omr_sheets`:
  - Limiar de ambiguidade física no cartão-resposta OMR: se a diferença de preenchimento entre duas alternativas for $\Delta\text{fill} < 25\%$ ($0.25$), o cartão **NÃO** é corrigido automaticamente; recebe status `PENDING_TEACHER_REVIEW` para arbitragem humana (HITL) com 1 clique.
- `notification_outbox` (`NotificationOutboxService.ts`):
  - Colunas: `id`, `idempotency_key UNIQUE`, `provider_message_id`, `recipient_phone`, `template_name`, `parameters_json`, `status` (`PENDING`, `PROCESSING`, `SENT`, `FAILED`, `DEAD_LETTER`, `AMBIGUOUS`), `retry_count`, `max_retries` (padrão 3), `next_retry_at`, `last_error`, `sent_at`, `reconciled_at`, `reconciled_by`, `created_at`.
  - Backoff exponencial: $10 \times 2^{\text{retry\_count}}$ segundos ($10\text{s}, 20\text{s}, 40\text{s}\dots$).
  - Reconciliação via `reconcileProviderStatus()` usando `provider_message_id` da Meta Cloud API (`whatsapp_meta`).
- `WebSocketServerManager` (`WebSocketServer.ts` — Porta `9000`):
  - Validação de origem LAN (`localhost`, `192.168.*`, `10.*`, `172.16-31.*`), autenticação por assinatura **HMAC-SHA256** (`payloadB64.signatureHex` validada com `crypto.timingSafeEqual`) e Rate Limiting Multicamadas por papel (`ADMIN`, `GATEWAY`, `TEACHER`, `STUDENT`, `GUARDIAN`, `GUEST`) e categoria (`READ`, `WRITE`, `DISPATCH`), com bloqueio progressivo (1ª violação: aviso; 2ª: cooldown 60s; 3ª: desconexão `1008`).
- `SQLiteDisasterRecoveryService`:
  - Snapshot atômico via `VACUUM INTO`, compressão GZIP, criptografia AES-256-GCM, manifesto com SHA-256 e rotação GFS (7 diários, 4 semanais, 3 mensais). Meta de RTO $< 2\text{ minutos}$ (executado em $< 500\text{ ms}$).
