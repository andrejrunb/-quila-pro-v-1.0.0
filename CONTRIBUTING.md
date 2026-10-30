# 🤝 Guia de Contribuição — Áquila Pro

Diretrizes para o desenvolvimento conjunto entre desenvolvedores humanos e agentes de IA.

---

## 🛠️ Padrões de Desenvolvimento

1. **Governança P0 (Rotas & Portais):**
   - Qualquer nova tela ou rota DEVE ser registrada em `apps/electron/src/types/RouteRegistry.ts`.
   - Rotas não cadastradas são rejeitadas pelo validador e capturadas pelo `ErrorBoundary`.

2. **Governança P1 (Plano de Controle Agêntico):**
   - Alterações automatizadas devem ser registradas com chave de idempotência no `AgentControlPlane`.
   - Toda alteração requer evidência de compilação limpa (`tsc`) e testes verdes (`jest`).

3. **Branching & Pull Requests:**
   - Nunca comite diretamente em branches protegidas (`clean-release-v1` ou `main`).
   - Crie branches no padrão `fix/<nome>` ou `feat/<nome>`.
   - Abra um Pull Request e anexe as evidências de teste.

4. **Privacidade e LGPD:**
   - É estritamente proibido incluir dados reais de estudantes, responsáveis ou professores em commits, fixtures ou logs. Utilize apenas dados sintéticos.
