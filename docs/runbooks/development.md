# 🛠️ Runbook: Fluxo Diário de Desenvolvimento

Guia passo a passo para execução de tarefas pela dupla (Desenvolvedor Humano + Antigravity).

---

## 📋 1. Início de Tarefa

1. **Definição da Issue:**
   - Verificar ou abrir a Issue no GitHub via GitHub MCP com descrição e critérios de aceite.
2. **Checagem de Estado Git:**
   ```bash
   git status
   git checkout clean-release-v1
   git pull origin clean-release-v1
   ```
3. **Criação de Branch de Trabalho:**
   ```bash
   git checkout -b fix/descricao-da-tarefa # ou feat/...
   ```

---

## 🧪 2. Validação & Qualidade

Antes de qualquer commit, executar a esteira mínima de testes determinísticos:

1. **Checagem de Tipos Estáticos (Zero Erros Obrigatório):**
   ```bash
   pnpm --filter aquila-pro-school-os exec tsc --project tsconfig.json --noEmit
   ```
2. **Execução de Testes Unitários de Regressão:**
   ```bash
   pnpm --filter aquila-pro-school-os exec jest src/__tests__/AgentControlPlaneAndRouteRegistry.test.ts --forceExit
   pnpm --filter aquila-pro-school-os exec jest src/__tests__/PilotControlPlaneLifecycle.test.ts --forceExit
   ```

---

## 🚀 3. Submissão e Revisão

1. **Commit com Mensagem Semântica:**
   ```bash
   git add <arquivos-alterados>
   git commit -m "tipo(escopo): descrição concisa do que foi alterado"
   ```
2. **Push e Pull Request:**
   ```bash
   git push origin fix/descricao-da-tarefa
   ```
   - Abrir ou atualizar PR no GitHub vinculado à Issue via GitHub MCP (`call_mcp_tool(ServerName='github', ToolName='create_pull_request')`).
3. **Anexo de Evidências:**
   - Anexar resumo dos testes no comentário do PR.
4. **Revisão Humana (HITL):**
   - Aprovação do Tech Lead antes do merge para a branch protegida (`clean-release-v1` ou `main`).
