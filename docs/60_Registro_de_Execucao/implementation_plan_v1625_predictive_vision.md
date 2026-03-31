# Implementation Plan - v1625: Predictive Vision Integration

Este plano inverte a via de auxílio: agora o WiFi ajuda as câmeras a serem mais rápidas e precisas.

## Proposed Changes

### [v1625: Predictive Recognition Logic]
- [MODIFY] [IdentityBridgeService.ts](file:///c:/aquila/aquilapro_electron/src/services/IdentityBridgeService.ts): Adicionar método `getPredictedSubjects(cameraLocation: string)`. Retorna os alunos que estão se movendo em direção à câmera baseado no vetor de deslocamento do RuView.
- [MODIFY] [UnifiedCommand.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/UnifiedCommand.tsx): No modo "Live Matrix", exibir um overlay de "Pré-ID" (ex: "Aproximando-se: João...") antes mesmo da face ser detectada claramente pela lente.

### [Camera Optimization]
- [MODIFY] [CameraManager.tsx](file:///c:/aquila/aquilapro_electron/src/ui/CameraManager.tsx): Simular a redução de "search space" do algoritmo de IA. Em vez de comparar com todos os 1000 alunos, a IA foca nos 5 que o WiFi diz estarem por perto.

## Verification Plan
### Automated Tests
1. Simular rastro de 'João' movendo-se de (10,10) para (20,20) onde fica a Camera_01.
2. Verificar se `getPredictedSubjects('Camera_01')` retorna 'João' 2 segundos antes dele chegar na coordenada exata.

### Manual Verification
1. Abrir o dashboard.
2. Ativar RuView e Live Matrix simultaneamente.
3. Observar o surgimento do label "PRE-ID" no slot da câmera quando um ponto no mapa se aproxima dela.
