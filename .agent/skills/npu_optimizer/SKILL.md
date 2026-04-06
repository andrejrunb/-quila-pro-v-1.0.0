---
name: NPU Optimizer
description: Skill para otimização de inferência de IA em hardware Áquila Edge (NPU 26 TOPS).
---

# Instruções de Uso

Esta skill deve ser ativada ao trabalhar em workers de visão computacional ou scripts de quantização.

## Diretrizes Técnicas
- **Quantização**: Utilizar TurboQuant 3-bit para modelos baseados em MobileNet/YOLO.
- **Memória**: Monitorar o uso de LPDDR5 ECC; manter o heap abaixo de 2GB por worker.
- **Latência**: Meta de < 200ms para abertura de catraca (End-to-End).

## Comandos Recomendados
- Analisar arquivos `.spec` para garantir alocação correta de NPU.
- Verificar logs em `audio_ai.log` e `perf_audit.log`.
