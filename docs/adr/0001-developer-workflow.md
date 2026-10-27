# ADR 0001: Workflow de Desenvolvimento da Dupla (Dev Humano + Antigravity)

- **Status:** Aceito
- **Data:** 2026-10-26
- **Decisores:** Tech Lead Humano & Antigravity (Córtex Central)

---

## 🎯 Contexto

O ecossistema Áquila Pro conta com mais de 370 componentes e 47 rotas ativas. O fluxo de desenvolvimento anterior sofria de:
1. Rastreamento volátil baseado apenas em mensagens no chat.
2. Inconsistência entre intenção de navegação e catálogo estático de rotas.
3. Risco de regressão e dependência excessiva de ferramentas externas fragmentadas (Linear, Notion, scripts ad-hoc).

---

## ⚖️ Decisão

Adotamos a seguinte pilha enxuta e unificada para o nosso fluxo de trabalho conjunto:

1. **Gestão de Tarefas & Kanban:** **GitHub Issues + GitHub Projects**.
   - Cada entrega verificável possui uma Issue associada.
   - Estados: `Backlog` ➔ `Ready` ➔ `In Progress` ➔ `In Review` ➔ `Done` (com `Blocked` para impedimentos).
2. **Memória de Decisões e Conhecimento:** **Markdown versionado no próprio repositório Git**.
   - Decisões acompanham o código na pasta `docs/` (`docs/adr/`, `docs/runbooks/`, `docs/handoff.md`).
   - Evita dispersão em ferramentas terceiras como Notion ou Obsidian.
3. **Inspeção de Código Determinística:**
   - Referências de tipos TypeScript, compilação estática (`tsc --noEmit`), índice AST local (`dev_codebase_rag_indexer.py`) e testes de interação (Jest / Playwright).
4. **Governança P0/P1:**
   - **P0:** `RouteRegistry.ts` como contrato estrito e canônico de rotas e perfis de acesso.
   - **P1:** `AgentControlPlane.ts` com idempotência durável e checkpoint obrigatório de revisão humana (**Human-in-the-Loop**).
5. **Automação do Ciclo Git:**
   - Alterações em branches de feature (`fix/...` ou `feat/...`).
   - Pull Requests gerenciados via GitHub MCP com execução de testes de CI antes de qualquer merge.

---

## 🚀 Consequências

- **Positivas:**
  - Ponto único de consulta (Single Source of Truth) no repositório.
  - Zero sobrecarga de sincronização com ferramentas de terceiros desnecessárias.
  - Retomada instantânea de sessões futuras através do `docs/handoff.md`.
- **Negativas / Cuidados:**
  - Exige rigor na atualização de `docs/handoff.md` a cada término de sessão.
  - Nenhum dado real de estudantes ou chaves secretas pode ser comitado na pasta `docs/`.
