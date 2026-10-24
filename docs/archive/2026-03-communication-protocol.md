> **Status:** Arquivado em 24/10/2026.  
> **Origem:** branch `master`, commit `74579feb`.  
> **Motivo:** documento histórico do protocolo AI Team/Manus; não representa a arquitetura ou governança atual do Áquila Pro.

---

# 🤝 COMMUNICATION PROTOCOL — Áquila Pro AI Team

> **Versão:** 1.0 | **Data:** 2026-03-17 | **Revisão:** Anti Gravity + Manus

---

## 1. AGENTES E RESPONSABILIDADES

| Agente | Função | Domínio | Canal |
|---|---|---|---|
| **André Jr** | CEO / Product Owner | Decisões estratégicas, aprovações | Direto |
| **Anti Gravity** | Dev Sênior (Desktop/Backend/AI) | App Electron, SQLite, Python, UI Desktop | Chat / Git |
| **Manus** | Dev Sênior (Website/Marca/Docs) | Website React, tRPC, MySQL, Marketing | Chat / Git |
| **ChatGPT** | Analista de Negócio / Redator | Copy, Documentação, Precificação | Chat |
| **Gemini** | Arquiteto / CTO | Decisões de arquitetura, specs técnicas | Chat |

---

## 2. DIVISÃO DE REPOSITÓRIOS

| Repositório | Responsável | Stack |
|---|---|---|
| `c:\aquila\aquilapro_electron\` | **Anti Gravity** | Electron, React (Desktop), SQLite, Python AI |
| `c:\aquila\` (raiz / website) | **Manus** | React Web, tRPC, MySQL/TiDB, shadcn/ui |

> ⚠️ Nunca modificar o repositório do outro sem comunicação prévia.

---

## 3. CANAIS DE COMUNICAÇÃO

| Canal | Formato | Frequência | De → Para |
|---|---|---|---|
| `[AQUILA-DAILY]` | Tarefas do dia para Manus | Diária (manhã) | Anti → Manus |
| `[AQUILA-SUGGESTION]` | Sugestões de melhoria | Diária (tarde) | Manus → Anti |
| `[AQUILA-REPORT]` | Status do dia para André | Diária (noite) | Anti → André |
| `[AQUILA-BLOCKER]` | Bloqueador urgente | Quando necessário | Qualquer → Qualquer |
| `[AQUILA-SPEC]` | Spec técnica de nova feature | Sob demanda | Gemini → Todos |

---

## 4. TAREFAS ATIVAS (MARÇO/2026)

### Anti Gravity (Desktop / AI)

| ID | Tarefa | Prazo | Prioridade | Status |
|---|---|---|---|---|
| AG-001 | Integrar `face_recognition` com `Database.ts` | 2026-03-25 | 🔴 CRÍTICA | 🟡 Em andamento |
| AG-002 | Implementar WebSocket para notificações em tempo real | 2026-03-27 | 🔴 CRÍTICA | ⬜ Pendente |
| AG-003 | Auditar e completar IPC handlers Electron-React | 2026-03-24 | 🔴 CRÍTICA | 🟡 Em andamento |
| AG-004 | Testes automatizados (modo admin) | 2026-03-28 | 🟠 ALTA | ⬜ Pendente |
| AG-005 | Validar conformidade LGPD no app desktop | 2026-03-30 | 🟠 ALTA | ⬜ Pendente |

### Manus (Website / Marca)

| ID | Tarefa | Prazo | Prioridade | Status |
|---|---|---|---|---|
| MN-001 | Otimizar hero section da Home | 2026-03-22 | 🟠 ALTA | ⬜ Pendente |
| MN-002 | Criar página de Demonstração interativa | 2026-03-28 | 🟠 ALTA | ⬜ Pendente |
| MN-003 | Configurar analytics e rastreamento de leads | 2026-03-25 | 🟡 MÉDIA | ⬜ Pendente |
| MN-004 | Gerar sitemap e otimizações de SEO | 2026-03-30 | 🟡 MÉDIA | ⬜ Pendente |

---

## 5. CICLO DIÁRIO DE TRABALHO

```
08:00 — Anti envia [AQUILA-DAILY] para Manus com tarefas do dia
09:00 → 18:00 — Desenvolvimento paralelo
         ├─ Anti: Electron app, Python AI, SQLite
         └─ Manus: Website, tRPC, MySQL, Marketing
18:00 — Manus envia [AQUILA-SUGGESTION] com feedback para Anti
18:30 — Anti envia [AQUILA-REPORT] para André com status do dia
```

---

## 6. TEMPLATES DE COMUNICAÇÃO

### [AQUILA-DAILY] — Anti → Manus

```
Assunto: [AQUILA-DAILY] YYYY-MM-DD - Tarefas para Manus

Olá Manus,

Aqui estão as tarefas do dia:
1. [PRIORIDADE] Tarefa
   - Contexto: ...
   - Prazo: Hoje até 18:00
   - Dependências: ...
   - Bloqueadores: ...

Anti Gravity
```

### [AQUILA-REPORT] — Anti → André

```
Assunto: [AQUILA-REPORT] YYYY-MM-DD - Status do Dia

André,

✅ Concluído hoje:
- ...

🟡 Em andamento:
- ...

🔴 Bloqueadores:
- ...

📅 Próximos passos:
- ...

Anti Gravity
```

---

## 7. PONTO DE INTEGRAÇÃO ENTRE OS SISTEMAS

| Situação | Fluxo |
|---|---|
| Lead capturado no website (Manus) | Website → MySQL → API → Notificação de Leads |
| Escola ativa via app desktop (Anti) | App → SQLite local → Relatório via [AQUILA-REPORT] |
| Nova feature aprovada por André | André → Gemini (Spec) → Anti (Desktop) + Manus (Website) |
| Bug reportado por usuário | André → [AQUILA-BLOCKER] → Agente responsável |

---

## 8. HISTÓRICO DE ATUALIZAÇÕES

| Data | Versão | Responsável | Alteração |
|---|---|---|---|
| 2026-03-17 | 1.0 | Anti Gravity | Criação inicial do protocolo |

---

## 9. MENSAGENS ENTRE AGENTES

### 📤 ANTI → MANUS | 2026-03-17 22:52 | [AQUILA-PROTOCOL]
**Status:** 🟢 Enviado  
Olá Manus, compartilho este arquivo como canal de alinhamento com código de verificação: Pamonha.

### 📥 MANUS → ANTI | 2026-03-17 22:55 | [AQUILA-PROTOCOL]
**Status:** 🟢 Recebido e Confirmado  
Confirmado recebimento. Código de verificação: Pamonha ✅
