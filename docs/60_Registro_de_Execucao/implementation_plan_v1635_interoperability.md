# Implementation Plan - v1635: Structural Interoperability & Legacy Bridge

Este plano formaliza a camada de interoperabilidade do Áquila Pro com o ecossistema edtech brasileiro, permitindo sincronização fluida com ERPs (Setti, SIESCOLA), Agendas (ClipEscola) e Grades (PowerCubus, Urania).

## Proposed Changes

### [v1635: Interoperability Layer]
- [NEW] [AquilaConnectorService.ts](file:///c:/aquila/aquilapro_electron/src/services/AquilaConnectorService.ts): 
    - Orquestrador de sincronização externa.
    - Mapeamento de `ExternalID` -> `AquilaID`.
- [MODIFY] [ExternalIntegrationService.ts](file:///c:/aquila/aquilapro_electron/src/services/ExternalIntegrationService.ts): 
    - Expandir parsers para suportar PowerCubus (CSV) e SIESCOLA (JSON).
- [MODIFY] [AcademicRecordsService.ts](file:///c:/aquila/aquilapro_electron/src/services/AcademicRecordsService.ts): 
    - Adicionar `legacyMetadata` aos registros de alunos e turmas.

### [v1635: UI - Integration HUB]
- [NEW] [IntegrationHUB.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/IntegrationHUB.tsx): 
    - Dashboard para administradores configurarem conectores.
    - Status de saúde das sincronizações em tempo real.

### [Documentation / Analytics]
- [NEW] [InteroperabilityMatrix.md](file:///c:/aquila/aquilapro_electron/src/docs/InteroperabilityMatrix.md): 
    - Matriz de campos para mapeamento de dados (De/Para).

## Verification Plan
### Automated Tests
1. Injetar CSV de grade PowerCubus -> Validar se o `SchedulingEngine` atualiza as janelas dos professores.
2. Injetar JSON de matrícula SIESCOLA -> Validar se novos alunos são criados no `AcademicRecordsService`.

### Manual Verification
1. Abrir o `IntegrationHUB.tsx` e validar os logs de sincronização.
2. Verificar se o `ROI Dashboard` (v1632) agora contabiliza o custo dos sistemas integrados como "Subsidiado pelo Áquila".
