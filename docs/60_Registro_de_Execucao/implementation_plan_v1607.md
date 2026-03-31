# Implementation Plan - v1607: RuView Site Survey (Ground Truth Mapping)

Esta fase implementa a ideia do usuário de realizar uma "varredura de campo" durante a instalação, usando um dispositivo móvel conhecido para calibrar o mapa 3D do RuView.

## Proposed Changes

### [RuView Engine]
- [MODIFY] [wifi_signal_engine.py](file:///c:/aquila/aquilapro_electron/python/wifi_signal_engine.py): Adicionar modo de calibração que aceita coordenadas "reais" e registros de POI (Doors/Entrances) para associar impressões digitais de rádio a pontos de infraestrutura.

### [Backend Services]
- [MODIFY] [MobileGateway.ts](file:///c:/aquila/aquilapro_electron/src/services/MobileGateway.ts): Adicionar evento `SURVEY_POINT_TAG` para registrar portas e zonas sensíveis durante a varredura.

### [Frontend Dashboard]
- [NEW] [SurveyHUD.tsx](file:///c:/aquila/aquilapro_electron/src/ui/components/SurveyHUD.tsx): Interface para o SOC acompanhar o progresso da varredura do técnico em tempo real.
- [MODIFY] [UnifiedCommand.tsx](file:///c:/aquila/aquilapro_electron/src/ui/pages/UnifiedCommand.tsx): Adicionar botão "Start Site Survey" e vísualização do caminho percorrido pelo instalador.

## Verification Plan
### Automated Tests
- Simular um dispositivo percorrendo um caminho predefinido e verificar se o `WiFiSignalEngine` consegue registrar os pontos de sinal corretamente.
### Manual Verification
- O técnico percorre a escola, posiciona-se em frente a uma porta principal, clica em "Tag Entry" no celular e verifica se o nó RuView mais próximo registra o "Selo de Sinal" dessa entrada.
