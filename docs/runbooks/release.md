# 🚀 Runbook: Procedimento de Release & Deploy Soberano

Guia para homologação, empacotamento e lançamento de versões do Áquila Pro.

---

## 🚦 1. Checklist de Pré-Release (Gates de Qualidade)

- [ ] **Compilador TypeScript:** `pnpm --filter aquila-pro-school-os exec tsc --project tsconfig.json --noEmit` sem nenhum erro.
- [ ] **Suítes de Teste:** Todos os testes unitários e pilotos em `apps/electron/src/__tests__` verdes.
- [ ] **Catálogo de Rotas (P0):** Nenhuma rota órfã sinalizada no `RouteRegistry.ts`.
- [ ] **Ledger de Agentes (P1):** Todas as tarefas do ciclo marcadas como `READY_FOR_REVIEW` ou `APPROVED` no `AgentControlPlane`.
- [ ] **Zero Vazamento de Dados:** Verificação de ausência de credenciais, chaves ou logs de estudantes.

---

## 📦 2. Build de Produção do Electron

```bash
pnpm --filter aquila-pro-school-os run build
```

Validação do executável gerado:
- Certificar que o `ErrorBoundary` engloba todas as visualizações (`App.tsx`).
- Testar inicialização offline-first com banco `aquila.db` local.

---

## 🏷️ 3. Tag Semântica e Publicação

1. Merge do PR aprovado para `clean-release-v1` ou `main`.
2. Criação da release tag:
   ```bash
   git tag -a v2.1.0 -m "Release v2.1.0: estabilidade de portais, gamificação e governança P0/P1"
   git push origin v2.1.0
   ```
3. Atualização do `docs/handoff.md`.
