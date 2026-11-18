# ADR-002 — Persistência Online, Contratos Unificados e Arquitetura de Sincronização BFF ↔ Edge

**Status:** Aceito (Condicionante para Fase 2 dos Portais Online)  
**Data:** 2026-11-11  
**Autores:** Arquitetura Áquila Pro  
**Relacionado a:** [PLANO_SITE_E_PORTAIS_ONLINE.md](file:///C:/Users/Thaysa/.gemini/antigravity/brain/5fca40fa-e48d-4bc6-bc7a-084bf4a62fe4/PLANO_SITE_E_PORTAIS_ONLINE.md), [AGENTS.md](file:///c:/aquila/AGENTS.md)

---

## 1. Contexto e Classificação Atual

A arquitetura do ecossistema separa:
1. **Site Público & Institucional (`apps/web` rotas públicas)** — Vercel / Next.js.
2. **Portais Autenticados (`apps/web` `/portal/*`, `/api/portal/*`)** — BFF serverless **bloqueado para exposição pública até validação da Fase 2 — Fatia 1** (`isPortalPublicExposureBlocked()` quando `VERCEL=1` e `AQUILA_PORTALS_PUBLIC_ENABLED !== 'true'`).
3. **Edge Escolar (`apps/desktop` / nó local)** — Banco SQLite local em modo WAL, operação offline-first e Zero Inbound WAN.

SQLite local permanece como banco operacional da escola no Edge, mas **não pode** ser utilizado em arquivo efêmero `/tmp/*.db` dentro de funções Serverless da Vercel como persistência compartilhada de produção (o filesystem das funções é efêmero e não compartilhado entre instâncias). Conforme implementação em `packages/db/src/index.ts`, o BFF agora falha fechado (`PERSISTENCE_NOT_CONFIGURED`) em ambiente Vercel caso não exista URL remota configurada.

---

## 2. Decisão de Persistência Online (7 Itens Obrigatórios)

| Item Arquitetural | Decisão Padrão para Produção na Nuvem | Detalhamento Operacional |
| :--- | :--- | :--- |
| **1. Banco remoto e driver** | **Turso / libSQL (`@libsql/client`)** ou PostgreSQL gerenciado com driver HTTP/WebSocket compatível com Drizzle | Compatível com `drizzle-orm/libsql` já suportado pelo pacote `@aquila/db`, via HTTPS/TLS 1.3 com token por ambiente (`AQUILA_DATABASE_URL` / `TURSO_DATABASE_URL` + `AQUILA_DATABASE_AUTH_TOKEN`). |
| **2. Região de armazenamento** | **`gru1` (São Paulo — South America East)** | Co-localização com `vercel.json` (`regions: ["gru1"]`) para baixa latência no Brasil e residência de dados educacionais em território nacional. |
| **3. Migrações e rollback** | **Migrações SQL versionadas e aditivas (`drizzle-kit` + scripts idempotentes)** | Alterações destrutivas proibidas antes de dupla escrita; rollback via restore point-in-time ou migração reversa testada antes do deploy de aplicação. |
| **4. Conexões e limites** | **Transporte HTTP serverless (stateless / pooled no provedor)** | Evita exaustão de file descriptors e limites de conexão TCP em escala serverless da Vercel; paginação e limites explícitos (`.limit()`) nas queries do BFF. |
| **5. Backup e restauração** | **Snapshots diários automáticos + Point-in-Time Recovery (PITR)** | Teste trimestral de restauração em ambiente isolado de homologação antes da promoção de releases; logs de auditoria preservados conforme política legal/escolar. |
| **6. Separação Prod vs Preview** | **Credenciais, bancos e secrets estritamente separados entre Produção, Preview e Dev** | Previews da Vercel não compartilham banco nem `AQUILA_AUTH_SECRET` de produção; seeds demonstrativos desabilitados em produção (`isDemoSeedAllowed() === false`). |
| **7. Isolamento entre instituições** | **`institution_id` obrigatório em entidades multi-tenant + vínculo validado no DAL** | Autorização consultada em tempo real no banco (`users`, `user_institutions`, `guardians_students.status='active'`) a cada leitura/mutação no BFF, sem confiar apenas em middleware ou claims antigas do JWT. |

---

## 3. Contratos Unificados (Não "Schema Unificado")

O Edge escolar e a projeção online **não devem** possuir tabelas idênticas nem replicação cega de colunas sensíveis. O fluxo segue um pipeline explícito de transformação e minimização:

```text
Modelo operacional Edge (SQLite local WAL)
   ↓ transformação explícita + descarte de mídia/vetores/rascunhos
Contrato de sincronização permitido (/api/sync/edge • contractVersion: 2026-11-v1)
   ↓ autenticação por dispositivo + validação positiva (.strict()) + inspeção profunda de fronteira
Modelo de projeção online (Projeção BFF no banco remoto)
```

### Política Interna de Fronteira na Nuvem
A proibição de envio à nuvem de **vetores biométricos, áudio/vídeo brutos, redações integrais não revisadas, anexos arbitrários e dumps/logs de stack trace** é adotada como **política arquitetural interna do Áquila Pro e medida de minimização sob LGPD** (evitando assumir vedação legal universal indistinta onde o ordenamento permite tratamento sob base legal/consentimento específico). Todo campo textual livre é inspecionado contra assinaturas `data:image|audio|video|application/...;base64,`, blobs Base64 extensos e stack traces (`LGPD_EDGE_BOUNDARY_VIOLATION`, HTTP `422`).

---

## 4. Contrato Mínimo de `/api/sync/edge` (`2026-11-v1`)

1. **Identidade por dispositivo/escola (`edge_credentials` e `AQUILA_EDGE_CREDENTIALS_JSON`)**: `keyId`, `deviceId`, `institutionId` e `schoolCloudId` derivados estritamente da credencial autenticada; divergência contra payload é rejeitada com `403`.
2. **Rotação e revogação**: suporte a janela `grace_rotation` (com cabeçalho `x-aquila-rotation-warning`), expiração (`expiresAt`) e bloqueio imediato `revoked` via tabela `edge_credentials` (HTTP `401 EDGE_CREDENTIAL_REVOKED`).
3. **Versão explícita do contrato**: `contractVersion: "2026-11-v1"` obrigatório; envelopes sem versão ou incompatíveis recebem `400`.
4. **Idempotência e processamento em lote**: deduplicação por `eventId` (`200 already_processed`) e suporte a lote `events[]` com resposta individualizada e HTTP `207 Multi-Status` em falhas parciais.
5. **Ordenação e conflitos**: suporte a `sequenceNumber` monotônico por `(schoolCloudId, eventType)` rejeitando eventos atrasados fora de ordem com `409 STALE_SEQUENCE_CONFLICT`.
6. **Lista positiva estrita (`.strict()`)**: apenas tipos explícitos (`HEARTBEAT`, `ATTENDANCE_QR`, `INVOICE_UPSERT`, `PUBLISHED_GRADE_UPSERT`, `COMMAND_ACK`, `AUDIT_LOG`) com rejeição de campos não documentados (`400 EDGE_STRICT_SCHEMA_REJECTED`).

---

## 5. Caminho de Escrita dos Portais & Matriz de Autoridade por Domínio

Por **Zero Inbound WAN**, a nuvem nunca abre conexão de entrada para a escola. Toda ação escrita no portal segue fluxo assíncrono verificável:

```text
Portal (UI) → BFF (tRPC/DAL com check vivo) → Comando persistido (edge_sync_commands: pending_at_edge)
   ↓ Edge consulta periodicamente via conexão de saída (GET /api/sync/edge)
   ↓ Edge valida e aplica localmente segundo regra de conflito do domínio
   ↓ Edge confirma resultado (POST /api/sync/edge • eventType: COMMAND_ACK) → Atualiza projeção online
```

A UI deve distinguir explicitamente `Recebido pelo Servidor (Projeção BFF)`, `Pendente na Escola (Edge)`, `Aplicado na Escola (Edge)` e `Dado Desatualizado / Falha de Sincronização` (`PortalSyncBanner`), jamais exibindo "sincronizado" após aceite isolado no BFF.

| Domínio | Sistema / Papel Autoritativo | Regra de Conflito e Reconciliação |
| :--- | :--- | :--- |
| **Frequência** | **Edge escolar + Docente titular** | Registros offline de portaria (Crachá QR) mesclam-se ao diário da aula; retificações nominais do docente prevalecem com trilha de auditoria (`edge_offline_merge_with_teacher_override`). |
| **Notas** | **Docente (HITL CNE/CP nº 15/2026)** | Separação estrita entre `draft_ai` (rascunho privado, proibido aos portais de família/aluno e no sync externo), `pending_review` e `published` (homologado pelo docente). |
| **Financeiro** | **Gateway/ERP Contábil + Edge** | O portal apenas exibe cobranças/PIX emitidos e solicita/inicia quitação; liquidação contábil definitiva depende de confirmação conciliada de pagamento. |
| **Consentimento LGPD** | **Responsável autenticado → propagado ao Edge** | Revogação passa a valer imediatamente no status do BFF como `REVOCATION` com status `pending_at_edge`, disparando comando prioritário (`lgpd_revocation_priority`) ao Edge para remoção de templates locais. Registros sob guarda legal não são prometidos como exclusão imediata irrestrita. |
| **Ocorrências** | **Escola (emissão) / Responsável (manifestação)** | Distinção formal entre leitura, **ciência** (`SCIENCE_ACKNOWLEDGED`) e **contestação/discordância** (`DISAGREEMENT_CONTESTATION`), nunca tratando leitura ou ciência como concordância automática. |

---

## 6. Identidade, Sessão Viva e Limites Preliminares

1. **Não confiar apenas em claims antigas do JWT**: `linkedStudentIds[]` no token é apenas dica de apresentação; decisões no BFF/DAL consultam `users.active`, `users.sessionRevokedBefore`, `revoked_sessions` (via `jti` revogado no `/api/auth/logout`), `user_institutions` (vínculo por escola para multi-instituição e trocas) e `guardians_students` com `status = 'active'`.
2. **Ciclo de vida de contas (Fase 2+)**: convite com token de uso único e expiração, recuperação de senha com invalidação via `sessionRevokedBefore`, desativação imediata via `users.active = false` e transferência de escola/turma via atualização de `user_institutions` / `classes` sem manter acesso residual.
3. **Protecão preliminar de rate limit**: `apps/web/src/lib/rateLimit.ts` é classificado formalmente como **proteção preliminar em memória de instância única**; deploy multi-instância em produção exige rate limit distribuído (Redis/Upstash ou WAF).

---

## 7. Valor Probatório de Hash, Consentimento e Pré-requisitos do Tutor Externo

- **Hash SHA-256 não substitui assinatura ICP-Brasil**: toda manifestação crítica registra separadamente: `contentHashSha256` (integridade do documento/evento), `authenticatedUserId`, `manifestationType`, `documentVersion`/`consentVersion`, `purpose`, horário registrado e `propagationStatus`.
- **Tutor Socrático externo (pré-requisito futuro)**: antes de conectar qualquer provedor externo de LLM, será obrigatório aprovar contrato específico listando provedor/modelo, ausência de uso para treinamento com dados estudantis, faixa etária permitida (vedado uso autônomo na Ed. Infantil e 1º–5º ano EF por Parecer CNE/CP nº 15/2026), dados estritamente permitidos (apenas enunciado pedagógico anonimizado, sem PII/redações identificadas) e retenção zero no fornecedor.
