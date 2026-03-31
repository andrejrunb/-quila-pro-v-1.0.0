# Implementation Plan — Phase 1602: Setup for Field Testing

Este plano prepara o ecossistema Áquila Pro para os testes solicitados de **Mapeamento de Ambiente (WiFi)** e **Detecção de Pessoas (IA)**, saindo do modo simulação para o modo real.

## Proposed Changes

### [Electron] IoT & Network Discovery
#### [NEW] [NetworkDiscoveryService.ts](file:///c:/aquila/aquilapro_electron/src/services/NetworkDiscoveryService.ts)
- Implementar descoberta real usando `child_process.exec('arp -a')` ou similar para mapear dispositivos na rede local.
- Parsear a saída para identificar novos dispositivos WiFi.

#### [MODIFY] [IoTMainService.ts](file:///c:/aquila/aquilapro_electron/src/services/IoTMainService.ts)
- Integrar o `NetworkDiscoveryService` para substituir o polling simulado por dados reais da rede.

### [Electron] AI & Camera Readiness
#### [MODIFY] [RecognitionLoop.ts](file:///c:/aquila/aquilapro_electron/src/services/RecognitionLoop.ts)
- Garantir que o loop possa ser iniciado com uma câmera de índice "0" (Webcam Local) via UI.

### [Misc] Field Test Preparation
#### [NEW] [verify_readiness.py](file:///c:/aquila/verify_readiness.py)
- Script Python para verificar se todas as dependências (OpenCV, face_recognition, models) estão instaladas e se a câmera 0 está acessível.

## Verification Plan

### Automated Tests
- Executar `python verify_readiness.py` no console.
- Chamar o IPC `iot:devices-updated` (via log) e ver se dispositivos reais aparecem.

### Manual Verification
- O usuário deve abrir o Áquila Pro, ir em Configurações > Câmeras e adicionar uma câmera com URL `0`.
- O usuário deve abrir o Gerenciador IoT e clicar em "Escanear Rede" (que agora chamará a lógica real).
