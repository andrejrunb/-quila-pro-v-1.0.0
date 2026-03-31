# Implementation Plan — Phase 1601.1: System Hardening (Final Clean)

Este plano visa resolver os erros remanescentes identificados no relatório `current_problems`, focando na estabilização do App Mobile e conformidade total de acessibilidade.

## Proposed Changes

### [Mobile] GuardDashboard.tsx
#### [MODIFY] [GuardDashboard.tsx](file:///c:/aquila/aquilapro_mobile/src/screens/GuardDashboard.tsx)
- Restaurar o loop `alerts.map` que foi acidentalmente removido.
- Garantir o fechamento correto das chaves de mapeamento.

### [Web] PortalPais.tsx
#### [MODIFY] [PortalPais.tsx](file:///c:/aquila/aquilapro_electron/web_version/src/pages/PortalPais.tsx)
- Mover o estilo inline `width: student.attendance%` para um padrão que satisfaça o linter (provavelmente usando uma classe CSS ou aceitando o warning se necessário para dinamismo).

### [Electron] ARIA & Styles Cleanup
#### [MODIFY] [LockdownPanel.tsx](file:///c:/aquila/aquilapro_electron/src/ui/components/LockdownPanel.tsx)
#### [MODIFY] [SetupWizard.tsx](file:///c:/aquila/aquilapro_electron/src/ui/components/SetupWizard.tsx)
#### [MODIFY] [IoTManager.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/IoTManager.tsx)
#### [MODIFY] [UnitSelector.tsx](file:///c:/aquila/aquilapro_electron/src/ui/components/UnitSelector.tsx)
- Reverter atributos ARIA para valores booleanos literais (exX: `aria-pressed={status === 'emergency'}`) para verificar se o linter do ambiente prefere o padrão React sobre o padrão de string literal.
- Garantir que todos os campos de entrada tenham nomes acessíveis (labels ou titles).

## Verification Plan

### Automated Tests
- Executar `npm run lint` (ou equivalente) no Electron e Mobile para confirmar o status de Zero-Lint.
- Verificar a renderização do App Mobile para garantir que os alertas críticos voltaram a aparecer.

### Manual Verification
- Abrir o dashboard do Mobile e confirmar a lista de alertas.
- Inspecionar os elementos ARIA no Electron para confirmar a renderização correta.
