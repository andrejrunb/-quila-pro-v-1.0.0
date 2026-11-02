---
name: NPU Optimizer
description: Skill para otimização de inferência de IA em hardware Áquila Edge (RK3588 6 TOPS NPU / Hailo-8 26 TOPS / NVIDIA CUDA / CPU fallback).
---

# NPU Optimizer (Multi-Profile Edge Acceleration)

Extração de performance e governança para inferência soberana de baixa latência em hardware de borda escolar.

## Perfis de Hardware Suportados
1. **ROCKCHIP_RK3588 (SoC Padrão Edge)**:
   - Capacidade da NPU: até **6 TOPS INT8** (3 núcleos de 2 TOPS) via **RKNN-Toolkit2**.
   - Modelos quantizados em INT8/FP16 para visão computacional local.
2. **DEDICATED_ACCELERATOR (M.2 / PCIe)**:
   - Aceleradores dedicados opcionais (ex.: Hailo-8 até 26 TOPS via HailoRT).
3. **NVIDIA_CUDA (Jetson / Desktop)**:
   - GPUs NVIDIA via TensorRT e ONNX Runtime CUDA.
4. **CPU_FALLBACK (Universial)**:
   - ONNX Runtime CPU com otimização multi-threading e quantização INT8 quando nenhum acelerador compatível estiver disponível.

## Criptografia e Proteção de Chaves em Repouso
- **Algoritmo**: `AES-256-GCM` obrigatório para matrizes biométricas pseudonimizadas e pesos locais.
- **Armazenamento de Chaves por SO**:
  - **Windows**: Windows DPAPI (`CryptProtectData` / `ProtectedData`).
  - **Linux / ARM**: Arquivo com permissão estrita `0600` protegido por segredo de máquina (`/etc/machine-id`) ou `systemd-creds` / Linux Kernel Keyring. Proibida a dependência exclusiva de APIs Win32 em nós Linux.

## Capacidades
- **Flash-MoE Strategy**: Implementação de Async Weight Streaming e Expert Repacking.
- **Kernel Fusion**: Otimização de operações de dequantização e produto escalar na NPU/GPU.
- **I/O Profiling**: Medição de carregamento de pesos, uso de DMA e latência por quadro.

## Regras Invioláveis (Zero-Bypass)
1. **Non-Blocking**: Proibido bloquear a Main Thread com carregamentos síncronos de modelos.
2. **Thermal Guard**: Monitorar temperatura do SoC/NPU e aplicar auto-throttling se exceder 75ºC (reduzir FPS de 30 para 10 até estabilização).
3. **Local Weights**: Pesos de modelos e embeddings de estudantes devem residir em armazenamento local criptografado (LGPD Art. 14).
4. **Hardware Specifics**: Nunca alegar que o Rockchip RK3588 possui 26 TOPS (seu limite é 6 TOPS).
