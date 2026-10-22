# 🧪 Runbook: Auditoria de QA e Regressão Automática

Como garantir a estabilidade das releases e a integridade da UI Elite (Stitch) antes de subir para produção.

---

## 🏗️ Estrutura de Testes
- **Local**: `apps/electron/e2e/*.spec.ts` (Playwright)
- **Cloud**: Vitest em `apps/web/tests` (Integrado via tRPC)

## 🛠️ Procedimento de QA Assistido (Antigravity)

### 1. Auditoria Visual e Performance
Utilize o workflow especializado do agente para verificar a Landing Page e Dashboards.
> **Comando Sugerido**: `/qa_mcp_audit`
- O agente abrirá o navegador real via **DevTools MCP**.
- Ele capturará screenshots de regressão (`screenshots/`).
- Ele rodará o Lighthouse para validar o score de acessibilidade.

### 2. Execução da Suite de Smoke Test
Rode os testes fundamentais de login e fluxo de matrícula.
```bash
npm run test:e2e:electron
```

### 3. Validação de Segurança (Identity)
Verifique se a biometria facial fake (para testes) não viola os guardrails da LGPD.
```bash
npx playwright test security.spec.ts
```

## 📝 Reporte de Bugs
Todo bug encontrado deve ser documentado com:
1. **Console Log**: Extraído via `list_console_messages()`.
2. **Snapshot**: Salvo em `snapshots/failure_*.png`.
3. **Escopo**: Se é um erro do Kernel (Local) ou do Cloud (SaaS).

---
*Escrito por: Agente Antigravity (IA)*
