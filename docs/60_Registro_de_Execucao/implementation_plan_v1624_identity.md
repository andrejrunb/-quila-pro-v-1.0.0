# Implementation Plan - v1624: Student Identity Bridge

Este plano estabelece a conexão direta entre o monitoramento invisível (RuView) e a identidade civil dos alunos (Database).

## Proposed Changes

### [v1624: Identity & Hybrid Bridge Service]
- [NEW] [IdentityBridgeService.ts](file:///c:/aquila/aquilapro_electron/src/services/IdentityBridgeService.ts): Gerencia o vínculo entre `RuView_Signal_ID`, `Student_ID` e `Camera_ID`.
- [MODIFY] [CameraManager.ts](file:///c:/aquila/aquilapro_electron/src/services/CameraManager.ts): Adicionar hook de "Enrolment Passivo". Quando uma face é reconhecida, o serviço consulta o RuView na mesma coordenada (X,Y) e vincula o ID do sinal ao ID do aluno.
- [MODIFY] [UnifiedCommand.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/UnifiedCommand.tsx): Exibir nomes de alunos sobre os pontos RuView e destacar pontos "Anônimos" (detectados via WiFi mas ainda não identificados via Câmera/NFC).

### [Enrollment Workflow]
- [MODIFY] [StudentManagement.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/StudentManagement.tsx): Adicionar campo de "Assinatura RuView/TAG" para vincular o dispositivo ou rastro do aluno ao seu perfil.

## Verification Plan
### Automated Tests
1. Simular sinal ruidoso com ID 'S-99'. Vincular 'S-99' ao aluno 'Carlos'. Verificar se o alerta de 'SafetyMonitor' agora cita o nome 'Carlos' no log.

### Manual Verification
1. Abrir o Mapa RuView no dashboard.
2. Posicionar o rastro simulado sobre uma sala.
3. Verificar se o nome do aluno aparece flutuando sobre o ponto no mapa.
