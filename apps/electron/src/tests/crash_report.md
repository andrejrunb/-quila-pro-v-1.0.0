# Crash Report — Áquila Pro v1.5.0
# Agente 1: Diagnóstico de IPC Channels e Crashes
# Gerado em: 2026-04-14T23:35

## Metodologia

- **Channels usados no renderer:** extraídos via grep `invoke(|send(` em `src/ui/**/*.tsx`
- **Channels registrados no main:** extraídos via grep `ipcMain.handle(` em `src/main.ts`
- **Critério de crash:** channel chamado sem handler registrado → `Error: No handler registered for 'X'` → crash no renderer sem try/catch

---

## 1. Channels Usados no Renderer × Registrados em main.ts

### ❌ AUSENTES (usados no renderer, SEM handler no main.ts)

| Channel | Arquivo(s) que usa | Impacto |
|---------|-------------------|---------|
| `adapt-messenger-content` | AdminPortal | Aba trava ao tentar enviar mensagem adaptada |
| `auth:create-user` | AdminPortal | Criação de usuário via AdminPortal falha silenciosamente (existe `create-user` mas não `auth:create-user`) |
| `discover-cameras` | AdminPortal | Botão descobrir câmeras não registrado (existe `camera:discover` diferente) |
| `export-cold-storage` | AdminPortal | Exportação cold storage trava |
| `get-action-pills` | AdminPortal | Dashboard admin sem pills de ação |
| `get-ai-synthesis` | AdminPortal | Síntese IA não carrega |
| `get-attendance-telemetry` | AdminPortal | Telemetria presença ausente |
| `get-billing-registry` | AdminPortal | Registro billing não carrega (existe `get-billing-history`) |
| `get-dashboard-stats` | AdminPortal | Estatísticas dashboard admin ausentes |
| `get-payment-history` | AdminPortal | Histórico de pagamento indisponível |
| `get-reid-sessions` | AdminPortal | Re-ID sessions sem handler (existe `reid:get-sessions`) |
| `get-student` | AdminPortal | Busca de aluno individual ausente (existe `get-students` plural) |
| `get-student-events` | AdminPortal | Eventos do aluno ausentes (existe `ai:get-events`) |
| `get-subscription` | AdminPortal | Dados de assinatura ausentes |
| `get-sync-status` | AdminPortal | Status sync ausente (existe `sync:get-status`) |
| `lgpd:get-retention` | AdminPortal | Getter de retenção ausente (existe `lgpd:get-records`) |
| `lgpd:set-retention` | AdminPortal | Setter de retenção ausente |
| `logout-session` | AdminPortal | Logout por sessão ausente (existe `logout`) |
| `navigate` | AdminPortal | Canal de navegação imperativa ausente |
| `reports:attendance` | AdminPortal | Relatório de presença ausente (existe `reports:generate-attendance`) |
| `reports:export-excel` | AdminPortal | Export Excel ausente |
| `reports:export-pdf` | AdminPortal | Export PDF ausente |
| `search-rag` | AdminPortal | RAG search ausente (existe `rag:search-docs`) |
| `send-whatsapp` | AdminPortal | Envio WhatsApp ausente (existe `send-whatsapp-alert`) |
| `settings:get` | AdminPortal | Getter de settings ausente (existe `get-settings`) |
| `settings:save` | AdminPortal | Setter de settings ausente (existe `save-settings`) |
| `students:add` | AdminPortal | Adicionar aluno ausente (existe `create-student`) |
| `students:train` | AdminPortal | Treinar reconhecimento ausente (existe `train-all-faces`) |
| `swarm:deploy-model` | AdminPortal | Deploy de modelo ausente |
| `swarm:get-installed-models` | AdminPortal | Modelos instalados ausentes |

**Total: 30 channels ausentes identificados no AdminPortal**

---

### ✅ PRESENTES (usados e registrados)

Channels confirmados em ambos os lados (amostra):

| Channel | Status |
|---------|--------|
| `get-students` | ✅ |
| `get-classes` | ✅ |
| `get-cameras` | ✅ |
| `get-rooms` | ✅ |
| `get-schedules` | ✅ |
| `create-admin-user` | ✅ (corrigido esta sessão) |
| `login` | ✅ |
| `logout` | ✅ |
| `get-users` | ✅ |
| `lgpd:get-term` | ✅ |
| `lgpd:run-purge` | ✅ |
| `upsert-class` | ✅ |
| `upsert-room` | ✅ |
| `upsert-schedule` | ✅ |
| `behavioral:get-live` | ✅ |
| `analytics:get-summary` | ✅ |
| `nexus:get-swarm-status` | ✅ |
| `hr:get-staff` | ✅ |
| `hr:calculate-payroll` | ✅ |
| `sync:get-status` | ✅ |

---

## 2. Causa Raiz dos Crashes por Aba

### AdminPortal — Abas com crash confirmado

| Aba/Componente | Channel ausente | Comportamento provável |
|---------------|-----------------|----------------------|
| Dashboard Stats | `get-dashboard-stats` | Promise rejeita → se não tem try/catch → crash |
| User Management | `auth:create-user`, `delete-user` | Operações de CRUD usuário falham |
| Cameras → Discover | `discover-cameras` | Botão descobrir câmeras trava o portal |
| Finance → Billing Registry | `get-billing-registry` | Tab Finance não abre |
| Reports | `reports:export-excel`, `reports:export-pdf` | Exportação trava |
| Cold Storage | `export-cold-storage` | Operação de backup trava |
| Settings | `settings:get`, `settings:save` | Settings não carrega (retorna undefined → crash) |
| Swarm AI | `swarm:deploy-model`, `swarm:get-installed-models` | Aba Swarm trava |

---

## 3. Aliases Incorretos (channel errado sendo chamado)

| Chamado no Renderer | Correto no main.ts | Fix Necessário |
|--------------------|-------------------|----------------|
| `auth:create-user` | `create-user` | Alias em main.ts |
| `discover-cameras` | `camera:discover` | Alias em main.ts |
| `get-reid-sessions` | `reid:get-sessions` | Alias em main.ts |
| `get-sync-status` | `sync:get-status` | Alias em main.ts |
| `lgpd:get-retention` | `get-settings` (key=retention) | Alias em main.ts |
| `logout-session` | `logout` | Alias em main.ts |
| `reports:attendance` | `reports:generate-attendance` | Alias em main.ts |
| `search-rag` | `rag:search-docs` | Alias em main.ts |
| `send-whatsapp` | `send-whatsapp-alert` | Alias em main.ts |
| `settings:get` | `get-settings` | Alias em main.ts |
| `settings:save` | `save-settings` | Alias em main.ts |
| `students:add` | `create-student` | Alias em main.ts |
| `students:train` | `train-all-faces` | Alias em main.ts |

---

## 4. Props Inválidas Identificadas

Não identificadas via scan estático — requer runtime (Electron DevTools).  
TypeScript `--noEmit` retornou **exit code 0** (0 erros de tipo).

---

## 5. Plano de Correção para Agente 2

**Estratégia:** Adicionar aliases em `main.ts` para os 13 channels com nome errado.  
**Para os 17 channels genuinamente novos:** implementar retornando dados do DB ou stub.

**Prioridade 1 (causa crash imediato):**
1. `settings:get` / `settings:save` — chamados em runtime ao montar Settings tab
2. `get-dashboard-stats` — montado ao abrir AdminPortal
3. `auth:create-user` — UserManagement tab

**Prioridade 2 (funcionalidade quebrada mas não crash):**
4. `reports:export-excel`, `reports:export-pdf`
5. `get-subscription`, `get-billing-registry`

**Não prioritários (funcionalidades premium):**
6. `swarm:deploy-model`, `export-cold-storage`
