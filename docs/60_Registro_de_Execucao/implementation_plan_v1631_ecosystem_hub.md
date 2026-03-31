# Implementation Plan - v1631: Institutional Ecosystem Hub

Este plano transforma o Áquila Pro em um **School OS (Sistema Operacional Escolar)** unificado, integrando e substituindo softwares legados (Urania, mensageria, gestão acadêmica) para reduzir custos e aumentar a coesão dos dados.

## Proposed Changes

### [v1631: Core Integration Services]
- [NEW] [ExternalIntegrationService.ts](file:///c:/aquila/aquilapro_electron/src/services/ExternalIntegrationService.ts): 
    - Implementar `UraniaParser` (importação de grades horárias).
    - Adaptadores para CSV/JSON de sistemas de secretaria.
- [NEW] [AcademicRecordsService.ts](file:///c:/aquila/aquilapro_electron/src/services/AcademicRecordsService.ts): Gestão centralizada de matrículas, turmas e históricos.
- [NEW] [CommunicationHubService.ts](file:///c:/aquila/aquilapro_electron/src/services/CommunicationHubService.ts): Motor de notificações Push/SMS para pais e responsáveis.

### [UI: Admin Ecosystem Dashboard]
- [NEW] [EcosystemIntelligence.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/EcosystemIntelligence.tsx): 
    - Hub central com visão 360º (Financeiro, Acadêmico, Segurança, Comunicação).
    - Widget de **"ROI de Unificação"**: Comparativo de custos entre Áquila e softwares fragmentados.

## Verification Plan
### Automated Tests
1. Simular importação de grade horária Urania -> Validar se o `SchedulingEngine` popula automaticamente.
2. Disparar alerta comportamental crítico -> Verificar se o `CommunicationHub` gera notificação para o pai.

### Manual Verification
1. Acessar o novo "Ecosystem Intelligence Hub".
2. Testar o switch de "Modo Secretaria" para "Modo Professor".
