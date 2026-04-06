---
description: Ciclo de validação completo para releases do Áquila Pro (Sovereign OS).
---

Este workflow garante que a versão candidata a release atenda aos critérios de segurança, performance e soberania.

// turbo
1. Executar Testes E2E (Playwright)
```powershell
cd apps/electron
npx playwright test
```

// turbo
2. Auditoria de Performance (RAM/CPU/NPU)
```powershell
node scripts/audit_performance.js --json > perf_report.json
```

3. Verificação de Compliance LGPD
- Revisar se novos endpoints de dados estão no log de auditoria.

4. Gerar Build de Produção
```powershell
npm run build:dist
```
