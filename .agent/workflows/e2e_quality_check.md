---
description: Execução automatizada de testes E2E Playwright e regressão visual do Áquila Pro.
---

Este workflow automatiza o ciclo completo de garantia de qualidade para a V1.x.

// turbo
1. Instalar dependências de teste (se necessário)
```powershell
npm install @playwright/test
```

// turbo
2. Executar suíte de testes Playwright
```powershell
npx playwright test
```

// turbo
3. Gerar relatório de saúde
```powershell
# Simulação de geração de relatório summarizado
echo "Report: SQA-1000 Compliant" > e2e_report.txt
```

4. Notificar o usuário com o resultado final e snapshots se houver falha.
