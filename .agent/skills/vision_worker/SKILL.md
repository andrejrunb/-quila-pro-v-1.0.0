---
name: Vision Worker Expert
description: Especialista em depuração e melhoria dos workers de Visão Computacional (Python/Node).
---

# Instruções de Uso

Utilizar para depurar `aquila_camera_worker` e `aquila_face_worker`.

## Fluxo de Processamento
1. Frame Capture (OpenCV/GStreamer)
2. Inferência NPU (TensorRT/Custom ARM)
3. IPC (Electron Main)

## Gotchas
- Cuidado com frames órfãos em memória SharedArrayBuffer.
- Verificar sincronia de timestamps entre múltiplas câmeras (Re-ID).
