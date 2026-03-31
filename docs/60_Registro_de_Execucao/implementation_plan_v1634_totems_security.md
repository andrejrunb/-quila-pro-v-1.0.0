# Implementation Plan - v1634: Specialized Totems & Security Screening

Este plano detalha a implementação das interfaces físicas (Totens) e a camada de triagem de segurança para visitantes externos.

## Proposed Changes

### [v1634: Logic & Services]
- [NEW] [VisitorRegistrationService.ts](file:///c:/aquila/aquilapro_electron/src/services/VisitorRegistrationService.ts): 
    - Gestão de dados de visitantes (Nome, CPF, Foto).
    - Mock de motor de `WatchlistScraping` (Cruzamento com dados públicos/procurados).
- [NEW] [GeofenceMonitorService.ts](file:///c:/aquila/aquilapro_electron/src/services/GeofenceMonitorService.ts): 
    - Simular detecção de pais por GPS/Geofencing para o Mural de Saída.

### [UI: Totem Dashboards]
- [NEW] [CoordinationTV.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/CoordinationTV.tsx): 
    - Visão de monitor para Sala de Professores/Coordenação.
    - Foco em alunos "Marcados em Vermelho" (Atrasos, Saídas indevidas).
- [NEW] [ArrivalBoard.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/ArrivalBoard.tsx): 
    - Mural "estilo Aeroporto" para a portaria.
    - Lista ranqueada por proximidade do pai.
- [NEW] [ReceptionPortal.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/ReceptionPortal.tsx): 
    - Interface Tablet (.apk) para cadastro rápido de visitantes e fotos.

### [UI: Secretary Enhancements]
- [MODIFY] [SecretaryDashboard.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/SecretaryDashboard.tsx): 
    - Adicionar fluxo de captura rápida de fotos de alunos via Mobile App.

## Verification Plan
### Automated Tests
1. Simular aproximação de pai via `GeofenceService` -> Validar se o nome aparece no `ArrivalBoard` no topo.
2. Cadastrar visitante com "CPF_SUSPEITO" -> Validar se notificação crítica chega ao `CoordinationTV`.

### Manual Verification
1. Abrir o `ArrivalBoard.tsx` e observar a transição de status (Chegando -> Na Porta).
2. Testar o fluxo de cadastro no `ReceptionPortal.tsx`.
