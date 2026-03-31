# Implementation Plan - v1613, v1614 & v1615: Mobile Identity & Auth

Este lote foca em endurecer os processos de identidade e autorização via dispositivos móveis, além de iniciar a gestão inteligente de ambientes.

## Proposed Changes

### [Mobile Biometrics - v1613]
- [MODIFY] [MobileGateway.ts](file:///c:/aquila/aquilapro_electron/src/services/MobileGateway.ts): Implementar simulador de Biometria (FaceID/TouchID) para validação de comandos críticos.

### [Dynamic QR Parent Auth - v1614]
- [NEW] [ParentAuthService.ts](file:///c:/aquila/aquilapro_electron/src/services/ParentAuthService.ts): Serviço para gerar e validar QRs dinâmicos de autorização de saída para pais/responsáveis.
- [NEW] [ParentAuthHUD.tsx](file:///c:/aquila/aquilapro_electron/src/ui/components/ParentAuthHUD.tsx): Componente visual para exibir status de autorizações de saída pendentes.

### [Smart Scheduling - v1615]
- [NEW] [SchedulingEngine.ts](file:///c:/aquila/aquilapro_electron/src/services/SchedulingEngine.ts): Lógica para correlacionar ocupação real (RuView) com a grade horária (Database) e alertar salas vazias/superlotadas.

## Verification Plan
### Automated Tests
- Simular validação biométrica com sucesso e falha no `MobileGateway`.
- Gerar um QR dinâmico e verificar sua expiração (TTL de 30s) no `ParentAuthService`.
### Manual Verification
- O técnico scaneia o QR e vê o status de "Saída Autorizada" mudar de cinza para verde neon no dashboard.
